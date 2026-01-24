# SidePilot

> 🚀 Your AI Co-Pilot in the Browser

**SidePilot** is a Chrome extension that brings AI-powered browser automation to any LLM provider—not just Claude.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Chrome-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)

---

## ✨ Features

### 🔌 Multi-Provider Support
Use **7+ LLM providers** with a single extension:
- **Anthropic** (Claude 3.5 Sonnet, Claude 3 Opus/Haiku)
- **OpenAI** (GPT-4o, GPT-4o-mini, o1-preview)
- **Google** (Gemini Pro, Gemini Flash)
- **Ollama** (Local LLMs - Llama, Mistral, etc.)
- **LM Studio** (Local models)
- **zAI** (Grok-2)
- More via OpenAI-compatible API

### 🖱️ Browser Automation Tools
- **Screenshot** - Capture pages with element annotations
- **Click** - Click elements by position or ref
- **Type** - Type text with human-like delays
- **Navigate** - Go to URLs or search
- **Scroll** - Scroll pages
- **Extract** - Get page content

### 🎯 Element Pointer
Point at elements visually - AI receives exact refs:
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

## 📦 Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm
- Chrome browser

### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/sidepilot.git
cd sidepilot/SidePilot

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
└── dist/               # Built extension
```

---

## 📋 Kiro Specs

Built with [Kiro](https://kiro.dev) spec-driven development:

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

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- **[browser-use](https://github.com/browser-use/browser-use)** - Browser automation patterns
- **[Cline](https://github.com/cline/cline)** - Multi-provider architecture
- **[Kiro](https://kiro.dev)** - Spec-driven development
- Built for the **Dynamous Hackathon**
