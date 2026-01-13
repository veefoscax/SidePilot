/**
 * SidePilot Multi-Provider Store
 * 
 * Advanced Zustand store for managing multiple LLM providers simultaneously.
 * Allows users to configure multiple providers and select models from any of them.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ProviderType, ModelInfo } from '@/providers/types';
import { createProvider, getProviderInfo } from '@/providers/factory';

interface ProviderConfig {
  type: ProviderType;
  apiKey: string;
  baseUrl?: string;
  isConfigured: boolean;
  isConnected: boolean;
  error?: string;
  lastTested?: number;
}

interface SelectedModel {
  id: string; // Original model ID
  provider: ProviderType;
  name: string;
  fullId: string; // Format: "provider:modelId" for global uniqueness
  capabilities: ModelInfo['capabilities'];
  pricing?: ModelInfo['pricing'];
}

interface MultiProviderState {
  // Multi-provider configuration
  providers: Record<ProviderType, ProviderConfig>;
  
  // Global model management
  selectedModels: SelectedModel[]; // Models from all providers
  currentModel: string | null; // Currently active model fullId (provider:model)
  
  // Provider-specific model loading
  availableModelsByProvider: Record<ProviderType, ModelInfo[]>;
  loadingProviders: ProviderType[];
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions - Provider Management
  setProviderConfig: (type: ProviderType, config: Partial<Omit<ProviderConfig, 'type'>>) => void;
  testProviderConnection: (type: ProviderType) => Promise<boolean>;
  
  // Actions - Model Loading
  loadModelsForProvider: (type: ProviderType) => Promise<void>;
  loadModelsForAllConfiguredProviders: () => Promise<void>;
  
  // Actions - Model Selection
  addSelectedModel: (model: ModelInfo, provider: ProviderType) => void;
  removeSelectedModel: (fullId: string) => void;
  toggleSelectedModel: (model: ModelInfo, provider: ProviderType) => void;
  setCurrentModel: (fullId: string) => void;
  
  // Actions - Utility
  clearError: () => void;
  initializeStore: () => void;
  getConfiguredProviders: () => ProviderType[];
  getSelectedModelsByProvider: (provider: ProviderType) => SelectedModel[];
  
  // Actions - Active Provider
  getCurrentProvider: () => { provider: ProviderType; model: SelectedModel } | null;
  getCurrentProviderInstance: () => any | null;
  getFirstConfiguredProvider: () => { provider: ProviderType; model: SelectedModel } | null;
}

/**
 * Chrome storage adapter for Zustand persistence
 */
