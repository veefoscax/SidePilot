# S02: Provider Factory - Requirements

## Feature Description
Implement multi-LLM provider factory supporting 40+ providers (like Cline), with unified interface for chat, streaming, and capability detection.

## User Stories

### US1: Provider Selection
**As a** user
**I want** to select from many LLM providers (Anthropic, OpenAI, Google, etc.)
**So that** I can use my preferred AI service

### US2: Model Capabilities
**As a** user
**I want** to see what each model supports (vision, tools, streaming)
**So that** I know which features will work

### US3: Provider Test
**As a** user
**I want** to test my API key connection
**So that** I know it's configured correctly

## Provider Types to Support

### Tier 1 (Core)
- anthropic (Claude)
- openai (GPT)
- google (Gemini)
- openai-compat (generic OpenAI-compatible)

### Tier 2 (Popular)
- deepseek
- groq
- mistral
- ollama (local)
- lmstudio (local)

### Tier 3 (Extended)
- openrouter (aggregator)
- together
- fireworks
- moonshot (kimi)
- zai (glm-4)
- huggingface
- xai (grok)
- cerebras
- sambanova

## Acceptance Criteria

### AC1: Provider Interface
- [ ] Unified `LLMProvider` interface
- [ ] `chat()` method for non-streaming
- [ ] `stream()` method for streaming
- [ ] `testConnection()` for API key validation
- [ ] `listModels()` optional for dynamic lists

### AC2: Factory Pattern
- [ ] `createProvider(type, config)` factory function
- [ ] Provider registry for known types
- [ ] Extensible for custom providers

### AC3: Model Registry
- [ ] Hardcoded model info (like Cline's `api.ts`)
- [ ] Context window, max tokens, capabilities
- [ ] Pricing information

### AC4: Capability Detection
- [ ] `supportsVision`: Can process images
- [ ] `supportsTools`: Function calling support
- [ ] `supportsStreaming`: SSE streaming
- [ ] `supportsReasoning`: Thinking mode
- [ ] `contextWindow`: Token limit
- [ ] `maxOutputTokens`: Output limit

## Dependencies
- S01: Extension scaffold (TypeScript setup)

## Files to Create
- src/providers/types.ts
- src/providers/factory.ts
- src/providers/base-provider.ts
- src/providers/models-registry.ts
- src/providers/anthropic.ts
- src/providers/openai.ts
- src/providers/google.ts
- src/providers/deepseek.ts
- src/providers/ollama.ts
