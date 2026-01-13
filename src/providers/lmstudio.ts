/**
 * LM Studio Provider
 * 
 * Extends Ollama provider for LM Studio compatibility.
 * LM Studio uses the same API as Ollama but runs on port 1234 by default.
 */

import { OllamaProvider } from './ollama';
import { ModelInfo } from './types';

export class LMStudioProvider extends OllamaProvider {
  protected getBaseUrl(): string {
    return this.config.baseUrl || 'http://127.0.0.1:1234';
  }

  async listModels(): Promise<ModelInfo[]> {
    try {
      // First try to get models from local LM Studio server
      const response = await this.makeRequest('/v1/models');
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        return data.data.map((model: any) => ({
          id: model.id,
          name: this.formatLMStudioModelName(model.id),
          provider: 'lmstudio' as const,
          capabilities: {
            supportsVision: this.supportsLMStudioVision(model.id),
            supportsTools: false, // Most local models don't support tools yet
            supportsStreaming: true,
            supportsReasoning: this.supportsLMStudioReasoning(model.id),
            supportsPromptCache: false,
            contextWindow: this.getLMStudioContextWindow(model.id),
            maxOutputTokens: 4096,
          },
        }));
      }
    } catch (error) {
      console.warn('Failed to fetch LM Studio models, trying Ollama API:', error);
      
      // Fallback to Ollama API format
      try {
        const response = await this.makeRequest('/api/tags');
        const data = await response.json();
        
        if (data.models && Array.isArray(data.models)) {
          return data.models.map((model: any) => ({
            id: model.name,
            name: this.formatLMStudioModelName(model.name),
            provider: 'lmstudio' as const,
            capabilities: {
              supportsVision: this.supportsLMStudioVision(model.name),
              supportsTools: false,
              supportsStreaming: true,
              supportsReasoning: this.supportsLMStudioReasoning(model.name),
              supportsPromptCache: false,
              contextWindow: this.getLMStudioContextWindow(model.name),
              maxOutputTokens: 4096,
            },
          }));
        }
      } catch (ollamaError) {
        console.warn('Failed to fetch LM Studio models via Ollama API:', ollamaError);
        // Return empty array - let the UI show "No models available"
        return [];
      }
    }
    
    // Return empty array - let the UI show "No models available"
    return [];
  }

  async testConnection(): Promise<boolean> {
    try {
      // First try OpenAI-compatible endpoint (LM Studio's preferred API)
      const response = await fetch(`${this.getBaseUrl()}/v1/models`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      if (response.ok) {
        return true;
      }
      
      // Fallback to Ollama-compatible endpoint
      const ollamaResponse = await fetch(`${this.getBaseUrl()}/api/tags`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      return ollamaResponse.ok;
    } catch (error) {
      console.warn('LM Studio connection test failed:', error);
      return false;
    }
  }

  private formatLMStudioModelName(name: string): string {
    // Convert model names to readable format
    return name
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/(\d+)b/gi, '$1B');
  }

  private supportsLMStudioVision(modelName: string): boolean {
    // Check if model supports vision (multimodal models)
    const visionModels = ['llava', 'bakllava', 'moondream', 'vision'];
    return visionModels.some(vm => modelName.toLowerCase().includes(vm));
  }

  private supportsLMStudioReasoning(modelName: string): boolean {
    // Check if model supports reasoning
    return modelName.toLowerCase().includes('deepseek-r1') || 
           modelName.toLowerCase().includes('reasoning') ||
           modelName.toLowerCase().includes('r1');
  }

  private getLMStudioContextWindow(modelName: string): number {
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