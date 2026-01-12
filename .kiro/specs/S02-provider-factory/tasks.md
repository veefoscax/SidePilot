# S02: Provider Factory - Tasks

## Implementation Checklist

### 1. Type Definitions
- [x] Create src/providers/types.ts <!-- id: 0 -->
- [x] Define ProviderType union (20+ types) <!-- id: 1 -->
- [x] Define ModelCapabilities interface <!-- id: 2 -->
- [x] Define ModelInfo interface <!-- id: 3 -->
- [x] Define ProviderConfig interface <!-- id: 4 -->
- [x] Define ChatMessage, ContentPart interfaces <!-- id: 5 -->
- [x] Define ChatOptions interface <!-- id: 6 -->
- [x] Define LLMResponse interface <!-- id: 7 -->
- [x] Define StreamChunk interface <!-- id: 8 -->
- [x] Define ToolDefinition, ToolCall interfaces <!-- id: 9 -->
- [x] Define LLMProvider interface <!-- id: 10 -->

### 2. Model Registry
- [x] Create src/providers/models-registry.ts <!-- id: 11 -->
- [x] Add Claude models (sonnet, haiku, opus) <!-- id: 12 -->
- [x] Add OpenAI models (gpt-4o, o1, o3) <!-- id: 13 -->
- [x] Add Google models (gemini-2.0) <!-- id: 14 -->
- [x] Add DeepSeek models <!-- id: 15 -->
- [x] Add Groq models <!-- id: 16 -->
- [x] Add local model defaults (ollama) <!-- id: 17 -->
- [x] Add getModelInfo() helper <!-- id: 18 -->

### 3. Base Provider
- [x] Create src/providers/base-provider.ts <!-- id: 19 -->
- [x] Implement abstract BaseProvider class <!-- id: 20 -->
- [x] Add testConnection() default implementation <!-- id: 21 -->

### 4. Anthropic Provider
- [x] Create src/providers/anthropic.ts <!-- id: 22 -->
- [x] Implement chat() with Anthropic API format <!-- id: 23 -->
- [x] Implement stream() with SSE parsing <!-- id: 24 -->
- [x] Handle tool_use blocks <!-- id: 25 -->
- [x] Handle vision (base64 images) <!-- id: 26 -->

### 5. OpenAI Provider
- [x] Create src/providers/openai.ts <!-- id: 27 -->
- [x] Implement chat() with OpenAI format <!-- id: 28 -->
- [x] Implement stream() with SSE <!-- id: 29 -->
- [x] Support OpenAI-compatible APIs (groq, mistral, etc.) <!-- id: 30 -->
- [x] Handle tool calls <!-- id: 31 -->
- [x] Handle vision <!-- id: 32 -->

### 6. Google Provider
- [x] Create src/providers/google.ts <!-- id: 33 -->
- [x] Implement Gemini API format <!-- id: 34 -->
- [x] Handle streaming <!-- id: 35 -->

### 7. DeepSeek Provider
- [x] Create src/providers/deepseek.ts <!-- id: 36 -->
- [x] Extend OpenAI provider (same format) <!-- id: 37 -->

### 8. Ollama Provider
- [x] Create src/providers/ollama.ts <!-- id: 38 -->
- [x] Implement local Ollama API <!-- id: 39 -->
- [x] Handle streaming <!-- id: 40 -->
- [x] Add listModels() to fetch local models <!-- id: 41 -->

### 9. Factory Function
- [x] Create src/providers/factory.ts <!-- id: 42 -->
- [x] Map provider types to classes <!-- id: 43 -->
- [x] Implement createProvider() <!-- id: 44 -->

### 10. Testing
- [x] Test Anthropic provider with API key <!-- id: 45 -->
- [x] Test OpenAI provider with API key <!-- id: 46 -->
- [x] Test Ollama with local server <!-- id: 47 -->
- [x] Verify streaming works <!-- id: 48 -->
- [x] Verify tool calls parse correctly <!-- id: 49 -->

## Success Criteria
- ✅ All 5 core providers implemented
- ✅ Streaming works for all providers  
- ✅ Tool calls work for Anthropic and OpenAI
- ✅ testConnection() validates API keys
- ✅ Model registry returns correct capabilities

### 11. Automated Testing (Playwright)
- [x] Install Playwright dependencies <!-- id: 50 -->
- [x] Create static build verification tests (verify dist/ output size & content) <!-- id: 51 -->
- [x] Create integration tests for UI/Logic <!-- id: 52 -->
- [x] Add test script to package.json <!-- id: 53 -->
- [x] Update DEVLOG with test results and screenshots <!-- id: 54 -->
