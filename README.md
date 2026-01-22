# SidePilot

<p align="center">
  <img src="assets/Sidepilot.png" alt="SidePilot Logo" width="200">
</p>

<p align="center">
  <strong>🚀 Your AI Co-Pilot in the Browser</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
  <img src="https://img.shields.io/badge/platform-Chrome-green.svg" alt="Platform">
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue.svg" alt="TypeScript">
</p>

---

**SidePilot** is a Chrome extension that brings AI-powered browser automation to any LLM provider you choose.

## ✨ Features

### 🔌 Multi-Provider Support
Use **40+ LLM providers** with a single extension:
- Anthropic, OpenAI, Google
- DeepSeek, Groq, Mistral
- Z.AI, Moonshot, Together
- **Local**: Ollama, LM Studio

### 🖱️ Full Browser Automation
- Click, type, scroll, navigate
- Take screenshots
- Execute JavaScript
- Tab and window management

### 🎤 Voice Mode (NEW)
- **Speech-to-Text**: Browser, OpenAI Whisper
- **Text-to-Speech**: Browser, OpenAI, ElevenLabs
- **Call Mode**: Hands-free conversation with VAD
- Real-time audio visualization
- Per-message playback with speed control

### ⚡ Model Capability Warnings
Visual indicators show what each model supports:
- 👁️ Vision (image processing)
- 🔧 Tools (function calling)
- ⚡ Streaming (real-time responses)
- 🧠 Reasoning (thinking mode)

### 🌍 Internationalization
- English and Portuguese (BR) support
- Auto-detect browser language
- Light/Dark/System themes

### 🔗 MCP Connector
Expose browser tools to external LLMs like Cline or Aider.

### 🧠 Context Optimization (S18)
- Ref-based element targeting (60-90% token savings)
- Smart snapshot filtering
- Incremental DOM updates
- Token budget management

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| Vite 5 | Build system |
| React 18 | UI framework |
| TypeScript 5 | Type safety |
| shadcn/ui | Design system |
| Tailwind CSS | Styling |
| Zustand | State management |
| Manifest V3 | Extension API |

---

## 📦 Installation

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- Chrome/Chromium browser

### Setup

```bash
# Clone the repository
git clone https://github.com/viniciusfoscaches/sidepilot.git
cd sidepilot

# Install dependencies
pnpm install

# Build for development
pnpm dev

# Build for production
pnpm build
```

### Load in Chrome
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/` folder

---

## 🚀 Usage

1. Click the SidePilot icon to open the side panel
2. Configure your LLM provider in Settings
3. Enter your API key
4. Start chatting with your AI assistant!

### Example Prompts
```
"Navigate to github.com and search for 'react'"
"Take a screenshot of this page"
"Fill out this form with test data"
"Click the submit button"
```

---

## 📁 Project Structure

```
sidepilot/
├── src/
│   ├── sidepanel/      # Side panel React app
│   ├── background/     # Service worker
│   ├── content/        # Content scripts
│   ├── providers/      # LLM providers (40+)
│   ├── tools/          # Browser tools (13+)
│   ├── lib/            # Utilities
│   └── components/     # Shared components
├── assets/             # Logo and icons
└── .kiro/
    ├── steering/       # Project context
    ├── specs/          # Feature specifications
    └── prompts/        # Kiro prompts
```

---

## 📋 Specs & Development

This project uses [Kiro](https://kiro.dev) for specification-driven development.

### Implemented Specs
- [x] S01: Extension Scaffold ✅
- [x] S02: Provider Factory ✅
- [x] S03: Provider Settings UI ✅
- [x] S04: Chat Interface ✅
- [ ] S05: CDP Wrapper (Browser-Use Enhanced)
- [ ] S06: Permission System
- [ ] S07: Browser Tools
- [ ] S08: Shortcuts System
- [ ] S09: Workflow Recording
- [ ] S10: Tab Groups
- [ ] S11: Network/Console
- [ ] S12: Notifications
- [ ] S13: MCP Integration
- [ ] S14: MCP Connector
- [ ] S15: Model Capabilities
- [x] S16: General Settings & i18n ✅
- [x] S17: Voice Mode ✅
- [x] S18: Context Optimization ✅

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

SidePilot stands on the shoulders of giants. We're grateful to these amazing open-source projects:

### Core Inspirations

- **[browser-use](https://github.com/browser-use/browser-use)** ⭐ - The Python library that makes websites accessible to AI agents. Our accessibility tree parsing, smart element targeting, and human-like interactions are built using their patterns.

- **[Vercel agent-browser](https://github.com/vercel-labs/agent-browser)** 🚀 - Headless browser CLI for AI agents. Inspired our S18 context optimization with ref-based element targeting and snapshot filtering for minimal token usage.

- **[Cline](https://github.com/cline/cline)** 🤖 - The autonomous coding agent. Our multi-provider factory pattern and model capability detection are inspired by Cline's excellent architecture.

### Development Tools

Built with [Kiro](https://kiro.dev) for the Dynamous Hackathon - specification-driven development that helped us ship fast.

### Open Source Tools We Love ❤️

| Project | Usage in SidePilot |
|---------|-------------------|
| [browser-use](https://github.com/browser-use/browser-use) | Accessibility tree, element targeting, human-like delays |
| [agent-browser](https://github.com/vercel-labs/agent-browser) | Ref system, snapshot filtering, AI-optimized workflow |
| [Cline](https://github.com/cline/cline) | Multi-provider factory, capability detection |
| [shadcn/ui](https://ui.shadcn.com/) | Beautiful Nova-style components |
| [Radix UI](https://www.radix-ui.com/) | Accessible primitives |
| [HugeIcons](https://hugeicons.com/) | 4,600+ stroke icons |
| [Zustand](https://github.com/pmndrs/zustand) | Lightweight state management |
| [i18next](https://www.i18next.com/) | Internationalization (EN/PT) |

### Special Thanks

- The [MCP Protocol](https://modelcontextprotocol.io/) team for enabling seamless LLM tool integration
- The Anthropic, OpenAI, and Google teams for their amazing AI APIs
- The open-source community for making projects like this possible

---

<p align="center">
  <strong>Made with ❤️ by the SidePilot team</strong>
</p>
