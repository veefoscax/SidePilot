<p align="center">
  <img src="assets/Sidepilot.png" alt="SidePilot Logo" width="200"/>
</p>

<h1 align="center">SidePilot</h1>

<p align="center">
  <strong>🚀 Your AI Co-Pilot in the Browser</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"/>
  <img src="https://img.shields.io/badge/platform-Chrome-green.svg" alt="Platform"/>
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue.svg" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/React-18-61dafb.svg" alt="React"/>
  <img src="https://img.shields.io/badge/Manifest-V3-orange.svg" alt="Manifest V3"/>
  <img src="https://img.shields.io/badge/Dynamous-Hackathon_2026-purple.svg" alt="Hackathon"/>
</p>

<p align="center">
  <em>A Chrome extension that brings AI-powered browser automation to any LLM provider—not just Claude.</em>
</p>

---

## ✨ Features

### 🔌 Multi-Provider Support
Use **7+ LLM providers** with a single extension:
- **Anthropic** (Claude 3.5 Sonnet, Claude 3 Opus/Haiku)
- **OpenAI** (GPT-4o, GPT-4o-mini, o1-preview)
- **Google** (Gemini Pro, Gemini Flash)
- **Ollama** (Local LLMs - Llama, Mistral, etc.)
- **LM Studio** (Local models)
- **xAI** (Grok-2)
- More via OpenAI-compatible API

### 🖱️ Browser Automation Tools
- **Screenshot** - Capture pages with element annotations
- **Click** - Click elements by position or ref
- **Type** - Type text with human-like delays
- **Navigate** - Go to URLs or search
- **Scroll** - Scroll pages
- **Extract** - Get page content

### 🎯 Element Pointer
Point at elements visually — AI receives exact refs:
1. Click 🎯 button
2. Hover to highlight elements
3. Click to select
4. Add optional comment
5. AI gets: ref (@e5), position, text

### ⚡ Model Capability Warnings
Visual indicators show what each model supports:
- 👁️ Vision (image processing)
- 🔧 Tools (function calling)
- ⚡ Streaming (real-time responses)
- 🧠 Reasoning (thinking mode)

### 🌍 Internationalization
- English and Portuguese (PT-BR)
- Easy to add more languages

### 🎨 Themes
- Light, Dark, and System modes

### 🔗 MCP Integration
- Connect to Model Context Protocol servers
- Extend capabilities with external tools

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
| Playwright | E2E Testing |

---

## 📦 Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm
- Chrome browser

### Setup

```bash
# Clone the repository
git clone https://github.com/veefoscax/SidePilot.git
cd SidePilot

# Install dependencies
npm install

# Build for production
npm run build
```

### Load in Chrome
1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `dist/` folder

### First Use
1. Click SidePilot icon → Side panel opens
2. Go to Settings (⚙️)
3. Enter OpenAI or Anthropic API key
4. Select a model
5. Start chatting!

---

## 🚀 Usage Examples

```
"Take a screenshot of this page"
"Navigate to github.com and search for 'react'"
"Click the submit button"
"Fill out this form with test data"
"Scroll down to see more content"
```

---

## 📁 Project Structure

```
SidePilot/
├── src/
│   ├── sidepanel/      # Side panel React app
│   ├── background/     # Service worker
│   ├── content/        # Content scripts
│   ├── providers/      # LLM providers (7+)
│   ├── tools/          # Browser tools (6+)
│   ├── lib/            # Utilities
│   └── components/     # Shared components
├── .kiro/
│   ├── steering/       # Project context
│   └── specs/          # Feature specifications (19 specs)
├── tests/              # E2E and unit tests
└── dist/               # Built extension
```

---

## 📋 Kiro Specs — Full Spec-Driven Development

Built with [Kiro](https://kiro.dev) spec-driven development — **19/19 specs complete**:

| Spec | Feature | Status |
|------|---------|--------|
| S01 | Extension Scaffold | ✅ |
| S02 | Provider Factory | ✅ |
| S03 | Provider Settings UI | ✅ |
| S04 | Chat Interface | ✅ |
| S05 | CDP Wrapper | ✅ |
| S06 | Permission System | ✅ |
| S07 | Browser Tools | ✅ |
| S08 | Shortcuts | ✅ |
| S09 | Workflow Recording | ✅ |
| S10 | Tab Groups | ✅ |
| S11 | Network/Console | ✅ |
| S12 | Notifications | ✅ |
| S13 | MCP Integration | ✅ |
| S14 | MCP Connector | ✅ |
| S15 | Model Capabilities | ✅ |
| S16 | General Settings & i18n | ✅ |
| S17 | Voice Mode | ✅ |
| S18 | Context Optimization | ✅ |
| S19 | Element Pointer | ✅ |

---

## 📅 Development Timeline

| Date | Milestone |
|------|-----------|
| **Jan 12, 2026** | 🎬 Project kickoff — initial scaffold with 15 Kiro specs |
| **Jan 13, 2026** | 🔌 Multi-provider support (OpenAI, Anthropic, Gemini, Ollama, xAI) |
| **Jan 13, 2026** | 💬 Chat interface with ULTRATHINK redesign |
| **Jan 14, 2026** | 🛡️ Permission system & CDP wrapper |
| **Jan 14, 2026** | 🖱️ Browser tools (screenshot, click, type, navigate, scroll) |
| **Jan 16, 2026** | 🌍 i18n (EN/PT-BR) & General Settings |
| **Jan 17, 2026** | 🎤 Voice mode integration |
| **Jan 18, 2026** | ⚡ Context optimization (60-90% token reduction) |
| **Jan 22, 2026** | 🧪 E2E testing infrastructure with Playwright |
| **Jan 22, 2026** | 🎯 Element Pointer — visual AI element selection |
| **Jan 23, 2026** | ✅ S19 verified — all 19 specs complete |
| **Jan 24, 2026** | 🏆 S05-S15 Excellence Review — all issues fixed |
| **Mar 11, 2026** | 📦 Published to GitHub as open source |

---

## 🤝 Related Projects

- **[Skill-E](https://github.com/veefoscax/Skill-E)** — Local-first AI Skill Definition generator (Tauri + React)
- **[OpenClaw](https://github.com/openclaw)** — Open-source gateway infrastructure

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- **[browser-use](https://github.com/browser-use/browser-use)** — Browser automation patterns
- **[Cline](https://github.com/cline/cline)** — Multi-provider architecture
- **[Kiro](https://kiro.dev)** — Spec-driven development
- Built for the **Dynamous Kiro Hackathon 2026**
