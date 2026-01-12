/**
 * Anthropic Claude Provider
 * 
 * Implements Anthropic's Messages API with support for:
 * - Chat completions
 * - Streaming
 * - Tool calling
 * - Vision (image analysis)
 * - Prompt caching
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

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | AnthropicContentBlock[];
}

interface AnthropicContentBlock {
  type: 'text' | 'image' | 'tool_use' | 'tool_result';
  text?: string;
  source?: {
    type: 'base64';
    media_type: string;
    data: string;
  };
  id?: string;
  name?: string;
  input?: object;
  tool_use_id?: string;
  content?: string;
}

interface AnthropicTool {
  name: string;
  description: string;
  input_schema: object;
}

interface AnthropicRequest {
  model: string;
  messages: AnthropicMessage[];
  max_tokens: number;
  system?: string;
  temperature?: number;
  tools?: AnthropicTool[];
  stream?: boolean;
}

interface AnthropicResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: AnthropicContentBlock[];
  model: string;
  stop_reason: 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence';
  stop_sequence?: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
}

export class AnthropicProvider extends BaseProvider {
  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<LLMResponse> {
    const request = this.buildRequest(messages, options);
    
    const response = await this.makeRequest('/v1/messages', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    const data: AnthropicResponse = await response.json();
    return this.parseResponse(data);
  }

  async *stream(messages: ChatMessage[], options: ChatOptions = {}): AsyncIterable<StreamChunk> {
    const request = this.buildRequest(messages, { ...options, stream: true });
    
    const response = await this.makeRequest('/v1/messages', {
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
              const event = JSON.parse(data);
              const chunk = this.parseStreamEvent(event);
              if (chunk) {
                yield chunk;
              }
            } catch (error) {
              console.warn('Failed to parse stream event:', error);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    return getModelsByProvider('anthropic');
  }

  private buildRequest(messages: ChatMessage[], options: ChatOptions): AnthropicRequest {
    const { model = 'claude-3-5-sonnet-20241022', maxTokens = 4096, temperature, tools, systemPrompt } = options;

    // Convert messages to Anthropic format
    const anthropicMessages: AnthropicMessage[] = [];
    let systemMessage = systemPrompt;

    for (const message of messages) {
      if (message.role === 'system') {
        // Anthropic handles system messages separately
        systemMessage = typeof message.content === 'string' ? message.content : 
          message.content.find(part => part.type === 'text')?.text || '';
        continue;
      }

      if (message.role === 'user' || message.role === 'assistant') {
        anthropicMessages.push({
          role: message.role,
          content: this.convertContent(message.content),
        });
      }
    }

    const request: AnthropicRequest = {
      model,
      messages: anthropicMessages,
      max_tokens: maxTokens,
    };

    if (systemMessage) {
      request.system = systemMessage;
    }

    if (temperature !== undefined) {
      request.temperature = temperature;
    }

    if (tools && tools.length > 0) {
      request.tools = tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema,
      }));
    }

    return request;
  }

  private convertContent(content: string | ContentPart[]): string | AnthropicContentBlock[] {
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
          type: 'image',
          source: {
            type: 'base64',
            media_type: part.image.mediaType,
            data: part.image.data,
          },
        };
      }
      throw new Error(`Unsupported content part type: ${part.type}`);
    });
  }

  private parseResponse(data: AnthropicResponse): LLMResponse {
    let content = '';
    const toolCalls: ToolCall[] = [];

    for (const block of data.content) {
      if (block.type === 'text' && block.text) {
        content += block.text;
      } else if (block.type === 'tool_use' && block.id && block.name && block.input) {
        toolCalls.push({
          id: block.id,
          name: block.name,
          input: block.input,
        });
      }
    }

    return {
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: {
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens,
        cacheReadTokens: data.usage.cache_read_input_tokens,
        cacheWriteTokens: data.usage.cache_creation_input_tokens,
      },
      stopReason: data.stop_reason,
      model: data.model,
    };
  }

  private parseStreamEvent(event: any): StreamChunk | null {
    switch (event.type) {
      case 'content_block_start':
        if (event.content_block?.type === 'tool_use') {
          return {
            type: 'tool_use',
            toolCall: {
              id: event.content_block.id,
              name: event.content_block.name,
            },
          };
        }
        return null;

      case 'content_block_delta':
        if (event.delta?.type === 'text_delta') {
          return {
            type: 'text',
            text: event.delta.text,
          };
        } else if (event.delta?.type === 'input_json_delta') {
          return {
            type: 'tool_use',
            toolCall: {
              input: event.delta.partial_json,
            },
          };
        }
        return null;

      case 'message_delta':
        if (event.usage) {
          return {
            type: 'done',
            usage: {
              inputTokens: event.usage.input_tokens || 0,
              outputTokens: event.usage.output_tokens || 0,
            },
          };
        }
        return null;

      case 'message_stop':
        return { type: 'done' };

      case 'error':
        return {
          type: 'error',
          error: event.error?.message || 'Unknown error',
        };

      default:
        return null;
    }
  }
}