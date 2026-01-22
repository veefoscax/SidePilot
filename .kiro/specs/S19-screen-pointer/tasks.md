# S19: Screen Pointer & Annotation - Tasks

> **Reference Workflow**: See `.kiro/steering/workflow.md` for execution guidelines.

## Overview

Implement screen capture with annotation drawing for guiding AI agents. Uses getDisplayMedia API and Fabric.js.

**Expected Impact**: Enhanced agent guidance, reduced ambiguity in user requests.

---

## Phase 1: Screen Capture Foundation (OPUS-PAUSE)

- [x] 1. Types and Interfaces
  - Create `src/lib/screen-capture/types.ts`
  - Define CaptureOptions, CaptureResult types
  - Define Annotation, AnnotationType types
  - Define AnnotatedScreenshot export type
  - _Requirements: TR1, TR3_

- [x] 2. Screen Capture Service
  - Create `src/lib/screen-capture/capture-service.ts`
  - Implement requestCapture() with getDisplayMedia
  - Implement captureFrame() for single frame
  - Implement stopCapture() for cleanup
  - Add error handling for denied permissions
  - _Requirements: AC1.1, AC1.2, AC1.3, TR1_

- [x] 3. Service Tests
  - Create unit tests for capture service
  - Mock MediaStream and getDisplayMedia
  - Test permission denied scenario

## Phase 2: Annotation Canvas (OPUS-PAUSE)

- [x] 4. Annotation Canvas Class
  - Create `src/lib/screen-capture/annotation-canvas.ts`
  - Initialize Fabric.js canvas
  - Implement setBackground() for screenshot
  - Implement tool switching (arrow, circle, rect, freehand, highlight)
  - _Requirements: AC2.1, TR2_
  - **Status**: Partial implementation complete, ready for drawing tools

- [ ] 5. Drawing Tools
  - Implement Arrow tool with custom shape
  - Implement Circle tool with transparent fill
  - Implement Rectangle tool
  - Implement Freehand with PencilBrush
  - Implement Highlight with semi-transparent rect
  - _Requirements: AC2.1_

- [ ] 6. Undo/Redo System
  - Implement undo stack (20 levels)
  - Implement redo stack
  - Add canUndo/canRedo checks
  - _Requirements: AC2.3, TR7_

- [ ] 7. Export Functions
  - Implement getAnnotations() → JSON
  - Implement toDataURL() → PNG/JPEG
  - Normalize coordinates to 0-1 range
  - _Requirements: AC3.1, AC3.2, AC3.3, AC4.1, AC4.2_

## Phase 3: React Components (OPUS-RECOMMENDED)

- [ ] 8. ToolPalette Component
  - Create `src/components/screen/ToolPalette.tsx`
  - Add tool buttons with icons
  - Add color picker
  - Add undo/redo/clear buttons
  - Style as floating toolbar
  - _Requirements: AC2.1, AC2.2, AC2.4_

- [ ] 9. AnnotationOverlay Component
  - Create `src/components/screen/AnnotationOverlay.tsx`
  - Wrap Fabric.js canvas in React
  - Handle canvas resize
  - Connect to ToolPalette state
  - _Requirements: TR3_

- [ ] 10. ScreenPointer Component
  - Create `src/components/screen/ScreenPointer.tsx`
  - Implement fullscreen overlay mode
  - Handle capture flow
  - Combine ToolPalette + AnnotationOverlay
  - Add "Send to AI" and "Cancel" buttons
  - _Requirements: AC4.1, AC4.4_

## Phase 4: Chat Integration (OPUS-RECOMMENDED)

- [ ] 11. Screen Pointer Button
  - Add "Screen Pointer" button to InputArea
  - Open ScreenPointer overlay on click
  - Request capture permission
  - _Requirements: AC1.1_

- [ ] 12. Message Attachment
  - Create annotated screenshot message attachment
  - Include annotation coordinates in context
  - Display annotation preview in chat
  - _Requirements: AC4.3, AC4.4_

- [ ] 13. LLM Context Integration
  - Format annotations for LLM system prompt
  - Include bounding box coordinates
  - Add annotation labels/descriptions
  - _Requirements: AC3.4_

## Phase 5: Live Mode (AUTO-OK - Advanced)

- [ ] 14. Live Capture Mode
  - Implement continuous frame capture
  - Add configurable frame rate (1-5 fps)
  - Implement delta detection
  - _Requirements: AC5.1, AC5.2, AC5.3_

- [ ] 15. Pointer Tracking
  - Track cursor position during live mode
  - Send pointer coordinates to AI
  - _Requirements: AC5.4_

## Phase 6: Testing & Documentation (AUTO-OK)

- [ ] 16. Unit Tests
  - Test annotation canvas operations
  - Test coordinate normalization
  - Test export functions

- [ ] 17. Integration Tests
  - Full capture → annotate → export flow
  - Chat message with annotation

- [ ] 18. Documentation
  - Add user guide for screen pointer
  - Document API for other extensions
  - Add examples in DEVLOG

---

## Checkpoints

### After Phase 2 (Task 7)
- [ ] Annotation canvas working with all tools
- [ ] Export produces valid JSON + PNG

### After Phase 4 (Task 13)
- [ ] Screen pointer accessible from chat
- [ ] Annotated screenshots sent to AI

### Final (Task 18)
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Live mode functional (optional)

---

## Dependencies

```bash
npm install fabric@^6.0.0
npm install -D @types/fabric@^5.3.0
```

---

## Notes

- Phase 5 (Live Mode) is advanced/optional
- Consider privacy: no background capture
- Optimize image size for token efficiency
- Test with different screen resolutions
