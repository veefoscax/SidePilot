# 🏗️ SidePilot Architecture

SidePilot is a high-performance browser extension designed to bridge the gap between Large Language Models (LLMs) and browser automation. It follows a multi-layered, modular architecture to ensure provider agnosticism and robust execution.

---

## 🏗️ System Overview

The extension operates across three primary environments:

### 1. SidePanel (The Orchestrator)
- **UI Engine**: React + Tailwind CSS + ShadcnUI.
- **State Management**: Zustand for reactive, persistent state across reloads.
- **Provider Factory**: A decoupled registry of LLM providers (Anthropic, OpenAI, Google, Local).
- **Tool Executor**: Manages tool invocation and results formatting for the LLM.

### 2. Service Worker (The Background Manager)
- **Messaging Hub**: Orchestrates communication between the UI and Content Scripts.
- **Permission Manager**: Handles dynamic permissions for tab and storage access.
- **Global Commands**: Listens for system-wide hotkeys to activate tools like the Element Pointer.

### 3. Content Scripts (The DOM Interface)
- **Element Pointer**: A precise selector engine that maps visual elements to S18 references.
- **Accessibility Tree Parser**: Generates a semantic representation of the page for LLM reasoning.
- **Automation Runner**: Executes scripts and interactions (clicks, typing) within the page context.

---

## 🔄 Provider Abstraction Layer

We utilize a **Factory Design Pattern** to support any LLM provider. This allows SidePilot to support 40+ models with minimal code duplication.

```typescript
// factory.ts logic
const PROVIDER_CLASSES = {
  anthropic: AnthropicProvider,
  openai: OpenAIProvider,
  google: GoogleProvider,
  "openai-compat": OpenAIProvider, // Generic support for many local/cloud providers
};
```

---

## 🛠️ Security & Privacy

- **Local-First Processing**: API keys are stored only in `chrome.storage.local` (never synced).
- **No Data Harvesting**: Communication happens directly between the browser and the provider endpoint.
- **Debug Mode**: Includes a comprehensive console and network inspector for developers to verify agent actions.

---

## 📅 Roadmap Architecture

- **S18 Reference Persistence**: Developing a hash-based mechanism to track elements across session reloads.
- **Local Tool Execution**: Enabling function calling for Ollama/LM Studio using internal proxy wrappers.

---
*Maintained by veefoscax - SidePilot Core Maintainer*
