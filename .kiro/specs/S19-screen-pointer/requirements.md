# S19: Screen Pointer & Annotation

## Overview

Enable users to capture their screen (desktop/window/tab) and draw annotations (arrows, circles, highlights) to guide the AI agent. Supports real-time live mode for agent following.

**Inspired By**: Google Gemini Live, screenshot annotation tools

---

## User Stories

### US1: Desktop Screen Capture
**As a** user  
**I want to** capture my desktop, window, or browser tab  
**So that** the AI can see what I'm looking at and help me

**Acceptance Criteria:**
- AC1.1: "Capture Screen" button triggers `getDisplayMedia()` permission flow
- AC1.2: User can select desktop, window, or tab to capture
- AC1.3: Captured frame displays in annotation canvas
- AC1.4: Works in Chrome extension context

---

### US2: Annotation Drawing
**As a** user  
**I want to** draw arrows, circles, and highlights on the screenshot  
**So that** I can point at specific elements for the AI

**Acceptance Criteria:**
- AC2.1: Tool palette with Arrow, Circle, Rectangle, Freehand, Highlight
- AC2.2: Color picker for annotation color (default: red)
- AC2.3: Undo/redo support for annotations
- AC2.4: Clear all button to reset annotations
- AC2.5: Touch-friendly for mobile/tablet

---

### US3: Coordinate Export
**As a** user  
**I want** annotations exported as bounding boxes with coordinates  
**So that** the AI can understand exact positions

**Acceptance Criteria:**
- AC3.1: Annotations serialized to JSON with coordinates
- AC3.2: Format: `{ type, x, y, width, height, color, label? }`
- AC3.3: Coordinates normalized to image dimensions (0-1 range)
- AC3.4: Export function available for LLM integration

---

### US4: Annotated Screenshot Export
**As a** user  
**I want to** export the annotated screenshot as an image  
**So that** I can share it or send to the AI

**Acceptance Criteria:**
- AC4.1: "Send to AI" button exports annotated PNG
- AC4.2: Image resized to reasonable size (max 1920x1080)
- AC4.3: Annotations baked into exported image
- AC4.4: Automatic attachment to next message

---

### US5: Live Follow Mode (Advanced)
**As a** user  
**I want** the AI to follow my screen in real-time  
**So that** I can get live assistance like Google Gemini

**Acceptance Criteria:**
- AC5.1: Toggle for "Live Mode" with continuous capture
- AC5.2: Configurable frame rate (1-5 fps for efficiency)
- AC5.3: Delta detection to send only changed frames
- AC5.4: Pointer position tracked and sent to AI
- AC5.5: Works with supported models (GPT-4o, Claude vision)

---

## Technical Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| TR1 | Use `getDisplayMedia()` API for screen capture | HIGH |
| TR2 | Use Fabric.js v6 for canvas annotations | HIGH |
| TR3 | TypeScript with React components | HIGH |
| TR4 | Work in Chrome extension context | HIGH |
| TR5 | Mobile touch support | MEDIUM |
| TR6 | WebRTC for live streaming (advanced) | LOW |
| TR7 | Annotation undo/redo stack (min 20 levels) | MEDIUM |

---

## Open Source Dependencies

| Library | Version | Purpose | License |
|---------|---------|---------|---------|
| fabric | ^6.0.0 | Canvas annotation | MIT |
| @types/fabric | ^5.0.0 | TypeScript types | MIT |

---

## Non-Functional Requirements

- NFR1: Screen capture permission should be explicit and user-triggered
- NFR2: No background screen access without user consent
- NFR3: Image compression for efficient LLM token usage
- NFR4: Annotations should render at 60fps
- NFR5: Live mode should not exceed 5% CPU usage
