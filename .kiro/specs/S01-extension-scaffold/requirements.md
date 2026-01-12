# S01: Extension Scaffold - Requirements

## Time Tracking
- **Estimated**: 45 minutes  
- **Actual**: 2 hours 15 minutes
- **Status**: ✅ Completed
- **Key Learning**: Chrome extensions require relative paths in HTML files

## Feature Description
Create the foundation Chrome extension with Manifest V3, Vite build system, React 18, TypeScript, and shadcn/ui design system.

## User Stories

### US1: Developer Setup
**As a** developer
**I want** to clone the repo and run `npm install && npm run dev`
**So that** I can start development immediately with hot reload

### US2: Extension Load
**As a** user
**I want** to load the extension in Chrome developer mode
**So that** I can access the side panel

### US3: Dark Mode
**As a** user
**I want** the extension to use dark mode by default
**So that** it matches my browser theme

## Acceptance Criteria

### AC1: Build System
- [ ] Vite configured for Chrome extension
- [ ] TypeScript compilation without errors
- [ ] Hot reload working for development
- [ ] Production build generates valid extension

### AC2: Extension Structure
- [ ] manifest.json valid for Manifest V3
- [ ] Side panel registered and opens
- [ ] Service worker running
- [ ] Content script injected in pages

### AC3: UI Framework
- [ ] React 18 rendering in side panel
- [ ] Tailwind CSS configured
- [ ] shadcn/ui configured with **Nova** style, **Cyan** theme, **Neutral** base color
- [ ] Fonts set to **Figtree**, Icons to **Hugeicons**
- [ ] Radius set to **Small**
- [ ] Dark mode as default theme

### AC4: Infrastructure
- [ ] Chrome storage wrapper utility
- [ ] Message passing between components
- [ ] Basic error handling

### AC5: Automated Visual Testing
- [ ] Playwright configured for Chrome Extension testing
- [ ] Automated screenshots of Side Panel
- [ ] Test results integrated with DEVLOG
- [ ] Tests running in CI/CD pipeline

## Dependencies
None - this is the foundation.

## Files to Create
- manifest.json
- vite.config.ts
- package.json
- tsconfig.json
- tailwind.config.js
- components.json
- src/sidepanel/index.html
- src/sidepanel/index.tsx
- src/sidepanel/App.tsx
- src/background/service-worker.ts
- src/content/content.ts
- src/lib/storage.ts
- src/lib/messaging.ts
