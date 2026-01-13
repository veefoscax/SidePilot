# SidePilot Supported Providers

> **Complete API Integration Guide** for all 40+ LLM providers

## Quick Reference

| Category | Providers | Auth Method |
|----------|-----------|-------------|
| **Core (Native)** | Anthropic, OpenAI, Google, Ollama, LM Studio | API Key / None |
| **OpenAI-Compatible** | DeepSeek, Groq, Mistral, xAI, Together, OpenRouter | Bearer Token |
| **Aggregators** | OpenRouter, Together, Fireworks, DeepInfra | Bearer Token |
| **Enterprise** | Bedrock, Vertex AI | Cloud Auth |
| **Chinese** | ZAI, MiniMax, Moonshot, Baichuan, Qwen | Bearer Token |
| **Local** | Ollama, LM Studio | None |

---

## 📚 Official Documentation Links (for Kiro)

> **Use these links to verify API implementations and get the latest information**

### Tier 1: Core Providers
| Provider | API Docs | Get API Key | SDK |
|----------|----------|-------------|-----|
| **Anthropic** | [Messages API](https://docs.anthropic.com/en/api/messages) | [Console](https://console.anthropic.com/settings/keys) | [@anthropic-ai/sdk](https://www.npmjs.com/package/@anthropic-ai/sdk) |
| **OpenAI** | [Chat API](https://platform.openai.com/docs/api-reference/chat) | [API Keys](https://platform.openai.com/api-keys) | [openai](https://www.npmjs.com/package/openai) |
| **Google** | [Gemini API](https://ai.google.dev/api/rest/v1beta/models/generateContent) | [AI Studio](https://aistudio.google.com/apikey) | [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai) |
| **Ollama** | [REST API](https://github.com/ollama/ollama/blob/main/docs/api.md) | Local (no key) | [ollama](https://www.npmjs.com/package/ollama) |
| **LM Studio** | [Server Docs](https://lmstudio.ai/docs/local-server) | Local (no key) | OpenAI SDK compatible |

### Tier 2: Popular Providers
| Provider | API Docs | Get API Key |
|----------|----------|-------------|
| **DeepSeek** | [API Reference](https://api-docs.deepseek.com/) | [Platform](https://platform.deepseek.com/api_keys) |
| **Groq** | [API Reference](https://console.groq.com/docs/api-reference) | [Console](https://console.groq.com/keys) |
| **Mistral** | [API Specs](https://docs.mistral.ai/api/) | [Console](https://console.mistral.ai/api-keys) |
| **xAI (Grok)** | [API Docs](https://docs.x.ai/) | [Console](https://console.x.ai/) |

### Tier 3: Aggregators & Platforms
| Provider | API Docs | Get API Key |
|----------|----------|-------------|
| **OpenRouter** | [API Reference](https://openrouter.ai/docs/api-reference/overview) | [Keys](https://openrouter.ai/keys) |
| **Together** | [Chat API](https://docs.together.ai/reference/chat-completions-1) | [Settings](https://api.together.xyz/settings/api-keys) |
| **Perplexity** | [Chat Guide](https://docs.perplexity.ai/guides/chat-completions-guide) | [Settings](https://www.perplexity.ai/settings/api) |
| **Fireworks** | [REST API](https://docs.fireworks.ai/api-reference/introduction) | [Account](https://fireworks.ai/account/api-keys) |
| **Cerebras** | [Inference API](https://inference-docs.cerebras.ai/api-reference/chat-completions) | [Cloud](https://cloud.cerebras.ai/) |
| **SambaNova** | [API Docs](https://community.sambanova.ai/t/sambanova-cloud-api-documentation/96) | [Cloud](https://cloud.sambanova.ai/) |
| **DeepInfra** | [API Reference](https://deepinfra.com/docs/advanced/openai_api) | [Dashboard](https://deepinfra.com/dash/api_keys) |
| **Cohere** | [Chat API](https://docs.cohere.com/reference/chat) | [Dashboard](https://dashboard.cohere.com/api-keys) |

### Tier 4: Cloud Platforms
| Provider | API Docs | Get API Key |
|----------|----------|-------------|
| **Hugging Face** | [Inference API](https://huggingface.co/docs/api-inference/index) | [Settings](https://huggingface.co/settings/tokens) |
| **Replicate** | [HTTP API](https://replicate.com/docs/reference/http) | [Account](https://replicate.com/account/api-tokens) |

### Tier 5: Chinese Providers
| Provider | API Docs | Get API Key |
|----------|----------|-------------|
| **ZAI (Zhipu)** | [开放平台](https://open.bigmodel.cn/dev/api) | [控制台](https://open.bigmodel.cn/usercenter/apikeys) |
| **MiniMax** | [开发文档](https://platform.minimaxi.com/document/Fast%20access) | [控制台](https://platform.minimaxi.com/user-center/basic-information/interface-key) |
| **Moonshot** | [API文档](https://platform.moonshot.cn/docs/api/chat) | [控制台](https://platform.moonshot.cn/console/api-keys) |
| **Baichuan** | [API文档](https://platform.baichuan-ai.com/docs/api) | [控制台](https://platform.baichuan-ai.com/console/apikey) |
| **Qwen (DashScope)** | [API文档](https://help.aliyun.com/zh/dashscope/developer-reference/api-details) | [控制台](https://dashscope.console.aliyun.com/apiKey) |

### Enterprise Providers
| Provider | API Docs | Setup Guide |
|----------|----------|-------------|
| **AWS Bedrock** | [API Reference](https://docs.aws.amazon.com/bedrock/latest/APIReference/welcome.html) | [Getting Started](https://docs.aws.amazon.com/bedrock/latest/userguide/getting-started.html) |
| **Google Vertex AI** | [Gemini API](https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/inference) | [Setup](https://cloud.google.com/vertex-ai/docs/start/introduction-unified-platform) |

---

## Tier 1: Core Providers (Native Implementations)

### Anthropic (Claude)

| Property | Value |
|----------|-------|
| **Base URL** | `https://api.anthropic.com` |
| **Auth Header** | `x-api-key: YOUR_API_KEY` |
| **API Version** | `anthropic-version: 2023-06-01` |
| **Models** | `claude-sonnet-4-20250514`, `claude-3-5-haiku-20241022`, `claude-3-opus-20240229` |
| **Features** | ✅ Vision, ✅ Tools, ✅ Streaming, ✅ Extended Thinking |
| **📚 Docs** | [Messages API](https://docs.anthropic.com/en/api/messages) |
| **🔑 Get Key** | [Console](https://console.anthropic.com/settings/keys) |

<details>
<summary>📋 TypeScript Implementation</summary>

```typescript
// src/providers/anthropic.ts
const ANTHROPIC_CONFIG = {
  baseUrl: 'https://api.anthropic.com',
  version: '2023-06-01',
  models: [
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', vision: true, tools: true },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', vision: true, tools: true },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', vision: true, tools: true },
  ]
};

async function createAnthropicMessage(apiKey: string, params: {
  model: string;
  messages: Array<{ role: string; content: string | ContentBlock[] }>;
  max_tokens?: number;
  system?: string;
  tools?: Tool[];
  stream?: boolean;
}) {
  const response = await fetch(`${ANTHROPIC_CONFIG.baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_CONFIG.version,
    },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      max_tokens: params.max_tokens || 4096,
      system: params.system,
      tools: params.tools,
      stream: params.stream,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }
  
  return params.stream ? response.body : response.json();
}

// Tool format for Anthropic
interface AnthropicTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required?: string[];
  };
}
```

</details>

---

### OpenAI (GPT)

| Property | Value |
|----------|-------|
| **Base URL** | `https://api.openai.com/v1` |
| **Auth Header** | `Authorization: Bearer YOUR_API_KEY` |
| **Models** | `gpt-4o`, `gpt-4o-mini`, `o1`, `o1-mini`, `o3-mini` |
| **Features** | ✅ Vision, ✅ Tools, ✅ Streaming, ✅ JSON Mode |
| **📚 Docs** | [Chat API](https://platform.openai.com/docs/api-reference/chat) |
| **🔑 Get Key** | [API Keys](https://platform.openai.com/api-keys) |

<details>
<summary>📋 TypeScript Implementation</summary>

```typescript
// src/providers/openai.ts
const OPENAI_CONFIG = {
  baseUrl: 'https://api.openai.com/v1',
  models: [
    { id: 'gpt-4o', name: 'GPT-4o', vision: true, tools: true },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', vision: true, tools: true },
    { id: 'o1', name: 'O1', reasoning: true },
    { id: 'o1-mini', name: 'O1 Mini', reasoning: true },
    { id: 'o3-mini', name: 'O3 Mini', reasoning: true },
  ]
};

async function createOpenAICompletion(apiKey: string, params: {
  model: string;
  messages: Array<{ role: string; content: string | ContentBlock[] }>;
  max_tokens?: number;
  temperature?: number;
  tools?: OpenAITool[];
  stream?: boolean;
  response_format?: { type: 'json_object' | 'text' };
}) {
  const response = await fetch(`${OPENAI_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(params),
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }
  
  return params.stream ? response.body : response.json();
}

// Tool format for OpenAI
interface OpenAITool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, { type: string; description: string }>;
      required?: string[];
    };
  };
}
```

</details>

---

### Google (Gemini)

| Property | Value |
|----------|-------|
| **Base URL** | `https://generativelanguage.googleapis.com/v1beta` |
| **Auth** | `?key=YOUR_API_KEY` (query param) |
| **Models** | `gemini-2.0-flash`, `gemini-1.5-pro`, `gemini-1.5-flash` |
| **Features** | ✅ Vision, ✅ Tools, ✅ Streaming, ✅ Code Execution |
| **📚 Docs** | [Gemini API](https://ai.google.dev/api/rest/v1beta/models/generateContent) |
| **🔑 Get Key** | [AI Studio](https://aistudio.google.com/apikey) |

<details>
<summary>📋 TypeScript Implementation</summary>

```typescript
// src/providers/google.ts
const GOOGLE_CONFIG = {
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  models: [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', vision: true, tools: true },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', vision: true, tools: true },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', vision: true, tools: true },
  ]
};

async function createGeminiContent(apiKey: string, model: string, params: {
  contents: Array<{ role: string; parts: Part[] }>;
  systemInstruction?: { parts: Part[] };
  tools?: GeminiTool[];
  generationConfig?: GenerationConfig;
}) {
  const url = `${GOOGLE_CONFIG.baseUrl}/models/${model}:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  
  if (!response.ok) {
    throw new Error(`Google API error: ${response.status}`);
  }
  
  return response.json();
}

// Streaming endpoint
async function streamGeminiContent(apiKey: string, model: string, params: object) {
  const url = `${GOOGLE_CONFIG.baseUrl}/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  
  return response.body;
}

// Tool format for Gemini
interface GeminiTool {
  functionDeclarations: Array<{
    name: string;
    description: string;
    parameters: {
      type: 'OBJECT';
      properties: Record<string, { type: string; description: string }>;
      required?: string[];
    };
  }>;
}
```

</details>

---

### Ollama (Local)

| Property | Value |
|----------|-------|
| **Base URL** | `http://localhost:11434` |
| **Auth** | None required |
| **Models** | Dynamic (pulls from local Ollama) |
| **Features** | ✅ Streaming, ⚠️ Tools (model dependent) |

<details>
<summary>📋 TypeScript Implementation</summary>

```typescript
// src/providers/ollama.ts
const OLLAMA_CONFIG = {
  baseUrl: 'http://localhost:11434',
};

// List available models
async function listOllamaModels(baseUrl = OLLAMA_CONFIG.baseUrl) {
  const response = await fetch(`${baseUrl}/api/tags`);
  const data = await response.json();
  return data.models.map((m: any) => ({
    id: m.name,
    name: m.name,
    size: m.size,
    modified: m.modified_at,
  }));
}

// Chat completion (OpenAI-compatible endpoint)
async function createOllamaCompletion(baseUrl: string, params: {
  model: string;
  messages: Array<{ role: string; content: string }>;
  stream?: boolean;
  options?: { temperature?: number; num_predict?: number };
}) {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      stream: params.stream ?? true,
      options: params.options,
    }),
  });
  
  return response.body;
}

// OpenAI-compatible endpoint (recommended)
async function createOllamaOpenAICompletion(baseUrl: string, params: object) {
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  
  return response.json();
}
```

</details>

---

### LM Studio (Local)

| Property | Value |
|----------|-------|
| **Base URL** | `http://127.0.0.1:1234/v1` |
| **Auth** | None required (local) |
| **Models** | Dynamic (loaded in LM Studio) |
| **Features** | ✅ Streaming, ✅ OpenAI-compatible |

<details>
<summary>📋 TypeScript Implementation</summary>

```typescript
// src/providers/lmstudio.ts
const LMSTUDIO_CONFIG = {
  baseUrl: 'http://127.0.0.1:1234/v1',
};

// Uses OpenAI-compatible format
async function createLMStudioCompletion(baseUrl: string, params: {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}) {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  
  return params.stream ? response.body : response.json();
}

// List models
async function listLMStudioModels(baseUrl = LMSTUDIO_CONFIG.baseUrl) {
  const response = await fetch(`${baseUrl}/models`);
  const data = await response.json();
  return data.data.map((m: any) => ({
    id: m.id,
    name: m.id,
  }));
}
```

</details>

---

## Tier 2: Popular Providers (OpenAI-Compatible)

### DeepSeek

| Property | Value |
|----------|-------|
| **Base URL** | `https://api.deepseek.com/v1` |
| **Auth Header** | `Authorization: Bearer YOUR_API_KEY` |
| **Models** | `deepseek-chat`, `deepseek-coder`, `deepseek-reasoner` |
| **Features** | ✅ Tools, ✅ Streaming, ✅ Reasoning |
| **Pricing** | Very affordable (~$0.14/1M input, $0.28/1M output) |

<details>
<summary>📋 TypeScript Implementation</summary>

```typescript
// src/providers/deepseek.ts
const DEEPSEEK_CONFIG = {
  baseUrl: 'https://api.deepseek.com/v1',
  models: [
    { id: 'deepseek-chat', name: 'DeepSeek Chat', tools: true },
    { id: 'deepseek-coder', name: 'DeepSeek Coder', tools: true },
    { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', reasoning: true },
  ]
};

// Uses OpenAI-compatible format
async function createDeepSeekCompletion(apiKey: string, params: {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  tools?: OpenAITool[];
}) {
  const response = await fetch(`${DEEPSEEK_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(params),
  });
  
  return params.stream ? response.body : response.json();
}
```

</details>

---

### Groq

| Property | Value |
|----------|-------|
| **Base URL** | `https://api.groq.com/openai/v1` |
| **Auth Header** | `Authorization: Bearer YOUR_API_KEY` |
| **Models** | `llama-3.3-70b-versatile`, `mixtral-8x7b-32768`, `gemma2-9b-it` |
| **Features** | ✅ Tools, ✅ Streaming, ⚡ Ultra-fast inference |

<details>
<summary>📋 TypeScript Implementation</summary>

```typescript
// src/providers/groq.ts
const GROQ_CONFIG = {
  baseUrl: 'https://api.groq.com/openai/v1',
  models: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', tools: true },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', tools: true },
    { id: 'gemma2-9b-it', name: 'Gemma 2 9B', tools: false },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', tools: true },
  ]
};

// Uses OpenAI-compatible format
async function createGroqCompletion(apiKey: string, params: {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  tools?: OpenAITool[];
}) {
  const response = await fetch(`${GROQ_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(params),
  });
  
  return params.stream ? response.body : response.json();
}
```

</details>

---

### Mistral

| Property | Value |
|----------|-------|
| **Base URL** | `https://api.mistral.ai/v1` |
| **Auth Header** | `Authorization: Bearer YOUR_API_KEY` |
| **Models** | `mistral-large-latest`, `mistral-medium-latest`, `codestral-latest` |
| **Features** | ✅ Tools, ✅ Streaming, ✅ Code Generation |

<details>
<summary>📋 TypeScript Implementation</summary>

```typescript
// src/providers/mistral.ts
const MISTRAL_CONFIG = {
  baseUrl: 'https://api.mistral.ai/v1',
  models: [
    { id: 'mistral-large-latest', name: 'Mistral Large', tools: true },
    { id: 'mistral-medium-latest', name: 'Mistral Medium', tools: true },
    { id: 'codestral-latest', name: 'Codestral', tools: true },
    { id: 'mistral-small-latest', name: 'Mistral Small', tools: true },
  ]
};

// Uses OpenAI-compatible format
async function createMistralCompletion(apiKey: string, params: {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  tools?: OpenAITool[];
}) {
  const response = await fetch(`${MISTRAL_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(params),
  });
  
  return params.stream ? response.body : response.json();
}
```

</details>

---

### xAI (Grok)

| Property | Value |
|----------|-------|
| **Base URL** | `https://api.x.ai/v1` |
| **Auth Header** | `Authorization: Bearer YOUR_API_KEY` |
| **Models** | `grok-2`, `grok-2-mini` |
| **Features** | ✅ Vision, ✅ Tools, ✅ Streaming |

<details>
<summary>📋 TypeScript Implementation</summary>

```typescript
// src/providers/xai.ts
const XAI_CONFIG = {
  baseUrl: 'https://api.x.ai/v1',
  models: [
    { id: 'grok-2', name: 'Grok 2', vision: true, tools: true },
    { id: 'grok-2-mini', name: 'Grok 2 Mini', tools: true },
  ]
};

// Uses OpenAI-compatible format
async function createXAICompletion(apiKey: string, params: {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}) {
  const response = await fetch(`${XAI_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(params),
  });
  
  return params.stream ? response.body : response.json();
}
```

</details>

---

## Tier 3: Aggregators & Platforms

### OpenRouter ⭐ RECOMMENDED

| Property | Value |
|----------|-------|
| **Base URL** | `https://openrouter.ai/api/v1` |
| **Auth Header** | `Authorization: Bearer YOUR_API_KEY` |
| **Extra Headers** | `HTTP-Referer`, `X-Title` (optional) |
| **Models** | 200+ models from all major providers |
| **Features** | ✅ All features, ✅ Model fallback, ✅ Usage tracking |

<details>
<summary>📋 TypeScript Implementation</summary>

```typescript
// src/providers/openrouter.ts
const OPENROUTER_CONFIG = {
  baseUrl: 'https://openrouter.ai/api/v1',
};

async function createOpenRouterCompletion(apiKey: string, params: {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  tools?: OpenAITool[];
}) {
  const response = await fetch(`${OPENROUTER_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://sidepilot.app',  // Your app URL
      'X-Title': 'SidePilot',                    // Your app name
    },
    body: JSON.stringify(params),
  });
  
  return params.stream ? response.body : response.json();
}

// Popular OpenRouter model IDs
const OPENROUTER_MODELS = [
  'anthropic/claude-sonnet-4',
  'openai/gpt-4o',
  'google/gemini-2.0-flash',
  'meta-llama/llama-3.3-70b',
  'deepseek/deepseek-chat',
  'mistralai/mistral-large',
];

// Get available models
async function listOpenRouterModels(apiKey: string) {
  const response = await fetch(`${OPENROUTER_CONFIG.baseUrl}/models`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });
  return response.json();
}
```

</details>

---

### Together AI

| Property | Value |
|----------|-------|
| **Base URL** | `https://api.together.xyz/v1` |
| **Auth Header** | `Authorization: Bearer YOUR_API_KEY` |
| **Models** | `meta-llama/Llama-3.3-70B-Instruct-Turbo`, `Qwen/Qwen2.5-72B-Instruct-Turbo` |
| **Features** | ✅ Tools, ✅ Streaming, ✅ JSON Mode |

<details>
<summary>📋 TypeScript Implementation</summary>

```typescript
// src/providers/together.ts
const TOGETHER_CONFIG = {
  baseUrl: 'https://api.together.xyz/v1',
  models: [
    { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B Turbo', tools: true },
    { id: 'Qwen/Qwen2.5-72B-Instruct-Turbo', name: 'Qwen 2.5 72B Turbo', tools: true },
    { id: 'mistralai/Mixtral-8x22B-Instruct-v0.1', name: 'Mixtral 8x22B', tools: true },
    { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3', tools: true },
  ]
};

async function createTogetherCompletion(apiKey: string, params: {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  tools?: OpenAITool[];
  response_format?: { type: 'json_object' | 'json_schema'; json_schema?: object };
}) {
  const response = await fetch(`${TOGETHER_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(params),
  });
  
  return params.stream ? response.body : response.json();
}
```

</details>

---

### Perplexity

| Property | Value |
|----------|-------|
| **Base URL** | `https://api.perplexity.ai` |
| **Auth Header** | `Authorization: Bearer YOUR_API_KEY` |
| **Models** | `sonar-pro`, `sonar`, `sonar-reasoning` |
| **Features** | ✅ Streaming, ✅ Web Search, ✅ Citations |
| **Special** | Returns `citations[]` array with source URLs |

<details>
<summary>📋 TypeScript Implementation</summary>

```typescript
// src/providers/perplexity.ts
const PERPLEXITY_CONFIG = {
  baseUrl: 'https://api.perplexity.ai',
  models: [
    { id: 'sonar-pro', name: 'Sonar Pro', search: true },
    { id: 'sonar', name: 'Sonar', search: true },
    { id: 'sonar-reasoning', name: 'Sonar Reasoning', reasoning: true, search: true },
  ]
};

async function createPerplexityCompletion(apiKey: string, params: {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  search_domain_filter?: string[];  // Perplexity-specific
  return_images?: boolean;           // Perplexity-specific
  return_related_questions?: boolean; // Perplexity-specific
}) {
  const response = await fetch(`${PERPLEXITY_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(params),
  });
  
  return params.stream ? response.body : response.json();
}

// Response includes citations
interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
  }>;
  citations?: string[];  // Array of source URLs
}
```

</details>

---

### Fireworks AI

| Property | Value |
|----------|-------|
| **Base URL** | `https://api.fireworks.ai/inference/v1` |
| **Auth Header** | `Authorization: Bearer YOUR_API_KEY` |
| **Models** | `accounts/fireworks/models/llama-v3p3-70b-instruct` |
| **Features** | ✅ Tools, ✅ Streaming, ⚡ Fast inference |

<details>
<summary>📋 TypeScript Implementation</summary>

```typescript
// src/providers/fireworks.ts
const FIREWORKS_CONFIG = {
  baseUrl: 'https://api.fireworks.ai/inference/v1',
  models: [
    { id: 'accounts/fireworks/models/llama-v3p3-70b-instruct', name: 'Llama 3.3 70B' },
    { id: 'accounts/fireworks/models/mixtral-8x22b-instruct', name: 'Mixtral 8x22B' },
    { id: 'accounts/fireworks/models/qwen2p5-72b-instruct', name: 'Qwen 2.5 72B' },
  ]
};

// Uses OpenAI-compatible format
async function createFireworksCompletion(apiKey: string, params: object) {
  const response = await fetch(`${FIREWORKS_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(params),
  });
  
  return response;
}
```

</details>

---

### Cerebras

| Property | Value |
|----------|-------|
| **Base URL** | `https://api.cerebras.ai/v1` |
| **Auth Header** | `Authorization: Bearer YOUR_API_KEY` |
| **Models** | `llama3.1-70b`, `llama3.1-8b` |
| **Features** | ✅ Streaming, ⚡ **Ultra-fast** (fastest inference) |

<details>
<summary>📋 TypeScript Implementation</summary>

```typescript
// src/providers/cerebras.ts
const CEREBRAS_CONFIG = {
  baseUrl: 'https://api.cerebras.ai/v1',
  models: [
    { id: 'llama3.1-70b', name: 'Llama 3.1 70B', fast: true },
    { id: 'llama3.1-8b', name: 'Llama 3.1 8B', fast: true },
  ]
};

// Uses OpenAI-compatible format - fastest inference available
async function createCerebrasCompletion(apiKey: string, params: object) {
  const response = await fetch(`${CEREBRAS_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(params),
  });
  
  return response;
}
```

</details>

---

### SambaNova

| Property | Value |
|----------|-------|
| **Base URL** | `https://api.sambanova.ai/v1` |
| **Auth Header** | `Authorization: Bearer YOUR_API_KEY` |
| **Models** | `Meta-Llama-3.1-405B-Instruct`, `Meta-Llama-3.1-70B-Instruct` |
| **Features** | ✅ Streaming, ⚡ Fast 405B inference |

<details>
<summary>📋 TypeScript Implementation</summary>

```typescript
// src/providers/sambanova.ts
const SAMBANOVA_CONFIG = {
  baseUrl: 'https://api.sambanova.ai/v1',
  models: [
    { id: 'Meta-Llama-3.1-405B-Instruct', name: 'Llama 3.1 405B' },
    { id: 'Meta-Llama-3.1-70B-Instruct', name: 'Llama 3.1 70B' },
  ]
};

// Uses OpenAI-compatible format
async function createSambaNovaCompletion(apiKey: string, params: object) {
  const response = await fetch(`${SAMBANOVA_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(params),
  });
  
  return response;
}
```

</details>

---

### DeepInfra

| Property | Value |
|----------|-------|
| **Base URL** | `https://api.deepinfra.com/v1/openai` |
| **Auth Header** | `Authorization: Bearer YOUR_API_KEY` |
| **Models** | `meta-llama/Llama-3.3-70B-Instruct`, `Qwen/Qwen2.5-72B-Instruct` |
| **Features** | ✅ Tools, ✅ Streaming, 💰 Cost-effective |

