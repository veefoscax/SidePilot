/**
 * SidePilot Base Provider
 * 
 * Abstract base class for all LLM providers with common functionality.
 */

import {
  LLMProvider,
  ProviderConfig,
  ProviderType,
  ChatMessage,
  ChatOptions,
  LLMResponse,
  StreamChunk,
  ProviderError,
  AuthenticationError,
  RateLimitError,
  NetworkError,
  ModelInfo,
  ConnectionResult,
  ConnectionStatus
} from './types';
import { ConnectionState } from './connection-state';
import { getProviderConfig, requiresApiKey as checkRequiresApiKey } from './provider-configs';

export abstract class BaseProvider implements LLMProvider {
  readonly type: ProviderType;
  readonly config: ProviderConfig;
  private connectionState: ConnectionState;
  private modelCache: ModelInfo[] = [];

  constructor(config: ProviderConfig) {
    this.type = config.type;
    this.config = config;
    this.connectionState = new ConnectionState();
    this.validateConfig();
  }

  /**
   * Validate provider configuration
   */
  protected validateConfig(): void {
    if (!this.config.apiKey && this.requiresApiKey()) {
      throw new Error(`API key is required for ${this.type} provider`);
    }
  }

  /**
   * Whether this provider requires an API key
   */
  protected requiresApiKey(): boolean {
    return checkRequiresApiKey(this.type);
  }

  /**
   * Get the base URL for API requests
   */
  protected getBaseUrl(): string {
    if (this.config.baseUrl) {
      return this.config.baseUrl;
    }

    const providerConfig = getProviderConfig(this.type);
    return providerConfig?.baseUrl || '';
  }

