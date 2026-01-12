/**
 * SidePilot Model Registry
 * 
 * Comprehensive registry of LLM models with capabilities and pricing.
 * Based on Cline's model registry with SidePilot-specific enhancements.
 */

import { ModelInfo, ProviderType } from './types';

/**
 * Model registry with capabilities and pricing information
 * Updated as of January 2025
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
  "o1": {
    name: "o1",
    provider: "openai",
    capabilities: {
      supportsVision: false,
      supportsTools: false,
      supportsStreaming: false,
      supportsReasoning: true,
      supportsPromptCache: false,
      contextWindow: 200000,
      maxOutputTokens: 100000,
    },
    pricing: { inputPer1M: 15, outputPer1M: 60 },
  },
  "o1-mini": {
    name: "o1 Mini",
    provider: "openai",
    capabilities: {
      supportsVision: false,
      supportsTools: false,
      supportsStreaming: false,
      supportsReasoning: true,
      supportsPromptCache: false,
      contextWindow: 128000,
      maxOutputTokens: 65536,
    },
    pricing: { inputPer1M: 3, outputPer1M: 12 },
  },

  // Google Gemini Models
  "gemini-2.0-flash-exp": {
    name: "Gemini 2.0 Flash",
    provider: "google",
    capabilities: {
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: false, // Google doesn't have prompt caching like Anthropic
      contextWindow: 1000000,
      maxOutputTokens: 8192,
    },
    pricing: { inputPer1M: 0.075, outputPer1M: 0.3 },
  },
  "gemini-1.5-pro": {
    name: "Gemini 1.5 Pro",
    provider: "google",
    capabilities: {
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: false, // Google doesn't have prompt caching like Anthropic
      contextWindow: 2000000,
      maxOutputTokens: 8192,
    },
    pricing: { inputPer1M: 1.25, outputPer1M: 5 },
  },

  // DeepSeek Models
  "deepseek-chat": {
    name: "DeepSeek V3",
    provider: "deepseek",
    capabilities: {
      supportsVision: false,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: false,
      contextWindow: 128000,
      maxOutputTokens: 8000,
    },
    pricing: { inputPer1M: 0.27, outputPer1M: 1.1 },
  },
  "deepseek-reasoner": {
    name: "DeepSeek R1",
    provider: "deepseek",
    capabilities: {
      supportsVision: false,
      supportsTools: false, // R1 doesn't support tools during reasoning
      supportsStreaming: true,
      supportsReasoning: true,
      supportsPromptCache: false,
      contextWindow: 128000,
      maxOutputTokens: 8000,
    },
    pricing: { inputPer1M: 0.55, outputPer1M: 2.19 },
  },

  // Groq Models (OpenAI-compatible)
  "llama-3.3-70b-versatile": {
    name: "Llama 3.3 70B",
    provider: "groq",
    capabilities: {
      supportsVision: false,
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

  // Z.AI (GLM) Models
  "glm-4-plus": {
    name: "GLM-4 Plus",
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
  "glm-4-0520": {
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

  // Ollama Local Models (common defaults)
  "llama3.3:70b": {
    name: "Llama 3.3 70B",
    provider: "ollama",
    capabilities: {
      supportsVision: false,
      supportsTools: false,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: false,
      contextWindow: 128000,
      maxOutputTokens: 4096,
    },
  },
  "qwen2.5:32b": {
    name: "Qwen 2.5 32B",
    provider: "ollama",
    capabilities: {
      supportsVision: false,
      supportsTools: false,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: false,
      contextWindow: 32768,
      maxOutputTokens: 4096,
    },
  },
  "deepseek-r1:32b": {
    name: "DeepSeek R1 32B",
    provider: "ollama",
    capabilities: {
      supportsVision: false,
      supportsTools: false,
      supportsStreaming: true,
      supportsReasoning: true,
      supportsPromptCache: false,
      contextWindow: 128000,
      maxOutputTokens: 4096,
    },
  },

  // Mistral Models
  "mistral-large-latest": {
    name: "Mistral Large",
    provider: "mistral",
    capabilities: {
      supportsVision: false,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: false,
      contextWindow: 128000,
      maxOutputTokens: 8000,
    },
    pricing: { inputPer1M: 2, outputPer1M: 6 },
  },

  // xAI Grok Models
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
    case 'ollama':
      return 'llama3.3:70b';
    case 'mistral':
      return 'mistral-large-latest';
    case 'xai':
      return 'grok-2-1212';
    default:
      return models[0].id;
  }
}