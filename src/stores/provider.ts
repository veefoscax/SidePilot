/**
 * SidePilot Provider Store
 * 
 * Zustand store for managing LLM provider configuration, API keys, and connection state.
 * Persists settings to Chrome storage for security and cross-session persistence.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ProviderType, ModelInfo, LLMProvider } from '@/providers/types';
import { createProvider } from '@/providers/factory';
import { getModelsByProvider } from '@/providers/models-registry';

interface ProviderState {
  // Configuration
  selectedProvider: ProviderType;
  apiKey: string;
  baseUrl?: string;
  selectedModel: string;
  
  // Runtime state
  provider: LLMProvider | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Available models for current provider
  availableModels: ModelInfo[];
  
  // Actions
  setProvider: (type: ProviderType) => void;
  setApiKey: (key: string) => void;
  setBaseUrl: (url: string) => void;
  setModel: (modelId: string) => void;
  testConnection: () => Promise<boolean>;
  initializeProvider: () => Promise<void>;
  clearError: () => void;
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
      
      // Runtime state
      provider: null,
      isConnected: false,
      isLoading: false,
      error: null,
      availableModels: [],
      
      // Actions
      setProvider: (type: ProviderType) => {
        const models = getModelsByProvider(type);
        const defaultModel = models[0]?.id || '';
        
        set({ 
          selectedProvider: type, 
          isConnected: false,
          availableModels: models,
          selectedModel: defaultModel,
          error: null
        });
      },
      
      setApiKey: (key: string) => {
        set({ apiKey: key, isConnected: false, error: null });
      },
      
      setBaseUrl: (url: string) => {
        set({ baseUrl: url, isConnected: false, error: null });
      },
      
      setModel: (modelId: string) => {
        set({ selectedModel: modelId, error: null });
      },
      
      testConnection: async () => {
        const { selectedProvider, apiKey, selectedModel, baseUrl } = get();
        
        if (!apiKey && selectedProvider !== 'ollama') {
          set({ error: 'API key is required for this provider', isConnected: false });
          return false;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const provider = createProvider({
            type: selectedProvider,
            apiKey,
            baseUrl,
            defaultModel: selectedModel,
          });
          
          const success = await provider.testConnection();
          
          set({ 
            isConnected: success, 
            provider: success ? provider : null,
            error: success ? null : 'Connection test failed'
          });
          
          return success;
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
        const { selectedProvider, apiKey, selectedModel, baseUrl } = get();
        
        if (!apiKey && selectedProvider !== 'ollama') {
          return;
        }
        
        try {
          const provider = createProvider({
            type: selectedProvider,
            apiKey,
            baseUrl,
            defaultModel: selectedModel,
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