<details>
<summary>📋 TypeScript Implementation</summary>

```typescript
// src/providers/deepinfra.ts
const DEEPINFRA_CONFIG = {
  baseUrl: 'https://api.deepinfra.com/v1/openai',
  models: [
    { id: 'meta-llama/Llama-3.3-70B-Instruct', name: 'Llama 3.3 70B' },
    { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen 2.5 72B' },
    { id: 'microsoft/WizardLM-2-8x22B', name: 'WizardLM 2 8x22B' },
  ]
};

// Uses OpenAI-compatible format
async function createDeepInfraCompletion(apiKey: string, params: object) {
  const response = await fetch(`${DEEPINFRA_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(params),
  });
  
  return response;
}
```

</details>

---

### Cohere

| Property | Value |
|----------|-------|
| **Base URL** | `https://api.cohere.ai/v1` |
| **Auth Header** | `Authorization: Bearer YOUR_API_KEY` |
| **Models** | `command-r-plus`, `command-r`, `command` |
| **Features** | ✅ Tools, ✅ Streaming, ✅ RAG, ✅ Embeddings |

<details>
<summary>📋 TypeScript Implementation</summary>

```typescript
// src/providers/cohere.ts
const COHERE_CONFIG = {
  baseUrl: 'https://api.cohere.ai/v1',
  models: [
    { id: 'command-r-plus', name: 'Command R+', tools: true, rag: true },
    { id: 'command-r', name: 'Command R', tools: true, rag: true },
    { id: 'command', name: 'Command', tools: true },
  ]
};

// Native Cohere API format
async function createCohereChat(apiKey: string, params: {
  model: string;
  message: string;
  chat_history?: Array<{ role: string; message: string }>;
  temperature?: number;
  max_tokens?: number;
  tools?: CohereTool[];
  connectors?: Array<{ id: string }>;  // For RAG
}) {
  const response = await fetch(`${COHERE_CONFIG.baseUrl}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(params),
  });
  
  return response.json();
}

