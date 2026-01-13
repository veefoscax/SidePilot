/**
 * OpenAI Provider
 * 
 * Implements OpenAI's Chat Completions API with support for:
 * - Chat completions
 * - Streaming
 * - Tool calling (function calling)
 * - Vision (GPT-4V)
 * - Compatible with OpenAI-compatible APIs (Groq, Mistral, etc.)
 */

import { BaseProvider } from './base-provider';
import { 
  ChatMessage, 
  ChatOptions, 
  LLMResponse, 
  StreamChunk, 
  ContentPart,
  ToolCall,
  ModelInfo
} from './types';
import { getProviderConfig } from './provider-configs';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | OpenAIContentPart[] | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: OpenAIToolCall[];
}

interface OpenAIContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
    detail?: 'low' | 'high' | 'auto';
  };
}

interface OpenAITool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: object;
  };
}

interface OpenAIToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  max_tokens?: number;
  temperature?: number;
  tools?: OpenAITool[];
  tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
  stream?: boolean;
}

interface OpenAIResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string | null;
      tool_calls?: OpenAIToolCall[];
    };
    finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter';
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenAIStreamChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: 'assistant';
      content?: string;
      reasoning_content?: string; // GLM-4 reasoning support
      tool_calls?: Array<{
        index: number;
        id?: string;
        type?: 'function';
        function?: {
          name?: string;
          arguments?: string;
        };
      }>;
    };
    finish_reason?: 'stop' | 'length' | 'tool_calls' | 'content_filter';
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIProvider extends BaseProvider {
  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<LLMResponse> {
    const request = this.buildRequest(messages, options);
    
    const response = await this.makeRequest('/chat/completions', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    const data: OpenAIResponse = await response.json();
    return this.parseResponse(data);
  }

  async *stream(messages: ChatMessage[], options: ChatOptions = {}): AsyncIterable<StreamChunk> {
    const request = this.buildRequest(messages, { ...options, stream: true });
    
    console.log('ZAI Stream request:', { 
      url: this.config.baseUrl + '/chat/completions',
      model: request.model,
      messagesCount: request.messages.length 
    });
    
    const response = await this.makeRequest('/chat/completions', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ZAI Stream error:', { status: response.status, error: errorText });
      throw new Error(`ZAI API error: ${response.status} ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body for streaming');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let hasContent = false;
    let hasReasoning = false;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              console.log('ZAI Stream completed:', { hasContent, hasReasoning });
              yield { type: 'done' };
              return;
            }

            if (data === '') continue; // Skip empty data lines

            try {
              const chunk: OpenAIStreamChunk = JSON.parse(data);
              console.log('ZAI Stream chunk:', { 
                type: chunk.choices?.[0]?.delta?.reasoning_content ? 'reasoning' : 
                      chunk.choices?.[0]?.delta?.content ? 'content' : 'other',
                hasContent: !!chunk.choices?.[0]?.delta?.content,
                hasReasoning: !!chunk.choices?.[0]?.delta?.reasoning_content,
                finishReason: chunk.choices?.[0]?.finish_reason
              });
              
              const streamChunk = this.parseStreamChunk(chunk);
              if (streamChunk) {
                // Handle reasoning content directly from GLM-4.7
                if (streamChunk.type === 'reasoning') {
                  hasReasoning = true;
                  yield streamChunk;
                } else if (streamChunk.type === 'text' && streamChunk.text) {
                  const text = streamChunk.text;
                  
                  // Regular content - any text counts as content
                  if (text.trim()) { // Only count non-empty text as content
                    hasContent = true;
                    yield streamChunk;
                  } else if (text === '') {
                    // Empty text chunk - still yield but don't count as content
                    yield streamChunk;
                  }
                } else if (streamChunk.type === 'tool_use') {
                  // Tool calls also count as content
                  hasContent = true;
                  yield streamChunk;
                } else {
                  yield streamChunk;
                }
              }
            } catch (error) {
              console.warn('Failed to parse ZAI stream chunk:', { data, error });
            }
          }
        }
      }
      
      // If we reach here without any content or reasoning, yield a fallback message
      if (!hasContent && !hasReasoning) {
        console.warn('ZAI stream ended without content or reasoning - yielding fallback');
        hasContent = true; // Mark as having content to prevent infinite loop
        yield { 
          type: 'text', 
          text: 'Response completed. The model may have provided reasoning without visible content.' 
        };
      } else {
        console.log('ZAI stream completed successfully:', { hasContent, hasReasoning });
      }
    } finally {
      reader.releaseLock();
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    try {
      // Try to fetch models from the /models endpoint
      const response = await this.makeRequest('/models');
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        return data.data.map((model: any) => ({
          id: model.id,
          name: model.id,
          provider: this.type,
          capabilities: {
            supportsVision: this.supportsVision(model.id),
            supportsTools: this.supportsTools(model.id),
            supportsStreaming: true,
            supportsReasoning: model.id.includes('o1'),
            supportsPromptCache: false,
            contextWindow: this.getContextWindow(model.id),
            maxOutputTokens: this.getMaxOutputTokens(model.id),
          },
        }));
      }
    } catch (error) {
      console.warn(`Failed to fetch models for ${this.type}:`, error);
    }

    // If API doesn't support /models endpoint, return common models for the provider
    return this.getDefaultModels();
  }

  protected getDefaultModels(): ModelInfo[] {
    const providerConfig = getProviderConfig(this.type);
    const defaultModelIds = providerConfig?.defaultModels || [];
    
    return defaultModelIds.map(modelId => ({
      id: modelId,
      name: this.getModelDisplayName(modelId),
      provider: this.type,
      capabilities: {
        supportsVision: this.supportsVision(modelId),
        supportsTools: this.supportsTools(modelId),
        supportsStreaming: true,
        supportsReasoning: this.supportsReasoning(modelId),
        supportsPromptCache: false,
        contextWindow: this.getContextWindow(modelId),
        maxOutputTokens: this.getMaxOutputTokens(modelId),
      },
    }));
  }

  private getModelDisplayName(modelId: string): string {
    const displayNames: Record<string, string> = {
      'gpt-4o': 'GPT-4o',
      'gpt-4o-mini': 'GPT-4o Mini',
      'o1': 'O1',
      'o1-mini': 'O1 Mini',
      'o3-mini': 'O3 Mini',
      'glm-4.7': 'GLM-4.7',
      'glm-4.6': 'GLM-4.6',
      'glm-4.5': 'GLM-4.5',
      'glm-4-plus': 'GLM-4 Plus',
      'glm-4-flash': 'GLM-4 Flash',
      'glm-4v-plus': 'GLM-4V Plus',
      'glm-4-long': 'GLM-4 Long',
      'llama-3.3-70b-versatile': 'Llama 3.3 70B',
      'deepseek-chat': 'DeepSeek Chat',
      'deepseek-reasoner': 'DeepSeek Reasoner',
    };
    
    return displayNames[modelId] || modelId;
  }

  private supportsReasoning(modelId: string): boolean {
    return modelId.includes('o1') || modelId.includes('o3') || modelId.includes('reasoner') || modelId.includes('glm-4.7') || modelId.includes('glm-4.6');
  }

  private supportsVision(modelId: string): boolean {
    return modelId.includes('gpt-4') || modelId.includes('claude') || modelId.includes('gemini');
  }

  private supportsTools(modelId: string): boolean {
    // Most modern models support tools
    return !modelId.includes('gpt-3.5-turbo-instruct');
  }

  private buildRequest(messages: ChatMessage[], options: ChatOptions): OpenAIRequest {
    const { 
      model = this.getDefaultModel(), 
      maxTokens, 
      temperature, 
      tools, 
      systemPrompt 
    } = options;

    // Convert messages to OpenAI format
    const openaiMessages: OpenAIMessage[] = [];

    // Add system prompt if provided
    if (systemPrompt) {
      openaiMessages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    for (const message of messages) {
      if (message.role === 'system' && !systemPrompt) {
        openaiMessages.push({
          role: 'system',
          content: typeof message.content === 'string' ? message.content : 
            message.content.find(part => part.type === 'text')?.text || '',
        });
      } else if (message.role === 'user' || message.role === 'assistant') {
        openaiMessages.push({
          role: message.role,
          content: this.convertContent(message.content),
        });
      }
    }

    const request: OpenAIRequest = {
      model,
      messages: openaiMessages,
    };

    if (maxTokens) {
      request.max_tokens = maxTokens;
    }

    if (temperature !== undefined) {
      request.temperature = temperature;
    }

    if (tools && tools.length > 0) {
      request.tools = tools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
        },
      }));
      request.tool_choice = 'auto';
    }

    return request;
  }

  private convertContent(content: string | ContentPart[]): string | OpenAIContentPart[] {
    if (typeof content === 'string') {
      return content;
    }

    return content.map(part => {
      if (part.type === 'text') {
        return {
          type: 'text',
          text: part.text || '',
        };
      } else if (part.type === 'image' && part.image) {
        return {
          type: 'image_url',
          image_url: {
            url: `data:${part.image.mediaType};base64,${part.image.data}`,
            detail: 'auto',
          },
        };
      }
      throw new Error(`Unsupported content part type: ${part.type}`);
    });
  }

  private parseResponse(data: OpenAIResponse): LLMResponse {
    const choice = data.choices[0];
    if (!choice) {
      throw new Error('No choices in OpenAI response');
    }

    const content = choice.message.content || '';
    const toolCalls: ToolCall[] = [];

    if (choice.message.tool_calls) {
      for (const toolCall of choice.message.tool_calls) {
        try {
          toolCalls.push({
            id: toolCall.id,
            name: toolCall.function.name,
            input: JSON.parse(toolCall.function.arguments) as Record<string, unknown>,
          });
        } catch (error) {
          console.warn('Failed to parse tool call arguments:', error);
        }
      }
    }

    return {
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: {
        inputTokens: data.usage.prompt_tokens,
        outputTokens: data.usage.completion_tokens,
      },
      stopReason: this.mapFinishReason(choice.finish_reason),
      model: data.model,
    };
  }

  private parseStreamChunk(chunk: OpenAIStreamChunk): StreamChunk | null {
    const choice = chunk.choices[0];
    if (!choice) return null;

    const delta = choice.delta;

    // Handle GLM-4 reasoning content
    if (delta.reasoning_content) {
      return {
        type: 'reasoning',
        text: delta.reasoning_content,
      };
    }

    if (delta.content) {
      return {
        type: 'text',
        text: delta.content,
      };
    }

    if (delta.tool_calls) {
      for (const toolCall of delta.tool_calls) {
        if (toolCall.function?.name) {
          return {
            type: 'tool_use',
            toolCall: {
              id: toolCall.id,
              name: toolCall.function.name,
            },
          };
        }
        if (toolCall.function?.arguments) {
          try {
            const parsedArgs = JSON.parse(toolCall.function.arguments);
            return {
              type: 'tool_use',
              toolCall: {
                input: parsedArgs,
              },
            };
          } catch (error) {
            console.warn('Failed to parse tool arguments:', error);
            return null;
          }
        }
      }
    }

    if (choice.finish_reason) {
      return {
        type: 'done',
        usage: chunk.usage ? {
          inputTokens: chunk.usage.prompt_tokens,
          outputTokens: chunk.usage.completion_tokens,
        } : undefined,
      };
    }

    return null;
  }

  private mapFinishReason(reason: string): LLMResponse['stopReason'] {
    switch (reason) {
      case 'stop':
        return 'end_turn';
      case 'length':
        return 'max_tokens';
      case 'tool_calls':
        return 'tool_use';
      default:
        return 'end_turn';
    }
  }

  protected getDefaultModel(): string {
    switch (this.type) {
      case 'openai':
        return 'gpt-4o';
      case 'groq':
        return 'llama-3.3-70b-versatile';
      case 'mistral':
        return 'mistral-large-latest';
      case 'deepseek':
        return 'deepseek-chat';
      case 'xai':
        return 'grok-2-1212';
      case 'zai':
        return 'glm-4.7';
      default:
        return 'gpt-3.5-turbo';
    }
  }

  private getContextWindow(modelId: string): number {
    if (modelId.includes('gpt-4')) return 128000;
    if (modelId.includes('gpt-3.5')) return 16385;
    if (modelId.includes('o1')) return 200000;
    return 4096;
  }

  private getMaxOutputTokens(modelId: string): number {
    if (modelId.includes('gpt-4')) return 4096;
    if (modelId.includes('gpt-3.5')) return 4096;
    if (modelId.includes('o1')) return 100000;
    return 2048;
  }
}