const chromeStorage = createJSONStorage(() => ({
  getItem: async (name: string) => {
    try {
      const result = await chrome.storage.local.get(name);
      return result[name] ?? null;
    } catch (error) {
      console.error('Failed to get from Chrome storage:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string) => {
    try {
      await chrome.storage.local.set({ [name]: value });
    } catch (error) {
      console.error('Failed to set Chrome storage:', error);
    }
  },
  removeItem: async (name: string) => {
    try {
      await chrome.storage.local.remove(name);
    } catch (error) {
      console.error('Failed to remove from Chrome storage:', error);
    }
  },
}));

/**
 * Initialize default provider configurations
 */
function createDefaultProviders(): Record<ProviderType, ProviderConfig> {
  const providers: Record<string, ProviderConfig> = {};
  
  // Core providers that users commonly configure
  const coreProviders: ProviderType[] = ['anthropic', 'openai', 'google', 'deepseek', 'groq', 'ollama', 'lmstudio'];
  
  coreProviders.forEach(type => {
    const providerInfo = getProviderInfo(type);
    providers[type] = {
      type,
      apiKey: '',
      baseUrl: !providerInfo.requiresApiKey ? (type === 'ollama' ? 'http://localhost:11434' : 'http://127.0.0.1:1234') : undefined,
      isConfigured: false,
      isConnected: false,
    };
  });
  
  return providers as Record<ProviderType, ProviderConfig>;
}

export const useMultiProviderStore = create<MultiProviderState>()(
  persist(
    (set, get) => ({
      // Initial state
      providers: createDefaultProviders(),
      selectedModels: [],
      currentModel: null,
      availableModelsByProvider: {} as Record<ProviderType, ModelInfo[]>,
      loadingProviders: [],
      isLoading: false,
      error: null,
      
      // Provider Management Actions
      setProviderConfig: (type: ProviderType, config: Partial<Omit<ProviderConfig, 'type'>>) => {
        const providerInfo = getProviderInfo(type);
        set(state => ({
          providers: {
            ...state.providers,
            [type]: {
              ...state.providers[type],
              ...config,
              type, // Ensure type is always set
              isConfigured: (config.apiKey && config.apiKey.trim().length > 0) || !providerInfo.requiresApiKey,
            }
          },
          error: null
        }));
        
        // Auto-load models if provider becomes configured
        if (config.apiKey && config.apiKey.trim().length > 0) {
          get().loadModelsForProvider(type);
        }
      },
      
      testProviderConnection: async (type: ProviderType) => {
        console.log('🏪 Store: Testing connection for', type);
        const { providers } = get();
        const providerConfig = providers?.[type];
        
        // Ensure provider config exists
        if (!providerConfig) {
          console.error(`❌ Provider config not found for ${type}`);
          return false;
        }
        
        console.log('📋 Provider config:', {
          isConfigured: providerConfig.isConfigured,
          hasApiKey: !!providerConfig.apiKey,
          hasBaseUrl: !!providerConfig.baseUrl
        });
        
        const providerInfo = getProviderInfo(type);
        if (!providerConfig?.isConfigured && providerInfo.requiresApiKey) {
          console.log('❌ Provider not configured and requires API key');
          set(state => ({
            providers: {
              ...state.providers,
              [type]: { ...providerConfig, error: 'API key required', isConnected: false }
            }
          }));
          return false;
        }
        
        console.log('🔄 Setting loading state...');
        set({ isLoading: true });
        
        try {
          console.log('🏭 Creating provider instance...');
          const provider = createProvider({
            type,
            apiKey: providerConfig.apiKey || '',
            baseUrl: providerConfig.baseUrl,
          });
          
          console.log('🧪 Calling provider.testConnection()...');
          const success = await provider.testConnection();
          console.log('✅ Provider test result:', success);
          
          set(state => ({
            providers: {
              ...state.providers,
              [type]: {
                ...providerConfig,
                isConnected: success,
                error: success ? undefined : 'Connection failed',
                lastTested: Date.now()
              }
            },
            isLoading: false
          }));
          
          return success;
        } catch (error) {
          console.error('💥 Provider test error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Connection failed';
          set(state => ({
            providers: {
              ...state.providers,
              [type]: { ...providerConfig, isConnected: false, error: errorMessage }
            },
            isLoading: false
          }));
          return false;
        }
      },
      
      // Model Loading Actions
      loadModelsForProvider: async (type: ProviderType) => {
        const { providers, loadingProviders } = get();
        const providerConfig = providers[type];
        
        // Don't load if already loading
        if (loadingProviders.includes(type)) return;
        
        // Ensure provider config exists
        if (!providerConfig) {
          console.error(`Provider config not found for ${type}`);
          return;
        }
        
        // Only load if provider is configured
        const providerInfo = getProviderInfo(type);
        if (!providerConfig.isConfigured && providerInfo.requiresApiKey) {
          console.log(`🔑 Provider ${type} not configured, skipping model loading`);
          return;
        }
        
        set(state => ({
          loadingProviders: [...state.loadingProviders, type]
        }));
        
        try {
          const provider = createProvider({
            type,
            apiKey: providerConfig.apiKey || '',
            baseUrl: providerConfig.baseUrl,
          });
          
          let models: ModelInfo[] = [];
          
          if (provider.listModels) {
            models = await provider.listModels();
            console.log(`✅ Loaded ${models.length} models from ${type}`);
          } else {
            console.log(`⚠️ Provider ${type} doesn't support dynamic model listing`);
          }
          
          set(state => ({
            availableModelsByProvider: {
              ...state.availableModelsByProvider,
              [type]: models
            },
            providers: {
              ...state.providers,
              [type]: { ...state.providers[type], error: undefined }
            },
            loadingProviders: state.loadingProviders.filter(p => p !== type)
          }));
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load models';
          console.error(`❌ Failed to load models for ${type}:`, error);
          set(state => ({
            availableModelsByProvider: {
              ...state.availableModelsByProvider,
              [type]: []
            },
            providers: {
              ...state.providers,
              [type]: { ...state.providers[type], error: errorMessage, isConnected: false }
            },
            loadingProviders: state.loadingProviders.filter(p => p !== type)
          }));
        }
      },
      
      loadModelsForAllConfiguredProviders: async () => {
        const { providers } = get();
        const configuredProviders = Object.values(providers)
          .filter(p => {
            const providerInfo = getProviderInfo(p.type);
            return p.isConfigured || !providerInfo.requiresApiKey;
          })
          .map(p => p.type);
          
        console.log(`🔄 Loading models for ${configuredProviders.length} configured providers`);
        
        // Load models for all configured providers in parallel
        await Promise.all(
          configuredProviders.map(type => get().loadModelsForProvider(type))
        );
      },
      
      // Model Selection Actions
      addSelectedModel: (model: ModelInfo, provider: ProviderType) => {
        const fullId = `${provider}:${model.id}`;
        
        set(state => {
          // Check if already selected
          if (state.selectedModels.some(m => m.fullId === fullId)) {
            return state;
          }
          
          const selectedModel: SelectedModel = {
            id: model.id,
            provider,
            name: model.name,
            fullId,
            capabilities: model.capabilities,
            pricing: model.pricing,
          };
          
          const newSelectedModels = [...state.selectedModels, selectedModel];
          
          return {
            selectedModels: newSelectedModels,
            currentModel: state.currentModel || fullId, // Set as current if none selected
          };
        });
      },
      
      removeSelectedModel: (fullId: string) => {
        set(state => {
          const newSelectedModels = state.selectedModels.filter(m => m.fullId !== fullId);
          
          return {
            selectedModels: newSelectedModels,
            currentModel: state.currentModel === fullId 
              ? (newSelectedModels[0]?.fullId || null)
              : state.currentModel
          };
        });
      },
      
      toggleSelectedModel: (model: ModelInfo, provider: ProviderType) => {
        const fullId = `${provider}:${model.id}`;
        const { selectedModels } = get();
        
        if (selectedModels.some(m => m.fullId === fullId)) {
          get().removeSelectedModel(fullId);
        } else {
          get().addSelectedModel(model, provider);
        }
      },
      
      setCurrentModel: (fullId: string) => {
        set({ currentModel: fullId });
      },
      
      // Utility Actions
      clearError: () => {
        set({ error: null });
      },
      
      initializeStore: () => {
        // Load models for any already configured providers
        get().loadModelsForAllConfiguredProviders();
      },
      
      getConfiguredProviders: () => {
        const { providers } = get();
        return Object.values(providers)
          .filter(p => {
            const providerInfo = getProviderInfo(p.type);
            return p.isConfigured || !providerInfo.requiresApiKey;
          })
          .map(p => p.type);
      },
      
      getSelectedModelsByProvider: (provider: ProviderType) => {
        const { selectedModels } = get();
        return selectedModels.filter(m => m.provider === provider);
      },
      
      // Active Provider Actions
      getCurrentProvider: () => {
        const { currentModel, selectedModels, providers } = get();
        if (!currentModel) return null;
        
        const model = selectedModels.find(m => m.fullId === currentModel);
        if (!model) return null;
        
        const providerConfig = providers[model.provider];
        if (!providerConfig?.isConfigured) return null;
        
        return { provider: model.provider, model };
      },
      
      getCurrentProviderInstance: () => {
        const currentProvider = get().getCurrentProvider();
        if (!currentProvider) return null;
        
        const { providers } = get();
        const providerConfig = providers[currentProvider.provider];
        
        try {
          return createProvider({
            type: currentProvider.provider,
            apiKey: providerConfig.apiKey || '',
            baseUrl: providerConfig.baseUrl,
          });
        } catch (error) {
          console.error('Failed to create provider instance:', error);
          return null;
        }
      },
      
      getFirstConfiguredProvider: () => {
        const { providers, availableModelsByProvider } = get();
        
        // Find first configured provider
        const configuredProvider = Object.values(providers).find(p => p.isConfigured);
        if (!configuredProvider) return null;
        
        // Get available models for this provider
        const availableModels = availableModelsByProvider[configuredProvider.type];
        if (!availableModels || availableModels.length === 0) return null;
        
        // Create a model object from the first available model
        const firstModel = availableModels[0];
        const model: SelectedModel = {
          id: firstModel.id,
          provider: configuredProvider.type,
          name: firstModel.name,
          fullId: `${configuredProvider.type}:${firstModel.id}`,
          capabilities: firstModel.capabilities,
          pricing: firstModel.pricing,
        };
        
        return { provider: configuredProvider.type, model };
      },
    }),
    {
      name: 'sidepilot-multi-provider-store',
      storage: chromeStorage,
      // Only persist configuration, not runtime state
      partialize: (state) => ({
        providers: state.providers,
        selectedModels: state.selectedModels,
        currentModel: state.currentModel,
      }),
    }
  )
);