// OpenAI-compatible endpoint also available
async function createCohereOpenAICompletion(apiKey: string, params: object) {
  const response = await fetch(`${COHERE_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(params),
  });
  
  return response;
}
```

</details>

---

## Tier 4: Cloud Platforms

### Hugging Face Inference API

| Property | Value |
|----------|-------|
| **Base URL** | `https://api-inference.huggingface.co/models` |
| **OpenAI-Compatible** | `https://api-inference.huggingface.co/models/{model}/v1` |
| **Auth Header** | `Authorization: Bearer YOUR_API_KEY` |
| **Models** | 1000+ open-source models |
| **Features** | ✅ Streaming, ✅ Open source access |

<details>
<summary>📋 TypeScript Implementation</summary>

```typescript
// src/providers/huggingface.ts
async function createHuggingFaceCompletion(apiKey: string, model: string, params: {
  messages: Array<{ role: string; content: string }>;
  max_tokens?: number;
  stream?: boolean;
}) {
  // OpenAI-compatible endpoint
  const response = await fetch(`https://api-inference.huggingface.co/models/${model}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(params),
  });
  
  return response;
}
```

</details>

---

## Tier 5: Chinese Providers (⚠️ Special Configuration Required)

> **Important**: These providers have unique API formats that differ from OpenAI-compatible APIs. Pay attention to the differences!

### ZAI (智谱 Zhipu AI) 🇨🇳

| Property | Value |
|----------|-------|
| **Base URL** | `https://open.bigmodel.cn/api/paas/v4` |
| **Auth Header** | `Authorization: Bearer YOUR_API_KEY` |
| **Models** | `glm-4-plus`, `glm-4-flash`, `glm-4v-plus` |
| **Features** | ✅ Vision, ✅ Tools, ✅ Streaming |

