/**
 * SidePilot Model Registry
 * 
 * Comprehensive registry of LLM models with capabilities and pricing.
 * Based on Cline's model registry with SidePilot-specific enhancements.
 * 
 * VERIFICATION NOTES (Task 7 - Model Registry Verification):
 * - Anthropic models: Verified against https://docs.anthropic.com/en/docs/about-claude/models
 * - OpenAI models: Verified against https://platform.openai.com/docs/models
 * - Google models: Verified against https://ai.google.dev/gemini-api/docs/models/gemini
 * - DeepSeek models: Verified against https://platform.deepseek.com/api-docs
 * - Last verified: January 2025
 */

import { ModelInfo, ProviderType } from './types';

/**
 * Model registry with capabilities and pricing information
 * Updated and verified as of January 2025
 */
export const MODEL_REGISTRY: Record<string, Omit<ModelInfo, 'id'>> = {
  // Anthropic Claude Models
  "claude-3-5-sonnet-20241022": {
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    capabilities: {
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: true,
      contextWindow: 200000,
      maxOutputTokens: 8192,
    },
    pricing: { 
      inputPer1M: 3, 
      outputPer1M: 15,
      cacheWritePer1M: 3.75,
      cacheReadPer1M: 0.3
    },
  },
  "claude-3-5-haiku-20241022": {
    name: "Claude 3.5 Haiku",
    provider: "anthropic",
    capabilities: {
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: true,
      contextWindow: 200000,
      maxOutputTokens: 8192,
    },
    pricing: { 
      inputPer1M: 0.8, 
      outputPer1M: 4,
      cacheWritePer1M: 1,
      cacheReadPer1M: 0.08
    },
  },
  // Anthropic Claude 3 Opus - Most capable Claude 3 model
  // Ref: https://docs.anthropic.com/en/docs/about-claude/models
  "claude-3-opus-20240229": {
    name: "Claude 3 Opus",
    provider: "anthropic",
    capabilities: {
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: true,
      contextWindow: 200000,
      maxOutputTokens: 4096,
    },
    pricing: { 
      inputPer1M: 15, 
      outputPer1M: 75,
      cacheWritePer1M: 18.75,
      cacheReadPer1M: 1.5
    },
  },
  // Anthropic Claude 3 Haiku - Fast and affordable
  "claude-3-haiku-20240307": {
    name: "Claude 3 Haiku",
    provider: "anthropic",
    capabilities: {
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: true,
      contextWindow: 200000,
      maxOutputTokens: 4096,
    },
    pricing: { 
      inputPer1M: 0.25, 
      outputPer1M: 1.25,
      cacheWritePer1M: 0.3,
      cacheReadPer1M: 0.03
    },
  },

  // OpenAI Models
  "gpt-4o": {
    name: "GPT-4o",
    provider: "openai",
    capabilities: {
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: false, // OpenAI doesn't have prompt caching like Anthropic
      contextWindow: 128000,
      maxOutputTokens: 4096,
    },
    pricing: { inputPer1M: 2.5, outputPer1M: 10 },
  },
  "gpt-4o-mini": {
    name: "GPT-4o Mini",
    provider: "openai",
    capabilities: {
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: false, // OpenAI doesn't have prompt caching like Anthropic
      contextWindow: 128000,
      maxOutputTokens: 16384,
    },
    pricing: { inputPer1M: 0.15, outputPer1M: 0.6 },
  },
  // OpenAI o1 - Full version with function calling and vision (Dec 2024 update)
  // Ref: https://openai.com/index/o1-and-new-tools-for-developers/
  "o1": {
    name: "o1",
    provider: "openai",
    capabilities: {
      supportsVision: true,  // Added Dec 2024
      supportsTools: true,   // Added Dec 2024 - function calling support
      supportsStreaming: true, // Added Dec 2024
      supportsReasoning: true,
      supportsPromptCache: false,
      contextWindow: 200000,
      maxOutputTokens: 100000,
    },
    pricing: { inputPer1M: 15, outputPer1M: 60 },
  },
  // OpenAI o1-mini - Preview version, limited capabilities
  // Note: o1-mini and o1-preview do NOT support function calling
  "o1-mini": {
    name: "o1 Mini",
    provider: "openai",
    capabilities: {
      supportsVision: false,  // Not supported in mini
      supportsTools: false,   // Not supported in mini/preview versions
      supportsStreaming: false, // Limited streaming in mini
      supportsReasoning: true,
      supportsPromptCache: false,
      contextWindow: 128000,
      maxOutputTokens: 65536,
    },
    pricing: { inputPer1M: 3, outputPer1M: 12 },
  },
  // OpenAI o3-mini - Newer reasoning model
  "o3-mini": {
    name: "o3 Mini",
    provider: "openai",
    capabilities: {
      supportsVision: false,
      supportsTools: true,   // o3 supports tools in Responses API
      supportsStreaming: true,
      supportsReasoning: true,
      supportsPromptCache: false,
      contextWindow: 200000,
      maxOutputTokens: 100000,
    },
    pricing: { inputPer1M: 1.1, outputPer1M: 4.4 },
  },

  // Google Gemini Models
  // Ref: https://ai.google.dev/gemini-api/docs/models/gemini
  "gemini-2.0-flash-exp": {
    name: "Gemini 2.0 Flash",
    provider: "google",
    capabilities: {
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: false,
      contextWindow: 1000000,  // 1M token context
      maxOutputTokens: 8192,
    },
    pricing: { inputPer1M: 0.075, outputPer1M: 0.3 },
  },
  // Gemini 2.0 Flash Lite - Cost-efficient version
  "gemini-2.0-flash-lite": {
    name: "Gemini 2.0 Flash Lite",
    provider: "google",
    capabilities: {
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: false,
      contextWindow: 1000000,
      maxOutputTokens: 8192,
    },
    pricing: { inputPer1M: 0.0375, outputPer1M: 0.15 },
  },
  "gemini-1.5-pro": {
    name: "Gemini 1.5 Pro",
    provider: "google",
    capabilities: {
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: false,
      contextWindow: 2000000,  // 2M token context - largest available
      maxOutputTokens: 8192,
    },
    pricing: { inputPer1M: 1.25, outputPer1M: 5 },
  },
  // Gemini 1.5 Flash - Fast and efficient
  "gemini-1.5-flash": {
    name: "Gemini 1.5 Flash",
    provider: "google",
    capabilities: {
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: false,
      contextWindow: 1000000,  // 1M token context
      maxOutputTokens: 8192,
    },
    pricing: { inputPer1M: 0.075, outputPer1M: 0.3 },
  },

  // DeepSeek Models
  // Ref: https://platform.deepseek.com/api-docs
  // Note: DeepSeek V3 does NOT support vision
  "deepseek-chat": {
    name: "DeepSeek V3",
    provider: "deepseek",
    capabilities: {
      supportsVision: false,  // Text-only model
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: false,
      contextWindow: 128000,
      maxOutputTokens: 8000,
    },
    pricing: { inputPer1M: 0.27, outputPer1M: 1.1 },
  },
  // DeepSeek R1 - Reasoning model
  // Note: R1 does NOT support tools during reasoning mode
  "deepseek-reasoner": {
    name: "DeepSeek R1",
    provider: "deepseek",
    capabilities: {
      supportsVision: false,
      supportsTools: false,  // Tools not supported during reasoning
      supportsStreaming: true,
      supportsReasoning: true,
      supportsPromptCache: false,
      contextWindow: 128000,
      maxOutputTokens: 8000,
    },
    pricing: { inputPer1M: 0.55, outputPer1M: 2.19 },
  },

  // Groq Models (OpenAI-compatible, ultra-fast inference)
  // Ref: https://console.groq.com/docs/models
  "llama-3.3-70b-versatile": {
    name: "Llama 3.3 70B",
    provider: "groq",
    capabilities: {
      supportsVision: false,  // Text-only
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: false,
      contextWindow: 128000,
      maxOutputTokens: 32768,
    },
    pricing: { inputPer1M: 0.59, outputPer1M: 0.79 },
  },
  "llama-3.1-8b-instant": {
    name: "Llama 3.1 8B",
    provider: "groq",
    capabilities: {
      supportsVision: false,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: false,
      contextWindow: 128000,
      maxOutputTokens: 8000,
    },
    pricing: { inputPer1M: 0.05, outputPer1M: 0.08 },
  },
  // Mixtral on Groq
  "mixtral-8x7b-32768": {
    name: "Mixtral 8x7B",
    provider: "groq",
    capabilities: {
      supportsVision: false,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: false,
      contextWindow: 32768,
      maxOutputTokens: 8000,
    },
    pricing: { inputPer1M: 0.24, outputPer1M: 0.24 },
  },

  // Z.AI (Zhipu AI) GLM Models
  // Ref: https://open.bigmodel.cn/dev/api
  // Note: GLM-4 Plus does NOT support vision, GLM-4V does
  "glm-4-plus": {
    name: "GLM-4 Plus",
    provider: "zai",
    capabilities: {
      supportsVision: false,  // GLM-4 Plus is text-only
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: false,
      contextWindow: 128000,
      maxOutputTokens: 4096,
    },
  },
  "glm-4-0520": {
    name: "GLM-4",
    provider: "zai",
    capabilities: {
      supportsVision: false,  // Base GLM-4 is text-only
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: false,
      contextWindow: 128000,
      maxOutputTokens: 4096,
    },
  },
  // GLM-4V Plus - Vision-enabled model
  "glm-4v-plus": {
    name: "GLM-4V Plus",
    provider: "zai",
    capabilities: {
      supportsVision: true,   // Vision model
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: false,
      contextWindow: 128000,
      maxOutputTokens: 4096,
    },
  },
  // GLM-4 Flash - Fast and affordable
  "glm-4-flash": {
    name: "GLM-4 Flash",
    provider: "zai",
    capabilities: {
      supportsVision: false,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: false,
      contextWindow: 128000,
      maxOutputTokens: 4096,
    },
  },
  // GLM-4 Long - Extended context
  "glm-4-long": {
    name: "GLM-4 Long",
    provider: "zai",
    capabilities: {
      supportsVision: false,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: false,
      contextWindow: 1000000,  // 1M context window
      maxOutputTokens: 8192,
    },
  },
  // GLM-4.7 - Coding plan model with reasoning
  "glm-4.7": {
    name: "GLM-4.7",
    provider: "zai",
    capabilities: {
      supportsVision: false,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: true,  // Supports reasoning
      supportsPromptCache: false,
      contextWindow: 128000,
      maxOutputTokens: 4096,
    },
  },

  // Mistral AI Models
  // Ref: https://docs.mistral.ai/getting-started/models/
  "mistral-large-latest": {
    name: "Mistral Large",
    provider: "mistral",
    capabilities: {
      supportsVision: false,  // Text-only (Pixtral is the vision model)
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: false,
      contextWindow: 128000,
      maxOutputTokens: 8000,
    },
    pricing: { inputPer1M: 2, outputPer1M: 6 },
  },
  // Mistral Small - Fast and efficient
  "mistral-small-latest": {
    name: "Mistral Small",
    provider: "mistral",
    capabilities: {
      supportsVision: false,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: false,
      contextWindow: 32000,
      maxOutputTokens: 8000,
    },
    pricing: { inputPer1M: 0.2, outputPer1M: 0.6 },
  },

  // xAI Grok Models
  // Ref: https://docs.x.ai/docs
  "grok-2-1212": {
    name: "Grok 2",
    provider: "xai",
    capabilities: {
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: false,
      contextWindow: 131072,
      maxOutputTokens: 4096,
    },
    pricing: { inputPer1M: 2, outputPer1M: 10 },
  },
  // Grok 2 Mini - Faster, more affordable
  "grok-2-mini": {
    name: "Grok 2 Mini",
    provider: "xai",
    capabilities: {
      supportsVision: false,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: false,
      contextWindow: 131072,
      maxOutputTokens: 4096,
    },
    pricing: { inputPer1M: 0.5, outputPer1M: 2.5 },
  },
};

