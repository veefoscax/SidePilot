# S08: Shortcuts System - Tasks

## Implementation Checklist

### 1. Types & Constants
- [ ] Create src/lib/shortcuts.ts
- [ ] Define SavedPrompt interface
- [ ] Define SHORTCUT_CHIP_REGEX

### 2. Shortcuts Store
- [ ] Create src/stores/shortcuts.ts
- [ ] Implement loadShortcuts
- [ ] Implement createShortcut
- [ ] Implement updateShortcut
- [ ] Implement deleteShortcut
- [ ] Implement recordUsage
- [ ] Persist to chrome.storage

### 3. Slash Menu
- [ ] Create src/components/SlashMenu.tsx
- [ ] Define SlashMenuItem interface
- [ ] Build system items
- [ ] Build user shortcuts items
- [ ] Build actions items
- [ ] Implement filtering
- [ ] Add keyboard navigation

### 4. Shortcut Chip
- [ ] Create src/components/ShortcutChip.tsx
- [ ] Render chip UI
- [ ] Expand on click
- [ ] Implement parseShortcutChips

### 5. Shortcut Editor
- [ ] Create src/components/ShortcutEditor.tsx
- [ ] Command input
- [ ] Prompt textarea
- [ ] URL input (optional)
- [ ] Save/Cancel buttons

### 6. Input Integration
- [ ] Detect / in input
- [ ] Show SlashMenu
- [ ] Insert chip on select
- [ ] Close menu on outside click

### 7. Tools Integration
- [ ] Create shortcuts_list tool
- [ ] Create shortcuts_execute tool
- [ ] Register in tool registry

## Success Criteria
- Shortcuts persist after reload
- / menu shows with typing
- Chips render in messages
- Usage count increments