**⚠️ Key Differences from OpenAI:**
- Different endpoint path: `/api/paas/v4/chat/completions`
- Model names use `glm-*` prefix
- Vision model is separate: `glm-4v-plus`

<details>
<summary>📋 TypeScript Implementation</summary>

```typescript
// src/providers/zai.ts
const ZAI_CONFIG = {
  baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
  models: [
    { id: 'glm-4-plus', name: 'GLM-4 Plus', tools: true },
    { id: 'glm-4-flash', name: 'GLM-4 Flash', tools: true },
    { id: 'glm-4v-plus', name: 'GLM-4V Plus', vision: true, tools: true },
    { id: 'glm-4-long', name: 'GLM-4 Long', tools: true },  // 1M context
  ]
};

async function createZAICompletion(apiKey: string, params: {
  model: string;
  messages: Array<{ role: string; content: string | ContentPart[] }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  tools?: OpenAITool[];
}) {
  const response = await fetch(`${ZAI_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(params),
  });
  
  return params.stream ? response.body : response.json();
}

// Vision format (same as OpenAI)
const visionMessage = {
  role: 'user',
  content: [
    { type: 'text', text: 'What is in this image?' },
    { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,...' } }
  ]
};
```

</details>

---

### MiniMax 🇨🇳

| Property | Value |
|----------|-------|
| **Base URL** | `https://api.minimax.chat/v1` |
| **Auth Header** | `Authorization: Bearer YOUR_API_KEY` |
| **Extra Header** | `X-Group-Id: YOUR_GROUP_ID` ⚠️ Required! |
| **Models** | `abab6-chat`, `abab5.5-chat`, `abab5-chat` |
| **Features** | ✅ Tools, ✅ Streaming |

**⚠️ Key Differences from OpenAI:**
- **Requires Group ID** in header: `X-Group-Id`
- Different model naming: `abab*-chat`
- Endpoint path: `/v1/text/chatcompletion_v2`
- Different request body structure

<details>
<summary>📋 TypeScript Implementation</summary>

```typescript
// src/providers/minimax.ts
const MINIMAX_CONFIG = {
  baseUrl: 'https://api.minimax.chat/v1',
  models: [
    { id: 'abab6-chat', name: 'ABAB 6 Chat', tools: true },
    { id: 'abab5.5-chat', name: 'ABAB 5.5 Chat', tools: true },
    { id: 'abab5-chat', name: 'ABAB 5 Chat', tools: true },
  ]
};

// ⚠️ MiniMax has TWO auth params: API Key AND Group ID
interface MiniMaxAuth {
  apiKey: string;
  groupId: string;  // Required! Get from MiniMax console
}

async function createMiniMaxCompletion(auth: MiniMaxAuth, params: {
  model: string;
  messages: Array<{
    sender_type: 'USER' | 'BOT';  // Different from OpenAI's 'role'
    sender_name?: string;
    text: string;
  }>;
  temperature?: number;
  tokens_to_generate?: number;  // Different from 'max_tokens'
  stream?: boolean;
}) {
  // Legacy endpoint (v1)
  const response = await fetch(`${MINIMAX_CONFIG.baseUrl}/text/chatcompletion_v2`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.apiKey}`,
      'X-Group-Id': auth.groupId,  // ⚠️ REQUIRED
    },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      temperature: params.temperature,
      tokens_to_generate: params.tokens_to_generate || 4096,
      stream: params.stream,
    }),
  });
  
  return params.stream ? response.body : response.json();
}