/**
 * Provider base URLs for API endpoints
 */
export const PROVIDER_BASE_URLS: Record<ProviderType, string> = {
  anthropic: "https://api.anthropic.com",
  openai: "https://api.openai.com/v1",
  google: "https://generativelanguage.googleapis.com",
  deepseek: "https://api.deepseek.com",
  groq: "https://api.groq.com/openai/v1",
  mistral: "https://api.mistral.ai/v1",
  ollama: "http://localhost:11434",
  lmstudio: "http://127.0.0.1:1234",
  openrouter: "https://openrouter.ai/api/v1",
  together: "https://api.together.xyz/v1",
  fireworks: "https://api.fireworks.ai/inference/v1",
  moonshot: "https://api.moonshot.cn/v1",
  zai: "https://open.bigmodel.cn/api/paas/v4",
  huggingface: "https://api-inference.huggingface.co",
  xai: "https://api.x.ai/v1",
  cerebras: "https://api.cerebras.ai/v1",
  sambanova: "https://api.sambanova.ai/v1",
  cohere: "https://api.cohere.ai/v1",
  perplexity: "https://api.perplexity.ai",
  replicate: "https://api.replicate.com/v1",
  anyscale: "https://api.endpoints.anyscale.com/v1",
  baseten: "https://model-api.baseten.co",
  modal: "https://api.modal.com/v1",
  runpod: "https://api.runpod.ai/v2",
  banana: "https://api.banana.dev",
  beam: "https://api.beam.cloud/v1",
  gradient: "https://api.gradient.ai/v1",
  novita: "https://api.novita.ai/v3",
  lepton: "https://api.lepton.ai/api/v1",
  hyperbolic: "https://api.hyperbolic.xyz/v1",
  deepinfra: "https://api.deepinfra.com/v1/openai",
  infermatic: "https://api.infermatic.ai/v1",
  aimlapi: "https://api.aimlapi.com/v1",
  shuttleai: "https://api.shuttleai.app/v1",
  cloudflare: "https://api.cloudflare.com/client/v4/accounts",
  "workers-ai": "https://api.cloudflare.com/client/v4/accounts",
  bedrock: "", // Uses AWS SDK
  vertex: "", // Uses Google SDK
  "openai-compat": "", // User-provided
};

