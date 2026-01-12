# S06: Permission System - Tasks

## Implementation Checklist

### 1. Permission Types
- [ ] Create src/lib/permissions.ts
- [ ] Define PermissionMode type
- [ ] Define DomainPermission interface
- [ ] Define PermissionRequest interface
- [ ] Define PermissionResult interface

### 2. Permission Manager
- [ ] Implement PermissionManager class
- [ ] Add checkPermission() method
- [ ] Add setPermission() method
- [ ] Add setToolPermission() method
- [ ] Add extractDomain() helper
- [ ] Add session approval tracking

### 3. Storage
- [ ] Load permissions from chrome.storage on init
- [ ] Save permissions on change
- [ ] Handle storage errors

### 4. Zustand Store
- [ ] Create src/stores/permissions.ts
- [ ] Implement loadPermissions action
- [ ] Implement setPendingRequest action
- [ ] Implement approveRequest action
- [ ] Implement denyRequest action

### 5. Permission Dialog
- [ ] Create src/components/PermissionDialog.tsx
- [ ] Show tool name and domain
- [ ] Display screenshot with click indicator
- [ ] Display text for type actions
- [ ] Add "Remember for domain" checkbox
- [ ] Add Approve/Deny buttons

### 6. Integration
- [ ] Hook into tool execution flow
- [ ] Check permission before executing
- [ ] Show dialog when needsPrompt
- [ ] Handle user response

### 7. Settings Page
- [ ] Add permissions section to Settings
- [ ] List all domain permissions
- [ ] Edit/delete buttons per domain
- [ ] Reset all button

## Success Criteria
- Permission dialog appears before sensitive actions
- "Remember" checkbox persists choice
- Permissions persist after reload
- Tool-specific overrides work correctly