// OpenAI-compatible endpoint (v1beta) - Simpler!
async function createMiniMaxOpenAICompletion(auth: MiniMaxAuth, params: object) {
  const response = await fetch(`https://api.minimax.chat/v1beta/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.apiKey}`,
      'X-Group-Id': auth.groupId,
    },
    body: JSON.stringify(params),
  });
  
  return response;
}
```

</details>

**🔧 Settings UI Fields:**
- API Key (text input)
- Group ID (text input, required)

---

### Moonshot (月之暗面) 🇨🇳

| Property | Value |
|----------|-------|
| **Base URL** | `https://api.moonshot.cn/v1` |
| **Auth Header** | `Authorization: Bearer YOUR_API_KEY` |
| **Models** | `moonshot-v1-8k`, `moonshot-v1-32k`, `moonshot-v1-128k` |
| **Features** | ✅ Streaming, ✅ Long context |

**⚠️ Key Differences:**
- Context length is in model name (8k, 32k, 128k)
- Chinese language optimized

<details>
<summary>📋 TypeScript Implementation</summary>

```typescript
// src/providers/moonshot.ts
const MOONSHOT_CONFIG = {
  baseUrl: 'https://api.moonshot.cn/v1',
  models: [
    { id: 'moonshot-v1-8k', name: 'Moonshot v1 8K', contextLength: 8192 },
    { id: 'moonshot-v1-32k', name: 'Moonshot v1 32K', contextLength: 32768 },
    { id: 'moonshot-v1-128k', name: 'Moonshot v1 128K', contextLength: 131072 },
  ]
};

// Uses OpenAI-compatible format
async function createMoonshotCompletion(apiKey: string, params: {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}) {
  const response = await fetch(`${MOONSHOT_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(params),
  });
  
  return params.stream ? response.body : response.json();
}
```

</details>

---

### Baichuan (百川) 🇨🇳

| Property | Value |
|----------|-------|
| **Base URL** | `https://api.baichuan-ai.com/v1` |
| **Auth Header** | `Authorization: Bearer YOUR_API_KEY` |
| **Models** | `Baichuan4`, `Baichuan3-Turbo`, `Baichuan2-Turbo` |
| **Features** | ✅ Streaming, ✅ Tools |

