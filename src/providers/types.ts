/**
 * SidePilot Provider Types
 * 
 * Unified interface for 40+ LLM providers supporting chat, streaming, and tools.
 * Based on Cline's multi-provider architecture with SidePilot-specific enhancements.
 */

// Provider types (40+ supported like Cline)
export type ProviderType =
  // Tier 1: Core providers
  | "anthropic"
  | "openai"
  | "google"
  | "openai-compat"
  // Tier 2: Popular providers
  | "deepseek"
  | "groq"
  | "mistral"
  | "ollama"
  | "lmstudio"
  // Tier 3: Extended providers
  | "openrouter"
  | "together"
  | "fireworks"
  | "moonshot"
  | "zai"
  | "huggingface"
  | "xai"
  | "cerebras"
  | "sambanova"
  | "bedrock"
  | "vertex"
  | "cohere"
  | "perplexity"
  | "replicate"
  | "anyscale"
  | "baseten"
  | "modal"
  | "runpod"
  | "banana"
  | "beam"
  | "gradient"
  | "novita"
  | "lepton"
  | "hyperbolic"
  | "deepinfra"
  | "infermatic"
  | "aimlapi"
  | "shuttleai"
  | "cloudflare"
  | "workers-ai"
  | "minimax";

export interface ModelCapabilities {
  supportsVision: boolean;
  supportsTools: boolean;
  supportsStreaming: boolean;
  supportsReasoning: boolean;
  supportsPromptCache: boolean;
  contextWindow: number;
  maxOutputTokens: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: ProviderType;
  capabilities: ModelCapabilities;
  pricing?: {
    inputPer1M: number;
    outputPer1M: number;
    cacheWritePer1M?: number;
    cacheReadPer1M?: number;
  };
}

export interface ProviderConfig {
  type: ProviderType;
  apiKey?: string;
  baseUrl?: string;
  extraHeaders?: Record<string, string>;
  defaultModel?: string;
  // Provider-specific options
  organizationId?: string; // OpenAI
  projectId?: string; // Google
  region?: string; // AWS Bedrock
  groupId?: string; // MiniMax
  authMethod?: 'bearer' | 'header' | 'query' | 'none';
  authHeader?: string;
  authParam?: string;
  requiresGroupId?: boolean;
  specialConfig?: string;
}

export interface UserProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  groupId?: string; // For MiniMax
  extraHeaders?: Record<string, string>;
}

export interface ConnectionResult {
  success: boolean;
  models?: ModelInfo[];
  error?: ProviderError;
  timestamp: Date;
}

export type ConnectionStatus = 'untested' | 'healthy' | 'degraded' | 'unhealthy';

export interface ContentPart {
  type: "text" | "image";
  text?: string;
  image?: {
    data: string; // base64
    mediaType: string;
  };
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string | ContentPart[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: object;
}

export interface ToolCall {
  id: string;
  name: string;
  input: object;
}

export interface ChatOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  tools?: ToolDefinition[];
  systemPrompt?: string;
  stream?: boolean;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
}

export interface LLMResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage?: TokenUsage;
  stopReason?: "end_turn" | "tool_use" | "max_tokens" | "stop_sequence";
  model?: string;
}

export interface StreamChunk {
  type: "text" | "tool_use" | "done" | "error";
  text?: string;
  toolCall?: Partial<ToolCall>;
  usage?: TokenUsage;
  error?: string;
}

/**
 * Unified LLM Provider Interface
 * 
 * All providers must implement this interface for consistent usage across SidePilot.
 * Supports both streaming and non-streaming chat, tool calling, and connection testing.
 */
export interface LLMProvider {
  readonly type: ProviderType;
  readonly config: ProviderConfig;

  /**
   * Send a chat completion request (non-streaming)
   */
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<LLMResponse>;

  /**
   * Send a streaming chat completion request
   */
  stream(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<StreamChunk>;

  /**
   * Test if the provider configuration is valid
   */
  testConnection(): Promise<ConnectionResult>;

  /**
   * List available models (optional - not all providers support this)
   */
  listModels?(): Promise<ModelInfo[]>;

  /**
   * Get connection status
   */
  getConnectionStatus(): ConnectionStatus;
}

/**
 * Provider creation error types
 */
export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: ProviderType,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export class AuthenticationError extends ProviderError {
  constructor(provider: ProviderType, message = 'Invalid API key or authentication failed') {
    super(message, provider, 'AUTH_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends ProviderError {
  constructor(provider: ProviderType, message = 'Rate limit exceeded') {
    super(message, provider, 'RATE_LIMIT');
    this.name = 'RateLimitError';
  }
}

export class NetworkError extends ProviderError {
  constructor(provider: ProviderType, message = 'Network error occurred') {
    super(message, provider, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class ModelNotFoundError extends ProviderError {
  constructor(provider: ProviderType, model: string) {
    super(`Model '${model}' not found for provider '${provider}'`, provider, 'MODEL_NOT_FOUND');
    this.name = 'ModelNotFoundError';
  }
}