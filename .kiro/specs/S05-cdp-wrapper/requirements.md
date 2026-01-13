# S05: CDP Wrapper - Requirements (Browser-Use Enhanced)

## Feature Description
Implement an advanced Chrome DevTools Protocol wrapper for browser automation with **optional browser-use SDK integration**. Supports intelligent element targeting, accessibility tree parsing, smart waits, human-like interactions, and comprehensive page understanding for AI agents.

## Integration Options

### Option A: Browser-Use Cloud SDK (Recommended for complex tasks)
Use the official `browser-use-sdk` TypeScript package for cloud-powered browser automation:
```typescript
import { BrowserUseClient } from "browser-use-sdk";

const client = new BrowserUseClient({ apiKey: "bu_..." });
const task = await client.tasks.createTask({
  task: "Fill out this job application with my resume",
});
const result = await task.complete();
```

**Pros**: Stealth mode, structured output, streaming, sandboxed execution
**Cons**: Requires API key, cloud dependency
**Best for**: Complex multi-step automation, form filling, data extraction

### Option B: Local CDP Wrapper (For simple tasks)
Use our built-in CDP wrapper for direct browser control:
```typescript
import { cdpWrapper } from "@/lib/cdp-wrapper";

await cdpWrapper.click(tabId, { ref: "submit_button" });
await cdpWrapper.type(tabId, "Hello world", { delay: 'human' });
```

**Pros**: No API key needed, works offline, full control
**Cons**: May trigger bot detection, requires more code
**Best for**: Simple clicks, typing, screenshots, navigation

## User Stories

### US1: Screenshot
**As a** user (AI agent)
**I want** to capture screenshots with element annotations
**So that** I can see and understand what's on the page

### US2: Smart Click
**As a** user (AI agent)
**I want** to click elements by description OR coordinates OR ref ID
**So that** I can interact reliably without brittle selectors

### US3: Type
**As a** user (AI agent)
**I want** to type text with human-like delays
**So that** I can fill forms naturally and avoid bot detection

### US4: Scroll
**As a** user (AI agent)
**I want** to scroll to elements or directions
**So that** I can access content anywhere on the page

### US5: Smart Wait
**As a** user (AI agent)
**I want** the system to wait intelligently for elements/navigation
**So that** I don't need to guess timing

### US6: Read Page
**As a** user (AI agent)
**I want** to get a semantic accessibility tree of the page
**So that** I can understand page structure for decision making

### US7: Element References
**As a** user (AI agent)
**I want** stable element reference IDs
**So that** I can target elements across multiple actions

## Acceptance Criteria

### AC1: Debugger Management
- [ ] Attach debugger to tab (CDP 1.3)
- [ ] Detach debugger cleanly
- [ ] Auto-reconnect if disconnected
- [ ] Track attached tabs

### AC2: Mouse Events (Browser-Use Enhanced)
- [ ] click(x, y) - coordinates
- [ ] click(ref: "element_123") - by reference ID
- [ ] click(description: "blue submit button") - natural language → accessibility tree lookup
- [ ] click(x, y, 'right') - right click
- [ ] click(x, y, 'left', 2) - double click
- [ ] click(x, y, 'left', 3) - triple click
- [ ] leftClickDrag(startX, startY, endX, endY)
- [ ] hover(ref) - move mouse without click
- [ ] Human-like mouse movement curves (bezier)
- [ ] Randomized timing delays (50-150ms)

### AC3: Keyboard Events (Browser-Use Enhanced)
- [ ] type(text) - character by character with human delays
- [ ] type(text, { delay: 'human' | 'fast' | number })
- [ ] insertText(text) - instant paste
- [ ] pressKey(key) - single key
- [ ] pressKeyChord(chord) - e.g., "Ctrl+A"
- [ ] Randomized typing delays (20-100ms per char)

### AC4: Screenshot (Browser-Use Enhanced)
- [ ] Capture viewport
- [ ] Handle device pixel ratio
- [ ] Resize for token limits
- [ ] Return base64 with dimensions
- [ ] **NEW**: Annotate interactive elements with bounding boxes
- [ ] **NEW**: Include element ref IDs in annotations
- [ ] **NEW**: Highlight option for specific elements

### AC5: Scroll (Browser-Use Enhanced)
- [ ] scroll(direction, amount)
- [ ] scrollToElement(ref) - scroll element into view
- [ ] scrollToTop() / scrollToBottom()
- [ ] Smooth scrolling with easing

### AC6: Smart Wait System (Browser-Use Inspired)
- [ ] waitForElement(ref or description, timeout)
- [ ] waitForNavigation(timeout)
- [ ] waitForNetworkIdle(idleTime, timeout)
- [ ] waitForSelector(cssSelector, timeout)
- [ ] wait(seconds) - explicit delay

### AC7: Accessibility Tree (Browser-Use Core Feature)
- [ ] generateAccessibilityTree(options)
- [ ] Parse DOM into semantic structure
- [ ] Assign stable ref IDs to interactive elements
- [ ] Track element states (disabled, checked, expanded)
- [ ] Include bounding boxes for each element
- [ ] Natural language descriptions
- [ ] WeakRef element map for DOM references
- [ ] Filter options (interactive only, visible only, max depth)

### AC8: Element Reference System (Browser-Use Inspired)
- [ ] __claudeElementMap - WeakRef map of DOM elements
- [ ] __claudeRefCounter - auto-increment ref IDs
- [ ] getElementByRef(ref) - retrieve DOM element
- [ ] highlightElement(ref) - visual highlight
- [ ] clearHighlights() - remove all highlights
- [ ] Refs persist across actions within session

### AC9: Network Tracking
- [ ] Enable network monitoring
- [ ] Track requests (URL, method, status)
- [ ] Limit to recent 100 requests

### AC10: Console Tracking
- [ ] Enable console monitoring
- [ ] Track logs, warnings, errors
- [ ] Capture stack traces for exceptions

### AC11: Human-Like Interactions (Stealth Mode)
- [ ] Randomized delays between actions
- [ ] Natural mouse movement (not straight lines)
- [ ] Typing speed variation
- [ ] Scroll speed variation
- [ ] Optional: Inject realistic mouse jitter

## Dependencies
- S01: Extension scaffold (service worker)

## Chrome APIs Used
- chrome.debugger.attach
- chrome.debugger.sendCommand
- chrome.debugger.detach
- chrome.debugger.onEvent
- chrome.scripting.executeScript (for accessibility tree, viewport info)

## Files to Create
- src/lib/cdp-wrapper.ts (enhanced CDP wrapper)
- src/lib/accessibility-tree.ts (browser-use inspired tree parser)
- src/lib/element-references.ts (stable ref ID system)
- src/lib/human-delays.ts (realistic delay generators)
- src/content/accessibility-tree.js (content script for DOM parsing)
