# S08: Shortcuts System - Tasks

## Implementation Checklist

### 1. Types & Constants
- [ ] Create src/lib/shortcuts.ts <!-- id: 0 -->
- [ ] Define SavedPrompt interface <!-- id: 1 -->
- [ ] Define SHORTCUT_CHIP_REGEX <!-- id: 2 -->

### 2. Shortcuts Store
- [ ] Create src/stores/shortcuts.ts <!-- id: 3 -->
- [ ] Implement loadShortcuts <!-- id: 4 -->
- [ ] Implement createShortcut <!-- id: 5 -->
- [ ] Implement updateShortcut <!-- id: 6 -->
- [ ] Implement deleteShortcut <!-- id: 7 -->
- [ ] Implement recordUsage <!-- id: 8 -->
- [ ] Persist to chrome.storage <!-- id: 9 -->

### 3. Slash Menu
- [ ] Create src/components/SlashMenu.tsx <!-- id: 10 -->
- [ ] Define SlashMenuItem interface <!-- id: 11 -->
- [ ] Build system items <!-- id: 12 -->
- [ ] Build user shortcuts items <!-- id: 13 -->
- [ ] Build actions items <!-- id: 14 -->
- [ ] Implement filtering <!-- id: 15 -->
- [ ] Add keyboard navigation <!-- id: 16 -->

### 4. Shortcut Chip
- [ ] Create src/components/ShortcutChip.tsx <!-- id: 17 -->
- [ ] Render chip UI <!-- id: 18 -->
- [ ] Expand on click <!-- id: 19 -->
- [ ] Implement parseShortcutChips <!-- id: 20 -->

### 5. Shortcut Editor
- [ ] Create src/components/ShortcutEditor.tsx <!-- id: 21 -->
- [ ] Command input <!-- id: 22 -->
- [ ] Prompt textarea <!-- id: 23 -->
- [ ] URL input (optional) <!-- id: 24 -->
- [ ] Save/Cancel buttons <!-- id: 25 -->

### 6. Input Integration
- [ ] Detect / in input <!-- id: 26 -->
- [ ] Show SlashMenu <!-- id: 27 -->
- [ ] Insert chip on select <!-- id: 28 -->
- [ ] Close menu on outside click <!-- id: 29 -->

### 7. Tools Integration
- [ ] Create shortcuts_list tool <!-- id: 30 -->
- [ ] Create shortcuts_execute tool <!-- id: 31 -->
- [ ] Register in tool registry <!-- id: 32 -->

## Success Criteria
- Shortcuts persist after reload
- / menu shows with typing
- Chips render in messages
- Usage count increments

### 8. Automated Testing (Playwright)
- [ ] Install Playwright dependencies <!-- id: 33 -->
- [ ] Create static build verification tests (verify dist/ output size & content) <!-- id: 34 -->
- [ ] Create integration tests for UI/Logic <!-- id: 35 -->
- [ ] Add test script to package.json <!-- id: 36 -->
- [ ] Update DEVLOG with test results and screenshots <!-- id: 37 -->
