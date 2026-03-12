# 📋 Unified Project Backlog: SidePilot & Skill-E

This document serves as the central organization for improvements, refactorings, and new features for the SidePilot and Skill-E projects.

---

## 🚀 SidePilot (Browser AI Co-Pilot)

| ID | Category | Task | Priority | Status |
|----|----------|------|----------|--------|
| S20 | Feature | **Multi-Element Selection** - Allow selecting multiple elements in pointer mode. | High | ✅ Done |
| S21 | UI/UX | **Advanced Tab Group Management** - Better visual interface for tab organization tools. | Medium | ✅ Done |
| S22 | Feature | **Global Keyboard Shortcuts** - Implement `Ctrl+Shift+P` and other hotkeys. | Medium | ✅ Done |
| S23 | UI/UX | **Visual Feedback Improvements** - Add animations and clearer selection indicators. | Low | ✅ Done |
| S24 | Tooling | **Enhanced Network Analysis** - Improve how the agent receives and parses network/console errors. | High | ✅ Done |
| S25 | Core | **Persistent Element Refs** - Keep refs valid across page navigation via DOM fingerprinting. | Medium | ✅ Done |
| S26 | Provider | **Local Provider Tools** - Enable tool/function calling support for Ollama and LM Studio. | High | ✅ Done |
| S27 | Feature | **Element Highlighting Persistence** - Restore visual highlights after hydration. | Low | ✅ Done |
| S28 | Core | **Smart Retry Mechanism** - Agent automatically retries with console context on failure. | High | ✅ Done |

---

## 🧠 Skill-E (Desktop Skill Definition Engine)

| ID | Category | Task | Priority | Status |
|----|----------|------|----------|--------|
| E01 | Refactor | **Decouple App.tsx** - Split the 16KB God Component into hooks/smaller components. | High | ✅ Done |
| E02 | Architecture | **Python Sidecar** - Move heavy AI (Whisper/GPU) to a standalone Python process. | High | ✅ Done |
| E03 | Feature | **Agent Playback Mode** - Implement "Play" button to verify skill execution. | Medium | ✅ Done |
| E04 | UI/UX | **Desktop Overlay Enhancements** - Pulsing recording frame and feedback. | Medium | ✅ Done |
| E05 | Core | **Cross-Platform Input Hooks** - Implement Mac and Linux support for input recording. | High | ✅ Done |
| E06 | Core | **Whisper Model Management** - Better auto-download UI and local path management. | Medium | ✅ Done |
| E07 | Refactor | **Typed Event Bus** - Implement a strictly typed event system between windows. | Low | ⏳ Todo |
| E08 | Refactor | **Code Quality & Linting** - Enforce strict ESLint, Prettier, and Husky. | Medium | ✅ Done |
| E09 | Test | **Frontend Unit Testing** - Setup Vitest and RTL with component coverage. | Medium | ✅ Done |
| E10 | Perf | **Memory Optimizations** - Frame buffer limits for long recordings. | High | ✅ Done |

---

## 🛠️ Global Improvements (Workspace)

- [x] **Setup E2E testing templates** for both projects using Playwright.
- [x] **Sanitize GitHub Issue Mentions** - Fixed accidental mentions of real users.
- [x] **Standardize DEVLOG format** across both projects.

---
*Created by Gemini CLI - March 2026*
