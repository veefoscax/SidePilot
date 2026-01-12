# S02: Provider Factory - Tasks

## Implementation Checklist

### 1. Type Definitions
- [ ] Create src/providers/types.ts
- [ ] Define ProviderType union (20+ types)
- [ ] Define ModelCapabilities interface
- [ ] Define ModelInfo interface
- [ ] Define ProviderConfig interface
- [ ] Define ChatMessage, ContentPart interfaces
- [ ] Define ChatOptions interface
- [ ] Define LLMResponse interface
- [ ] Define StreamChunk interface
- [ ] Define ToolDefinition, ToolCall interfaces
- [ ] Define LLMProvider interface

### 2. Model Registry
- [ ] Create src/providers/models-registry.ts
- [ ] Add Claude models (sonnet, haiku, opus)
- [ ] Add OpenAI models (gpt-4o, o1, o3)
- [ ] Add Google models (gemini-2.0)
- [ ] Add DeepSeek models
- [ ] Add Groq models
- [ ] Add local model defaults (ollama)
- [ ] Add getModelInfo() helper

### 3. Base Provider
- [ ] Create src/providers/base-provider.ts
- [ ] Implement abstract BaseProvider class
- [ ] Add testConnection() default implementation

### 4. Anthropic Provider
- [ ] Create src/providers/anthropic.ts
- [ ] Implement chat() with Anthropic API format
- [ ] Implement stream() with SSE parsing
- [ ] Handle tool_use blocks
- [ ] Handle vision (base64 images)

### 5. OpenAI Provider
- [ ] Create src/providers/openai.ts
- [ ] Implement chat() with OpenAI format
- [ ] Implement stream() with SSE
- [ ] Support OpenAI-compatible APIs (groq, mistral, etc.)
- [ ] Handle tool calls
- [ ] Handle vision

### 6. Google Provider
- [ ] Create src/providers/google.ts
- [ ] Implement Gemini API format
- [ ] Handle streaming

### 7. DeepSeek Provider
- [ ] Create src/providers/deepseek.ts
- [ ] Extend OpenAI provider (same format)

### 8. Ollama Provider
- [ ] Create src/providers/ollama.ts
- [ ] Implement local Ollama API
- [ ] Handle streaming
- [ ] Add listModels() to fetch local models

### 9. Factory Function
- [ ] Create src/providers/factory.ts
- [ ] Map provider types to classes
- [ ] Implement createProvider()

### 10. Testing
- [ ] Test Anthropic provider with API key
- [ ] Test OpenAI provider with API key
- [ ] Test Ollama with local server
- [ ] Verify streaming works
- [ ] Verify tool calls parse correctly

## Success Criteria
- All 5 core providers implemented
- Streaming works for all providers
- Tool calls work for Anthropic and OpenAI
- testConnection() validates API keys
- Model registry returns correct capabilities
