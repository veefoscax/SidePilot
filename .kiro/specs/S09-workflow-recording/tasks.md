# Implementation Plan: Workflow Recording

## Overview

This implementation plan creates a workflow recording system that captures user actions as a series of steps with screenshots, enabling users to save and replay complex browser automation sequences.

## Tasks

- [x] 1. Types and Core Definitions
  - Create src/lib/workflow.ts with core types
  - Define WorkflowStep interface (id, action, params, screenshot, description)
  - Define WorkflowRecording interface (id, name, steps, createdAt)
  - Define WorkflowState enum (idle, recording, editing)
  - _Requirements: AC1_

- [x] 2. Workflow Store Implementation
  - Create src/stores/workflow.ts with Zustand
  - Implement startRecording to begin capture
  - Implement captureStep with automatic screenshot
  - Implement stopRecording to finalize workflow
  - Implement cancelRecording to discard
  - Implement deleteStep to remove single step
  - Implement updateStepDescription for manual edits
  - Add persistence to chrome.storage.local
  - _Requirements: AC2, AC3_

- [x] 2.1 Write tests for workflow store
  - Test recording lifecycle
  - Test step capture and modification
  - Test persistence
  - _Requirements: AC2_

- [x] 3. Recording Bar Component
  - Create src/components/RecordingBar.tsx
  - Show pulsing recording indicator
  - Display current step count
  - Add Stop Recording button
  - Add Cancel Recording button
  - Position at top of side panel
  - _Requirements: AC4_

- [x] 4. Checkpoint - Test Core Recording
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Step Preview Component
  - Create src/components/WorkflowStepCard.tsx
  - Show screenshot thumbnail (resized)
  - Display action description
  - Add inline edit for description
  - Add delete step button
  - Add drag handle for reordering
  - _Requirements: AC5_

- [x] 6. Workflow Editor Modal
  - Create src/components/WorkflowEditor.tsx
  - Add workflow name input
  - Display scrollable steps list
  - Add Save as Shortcut button
  - Add Discard button
  - Show total steps count and estimated time
  - _Requirements: AC6_

- [x] 7. Prompt Generation
  - Implement generateWorkflowPrompt utility
  - Include all step descriptions in order
  - Format for AI understanding with numbered steps
  - Add context about starting URL
  - _Requirements: AC7_

- [-] 8. Integration with System
  - Add "Record Workflow" to slash menu
  - Hook step capture to CDP action completions
  - Auto-capture screenshot after each action
  - Save final workflow as shortcut
  - Connect to shortcuts store
  - _Requirements: AC8, AC9_

- [ ] 9. Integration Testing
  - Test complete workflow recording flow
  - Test step editing and deletion
  - Test saving as shortcut
  - Test prompt generation quality
  - _Requirements: All_

- [ ] 10. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Recording should be non-intrusive
- Screenshots should be optimized for storage
- Workflow prompts need to be clear for AI execution
- Consider adding workflow replay functionality in future
