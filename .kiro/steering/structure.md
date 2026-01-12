# Project Structure

```
byo-llm-browser-agent/
├── manifest.json                 # Extension manifest (MV3)
├── vite.config.ts               # Vite configuration
├── tailwind.config.js           # Tailwind config
├── components.json              # shadcn/ui config
├── package.json
├── tsconfig.json
│
├── src/
│   ├── sidepanel/               # Side panel app
│   │   ├── index.html
│   │   ├── index.tsx            # Entry point
│   │   ├── App.tsx              # Root component
│   │   └── pages/
│   │       ├── Chat.tsx
│   │       └── Settings.tsx
│   │
│   ├── background/              # Service worker
│   │   └── service-worker.ts
│   │
│   ├── content/                 # Content scripts
│   │   ├── content.ts
│   │   └── visual-indicator.ts
│   │
│   ├── providers/               # LLM providers
│   │   ├── types.ts             # Shared interfaces
│   │   ├── factory.ts           # Provider factory
│   │   ├── models-registry.ts   # Known models + capabilities
│   │   ├── anthropic.ts
│   │   ├── openai.ts
│   │   ├── google.ts
│   │   ├── deepseek.ts
│   │   └── ollama.ts
│   │
│   ├── tools/                   # Browser tools
│   │   ├── types.ts
│   │   ├── registry.ts
│   │   ├── computer.ts
│   │   ├── navigation.ts
│   │   ├── tabs.ts
│   │   └── ...
│   │
│   ├── lib/                     # Utilities
│   │   ├── cdp-wrapper.ts
│   │   ├── storage.ts
│   │   ├── messaging.ts
│   │   └── permissions.ts
│   │
│   ├── stores/                  # Zustand stores
│   │   ├── chat.ts
│   │   ├── provider.ts
│   │   └── permissions.ts
│   │
│   └── components/              # Shared React components
│       ├── ui/                  # shadcn/ui components
│       │   ├── button.tsx
│       │   ├── input.tsx
│       │   └── ...
│       ├── chat/
│       │   ├── ChatMessage.tsx
│       │   ├── MessageList.tsx
│       │   └── InputArea.tsx
│       └── settings/
│           ├── ProviderSelector.tsx
│           └── ModelSelector.tsx
│
├── public/
│   └── icons/
│
└── .kiro/
    ├── steering/
    ├── specs/
    └── prompts/
```

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| React Component | PascalCase | `ChatMessage.tsx` |
| Hook | camelCase + `use` | `useProvider.ts` |
| Store | camelCase | `chatStore.ts` |
| Utility | camelCase | `storage.ts` |
| Type file | .ts extension | `types.ts` |
| Interface | PascalCase + I prefix | `ILLMProvider` or just `LLMProvider` |
| Constant | UPPER_SNAKE_CASE | `MAX_TOKENS` |

## Import Order
1. React/external libraries
2. Components
3. Hooks/stores
4. Utils
5. Types
6. Styles
