/**
 * SidePilot Provider Factory
 * 
 * Enhanced factory function to create LLM providers with unified interface.
 * Supports 40+ providers with automatic configuration application.
 */

import { ProviderType, ProviderConfig, UserProviderConfig, LLMProvider, ProviderError } from './types';
import { AnthropicProvider } from './anthropic';
import { OpenAIProvider } from './openai';
import { GoogleProvider } from './google';
import { OllamaProvider } from './ollama';
import { LMStudioProvider } from './lmstudio';
import { ZAIProvider } from './zai';
import { getProviderConfig, requiresApiKey, requiresGroupId } from './provider-configs';

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
  lmstudio: LMStudioProvider, // LM Studio with correct port

  // Tier 3: Extended providers (OpenAI-compatible)
  openrouter: OpenAIProvider,
  together: OpenAIProvider,
  fireworks: OpenAIProvider,
  moonshot: OpenAIProvider,
  zai: ZAIProvider, // Use dedicated ZAI provider
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
 * Create a provider instance with enhanced configuration
 * 
 * @param type Provider type
 * @param userConfig User-provided configuration
 * @returns Configured LLM provider instance
 * @throws ProviderError if provider type is unknown or configuration is invalid
 */
export function createProvider(type: ProviderType, userConfig: UserProviderConfig = {}): LLMProvider {
  // Validate provider type
  const ProviderClass = PROVIDER_CLASSES[type];
  if (!ProviderClass) {
    throw new ProviderError(
      `Unknown provider type: ${type}. Supported providers: ${Object.keys(PROVIDER_CLASSES).join(', ')}`,
      type,
      'UNKNOWN_PROVIDER'
    );
  }

  // Get provider template configuration
  const template = getProviderConfig(type);
  if (!template) {
    throw new ProviderError(
      `No configuration template found for provider: ${type}`,
      type,
      'MISSING_CONFIG_TEMPLATE'
    );
  }

  // Validate required configuration
  validateProviderConfig(type, userConfig);

  // Build complete provider configuration
  const config: ProviderConfig = {
    type,
    apiKey: userConfig.apiKey,
    baseUrl: getBaseUrlForPlan(type, userConfig.planType, userConfig.baseUrl, template),
    extraHeaders: { ...template.extraHeaders, ...userConfig.extraHeaders },
    groupId: userConfig.groupId,
    // Provider-specific fields
    authMethod: template.authMethod,
    authHeader: template.authHeader,
    authParam: template.authParam,
    requiresGroupId: template.requiresGroupId,
  };

  try {
    return new ProviderClass(config);
  } catch (error) {
    if (error instanceof ProviderError) {
      throw error;
    }
    
    throw new ProviderError(
      `Failed to create provider ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      type,
      'PROVIDER_CREATION_FAILED'
    );
  }
}

/**
 * Get base URL for provider based on plan type
 */
function getBaseUrlForPlan(
  type: ProviderType, 
  planType: string | undefined, 
  userBaseUrl: string | undefined, 
  template: any
): string {
  // If user provided explicit base URL, use it
  if (userBaseUrl) {
    return userBaseUrl;
  }
  
  // If provider supports plan types and plan type is specified
  if (template.planTypes && planType && template.planTypes[planType]) {
    return template.planTypes[planType].baseUrl;
  }
  
  // Default to template base URL
  return template.baseUrl;
}

/**
 * Validate provider configuration
 */
function validateProviderConfig(type: ProviderType, userConfig: UserProviderConfig): void {
  // Check API key requirement
  if (requiresApiKey(type) && !userConfig.apiKey) {
    throw new ProviderError(
      `API key is required for ${type} provider`,
      type,
      'MISSING_API_KEY'
    );
  }

  // Check Group ID requirement (e.g., MiniMax)
  if (requiresGroupId(type) && !userConfig.groupId) {
    throw new ProviderError(
      `Group ID is required for ${type} provider`,
      type,
      'MISSING_GROUP_ID'
    );
  }

  // Validate base URL format if provided
  if (userConfig.baseUrl) {
    try {
      new URL(userConfig.baseUrl);
    } catch {
      throw new ProviderError(
        `Invalid base URL format: ${userConfig.baseUrl}`,
        type,
        'INVALID_BASE_URL'
      );
    }
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
    lmstudio: {
      name: 'LM Studio',
      description: 'Local LLM server with UI',
      website: 'https://lmstudio.ai',
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