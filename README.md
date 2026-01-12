# SidePilot

> 🚀 Your AI Co-Pilot in the Browser

**SidePilot** is a Chrome extension that brings AI-powered browser automation to any LLM provider you choose.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Chrome-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)

---

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

### ⚡ Model Capability Warnings
Visual indicators show what each model supports:
- 👁️ Vision (image processing)
- 🔧 Tools (function calling)
- ⚡ Streaming (real-time responses)
- 🧠 Reasoning (thinking mode)

### 🔗 MCP Connector
Expose browser tools to external LLMs like Cline or Aider.

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
git clone https://github.com/your-username/sidepilot.git
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
└── .kiro/
    ├── steering/       # Project context
    ├── specs/          # Feature specifications
    └── prompts/        # Kiro prompts
```

---

## 📋 Specs & Development

This project uses [Kiro](https://kiro.dev) for specification-driven development.

### Implemented Specs
- [ ] S01: Extension Scaffold
- [ ] S02: Provider Factory
- [ ] S03: Provider Settings UI
- [ ] S04: Chat Interface
- [ ] S05: CDP Wrapper
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

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- Multi-provider architecture inspired by [Cline](https://github.com/cline/cline)
- Built with [Kiro](https://kiro.dev) for the Dynamous Hackathon
