/**
 * Ollama Provider
 * 
 * Implements Ollama's local API with support for:
 * - Chat completions
 * - Streaming
 * - Local model management
 * - No API key required (local server)
 */

import { BaseProvider } from './base-provider';
import { 
  ChatMessage, 
  ChatOptions, 
  LLMResponse, 
  StreamChunk, 
  ModelInfo
} from './types';
import { getModelsByProvider } from './models-registry';

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaRequest {
  model: string;
  messages: OllamaMessage[];
  stream?: boolean;
  options?: {
    temperature?: number;
    num_predict?: number;
  };
}

interface OllamaResponse {
  model: string;
  created_at: string;
  message: {
    role: 'assistant';
    content: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

interface OllamaModelsResponse {
  models: OllamaModel[];
}

export class OllamaProvider extends BaseProvider {
  protected requiresApiKey(): boolean {
    return false; // Ollama runs locally, no API key needed
  }

  protected getBaseUrl(): string {
    return this.config.baseUrl || 'http://localhost:11434';
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
    
    const response = await this.makeRequest('/api/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    const data: OllamaResponse = await response.json();
    return this.parseResponse(data);
  }

  async *stream(messages: ChatMessage[], options: ChatOptions = {}): AsyncIterable<StreamChunk> {
    const request = this.buildRequest(messages, { ...options, stream: true });
    
    const response = await this.makeRequest('/api/chat', {
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
          if (line.trim()) {
            try {
              const data: OllamaResponse = JSON.parse(line);
              const chunk = this.parseStreamChunk(data);
              if (chunk) {
                yield chunk;
              }
              
              if (data.done) {
                return;
              }
            } catch (error) {
              console.warn('Failed to parse Ollama stream chunk:', error);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    try {
      // First try to get models from local Ollama server
      const response = await this.makeRequest('/api/tags');
      const data: OllamaModelsResponse = await response.json();
      
      return data.models.map(model => ({
        id: model.name,
        name: this.formatModelName(model.name),
        provider: 'ollama' as const,
        capabilities: {
          supportsVision: this.supportsVision(model.name),
          supportsTools: false, // Most local models don't support tools yet
          supportsStreaming: true,
          supportsReasoning: this.supportsReasoning(model.name),
          supportsPromptCache: false,
          contextWindow: this.getContextWindow(model.name),
          maxOutputTokens: 4096,
        },
      }));
    } catch (error) {
      console.warn('Failed to fetch Ollama models:', error);
      // Return empty array - let the UI show "No models available"
      return [];
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Test if Ollama server is running
      const response = await fetch(`${this.getBaseUrl()}/api/tags`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return response.ok;
    } catch (error) {
      console.warn('Ollama connection test failed:', error);
      return false;
    }
  }

  private buildRequest(messages: ChatMessage[], options: ChatOptions): OllamaRequest {
    const { model = 'llama3.3:70b', maxTokens, temperature, systemPrompt } = options;

    // Convert messages to Ollama format
    const ollamaMessages: OllamaMessage[] = [];

    // Add system prompt if provided
    if (systemPrompt) {
      ollamaMessages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    for (const message of messages) {
      if (message.role === 'system' && !systemPrompt) {
        ollamaMessages.push({
          role: 'system',
          content: typeof message.content === 'string' ? message.content : 
            message.content.find(part => part.type === 'text')?.text || '',
        });
      } else if (message.role === 'user' || message.role === 'assistant') {
        ollamaMessages.push({
          role: message.role,
          content: typeof message.content === 'string' ? message.content :
            message.content.find(part => part.type === 'text')?.text || '',
        });
      }
    }

    const request: OllamaRequest = {
      model,
      messages: ollamaMessages,
    };

    if (maxTokens || temperature !== undefined) {
      request.options = {};
      if (maxTokens) {
        request.options.num_predict = maxTokens;
      }
      if (temperature !== undefined) {
        request.options.temperature = temperature;
      }
    }

    return request;
  }

  private parseResponse(data: OllamaResponse): LLMResponse {
    return {
      content: data.message.content,
      usage: {
        inputTokens: data.prompt_eval_count || 0,
        outputTokens: data.eval_count || 0,
      },
      stopReason: 'end_turn',
      model: data.model,
    };
  }

  private parseStreamChunk(data: OllamaResponse): StreamChunk | null {
    if (data.message?.content) {
      return {
        type: 'text',
        text: data.message.content,
      };
    }

    if (data.done) {
      return {
        type: 'done',
        usage: {
          inputTokens: data.prompt_eval_count || 0,
          outputTokens: data.eval_count || 0,
        },
      };
    }

    return null;
  }

  private formatModelName(name: string): string {
    // Convert model names like "llama3.3:70b" to "Llama 3.3 70B"
    return name
      .replace(/:/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/(\d+)b/gi, '$1B');
  }

  private supportsVision(modelName: string): boolean {
    // Check if model supports vision (multimodal models)
    const visionModels = ['llava', 'bakllava', 'moondream'];
    return visionModels.some(vm => modelName.toLowerCase().includes(vm));
  }

  private supportsReasoning(modelName: string): boolean {
    // Check if model supports reasoning (like DeepSeek R1)
    return modelName.toLowerCase().includes('deepseek-r1') || 
           modelName.toLowerCase().includes('reasoning');
  }

  private getContextWindow(modelName: string): number {
    // Estimate context window based on model name
    if (modelName.includes('70b') || modelName.includes('72b')) {
      return 128000;
    }
    if (modelName.includes('32b')) {
      return 32768;
    }
    if (modelName.includes('13b') || modelName.includes('14b')) {
      return 16384;
    }
    if (modelName.includes('7b') || modelName.includes('8b')) {
      return 8192;
    }
    return 4096; // Default
  }
}