<details>
<summary>📋 TypeScript Implementation</summary>

```typescript
// src/providers/baichuan.ts
const BAICHUAN_CONFIG = {
  baseUrl: 'https://api.baichuan-ai.com/v1',
  models: [
    { id: 'Baichuan4', name: 'Baichuan 4', tools: true },
    { id: 'Baichuan3-Turbo', name: 'Baichuan 3 Turbo', tools: true },
    { id: 'Baichuan2-Turbo', name: 'Baichuan 2 Turbo' },
  ]
};

// Uses OpenAI-compatible format
async function createBaichuanCompletion(apiKey: string, params: object) {
  const response = await fetch(`${BAICHUAN_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(params),
  });
  
  return response;
}
```

</details>

---

### Qwen (通义千问) via DashScope 🇨🇳

| Property | Value |
|----------|-------|
| **Base URL** | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| **Auth Header** | `Authorization: Bearer YOUR_API_KEY` |
| **Models** | `qwen-max`, `qwen-plus`, `qwen-turbo`, `qwen-vl-max` |
| **Features** | ✅ Vision, ✅ Tools, ✅ Streaming |

**⚠️ Key Differences:**
- Uses Alibaba DashScope platform
- Vision model is `qwen-vl-*`
- Also available via Together AI and OpenRouter for easier access

<details>
<summary>📋 TypeScript Implementation</summary>

```typescript
// src/providers/qwen.ts
const QWEN_CONFIG = {
  baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  models: [
    { id: 'qwen-max', name: 'Qwen Max', tools: true },
    { id: 'qwen-plus', name: 'Qwen Plus', tools: true },
    { id: 'qwen-turbo', name: 'Qwen Turbo', tools: true },
    { id: 'qwen-vl-max', name: 'Qwen VL Max', vision: true },
  ]
};

