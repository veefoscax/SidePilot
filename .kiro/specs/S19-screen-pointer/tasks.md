# S19: Element Pointer - Tasks (Simplified)

## Overview

Minimal element pointing for hackathon. 5 tasks only.

---

## Tasks

- [x] 1. Content Script Setup
  - Create `src/content/element-pointer.ts`
  - Create `src/lib/element-pointer/index.ts` with types
  - Add to manifest.json content_scripts
  - Message listeners for ACTIVATE/DEACTIVATE
  - _Requirements: TR2_

- [x] 2. Overlay UI
  - Inject overlay container on activation
  - CSS for highlight box (follows mouse)
  - CSS for selected element marker
  - Pure CSS, no dependencies
  - _Requirements: AC2, TR3_

- [x] 3. Element Selection + S18 Ref
  - On element hover: show highlight
  - On element click: select + assign S18 ref
  - Get position (x, y, width, height)
  - Get text content (truncated 50 chars)
  - _Requirements: AC3, TR1_

- [x] 4. Comment + Done
  - Show comment input after selection
  - Enter key or "Done" button completes
  - Escape cancels
  - Send PointedElement to sidepanel
  - _Requirements: AC4, AC5_

- [x] 5. Chat Integration
  - Create ElementPointerButton component
  - Add 🎯 button to InputArea
  - Receive pointed element from content script
  - Inject into chat message context
  - _Requirements: AC1, AC6_

---

## Checkpoint

### After All Tasks
- [x] 🎯 button visible in chat input
- [x] Click activates overlay in tab
- [x] Hovering highlights elements
- [x] Clicking assigns ref from S18
- [x] Comment input works
- [x] Agent receives ref + position + comment

---

## Not Included (Hackathon Scope)

- ❌ Multi-element selection
- ❌ Desktop capture
- ❌ Text selection
- ❌ Complex output formats
- ❌ Selector generation
