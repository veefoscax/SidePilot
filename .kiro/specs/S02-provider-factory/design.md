# S02: Provider Factory - Design

## Type Definitions

```typescript
// src/providers/types.ts

// Provider types (based on Cline's api.ts)
export type ProviderType =
  | "anthropic"
  | "openai"
  | "google"
  | "openai-compat"
  | "deepseek"
  | "groq"
  | "mistral"
  | "ollama"
  | "lmstudio"
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
  | "vertex";

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
  apiKey: string;
  baseUrl?: string;
  extraHeaders?: Record<string, string>;
  defaultModel?: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string | ContentPart[];
}

export interface ContentPart {
  type: "text" | "image";
  text?: string;
  image?: {
    data: string; // base64
    mediaType: string;
  };
}

export interface ChatOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  tools?: ToolDefinition[];
  systemPrompt?: string;
}

export interface LLMResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage?: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
  };
  stopReason?: "end_turn" | "tool_use" | "max_tokens";
}

export interface StreamChunk {
  type: "text" | "tool_use" | "done";
  text?: string;
  toolCall?: Partial<ToolCall>;
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

export interface LLMProvider {
  readonly type: ProviderType;
  readonly config: ProviderConfig;

  chat(messages: ChatMessage[], options?: ChatOptions): Promise<LLMResponse>;
  stream(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<StreamChunk>;
  testConnection(): Promise<boolean>;
  listModels?(): Promise<ModelInfo[]>;
}
```

## Factory Implementation

```typescript
// src/providers/factory.ts
import { ProviderType, ProviderConfig, LLMProvider } from "./types";
import { AnthropicProvider } from "./anthropic";
import { OpenAIProvider } from "./openai";
import { GoogleProvider } from "./google";
import { DeepSeekProvider } from "./deepseek";
import { OllamaProvider } from "./ollama";

const PROVIDER_CLASSES: Record<ProviderType, new (config: ProviderConfig) => LLMProvider> = {
  anthropic: AnthropicProvider,
  openai: OpenAIProvider,
  "openai-compat": OpenAIProvider,
  google: GoogleProvider,
  deepseek: DeepSeekProvider,
  groq: OpenAIProvider, // OpenAI-compatible
  mistral: OpenAIProvider, // OpenAI-compatible
  ollama: OllamaProvider,
  lmstudio: OllamaProvider, // Same API as Ollama
  openrouter: OpenAIProvider,
  together: OpenAIProvider,
  fireworks: OpenAIProvider,
  moonshot: OpenAIProvider,
  zai: OpenAIProvider, // GLM uses OpenAI format
  huggingface: OpenAIProvider,
  xai: OpenAIProvider,
  cerebras: OpenAIProvider,
  sambanova: OpenAIProvider,
  bedrock: AnthropicProvider, // Anthropic format
  vertex: GoogleProvider,
};

export function createProvider(config: ProviderConfig): LLMProvider {
  const ProviderClass = PROVIDER_CLASSES[config.type];
  if (!ProviderClass) {
    throw new Error(`Unknown provider type: ${config.type}`);
  }
  return new ProviderClass(config);
}
```

## Base Provider

```typescript
// src/providers/base-provider.ts
export abstract class BaseProvider implements LLMProvider {
  readonly type: ProviderType;
  readonly config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.type = config.type;
    this.config = config;
  }

  abstract chat(messages: ChatMessage[], options?: ChatOptions): Promise<LLMResponse>;
  abstract stream(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<StreamChunk>;

  async testConnection(): Promise<boolean> {
    try {
      await this.chat([{ role: "user", content: "ping" }], { maxTokens: 5 });
      return true;
    } catch {
      return false;
    }
  }
}
```

## Model Registry (like Cline)

```typescript
// src/providers/models-registry.ts
export const MODEL_REGISTRY: Record<string, Partial<ModelInfo>> = {
  // Anthropic
  "claude-sonnet-4-5-20250929": {
    name: "Claude Sonnet 4.5",
    provider: "anthropic",
    capabilities: {
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: true,
      supportsPromptCache: true,
      contextWindow: 200000,
      maxOutputTokens: 8192,
    },
    pricing: { inputPer1M: 3, outputPer1M: 15 },
  },
  // OpenAI
  "gpt-4o": {
    name: "GPT-4o",
    provider: "openai",
    capabilities: {
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: true,
      contextWindow: 128000,
      maxOutputTokens: 4096,
    },
    pricing: { inputPer1M: 2.5, outputPer1M: 10 },
  },
  // DeepSeek
  "deepseek-chat": {
    name: "DeepSeek V3",
    provider: "deepseek",
    capabilities: {
      supportsVision: false,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: true,
      contextWindow: 128000,
      maxOutputTokens: 8000,
    },
    pricing: { inputPer1M: 0.27, outputPer1M: 1.1 },
  },
  // Z.AI
  "glm-4": {
    name: "GLM-4",
    provider: "zai",
    capabilities: {
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: false,
      contextWindow: 128000,
      maxOutputTokens: 4096,
    },
  },
  // Ollama (common local models)
  "llama3.3:70b": {
    name: "Llama 3.3 70B",
    provider: "ollama",
    capabilities: {
      supportsVision: false,
      supportsTools: false, // Most local models don't support tools
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: false,
      contextWindow: 128000,
      maxOutputTokens: 4096,
    },
  },
};

export function getModelInfo(modelId: string): ModelInfo | undefined {
  const info = MODEL_REGISTRY[modelId];
  if (!info) return undefined;
  return { id: modelId, ...info } as ModelInfo;
}
```

## Provider Base URLs

```typescript
export const PROVIDER_BASE_URLS: Record<ProviderType, string> = {
  anthropic: "https://api.anthropic.com",
  openai: "https://api.openai.com/v1",
  google: "https://generativelanguage.googleapis.com",
  deepseek: "https://api.deepseek.com",
  groq: "https://api.groq.com/openai/v1",
  mistral: "https://api.mistral.ai/v1",
  ollama: "http://localhost:11434",
  lmstudio: "http://localhost:1234/v1",
  openrouter: "https://openrouter.ai/api/v1",
  together: "https://api.together.xyz/v1",
  fireworks: "https://api.fireworks.ai/inference/v1",
  moonshot: "https://api.moonshot.cn/v1",
  zai: "https://open.bigmodel.cn/api/paas/v4",
  huggingface: "https://api-inference.huggingface.co",
  xai: "https://api.x.ai/v1",
  cerebras: "https://api.cerebras.ai/v1",
  sambanova: "https://api.sambanova.ai/v1",
  bedrock: "", // Uses AWS SDK
  vertex: "", // Uses Google SDK
  "openai-compat": "", // User-provided
};
```