/**
 * Get model information by ID
 */
export function getModelInfo(modelId: string): ModelInfo | undefined {
  const info = MODEL_REGISTRY[modelId];
  if (!info) return undefined;
  return { id: modelId, ...info };
}

/**
 * Get all models for a specific provider
 */
export function getModelsByProvider(provider: ProviderType): ModelInfo[] {
  return Object.entries(MODEL_REGISTRY)
    .filter(([_, info]) => info.provider === provider)
    .map(([id, info]) => ({ id, ...info }));
}

/**
 * Get models that support specific capabilities
 */
export function getModelsByCapability(capability: keyof ModelInfo['capabilities']): ModelInfo[] {
  return Object.entries(MODEL_REGISTRY)
    .filter(([_, info]) => info.capabilities[capability])
    .map(([id, info]) => ({ id, ...info }));
}

/**
 * Get the default model for a provider
 */
export function getDefaultModel(provider: ProviderType): string | undefined {
  const models = getModelsByProvider(provider);
  if (models.length === 0) return undefined;
  
  // Provider-specific defaults
  switch (provider) {
    case 'anthropic':
      return 'claude-3-5-sonnet-20241022';
    case 'openai':
      return 'gpt-4o';
    case 'google':
      return 'gemini-2.0-flash-exp';
    case 'deepseek':
      return 'deepseek-chat';
    case 'groq':
      return 'llama-3.3-70b-versatile';
    case 'zai':
      return 'glm-4-plus';
    case 'mistral':
      return 'mistral-large-latest';
    case 'xai':
      return 'grok-2-1212';
    default:
      return models[0].id;
  }
}