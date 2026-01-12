# S06: Permission System - Requirements

## Feature Description
Domain-based permission system to control which tools can execute on which websites, with approval UI and auto-approve options.

## User Stories

### US1: Permission Request
**As a** user
**I want** to see what action the AI wants to perform before it executes
**So that** I maintain control over my browser

### US2: Domain Rules
**As a** user
**I want** to set rules per domain (always allow, ask, deny)
**So that** I don't have to approve every action on trusted sites

### US3: Tool-Specific Rules
**As a** user
**I want** to allow some tools but not others per domain
**So that** I have fine-grained control

## Acceptance Criteria

### AC1: Permission Modes
- [ ] `always_allow` - Auto-approve all actions
- [ ] `ask_once` - Ask first time, remember choice
- [ ] `ask_always` - Ask every time
- [ ] `deny` - Block all actions

### AC2: Permission Request
- [ ] Show tool name being requested
- [ ] Show action details (coordinates, text)
- [ ] Include screenshot for click actions
- [ ] Approve/Deny buttons
- [ ] "Remember for this domain" checkbox

### AC3: Domain Management
- [ ] List all domains with rules
- [ ] Edit/delete domain rules
- [ ] Reset all permissions

### AC4: Storage
- [ ] Persist permissions in chrome.storage
- [ ] Track last used timestamp

## Dependencies
- S01: Extension scaffold
- S05: CDP wrapper (domain detection from tabs)

## Files to Create
- src/lib/permissions.ts
- src/stores/permissions.ts
- src/components/PermissionDialog.tsx
