# S03: Provider Settings UI - Design

## Component Hierarchy

```
SettingsPage
├── ProviderSection
│   ├── ProviderSelector       // Select dropdown with icons
│   └── ApiKeyInput            // Password input with test
├── ModelSection
│   ├── ModelSelector          // Filtered by provider
│   └── CapabilityBadges       // Vision, tools, streaming
├── ConnectionSection
│   ├── TestConnectionButton
│   └── ConnectionStatus
└── SaveButton
```

## Zustand Store

```typescript
// src/stores/provider.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ProviderType, ModelInfo, LLMProvider } from '@/providers/types';

interface ProviderState {
  // Config
  selectedProvider: ProviderType;
  apiKey: string;
  baseUrl?: string;
  selectedModel: string;
  
  // Runtime
  provider: LLMProvider | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setProvider(type: ProviderType): void;
  setApiKey(key: string): void;
  setModel(modelId: string): void;
  testConnection(): Promise<boolean>;
  initializeProvider(): Promise<void>;
}

export const useProviderStore = create<ProviderState>()(
  persist(
    (set, get) => ({
      selectedProvider: 'openai',
      apiKey: '',
      selectedModel: 'gpt-4o',
      provider: null,
      isConnected: false,
      isLoading: false,
      error: null,
      
      setProvider: (type) => set({ selectedProvider: type, isConnected: false }),
      setApiKey: (key) => set({ apiKey: key, isConnected: false }),
      setModel: (modelId) => set({ selectedModel: modelId }),
      
      testConnection: async () => {
        set({ isLoading: true, error: null });
        try {
          const { selectedProvider, apiKey, selectedModel } = get();
          const provider = createProvider({
            type: selectedProvider,
            apiKey,
            defaultModel: selectedModel,
          });
          const success = await provider.testConnection();
          set({ isConnected: success, provider: success ? provider : null });
          return success;
        } catch (e) {
          set({ error: e.message, isConnected: false });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },
      
      initializeProvider: async () => {
        const { selectedProvider, apiKey, selectedModel } = get();
        if (!apiKey) return;
        const provider = createProvider({
          type: selectedProvider,
          apiKey,
          defaultModel: selectedModel,
        });
        set({ provider });
      },
    }),
    {
      name: 'provider-storage',
      storage: createJSONStorage(() => ({
        getItem: async (name) => {
          const result = await chrome.storage.local.get(name);
          return result[name] ?? null;
        },
        setItem: async (name, value) => {
          await chrome.storage.local.set({ [name]: value });
        },
        removeItem: async (name) => {
          await chrome.storage.local.remove(name);
        },
      })),
      partialize: (state) => ({
        selectedProvider: state.selectedProvider,
        apiKey: state.apiKey,
        baseUrl: state.baseUrl,
        selectedModel: state.selectedModel,
      }),
    }
  )
);
```

## Provider Selector Component

```tsx
// src/components/settings/ProviderSelector.tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProviderType } from '@/providers/types';

const PROVIDERS: { type: ProviderType; name: string; tier: 'core' | 'popular' | 'extended' }[] = [
  { type: 'anthropic', name: 'Anthropic (Claude)', tier: 'core' },
  { type: 'openai', name: 'OpenAI (GPT)', tier: 'core' },
  { type: 'google', name: 'Google (Gemini)', tier: 'core' },
  { type: 'deepseek', name: 'DeepSeek', tier: 'popular' },
  { type: 'groq', name: 'Groq', tier: 'popular' },
  { type: 'ollama', name: 'Ollama (Local)', tier: 'popular' },
  { type: 'openrouter', name: 'OpenRouter', tier: 'extended' },
  // ... more providers
];

export function ProviderSelector({ value, onChange }: Props) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select provider" />
      </SelectTrigger>
      <SelectContent>
        {PROVIDERS.map(p => (
          <SelectItem key={p.type} value={p.type}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

## Capability Badges Component

```tsx
// src/components/settings/CapabilityBadges.tsx
import { Badge } from '@/components/ui/badge';
import { Eye, Wrench, Zap, Brain } from 'lucide-react';
import { ModelCapabilities } from '@/providers/types';

export function CapabilityBadges({ capabilities }: { capabilities: ModelCapabilities }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {capabilities.supportsVision && (
        <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
          <Eye className="w-3 h-3 mr-1" /> Vision
        </Badge>
      )}
      {capabilities.supportsTools && (
        <Badge variant="secondary" className="bg-green-500/20 text-green-400">
          <Wrench className="w-3 h-3 mr-1" /> Tools
        </Badge>
      )}
      {capabilities.supportsStreaming && (
        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
          <Zap className="w-3 h-3 mr-1" /> Streaming
        </Badge>
      )}
      {capabilities.supportsReasoning && (
        <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
          <Brain className="w-3 h-3 mr-1" /> Reasoning
        </Badge>
      )}
      <span className="text-xs text-muted-foreground">
        {(capabilities.contextWindow / 1000).toFixed(0)}K context
      </span>
    </div>
  );
}
```

## Files to Create
- src/sidepanel/pages/Settings.tsx
- src/stores/provider.ts
- src/components/settings/ProviderSelector.tsx
- src/components/settings/ApiKeyInput.tsx
- src/components/settings/ModelSelector.tsx
- src/components/settings/CapabilityBadges.tsx
- src/components/settings/TestConnectionButton.tsx
