/**
 * SidePilot Provider Factory
 * 
 * Factory function to create LLM providers with unified interface.
 * Supports 40+ providers including Anthropic, OpenAI, Google, DeepSeek, Ollama, and more.
 */

import { ProviderType, ProviderConfig, LLMProvider, ProviderError } from './types';
import { AnthropicProvider } from './anthropic';
import { OpenAIProvider } from './openai';
import { GoogleProvider } from './google';
import { OllamaProvider } from './ollama';

/**
 * Provider class registry
 * Maps provider types to their implementation classes
 */
const PROVIDER_CLASSES: Record<ProviderType, new (config: ProviderConfig) => LLMProvider> = {
  // Tier 1: Core providers
  anthropic: AnthropicProvider,
  openai: OpenAIProvider,
  google: GoogleProvider,
  "openai-compat": OpenAIProvider,

  // Tier 2: Popular providers (OpenAI-compatible)
  deepseek: OpenAIProvider,
  groq: OpenAIProvider,
  mistral: OpenAIProvider,
  ollama: OllamaProvider,
  lmstudio: OllamaProvider, // Same API as Ollama

  // Tier 3: Extended providers (OpenAI-compatible)
  openrouter: OpenAIProvider,
  together: OpenAIProvider,
  fireworks: OpenAIProvider,
  moonshot: OpenAIProvider,
  zai: OpenAIProvider,
  huggingface: OpenAIProvider,
  xai: OpenAIProvider,
  cerebras: OpenAIProvider,
  sambanova: OpenAIProvider,
  cohere: OpenAIProvider,
  perplexity: OpenAIProvider,
  replicate: OpenAIProvider,
  anyscale: OpenAIProvider,
  baseten: OpenAIProvider,
  modal: OpenAIProvider,
  runpod: OpenAIProvider,
  banana: OpenAIProvider,
  beam: OpenAIProvider,
  gradient: OpenAIProvider,
  novita: OpenAIProvider,
  lepton: OpenAIProvider,
  hyperbolic: OpenAIProvider,
  deepinfra: OpenAIProvider,
  infermatic: OpenAIProvider,
  aimlapi: OpenAIProvider,
  shuttleai: OpenAIProvider,
  cloudflare: OpenAIProvider,
  "workers-ai": OpenAIProvider,

  // Cloud providers (special implementations)
  bedrock: AnthropicProvider, // AWS Bedrock uses Anthropic format
  vertex: GoogleProvider, // Google Vertex AI
};

/**
 * Create a provider instance
 * 
 * @param config Provider configuration including type, API key, and options
 * @returns Configured LLM provider instance
 * @throws ProviderError if provider type is unknown or configuration is invalid
 */
export function createProvider(config: ProviderConfig): LLMProvider {
  const ProviderClass = PROVIDER_CLASSES[config.type];
  
  if (!ProviderClass) {
    throw new ProviderError(
      `Unknown provider type: ${config.type}. Supported providers: ${Object.keys(PROVIDER_CLASSES).join(', ')}`,
      config.type,
      'UNKNOWN_PROVIDER'
    );
  }

  try {
    return new ProviderClass(config);
  } catch (error) {
    if (error instanceof ProviderError) {
      throw error;
    }
    
    throw new ProviderError(
      `Failed to create provider ${config.type}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      config.type,
      'PROVIDER_CREATION_FAILED'
    );
  }
}

/**
 * Get all supported provider types
 */
export function getSupportedProviders(): ProviderType[] {
  return Object.keys(PROVIDER_CLASSES) as ProviderType[];
}

/**
 * Check if a provider type is supported
 */
export function isProviderSupported(type: string): type is ProviderType {
  return type in PROVIDER_CLASSES;
}

/**
 * Get provider categories for UI organization
 */
export function getProviderCategories(): Record<string, ProviderType[]> {
  return {
    'Core Providers': [
      'anthropic',
      'openai', 
      'google',
      'deepseek'
    ],
    'Fast & Affordable': [
      'groq',
      'cerebras',
      'sambanova',
      'deepinfra'
    ],
    'Local & Self-Hosted': [
      'ollama',
      'lmstudio'
    ],
    'Aggregators': [
      'openrouter',
      'together',
      'fireworks'
    ],
    'Specialized': [
      'mistral',
      'cohere',
      'perplexity',
      'xai'
    ],
    'Cloud Platforms': [
      'bedrock',
      'vertex',
      'huggingface',
      'replicate'
    ],
    'Enterprise': [
      'anyscale',
      'baseten',
      'modal',
      'runpod'
    ],
    'Other': [
      'openai-compat',
      'moonshot',
      'zai',
      'banana',
      'beam',
      'gradient',
      'novita',
      'lepton',
      'hyperbolic',
      'infermatic',
      'aimlapi',
      'shuttleai',
      'cloudflare',
      'workers-ai'
    ]
  };
}

/**
 * Get provider display information
 */
export function getProviderInfo(type: ProviderType): {
  name: string;
  description: string;
  website: string;
  requiresApiKey: boolean;
  supportsStreaming: boolean;
  supportsTools: boolean;
  supportsVision: boolean;
} {
  const providerInfo: Record<ProviderType, ReturnType<typeof getProviderInfo>> = {
    anthropic: {
      name: 'Anthropic Claude',
      description: 'Advanced reasoning and safety',
      website: 'https://anthropic.com',
      requiresApiKey: true,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
    },
    openai: {
      name: 'OpenAI',
      description: 'GPT-4o and reasoning models',
      website: 'https://openai.com',
      requiresApiKey: true,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
    },
    google: {
      name: 'Google Gemini',
      description: 'Multimodal with large context',
      website: 'https://ai.google.dev',
      requiresApiKey: true,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
    },
    deepseek: {
      name: 'DeepSeek',
      description: 'High-performance, competitive pricing',
      website: 'https://deepseek.com',
      requiresApiKey: true,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: false,
    },
    groq: {
      name: 'Groq',
      description: 'Ultra-fast Llama and Mixtral',
      website: 'https://groq.com',
      requiresApiKey: true,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: false,
    },
    ollama: {
      name: 'Ollama',
      description: 'Run models locally',
      website: 'https://ollama.ai',
      requiresApiKey: false,
      supportsStreaming: true,
      supportsTools: false,
      supportsVision: false,
    },
    mistral: {
      name: 'Mistral AI',
      description: 'Efficient European models',
      website: 'https://mistral.ai',
      requiresApiKey: true,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: false,
    },
    xai: {
      name: 'xAI Grok',
      description: 'Real-time information access',
      website: 'https://x.ai',
      requiresApiKey: true,
      supportsStreaming: true,
      supportsTools: true,
      supportsVision: true,
    },
    // Add more provider info as needed...
  } as any;

  return providerInfo[type] || {
    name: type.charAt(0).toUpperCase() + type.slice(1),
    description: `${type} provider`,
    website: '',
    requiresApiKey: true,
    supportsStreaming: true,
    supportsTools: false,
    supportsVision: false,
  };
}