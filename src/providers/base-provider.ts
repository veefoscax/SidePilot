/**
 * SidePilot Base Provider
 * 
 * Abstract base class for all LLM providers with common functionality.
 */

import { LLMProvider, ProviderConfig, ProviderType, ChatMessage, ChatOptions, LLMResponse, StreamChunk } from './types';

export abstract class BaseProvider implements LLMProvider {
  readonly type: ProviderType;
  readonly config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.type = config.type;
    this.config = config;
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
    // Local providers don't require API keys
    return !['ollama', 'lmstudio'].includes(this.type);
  }

  /**
   * Get the base URL for API requests
   */
  protected getBaseUrl(): string {
    if (this.config.baseUrl) {
      return this.config.baseUrl;
    }
    
    // Import here to avoid circular dependency
    const { PROVIDER_BASE_URLS } = require('./models-registry');
    return PROVIDER_BASE_URLS[this.type] || '';
  }

  /**
   * Get default headers for API requests
   */
  protected getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'SidePilot/1.0.0',
    };

    // Add provider-specific headers
    if (this.config.apiKey) {
      switch (this.type) {
        case 'anthropic':
          headers['x-api-key'] = this.config.apiKey;
          headers['anthropic-version'] = '2023-06-01';
          break;
        case 'openai':
        case 'openai-compat':
        case 'groq':
        case 'mistral':
        case 'openrouter':
        case 'together':
        case 'fireworks':
        case 'deepseek':
        case 'xai':
        case 'cerebras':
        case 'sambanova':
          headers['Authorization'] = `Bearer ${this.config.apiKey}`;
          break;
        case 'google':
          // Google uses API key as query parameter, not header
          break;
        case 'zai':
          headers['Authorization'] = `Bearer ${this.config.apiKey}`;
          break;
        default:
          headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }
    }

    // Add extra headers from config
    if (this.config.extraHeaders) {
      Object.assign(headers, this.config.extraHeaders);
    }

    return headers;
  }

  /**
   * Make HTTP request with error handling
   */
  protected async makeRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${this.getBaseUrl()}${endpoint}`;
    const headers = this.getHeaders();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    return response;
  }

  /**
   * Handle error responses from API
   */
  protected async handleErrorResponse(response: Response): Promise<never> {
    const { ProviderError, AuthenticationError, RateLimitError } = require('./types');
    
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
        throw new AuthenticationError(this.type, errorMessage);
      case 429:
        throw new RateLimitError(this.type, errorMessage);
      default:
        throw new ProviderError(errorMessage, this.type, response.status.toString());
    }
  }

  /**
   * Default implementation of testConnection
   * Sends a minimal chat request to verify API key and connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.chat(
        [{ role: 'user', content: 'ping' }],
        { maxTokens: 5 }
      );
      return response.content.length > 0;
    } catch (error) {
      console.warn(`Connection test failed for ${this.type}:`, error);
      return false;
    }
  }

  /**
   * Abstract methods that must be implemented by concrete providers
   */
  abstract chat(messages: ChatMessage[], options?: ChatOptions): Promise<LLMResponse>;
  abstract stream(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<StreamChunk>;

  /**
   * Optional method to list available models
   * Not all providers support this
   */
  async listModels?(): Promise<import('./types').ModelInfo[]>;
}