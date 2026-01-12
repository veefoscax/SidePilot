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
- [ ] Create shortcut with name, command, prompt
- [ ] Edit existing shortcuts
- [ ] Delete shortcuts
- [ ] List all shortcuts

### AC2: / Command Menu
- [ ] Type / to trigger menu
- [ ] Autocomplete filtering
- [ ] Groups: system, shortcuts, actions
- [ ] Keyboard navigation

### AC3: Shortcut Chips
- [ ] Syntax: `[[shortcut:id:name]]`
- [ ] Render as clickable chip in chat
- [ ] Click to expand prompt content

### AC4: Usage Tracking
- [ ] Count uses per shortcut
- [ ] Sort by most used

## Dependencies
- S04: Chat interface

## Files to Create
- src/lib/shortcuts.ts
- src/stores/shortcuts.ts
- src/components/SlashMenu.tsx
- src/components/ShortcutChip.tsx
- src/components/ShortcutEditor.tsx
