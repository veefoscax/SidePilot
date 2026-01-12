/**
 * Google Gemini Provider
 * 
 * Implements Google's Gemini API with support for:
 * - Chat completions
 * - Streaming
 * - Tool calling (function calling)
 * - Vision (multimodal capabilities)
 * - Large context windows (up to 2M tokens)
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

interface GoogleContent {
  parts: Array<{
    text?: string;
    inlineData?: {
      mimeType: string;
      data: string;
    };
    functionCall?: {
      name: string;
      args: object;
    };
    functionResponse?: {
      name: string;
      response: object;
    };
  }>;
  role?: 'user' | 'model';
}

interface GoogleTool {
  functionDeclarations: Array<{
    name: string;
    description: string;
    parameters: object;
  }>;
}

interface GoogleRequest {
  contents: GoogleContent[];
  tools?: GoogleTool[];
  systemInstruction?: {
    parts: Array<{ text: string }>;
  };
  generationConfig?: {
    maxOutputTokens?: number;
    temperature?: number;
  };
}

interface GoogleResponse {
  candidates: Array<{
    content: GoogleContent;
    finishReason: 'FINISH_REASON_STOP' | 'FINISH_REASON_MAX_TOKENS' | 'FINISH_REASON_SAFETY' | 'FINISH_REASON_RECITATION' | 'FINISH_REASON_OTHER';
    safetyRatings?: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export class GoogleProvider extends BaseProvider {
  protected getBaseUrl(): string {
    if (this.config.baseUrl) {
      return this.config.baseUrl;
    }
    return 'https://generativelanguage.googleapis.com';
  }

  protected getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'User-Agent': 'SidePilot/1.0.0',
      ...this.config.extraHeaders,
    };
  }

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<LLMResponse> {
    const request = this.buildRequest(messages, options);
    const model = options.model || 'gemini-2.0-flash-exp';
    
    const response = await this.makeRequest(
      `/v1beta/models/${model}:generateContent?key=${this.config.apiKey}`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );

    const data: GoogleResponse = await response.json();
    return this.parseResponse(data);
  }

  async *stream(messages: ChatMessage[], options: ChatOptions = {}): AsyncIterable<StreamChunk> {
    const request = this.buildRequest(messages, options);
    const model = options.model || 'gemini-2.0-flash-exp';
    
    const response = await this.makeRequest(
      `/v1beta/models/${model}:streamGenerateContent?key=${this.config.apiKey}`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );

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
          if (line.trim() && line.startsWith('[') || line.startsWith('{')) {
            try {
              const data: GoogleResponse = JSON.parse(line);
              const chunk = this.parseStreamChunk(data);
              if (chunk) {
                yield chunk;
              }
            } catch (error) {
              console.warn('Failed to parse Google stream chunk:', error);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    yield { type: 'done' };
  }

  async listModels(): Promise<ModelInfo[]> {
    return getModelsByProvider('google');
  }

  private buildRequest(messages: ChatMessage[], options: ChatOptions): GoogleRequest {
    const { maxTokens, temperature, tools, systemPrompt } = options;

    // Convert messages to Google format
    const contents: GoogleContent[] = [];
    let systemInstruction: GoogleRequest['systemInstruction'];

    // Handle system prompt
    if (systemPrompt) {
      systemInstruction = {
        parts: [{ text: systemPrompt }]
      };
    }

    for (const message of messages) {
      if (message.role === 'system' && !systemPrompt) {
        systemInstruction = {
          parts: [{ 
            text: typeof message.content === 'string' ? message.content : 
              message.content.find(part => part.type === 'text')?.text || ''
          }]
        };
        continue;
      }

      if (message.role === 'user' || message.role === 'assistant') {
        contents.push({
          role: message.role === 'assistant' ? 'model' : 'user',
          parts: this.convertContent(message.content),
        });
      }
    }

    const request: GoogleRequest = {
      contents,
    };

    if (systemInstruction) {
      request.systemInstruction = systemInstruction;
    }

    if (maxTokens || temperature !== undefined) {
      request.generationConfig = {};
      if (maxTokens) {
        request.generationConfig.maxOutputTokens = maxTokens;
      }
      if (temperature !== undefined) {
        request.generationConfig.temperature = temperature;
      }
    }

    if (tools && tools.length > 0) {
      request.tools = [{
        functionDeclarations: tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
        }))
      }];
    }

    return request;
  }

  private convertContent(content: string | ContentPart[]): Array<{
    text?: string;
    inlineData?: { mimeType: string; data: string };
  }> {
    if (typeof content === 'string') {
      return [{ text: content }];
    }

    return content.map(part => {
      if (part.type === 'text') {
        return { text: part.text || '' };
      } else if (part.type === 'image' && part.image) {
        return {
          inlineData: {
            mimeType: part.image.mediaType,
            data: part.image.data,
          }
        };
      }
      throw new Error(`Unsupported content part type: ${part.type}`);
    });
  }

  private parseResponse(data: GoogleResponse): LLMResponse {
    const candidate = data.candidates[0];
    if (!candidate) {
      throw new Error('No candidates in Google response');
    }

    let content = '';
    const toolCalls: ToolCall[] = [];

    for (const part of candidate.content.parts) {
      if (part.text) {
        content += part.text;
      } else if (part.functionCall) {
        toolCalls.push({
          id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: part.functionCall.name,
          input: part.functionCall.args,
        });
      }
    }

    return {
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: data.usageMetadata ? {
        inputTokens: data.usageMetadata.promptTokenCount,
        outputTokens: data.usageMetadata.candidatesTokenCount,
      } : undefined,
      stopReason: this.mapFinishReason(candidate.finishReason),
    };
  }

  private parseStreamChunk(data: GoogleResponse): StreamChunk | null {
    const candidate = data.candidates?.[0];
    if (!candidate) return null;

    for (const part of candidate.content.parts) {
      if (part.text) {
        return {
          type: 'text',
          text: part.text,
        };
      } else if (part.functionCall) {
        return {
          type: 'tool_use',
          toolCall: {
            id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: part.functionCall.name,
            input: part.functionCall.args,
          },
        };
      }
    }

    if (candidate.finishReason && candidate.finishReason !== 'FINISH_REASON_STOP') {
      return {
        type: 'done',
        usage: data.usageMetadata ? {
          inputTokens: data.usageMetadata.promptTokenCount,
          outputTokens: data.usageMetadata.candidatesTokenCount,
        } : undefined,
      };
    }

    return null;
  }

  private mapFinishReason(reason: string): LLMResponse['stopReason'] {
    switch (reason) {
      case 'FINISH_REASON_STOP':
        return 'end_turn';
      case 'FINISH_REASON_MAX_TOKENS':
        return 'max_tokens';
      default:
        return 'end_turn';
    }
  }
}