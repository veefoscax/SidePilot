# S02: Provider Factory - Tasks

## Implementation Checklist

### 1. Type Definitions
- [ ] Create src/providers/types.ts <!-- id: 0 -->
- [ ] Define ProviderType union (20+ types) <!-- id: 1 -->
- [ ] Define ModelCapabilities interface <!-- id: 2 -->
- [ ] Define ModelInfo interface <!-- id: 3 -->
- [ ] Define ProviderConfig interface <!-- id: 4 -->
- [ ] Define ChatMessage, ContentPart interfaces <!-- id: 5 -->
- [ ] Define ChatOptions interface <!-- id: 6 -->
- [ ] Define LLMResponse interface <!-- id: 7 -->
- [ ] Define StreamChunk interface <!-- id: 8 -->
- [ ] Define ToolDefinition, ToolCall interfaces <!-- id: 9 -->
- [ ] Define LLMProvider interface <!-- id: 10 -->

### 2. Model Registry
- [ ] Create src/providers/models-registry.ts <!-- id: 11 -->
- [ ] Add Claude models (sonnet, haiku, opus) <!-- id: 12 -->
- [ ] Add OpenAI models (gpt-4o, o1, o3) <!-- id: 13 -->
- [ ] Add Google models (gemini-2.0) <!-- id: 14 -->
- [ ] Add DeepSeek models <!-- id: 15 -->
- [ ] Add Groq models <!-- id: 16 -->
- [ ] Add local model defaults (ollama) <!-- id: 17 -->
- [ ] Add getModelInfo() helper <!-- id: 18 -->

### 3. Base Provider
- [ ] Create src/providers/base-provider.ts <!-- id: 19 -->
- [ ] Implement abstract BaseProvider class <!-- id: 20 -->
- [ ] Add testConnection() default implementation <!-- id: 21 -->

### 4. Anthropic Provider
- [ ] Create src/providers/anthropic.ts <!-- id: 22 -->
- [ ] Implement chat() with Anthropic API format <!-- id: 23 -->
- [ ] Implement stream() with SSE parsing <!-- id: 24 -->
- [ ] Handle tool_use blocks <!-- id: 25 -->
- [ ] Handle vision (base64 images) <!-- id: 26 -->

### 5. OpenAI Provider
- [ ] Create src/providers/openai.ts <!-- id: 27 -->
- [ ] Implement chat() with OpenAI format <!-- id: 28 -->
- [ ] Implement stream() with SSE <!-- id: 29 -->
- [ ] Support OpenAI-compatible APIs (groq, mistral, etc.) <!-- id: 30 -->
- [ ] Handle tool calls <!-- id: 31 -->
- [ ] Handle vision <!-- id: 32 -->

### 6. Google Provider
- [ ] Create src/providers/google.ts <!-- id: 33 -->
- [ ] Implement Gemini API format <!-- id: 34 -->
- [ ] Handle streaming <!-- id: 35 -->

### 7. DeepSeek Provider
- [ ] Create src/providers/deepseek.ts <!-- id: 36 -->
- [ ] Extend OpenAI provider (same format) <!-- id: 37 -->

### 8. Ollama Provider
- [ ] Create src/providers/ollama.ts <!-- id: 38 -->
- [ ] Implement local Ollama API <!-- id: 39 -->
- [ ] Handle streaming <!-- id: 40 -->
- [ ] Add listModels() to fetch local models <!-- id: 41 -->

### 9. Factory Function
- [ ] Create src/providers/factory.ts <!-- id: 42 -->
- [ ] Map provider types to classes <!-- id: 43 -->
- [ ] Implement createProvider() <!-- id: 44 -->

### 10. Testing
- [ ] Test Anthropic provider with API key <!-- id: 45 -->
- [ ] Test OpenAI provider with API key <!-- id: 46 -->
- [ ] Test Ollama with local server <!-- id: 47 -->
- [ ] Verify streaming works <!-- id: 48 -->
- [ ] Verify tool calls parse correctly <!-- id: 49 -->

## Success Criteria
- All 5 core providers implemented
- Streaming works for all providers
- Tool calls work for Anthropic and OpenAI
- testConnection() validates API keys
- Model registry returns correct capabilities

### 11. Automated Testing (Playwright)
- [ ] Install Playwright dependencies <!-- id: 50 -->
- [ ] Create static build verification tests (verify dist/ output size & content) <!-- id: 51 -->
- [ ] Create integration tests for UI/Logic <!-- id: 52 -->
- [ ] Add test script to package.json <!-- id: 53 -->
- [ ] Update DEVLOG with test results and screenshots <!-- id: 54 -->
