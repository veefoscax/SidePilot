/**
 * SidePilot Provider Store
 * 
 * Zustand store for managing LLM provider configuration, API keys, and connection state.
 * Persists settings to Chrome storage for security and cross-session persistence.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ProviderType, ModelInfo, LLMProvider } from '@/providers/types';
import { createProvider, getProviderInfo } from '@/providers/factory';

interface ProviderState {
  // Configuration
  selectedProvider: ProviderType;
  apiKey: string;
  baseUrl?: string;
  selectedModel: string;
  selectedModels: string[]; // Array of selected model IDs
  
  // Runtime state
  provider: LLMProvider | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Available models for current provider
  availableModels: ModelInfo[];
  isLoadingModels: boolean;
  
  // Actions
  setProvider: (type: ProviderType) => void;
  setApiKey: (key: string) => void;
  setBaseUrl: (url: string) => void;
  setModel: (modelId: string) => void;
  addModel: (modelId: string) => void;
  removeModel: (modelId: string) => void;
  toggleModel: (modelId: string) => void;
  testConnection: () => Promise<boolean>;
  initializeProvider: () => Promise<void>;
  clearError: () => void;
  loadModelsForProvider: (type: ProviderType) => Promise<void>;
  refreshModels: () => Promise<void>;
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

export const useProviderStore = create<ProviderState>()(
  persist(
    (set, get) => ({
      // Default configuration
      selectedProvider: 'openai',
      apiKey: '',
      baseUrl: undefined,
      selectedModel: 'gpt-4o',
      selectedModels: [], // Start with empty array
      
      // Runtime state
      provider: null,
      isConnected: false,
      isLoading: false,
      error: null,
      availableModels: [],
      isLoadingModels: false,
      
      // Actions
      setProvider: (type: ProviderType) => {
        set({ 
          selectedProvider: type, 
          isConnected: false,
          availableModels: [], // Clear models while loading
          selectedModel: '',
          selectedModels: [], // Clear selected models
          error: null
        });
        
        // Load models for the new provider
        get().loadModelsForProvider(type);
      },
      
      loadModelsForProvider: async (type: ProviderType) => {
        set({ isLoadingModels: true });
        
        try {
          let models: ModelInfo[] = [];
          
          // Check if provider requires API key
          const providerInfo = getProviderInfo(type);
          const { apiKey } = get();
          const hasApiKey = apiKey && apiKey.trim().length > 0;
          
          if (!providerInfo.requiresApiKey || hasApiKey) {
            try {
              const tempProvider = createProvider(type, {
                apiKey: providerInfo.requiresApiKey ? apiKey : undefined,
                baseUrl: get().baseUrl,
              });
              
              // If provider supports listModels, use it
              if (tempProvider.listModels) {
                models = await tempProvider.listModels();
                console.log(`✅ Loaded ${models.length} models from ${type} provider`);
              } else {
                console.log(`⚠️ Provider ${type} doesn't support dynamic model listing`);
              }
            } catch (error) {
              console.warn(`⚠️ Failed to fetch models from ${type} provider:`, error);
            }
          } else {
            console.log(`🔑 No API key provided for ${type}, not loading models`);
          }
          
          set({ 
            availableModels: models,
            selectedModel: models.length > 0 ? models[0].id : '',
            selectedModels: models.length > 0 ? [models[0].id] : [], // Auto-select first model
            isLoadingModels: false,
          });
        } catch (error) {
          console.error(`❌ Error loading models for ${type}:`, error);
          set({ 
            availableModels: [],
            selectedModel: '',
            selectedModels: [], // Clear selected models
            isLoadingModels: false,
            error: `Failed to load models: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      },
      
      refreshModels: async () => {
        const { selectedProvider } = get();
        await get().loadModelsForProvider(selectedProvider);
      },
      
      setApiKey: (key: string) => {
        set({ apiKey: key, isConnected: false, error: null });
        
        // If API key is provided, reload models for current provider
        if (key && key.trim().length > 0) {
          const { selectedProvider } = get();
          get().loadModelsForProvider(selectedProvider);
        } else {
          // If API key is cleared, clear models (except for providers that don't require API keys)
          const { selectedProvider } = get();
          const providerInfo = getProviderInfo(selectedProvider);
          if (providerInfo.requiresApiKey) {
            set({ availableModels: [], selectedModel: '', selectedModels: [] });
          }
        }
      },
      
      setBaseUrl: (url: string) => {
        set({ baseUrl: url, isConnected: false, error: null });
      },
      
      setModel: (modelId: string) => {
        set({ selectedModel: modelId, error: null });
      },
      
      addModel: (modelId: string) => {
        const { selectedModels } = get();
        if (!selectedModels.includes(modelId)) {
          const newSelectedModels = [...selectedModels, modelId];
          set({ 
            selectedModels: newSelectedModels,
            selectedModel: modelId, // Set as current model
            error: null 
          });
        }
      },
      
      removeModel: (modelId: string) => {
        const { selectedModels, selectedModel } = get();
        const newSelectedModels = selectedModels.filter(id => id !== modelId);
        
        // If we're removing the current model, switch to another one
        const newCurrentModel = modelId === selectedModel 
          ? (newSelectedModels[0] || '') 
          : selectedModel;
          
        set({ 
          selectedModels: newSelectedModels,
          selectedModel: newCurrentModel,
          error: null 
        });
      },
      
      toggleModel: (modelId: string) => {
        const { selectedModels } = get();
        if (selectedModels.includes(modelId)) {
          get().removeModel(modelId);
        } else {
          get().addModel(modelId);
        }
      },
      
      testConnection: async () => {
        const { selectedProvider, apiKey, baseUrl } = get();
        
        const providerInfo = getProviderInfo(selectedProvider);
        if (providerInfo.requiresApiKey && !apiKey) {
          set({ error: 'API key is required for this provider', isConnected: false });
          return false;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const provider = createProvider(selectedProvider, {
            apiKey,
            baseUrl,
          });
          
          const result = await provider.testConnection();
          
          set({ 
            isConnected: result.success, 
            provider: result.success ? provider : null,
            error: result.success ? null : result.error?.message || 'Connection test failed'
          });
          
          return result.success;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          set({ 
            error: errorMessage, 
            isConnected: false, 
            provider: null 
          });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },
      
      initializeProvider: async () => {
        const { selectedProvider, apiKey, baseUrl } = get();
        
        const providerInfo = getProviderInfo(selectedProvider);
        if (providerInfo.requiresApiKey && !apiKey) {
          return;
        }
        
        try {
          const provider = createProvider(selectedProvider, {
            apiKey,
            baseUrl,
          });
          
          set({ provider, error: null });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to initialize provider';
          set({ error: errorMessage, provider: null });
        }
      },
      
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'sidepilot-provider-storage',
      storage: chromeStorage,
      partialize: (state) => ({
        selectedProvider: state.selectedProvider,
        apiKey: state.apiKey,
        baseUrl: state.baseUrl,
        selectedModel: state.selectedModel,
      }),
    }
  )
);

// Initialize available models on store creation
useProviderStore.getState().setProvider(useProviderStore.getState().selectedProvider);