# S06: Permission System - Tasks

## Implementation Checklist

### 1. Permission Types
- [ ] Create src/lib/permissions.ts <!-- id: 0 -->
- [ ] Define PermissionMode type <!-- id: 1 -->
- [ ] Define DomainPermission interface <!-- id: 2 -->
- [ ] Define PermissionRequest interface <!-- id: 3 -->
- [ ] Define PermissionResult interface <!-- id: 4 -->

### 2. Permission Manager
- [ ] Implement PermissionManager class <!-- id: 5 -->
- [ ] Add checkPermission() method <!-- id: 6 -->
- [ ] Add setPermission() method <!-- id: 7 -->
- [ ] Add setToolPermission() method <!-- id: 8 -->
- [ ] Add extractDomain() helper <!-- id: 9 -->
- [ ] Add session approval tracking <!-- id: 10 -->

### 3. Storage
- [ ] Load permissions from chrome.storage on init <!-- id: 11 -->
- [ ] Save permissions on change <!-- id: 12 -->
- [ ] Handle storage errors <!-- id: 13 -->

### 4. Zustand Store
- [ ] Create src/stores/permissions.ts <!-- id: 14 -->
- [ ] Implement loadPermissions action <!-- id: 15 -->
- [ ] Implement setPendingRequest action <!-- id: 16 -->
- [ ] Implement approveRequest action <!-- id: 17 -->
- [ ] Implement denyRequest action <!-- id: 18 -->

### 5. Permission Dialog
- [ ] Create src/components/PermissionDialog.tsx <!-- id: 19 -->
- [ ] Show tool name and domain <!-- id: 20 -->
- [ ] Display screenshot with click indicator <!-- id: 21 -->
- [ ] Display text for type actions <!-- id: 22 -->
- [ ] Add "Remember for domain" checkbox <!-- id: 23 -->
- [ ] Add Approve/Deny buttons <!-- id: 24 -->

### 6. Integration
- [ ] Hook into tool execution flow <!-- id: 25 -->
- [ ] Check permission before executing <!-- id: 26 -->
- [ ] Show dialog when needsPrompt <!-- id: 27 -->
- [ ] Handle user response <!-- id: 28 -->

### 7. Settings Page
- [ ] Add permissions section to Settings <!-- id: 29 -->
- [ ] List all domain permissions <!-- id: 30 -->
- [ ] Edit/delete buttons per domain <!-- id: 31 -->
- [ ] Reset all button <!-- id: 32 -->

## Success Criteria
- Permission dialog appears before sensitive actions
- "Remember" checkbox persists choice
- Permissions persist after reload
- Tool-specific overrides work correctly
