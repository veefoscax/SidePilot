# SidePilot - Hackathon Demo Script

## 🎬 Video Presentation Script (3-5 minutes)

---

### Intro (30 seconds)

**[Screen: SidePilot Logo/Title]**

> "Hi! I'm presenting SidePilot - your AI Co-Pilot in the browser.
> 
> SidePilot is a Chrome extension that brings AI-powered browser automation to ANY LLM provider - not just Claude. Whether you use OpenAI, Anthropic, Gemini, or a local LLM like Ollama, SidePilot works with them all."

---

### Demo 1: Quick Setup (45 seconds)

**[Screen: Open Chrome with SidePilot installed]**

1. Click SidePilot icon → Side panel opens
2. Go to Settings (⚙️)
3. Enter API key (OpenAI or Anthropic)
4. Select a model

> "Setup is simple - add your API key, choose a model, and you're ready to go. We support 7 different providers with 40+ models."

---

### Demo 2: Chat + Browser Tools (90 seconds)

**[Screen: Chat interface]**

1. Type: "Take a screenshot of this page"
   - AI uses screenshot tool
   - Shows annotated screenshot with element refs

2. Type: "Click on the search box"
   - AI uses click tool with position

3. Type: "Navigate to github.com"
   - AI uses navigate tool

> "What makes SidePilot special is the native browser tool integration. The AI can take screenshots, click elements, type text, navigate - all using Chrome's DevTools Protocol."

**Show Element Pointer (🎯 button)**:
- Click 🎯 button
- Hover over element (shows highlight)
- Click to select
- Add comment
- Send to chat

> "Users can also visually point at elements. Just click the target button, select an element, and the AI receives an exact reference to interact with it."

---

### Demo 3: Features Showcase (60 seconds)

**Settings Features**:
- Theme toggle (light/dark/system)
- Language switch (EN ↔ PT)
- Voice Mode icon (optional)

**Model Capabilities**:
- Show model badges (Vision 👁️, Tools 🔧, Streaming ⚡)

> "SidePilot is built for developers. Every model shows its capabilities, settings persist across sessions, and the UI supports multiple languages and themes."

---

### Tech Highlights (30 seconds)

**[Screen: Show code or architecture diagram]**

> "Built with:
> - React 18 + TypeScript
> - Zustand for state management
> - Chrome Manifest V3
> - Kiro for spec-driven development
> 
> All 19 specs designed and implemented with Kiro's AI-assisted workflow."

---

### Closing (30 seconds)

**[Screen: Repository / Hackathon info]**

> "SidePilot brings AI browser automation to everyone. No vendor lock-in, works with your preferred LLM, and it's open source.
> 
> Try it out and let your AI co-pilot take the wheel!"

---

## 📹 Recording Tips

1. **Resolution**: 1920x1080 or 1280x720
2. **Side panel**: Open on the right side
3. **Browser zoom**: 100%
4. **Clear chat history** before recording
5. **Pre-configure** API key
6. **Test each step** before recording

## 🔧 Pre-Recording Checklist

- [ ] Build extension: `npm run build`
- [ ] Load in Chrome: chrome://extensions → Load unpacked → dist/
- [ ] API key configured (OpenAI or Anthropic)
- [ ] Clear any old chat messages
- [ ] Set theme to match preference
- [ ] Close other tabs/distractions
