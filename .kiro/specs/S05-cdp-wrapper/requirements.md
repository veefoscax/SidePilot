# S05: CDP Wrapper - Requirements

## Feature Description
Implement Chrome DevTools Protocol wrapper for browser automation: screenshots, mouse clicks, keyboard typing, scrolling, and network/console tracking.

## User Stories

### US1: Screenshot
**As a** developer (AI)
**I want** to capture screenshots of the current tab
**So that** I can see what's on the page

### US2: Click
**As a** developer (AI)
**I want** to click on specific coordinates
**So that** I can interact with page elements

### US3: Type
**As a** developer (AI)
**I want** to type text into focused elements
**So that** I can fill forms

### US4: Scroll
**As a** developer (AI)
**I want** to scroll the page
**So that** I can access content below the fold

### US5: Keyboard Shortcuts
**As a** developer (AI)
**I want** to press keyboard combinations (Ctrl+A, etc.)
**So that** I can use shortcuts

## Acceptance Criteria

### AC1: Debugger Management
- [ ] Attach debugger to tab (CDP 1.3)
- [ ] Detach debugger cleanly
- [ ] Auto-reconnect if disconnected
- [ ] Track attached tabs

### AC2: Mouse Events
- [ ] click(x, y) - single click
- [ ] click(x, y, 'right') - right click
- [ ] click(x, y, 'left', 2) - double click
- [ ] click(x, y, 'left', 3) - triple click
- [ ] leftClickDrag(startX, startY, endX, endY)
- [ ] Coordinate scaling for device pixel ratio

### AC3: Keyboard Events
- [ ] type(text) - character by character
- [ ] insertText(text) - instant paste
- [ ] pressKey(key) - single key
- [ ] pressKeyChord(chord) - e.g., "Ctrl+A"

### AC4: Screenshot
- [ ] Capture viewport
- [ ] Handle device pixel ratio
- [ ] Resize for token limits
- [ ] Return base64 with dimensions

### AC5: Scroll
- [ ] scroll(direction, amount)
- [ ] Directions: up, down, left, right

### AC6: Network Tracking
- [ ] Enable network monitoring
- [ ] Track requests (URL, method, status)
- [ ] Limit to recent 100 requests

### AC7: Console Tracking
- [ ] Enable console monitoring
- [ ] Track logs, warnings, errors
- [ ] Capture stack traces for exceptions

## Dependencies
- S01: Extension scaffold (service worker)

## Chrome APIs Used
- chrome.debugger.attach
- chrome.debugger.sendCommand
- chrome.debugger.detach
- chrome.debugger.onEvent
- chrome.scripting.executeScript (for viewport info)
