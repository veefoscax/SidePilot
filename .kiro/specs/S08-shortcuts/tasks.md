# Implementation Plan: Shortcuts System

## Overview

This implementation plan creates a shortcuts system enabling users to save and reuse common prompts and actions, accessible via slash commands in the chat interface.

## Tasks

- [ ] 1. Types and Constants
  - Create src/lib/shortcuts.ts with core types
  - Define SavedPrompt interface with id, command, prompt, url, usageCount
  - Define SHORTCUT_CHIP_REGEX for parsing shortcuts in text
  - Add DEFAULT_SHORTCUTS for common actions
  - _Requirements: AC1_

- [ ] 2. Shortcuts Store Implementation
  - Create src/stores/shortcuts.ts with Zustand
  - Implement loadShortcuts from chrome.storage
  - Implement createShortcut with validation
  - Implement updateShortcut for editing
  - Implement deleteShortcut with confirmation
  - Implement recordUsage for analytics
  - Add persistence to chrome.storage.local
  - _Requirements: AC2, AC3_

- [ ] 2.1 Write tests for shortcuts store
  - Test CRUD operations
  - Test persistence
  - Test usage tracking
  - _Requirements: AC2_

- [ ] 3. Slash Menu Component
  - Create src/components/SlashMenu.tsx
  - Define SlashMenuItem interface
  - Build system items (screenshot, navigate, etc.)
  - Build user shortcuts from store
  - Build action items (new shortcut, settings)
  - Implement real-time filtering
  - Add keyboard navigation (up/down/enter/escape)
  - _Requirements: AC4, AC5, AC6_

- [ ] 3.1 Write tests for slash menu
  - Test filtering behavior
  - Test keyboard navigation
  - Test item selection
  - _Requirements: AC4, AC5_

- [ ] 4. Shortcut Chip Component
  - Create src/components/ShortcutChip.tsx
  - Render chip UI with icon and command name
  - Expand on click to show full prompt
  - Implement parseShortcutChips utility for message parsing
  - _Requirements: AC7_

- [ ] 5. Checkpoint - Test Core Components
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Shortcut Editor Component
  - Create src/components/ShortcutEditor.tsx as modal
  - Add command input with validation (no spaces, lowercase)
  - Add prompt textarea with placeholder examples
  - Add optional URL input for navigation shortcuts
  - Add Save/Cancel buttons
  - Handle both create and edit modes
  - _Requirements: AC8_

- [ ] 7. Chat Input Integration
  - Detect "/" in input field
  - Show SlashMenu positioned above input
  - Insert chip on item selection
  - Close menu on outside click or escape
  - Handle chip expansion on send
  - _Requirements: AC9, AC10_

- [ ] 8. Tools Integration
  - Create shortcuts_list tool for AI to see shortcuts
  - Create shortcuts_execute tool to run shortcuts
  - Register tools in registry
  - Add appropriate descriptions for LLM
  - _Requirements: AC11_

- [ ] 9. Integration Testing
  - Test end-to-end shortcut creation
  - Test slash menu in chat
  - Test chip rendering in messages
  - Test usage count increments
  - _Requirements: All_

- [ ] 10. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Shortcuts should persist across sessions
- Slash menu must be accessible and responsive
- Chips in messages help with readability
- Usage analytics help prioritize frequent shortcuts