// Uses OpenAI-compatible format
async function createQwenCompletion(apiKey: string, params: object) {
  const response = await fetch(`${QWEN_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(params),
  });
  
  return response;
}
```

</details>

---

## Special Configurations Summary

| Provider | Extra Headers | Different Endpoint | Different Body |
|----------|---------------|-------------------|----------------|
| **MiniMax** | `X-Group-Id` required | `/text/chatcompletion_v2` | `sender_type`, `tokens_to_generate` |
| **ZAI** | - | `/api/paas/v4/chat/completions` | Standard OpenAI |
| **Moonshot** | - | Standard | Standard OpenAI |
| **Baichuan** | - | Standard | Standard OpenAI |
| **Qwen** | - | Uses DashScope | Standard OpenAI |

---

## Tier 6: Generic OpenAI-Compatible

For any provider that offers an OpenAI-compatible API:

```typescript
// src/providers/openai-compatible.ts
interface OpenAICompatibleConfig {
  baseUrl: string;
  apiKey: string;
  defaultModel?: string;
  extraHeaders?: Record<string, string>;  // For providers like MiniMax
}

async function createOpenAICompatibleCompletion(config: OpenAICompatibleConfig, params: {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  tools?: OpenAITool[];
}) {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      ...config.extraHeaders,  // Include any provider-specific headers
    },
    body: JSON.stringify(params),
  });
  
  return params.stream ? response.body : response.json();
}
```

---

## Status Legend

| Status | Description |
|--------|-------------|
| ✅ **Working** | Fully implemented and tested |
| 🔧 **Needs Config** | Requires specific configuration |
| ⚠️ **Partial** | Some features not available |
| ❌ **Not Working** | Known issues |

---

## Feature Support Matrix

| Provider | Streaming | Tools | Vision | JSON Mode | Reasoning |
|----------|-----------|-------|--------|-----------|-----------|
| Anthropic | ✅ | ✅ | ✅ | ✅ | ✅ |
| OpenAI | ✅ | ✅ | ✅ | ✅ | ✅ |
| Google | ✅ | ✅ | ✅ | ✅ | - |
| DeepSeek | ✅ | ✅ | - | ✅ | ✅ |
| Groq | ✅ | ✅ | - | - | - |
| Mistral | ✅ | ✅ | - | ✅ | - |
| OpenRouter | ✅ | ✅ | ✅ | ✅ | ✅ |
| Together | ✅ | ✅ | - | ✅ | - |
| Perplexity | ✅ | - | - | - | ✅ |
| Ollama | ✅ | ⚠️ | ⚠️ | - | - |
| LM Studio | ✅ | ⚠️ | ⚠️ | - | - |

---

## Getting API Keys

| Provider | Get Key URL |
|----------|-------------|
| Anthropic | https://console.anthropic.com/settings/keys |
| OpenAI | https://platform.openai.com/api-keys |
| Google | https://aistudio.google.com/apikey |
| DeepSeek | https://platform.deepseek.com/api_keys |
| Groq | https://console.groq.com/keys |
| Mistral | https://console.mistral.ai/api-keys |
| OpenRouter | https://openrouter.ai/keys |
| Together | https://api.together.xyz/settings/api-keys |
| Perplexity | https://www.perplexity.ai/settings/api |
| Fireworks | https://fireworks.ai/account/api-keys |
| Cohere | https://dashboard.cohere.com/api-keys |

---

## Acknowledgments

Special thanks to:
- [browser-use](https://github.com/browser-use/browser-use) - Browser automation patterns
- [Cline](https://github.com/cline/cline) - Multi-provider factory pattern inspiration
- All the amazing LLM providers making AI accessible!