  /**
   * Get default headers for API requests
   */
  protected getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'SidePilot/1.0.0',
    };

    const providerConfig = getProviderConfig(this.type);

    // Add provider-specific headers
    if (this.config.apiKey && providerConfig) {
      switch (providerConfig.authMethod) {
        case 'bearer':
          headers['Authorization'] = `Bearer ${this.config.apiKey}`;
          break;
        case 'header':
          if (providerConfig.authHeader) {
            headers[providerConfig.authHeader] = this.config.apiKey;
          }
          break;
        case 'query':
          // Query parameters are handled in buildUrl
          break;
        case 'none':
          // No authentication required
          break;
      }
    }

    // Add provider-specific extra headers
    if (providerConfig?.extraHeaders) {
      Object.assign(headers, providerConfig.extraHeaders);
    }

    // Add user-configured extra headers
    if (this.config.extraHeaders) {
      Object.assign(headers, this.config.extraHeaders);
    }

    // Special handling for MiniMax Group ID
    if (this.type === 'minimax' && this.config.groupId) {
      headers['X-Group-Id'] = this.config.groupId;
    }

    return headers;
  }

  /**
   * Build URL with query parameters (for Google and other query-based auth)
   */
  protected buildUrl(endpoint: string): string {
    const baseUrl = this.getBaseUrl();
    const url = new URL(`${baseUrl}${endpoint}`);

    const providerConfig = getProviderConfig(this.type);

    // Add API key as query parameter for providers that use query auth
    if (providerConfig?.authMethod === 'query' && providerConfig.authParam && this.config.apiKey) {
      url.searchParams.set(providerConfig.authParam, this.config.apiKey);
    }

    return url.toString();
  }

  /**
   * Default request timeout in milliseconds
   */
  protected readonly REQUEST_TIMEOUT_MS = 30000;

  /**
   * Maximum retry attempts for rate limit errors
   */
  protected readonly MAX_RETRIES = 3;

  /**
   * Make HTTP request with timeout and error handling
   */
  protected async makeRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    return this.makeRequestWithRetry(endpoint, options, 0);
  }

  /**
   * Make HTTP request with retry logic for rate limits and network errors
   */
  private async makeRequestWithRetry(
    endpoint: string,
    options: RequestInit,
    attempt: number
  ): Promise<Response> {
    const url = this.buildUrl(endpoint);
    const headers = this.getHeaders();

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        // Check if this is a retryable error
        if (response.status === 429 && attempt < this.MAX_RETRIES) {
          // Rate limit - retry with exponential backoff
          const delay = this.calculateBackoffDelay(attempt);
          console.log(`⏳ Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${this.MAX_RETRIES})`);
          await this.sleep(delay);
          return this.makeRequestWithRetry(endpoint, options, attempt + 1);
        }
        await this.handleErrorResponse(response);
      }

      return response;
    } catch (error) {
      // Handle abort (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        if (attempt < this.MAX_RETRIES) {
          const delay = this.calculateBackoffDelay(attempt);
          console.log(`⏳ Request timed out, retrying in ${delay}ms (attempt ${attempt + 1}/${this.MAX_RETRIES})`);
          await this.sleep(delay);
          return this.makeRequestWithRetry(endpoint, options, attempt + 1);
        }
        throw new NetworkError(
          this.type,
          `Request timed out after ${this.REQUEST_TIMEOUT_MS}ms (${this.MAX_RETRIES} retries exhausted)`
        );
      }

      if (error instanceof ProviderError) {
        throw error;
      }

      // Network errors - retry with backoff
      if (attempt < this.MAX_RETRIES) {
        const delay = this.calculateBackoffDelay(attempt);
        console.log(`⏳ Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${this.MAX_RETRIES})`);
        await this.sleep(delay);
        return this.makeRequestWithRetry(endpoint, options, attempt + 1);
      }

      throw new NetworkError(
        this.type,
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Calculate exponential backoff delay with jitter
   */
  private calculateBackoffDelay(attempt: number): number {
    const baseDelay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
    const jitter = Math.random() * 1000; // 0-1000ms random jitter
    return baseDelay + jitter;
  }

  /**
   * Promise-based sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Handle error responses from API
   */
  protected async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

    try {
      const errorData = await response.json();
      if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // Ignore JSON parsing errors
    }

    // Map HTTP status codes to specific error types
    switch (response.status) {
      case 401:
      case 403:
        throw new AuthenticationError(this.type, this.getAuthErrorMessage(errorMessage));
      case 429:
        throw new RateLimitError(this.type, 'Rate limit exceeded. Please try again later.');
      default:
        throw new ProviderError(errorMessage, this.type, response.status.toString());
    }
  }

  /**
   * Get provider-specific authentication error message
   */
  private getAuthErrorMessage(originalMessage: string): string {
    const authGuides: Record<string, string> = {
      anthropic: 'Get your API key from https://console.anthropic.com/settings/keys',
      openai: 'Get your API key from https://platform.openai.com/api-keys',
      google: 'Get your API key from https://aistudio.google.com/apikey',
      zai: 'Verify your ZAI coding plan API key and ensure it has sufficient credits',
      minimax: 'Ensure both API key and Group ID are correct from MiniMax console',
      deepseek: 'Get your API key from https://platform.deepseek.com/api_keys',
      groq: 'Get your API key from https://console.groq.com/keys',
      mistral: 'Get your API key from https://console.mistral.ai/api-keys',
      openrouter: 'Get your API key from https://openrouter.ai/keys',
      together: 'Get your API key from https://api.together.xyz/settings/api-keys',
      perplexity: 'Get your API key from https://www.perplexity.ai/settings/api'
    };

    const guidance = authGuides[this.type] || 'Please check your API key and try again.';
    return `${originalMessage}\n\n${guidance}`;
  }

  /**
   * Enhanced connection testing that matches actual usage
   */
  async testConnection(): Promise<ConnectionResult> {
    try {
      // Use the same configuration as actual chat requests
      const testResult = await this.performConnectionTest();
      this.connectionState.markSuccess();
      return {
        success: true,
        models: testResult.models,
        timestamp: new Date()
      };
    } catch (error) {
      const providerError = error instanceof ProviderError ? error :
        new ProviderError(
          error instanceof Error ? error.message : 'Unknown error',
          this.type
        );

      this.connectionState.markFailure(providerError);
      return {
        success: false,
        error: providerError,
        timestamp: new Date()
      };
    }
  }

  /**
   * Provider-specific connection test implementation
   */
  protected async performConnectionTest(): Promise<{ models: ModelInfo[] }> {
    // Default implementation: try to list models or make a minimal chat request
    try {
      const models = await this.listModels?.() || [];
      return { models };
    } catch (error) {
      // Fallback to minimal chat request
      const response = await this.chat(
        [{ role: 'user', content: 'test' }],
        { maxTokens: 1 }
      );

      if (response.content.length >= 0) {
        return { models: this.getDefaultModels() };
      }

      throw error;
    }
  }

  /**
   * Enhanced model loading with fallback
   */
  async listModels(): Promise<ModelInfo[]> {
    if (this.modelCache.length > 0) {
      return this.modelCache;
    }

    try {
      const models = await this.fetchModelsFromAPI();
      this.modelCache = models;
      return models;
    } catch (error) {
      console.warn(`Failed to fetch models for ${this.type}, using defaults:`, error);
      const defaultModels = this.getDefaultModels();
      this.modelCache = defaultModels;
      return defaultModels;
    }
  }

  /**
   * Provider-specific model fetching
   */
  protected async fetchModelsFromAPI(): Promise<ModelInfo[]> {
    // Default implementation for OpenAI-compatible providers
    try {
      const response = await this.makeRequest('/models');
      const data = await response.json();

      if (data.data && Array.isArray(data.data)) {
        return data.data.map((model: any) => ({
          id: model.id,
          name: model.id,
          provider: this.type,
          capabilities: this.getModelCapabilities(model.id)
        }));
      }
    } catch (error) {
      // If /models endpoint doesn't exist, fall back to defaults
    }

    return this.getDefaultModels();
  }

  /**
   * Get default models for the provider
   */
  protected abstract getDefaultModels(): ModelInfo[];

  /**
   * Get model capabilities based on model ID
   */
  protected getModelCapabilities(modelId: string): ModelInfo['capabilities'] {
    // Default capabilities - providers can override
    return {
      supportsVision: false,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: false,
      contextWindow: 4096,
      maxOutputTokens: 2048
    };
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionState.getStatus();
  }

  /**
   * Clear cached models (called when configuration changes)
   */
  clearModelCache(): void {
    this.modelCache = [];
    this.connectionState.reset();
  }

  /**
   * Abstract methods that must be implemented by concrete providers
   */
  abstract chat(messages: ChatMessage[], options?: ChatOptions): Promise<LLMResponse>;
  abstract stream(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<StreamChunk>;
}