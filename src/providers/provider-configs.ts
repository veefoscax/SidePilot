/**
 * Provider Configuration Registry
 * 
 * Comprehensive configuration for all 40+ supported providers
 * Based on PROVIDER_LIST.md documentation
 */

import { ProviderType } from './types';

export interface ProviderConfigTemplate {
  baseUrl: string;
  authMethod: 'bearer' | 'header' | 'query' | 'none';
  authHeader?: string;
  authParam?: string;
  requiresApiKey: boolean;
  requiresGroupId?: boolean;
  extraHeaders?: Record<string, string>;
  defaultModels: string[];
  capabilities: {
    supportsVision: boolean;
    supportsTools: boolean;
    supportsStreaming: boolean;
    supportsReasoning: boolean;
  };
}

/**
 * Provider configuration registry
 * Maps provider types to their default configurations
 */
export const PROVIDER_CONFIGS: Record<ProviderType, ProviderConfigTemplate> = {
  // Tier 1: Core Providers (Native Implementations)
  anthropic: {
    baseUrl: 'https://api.anthropic.com',
    authMethod: 'header',
    authHeader: 'x-api-key',
    requiresApiKey: true,
    extraHeaders: {
      'anthropic-version': '2023-06-01',
    },
    defaultModels: ['claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
    capabilities: {
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: true,
    },
  },

  openai: {
    baseUrl: 'https://api.openai.com/v1',
    authMethod: 'bearer',
    requiresApiKey: true,
    defaultModels: ['gpt-4o', 'gpt-4o-mini', 'o1', 'o1-mini', 'o3-mini'],
    capabilities: {
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: true,
    },
  },

  google: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    authMethod: 'query',
    authParam: 'key',
    requiresApiKey: true,
    defaultModels: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    capabilities: {
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
    },
  },

  'openai-compat': {
    baseUrl: 'http://localhost:8080/v1',
    authMethod: 'bearer',
    requiresApiKey: false,
    defaultModels: [],
    capabilities: {
      supportsVision: false,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
    },
  },

  // Tier 2: Popular Providers (OpenAI-Compatible)
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    authMethod: 'bearer',
    requiresApiKey: true,
    defaultModels: ['deepseek-chat', 'deepseek-reasoner'],
    capabilities: {
      supportsVision: false,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: true,
    },
  },

  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    authMethod: 'bearer',
    requiresApiKey: true,
    defaultModels: ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', 'mixtral-8x7b-32768'],
    capabilities: {
      supportsVision: false,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
    },
  },

  mistral: {
    baseUrl: 'https://api.mistral.ai/v1',
    authMethod: 'bearer',
    requiresApiKey: true,
    defaultModels: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest'],
    capabilities: {
      supportsVision: false,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
    },
  },

  ollama: {
    baseUrl: 'http://localhost:11434',
    authMethod: 'none',
    requiresApiKey: false,
    defaultModels: ['llama3.2', 'qwen2.5', 'mistral'],
    capabilities: {
      supportsVision: false,
      supportsTools: false,
      supportsStreaming: true,
      supportsReasoning: false,
    },
  },

  lmstudio: {
    baseUrl: 'http://127.0.0.1:1234/v1',
    authMethod: 'none',
    requiresApiKey: false,
    defaultModels: [],
    capabilities: {
      supportsVision: false,
      supportsTools: false,
      supportsStreaming: true,
      supportsReasoning: false,
    },
  },

  // Tier 3: Extended Providers
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    authMethod: 'bearer',
    requiresApiKey: true,
    defaultModels: ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'google/gemini-2.0-flash'],
    capabilities: {
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: true,
    },
  },

  together: {
    baseUrl: 'https://api.together.xyz/v1',
    authMethod: 'bearer',
    requiresApiKey: true,
    defaultModels: ['meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', 'mistralai/Mixtral-8x7B-Instruct-v0.1'],
    capabilities: {
      supportsVision: false,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
    },
  },

  fireworks: {
    baseUrl: 'https://api.fireworks.ai/inference/v1',
    authMethod: 'bearer',
    requiresApiKey: true,
    defaultModels: ['accounts/fireworks/models/llama-v3p1-70b-instruct'],
    capabilities: {
      supportsVision: false,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
    },
  },

  moonshot: {
    baseUrl: 'https://api.moonshot.cn/v1',
    authMethod: 'bearer',
    requiresApiKey: true,
    defaultModels: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    capabilities: {
      supportsVision: false,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
    },
  },

  zai: {
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    authMethod: 'bearer',
    requiresApiKey: true,
    defaultModels: ['glm-4-plus', 'glm-4-flash', 'glm-4v-plus', 'glm-4-long'],
    capabilities: {
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
    },
  },

  huggingface: {
    baseUrl: 'https://api-inference.huggingface.co',
    authMethod: 'bearer',
    requiresApiKey: true,
    defaultModels: [],
    capabilities: {
      supportsVision: false,
      supportsTools: false,
      supportsStreaming: false,
      supportsReasoning: false,
    },
  },

  xai: {
    baseUrl: 'https://api.x.ai/v1',
    authMethod: 'bearer',
    requiresApiKey: true,
    defaultModels: ['grok-2-1212', 'grok-2-vision-1212'],
    capabilities: {
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
    },
  },

  cerebras: {
    baseUrl: 'https://api.cerebras.ai/v1',
    authMethod: 'bearer',
    requiresApiKey: true,
    defaultModels: ['llama3.1-8b', 'llama3.1-70b'],
    capabilities: {
      supportsVision: false,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
    },
  },

  sambanova: {
    baseUrl: 'https://api.sambanova.ai/v1',
    authMethod: 'bearer',
    requiresApiKey: true,
    defaultModels: ['Meta-Llama-3.1-70B-Instruct', 'Meta-Llama-3.1-8B-Instruct'],
    capabilities: {
      supportsVision: false,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
    },
  },

  bedrock: {
    baseUrl: 'https://bedrock-runtime.us-east-1.amazonaws.com',
    authMethod: 'header',
    requiresApiKey: true,
    defaultModels: ['anthropic.claude-3-5-sonnet-20241022-v2:0'],
    capabilities: {
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: true,
    },
  },

  vertex: {
    baseUrl: 'https://us-central1-aiplatform.googleapis.com/v1',
    authMethod: 'bearer',
    requiresApiKey: true,
    defaultModels: ['gemini-2.0-flash', 'gemini-1.5-pro'],
    capabilities: {
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
    },
  },

  cohere: {
    baseUrl: 'https://api.cohere.ai/v1',
    authMethod: 'bearer',
    requiresApiKey: true,
    defaultModels: ['command-r-plus', 'command-r', 'command'],
    capabilities: {
      supportsVision: false,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
    },
  },

  perplexity: {
    baseUrl: 'https://api.perplexity.ai',
    authMethod: 'bearer',
    requiresApiKey: true,
    defaultModels: ['llama-3.1-sonar-large-128k-online', 'llama-3.1-sonar-small-128k-online'],
    capabilities: {
      supportsVision: false,
      supportsTools: false,
      supportsStreaming: true,
      supportsReasoning: false,
    },
  },

  replicate: {
    baseUrl: 'https://api.replicate.com/v1',
    authMethod: 'bearer',
    requiresApiKey: true,
    defaultModels: [],
    capabilities: {
      supportsVision: false,
      supportsTools: false,
      supportsStreaming: false,
      supportsReasoning: false,
    },
  },

  anyscale: {
    baseUrl: 'https://api.endpoints.anyscale.com/v1',
    authMethod: 'bearer',
    requiresApiKey: true,
    defaultModels: ['meta-llama/Meta-Llama-3.1-70B-Instruct'],
    capabilities: {
      supportsVision: false,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
    },
  },

  baseten: {
    baseUrl: 'https://model-<model-id>.api.baseten.co/production/predict',
    authMethod: 'bearer',
    requiresApiKey: true,
    defaultModels: [],
    capabilities: {
      supportsVision: false,
      supportsTools: false,
      supportsStreaming: false,
      supportsReasoning: false,
    },
  },

  modal: {
    baseUrl: 'https://api.modal.com/v1',
    authMethod: 'bearer',
    requiresApiKey: true,
    defaultModels: [],
    capabilities: {
      supportsVision: false,
      supportsTools: false,
      supportsStreaming: false,
      supportsReasoning: false,
    },
  },

  runpod: {
    baseUrl: 'https://api.runpod.ai/v2',
    authMethod: 'bearer',
    requiresApiKey: true,
    defaultModels: [],
    capabilities: {
      supportsVision: false,
      supportsTools: false,
      supportsStreaming: false,
      supportsReasoning: false,
    },
  },

  banana: {
    baseUrl: 'https://api.banana.dev',
    authMethod: 'bearer',
    requiresApiKey: true,
    defaultModels: [],
    capabilities: {
      supportsVision: false,
      supportsTools: false,
      supportsStreaming: false,
      supportsReasoning: false,
    },
  },

  beam: {
    baseUrl: 'https://api.beam.cloud',
    authMethod: 'bearer',
    requiresApiKey: true,
    defaultModels: [],
    capabilities: {
      supportsVision: false,
      supportsTools: false,
      supportsStreaming: false,
      supportsReasoning: false,
    },
  },

  gradient: {
    baseUrl: 'https://api.gradient.ai/v1',
    authMethod: 'bearer',
    requiresApiKey: true,
    defaultModels: [],
    capabilities: {
      supportsVision: false,
      supportsTools: false,
      supportsStreaming: false,
      supportsReasoning: false,
    },
  },

  novita: {
    baseUrl: 'https://api.novita.ai/v3/openai',
    authMethod: 'bearer',
    requiresApiKey: true,
    defaultModels: [],
    capabilities: {
      supportsVision: false,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
    },
  },

  lepton: {
    baseUrl: 'https://api.lepton.ai/api/v1',
    authMethod: 'bearer',
    requiresApiKey: true,
    defaultModels: [],
    capabilities: {
      supportsVision: false,
      supportsTools: false,
      supportsStreaming: false,
      supportsReasoning: false,
    },
  },

  hyperbolic: {
    baseUrl: 'https://api.hyperbolic.xyz/v1',
    authMethod: 'bearer',
    requiresApiKey: true,
    defaultModels: [],
    capabilities: {
      supportsVision: false,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
    },
  },

  deepinfra: {
    baseUrl: 'https://api.deepinfra.com/v1/openai',
    authMethod: 'bearer',
    requiresApiKey: true,
    defaultModels: ['meta-llama/Meta-Llama-3.1-70B-Instruct', 'mistralai/Mixtral-8x7B-Instruct-v0.1'],
    capabilities: {
      supportsVision: false,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
    },
  },

  infermatic: {
    baseUrl: 'https://api.infermatic.ai/v1',
    authMethod: 'bearer',
    requiresApiKey: true,
    defaultModels: [],
    capabilities: {
      supportsVision: false,
      supportsTools: false,
      supportsStreaming: false,
      supportsReasoning: false,
    },
  },

  aimlapi: {
    baseUrl: 'https://api.aimlapi.com/v1',
    authMethod: 'bearer',
    requiresApiKey: true,
    defaultModels: [],
    capabilities: {
      supportsVision: false,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
    },
  },

  shuttleai: {
    baseUrl: 'https://api.shuttleai.app/v1',
    authMethod: 'bearer',
    requiresApiKey: true,
    defaultModels: [],
    capabilities: {
      supportsVision: false,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
    },
  },

  cloudflare: {
    baseUrl: 'https://api.cloudflare.com/client/v4/accounts/<account-id>/ai/v1',
    authMethod: 'bearer',
    requiresApiKey: true,
    defaultModels: [],
    capabilities: {
      supportsVision: false,
      supportsTools: false,
      supportsStreaming: false,
      supportsReasoning: false,
    },
  },

  'workers-ai': {
    baseUrl: 'https://api.cloudflare.com/client/v4/accounts/<account-id>/ai/v1',
    authMethod: 'bearer',
    requiresApiKey: true,
    defaultModels: [],
    capabilities: {
      supportsVision: false,
      supportsTools: false,
      supportsStreaming: false,
      supportsReasoning: false,
    },
  },

  minimax: {
    baseUrl: 'https://api.minimax.chat/v1',
    authMethod: 'bearer',
    requiresApiKey: true,
    requiresGroupId: true,
    defaultModels: ['abab6-chat', 'abab5.5-chat', 'abab5-chat'],
    capabilities: {
      supportsVision: false,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
    },
  },
};

/**
 * Get provider configuration template
 */
export function getProviderConfig(type: ProviderType): ProviderConfigTemplate {
  return PROVIDER_CONFIGS[type];
}

/**
 * Check if provider requires API key
 */
export function requiresApiKey(type: ProviderType): boolean {
  return PROVIDER_CONFIGS[type]?.requiresApiKey ?? true;
}

/**
 * Check if provider requires Group ID (e.g., MiniMax)
 */
export function requiresGroupId(type: ProviderType): boolean {
  return PROVIDER_CONFIGS[type]?.requiresGroupId ?? false;
}

/**
 * Get default base URL for provider
 */
export function getDefaultBaseUrl(type: ProviderType): string {
  return PROVIDER_CONFIGS[type]?.baseUrl ?? '';
}

/**
 * Get provider capabilities
 */
export function getProviderCapabilities(type: ProviderType): ProviderConfigTemplate['capabilities'] {
  return PROVIDER_CONFIGS[type]?.capabilities ?? {
    supportsVision: false,
    supportsTools: false,
    supportsStreaming: false,
    supportsReasoning: false,
  };
}
