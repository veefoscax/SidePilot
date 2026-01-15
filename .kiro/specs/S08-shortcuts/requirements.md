# S08: Shortcuts System - Requirements

## Feature Description
Saved prompts system with / command menu, shortcut chips, and optional scheduling.

## User Stories

### US1: Create Shortcut
**As a** user
**I want** to save a prompt as a shortcut with a /command
**So that** I can reuse it quickly

### US2: Quick Access
**As a** user
**I want** to type / and see my shortcuts
**So that** I can invoke them instantly

### US3: Shortcut Chips
**As a** user
**I want** shortcuts to appear as clickable chips in chat
**So that** I can see what shortcut was used

## Acceptance Criteria

### AC1: Shortcut CRUD
- [x] Create shortcut with name, command, prompt
- [x] Edit existing shortcuts
- [x] Delete shortcuts
- [x] List all shortcuts

### AC2: / Command Menu
- [x] Type / to trigger menu
- [x] Autocomplete filtering
- [x] Groups: system, shortcuts, actions
- [x] Keyboard navigation

### AC3: Shortcut Chips
- [x] Syntax: `[[shortcut:id:name]]`
- [x] Render as clickable chip in chat
- [x] Click to expand prompt content

### AC4: Usage Tracking
- [x] Count uses per shortcut
- [x] Sort by most used

## Dependencies
- S04: Chat interface

## Files to Create
- src/lib/shortcuts.ts
- src/stores/shortcuts.ts
- src/components/SlashMenu.tsx
- src/components/ShortcutChip.tsx
- src/components/ShortcutEditor.tsx
