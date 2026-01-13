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
  ToolDefinition,
  ToolCall,
  ModelInfo
} from './types';
import { getModelsByProvider } from './models-registry';

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
    
    const response = await this.makeRequest('/chat/completions', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body for streaming');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              yield { type: 'done' };
              return;
            }

            try {
              const chunk: OpenAIStreamChunk = JSON.parse(data);
              const streamChunk = this.parseStreamChunk(chunk);
              if (streamChunk) {
                yield streamChunk;
              }
            } catch (error) {
              console.warn('Failed to parse stream chunk:', error);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    // For OpenAI, we can fetch available models directly from the API
    if (this.type === 'openai') {
      try {
        const response = await this.makeRequest('/models');
        const data = await response.json();
        
        return data.data
          .filter((model: any) => model.id.includes('gpt'))
          .map((model: any) => ({
            id: model.id,
            name: model.id,
            provider: this.type,
            capabilities: {
              supportsVision: model.id.includes('gpt-4') && !model.id.includes('gpt-4-turbo-preview'),
              supportsTools: true,
              supportsStreaming: true,
              supportsReasoning: model.id.includes('o1'),
              supportsPromptCache: false,
              contextWindow: this.getContextWindow(model.id),
              maxOutputTokens: this.getMaxOutputTokens(model.id),
            },
          }));
      } catch (error) {
        console.warn('Failed to fetch OpenAI models:', error);
        return [];
      }
    }

    // For other OpenAI-compatible providers, return empty array
    // Let the UI show "No models available" - they should configure their own models
    return [];
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
            input: JSON.parse(toolCall.function.arguments),
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
          return {
            type: 'tool_use',
            toolCall: {
              input: toolCall.function.arguments,
            },
          };
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

  private getDefaultModel(): string {
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