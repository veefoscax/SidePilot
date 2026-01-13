# Implementation Plan: Permission System

## Overview

This implementation plan creates a robust permission system for browser automation actions, ensuring user control over sensitive operations like clicking, typing, and navigation.

## Tasks

- [ ] 1. Permission Types and Core Definitions
  - Create src/lib/permissions.ts with core types
  - Define PermissionMode type (auto/prompt/deny)
  - Define DomainPermission, PermissionRequest, PermissionResult interfaces
  - Implement domain extraction utility
  - _Requirements: AC1, AC2_

- [ ] 1.1 Write unit tests for permission types
  - Test PermissionMode validation
  - Test domain extraction edge cases
  - _Requirements: AC1_

- [ ] 2. Permission Manager Implementation
  - Implement PermissionManager class singleton
  - Add checkPermission() method with mode evaluation
  - Add setPermission() for domain-level permissions
  - Add setToolPermission() for tool-specific overrides
  - Add session approval tracking (memory-only)
  - _Requirements: AC3, AC4, AC5, AC6_

- [ ] 2.1 Write tests for permission manager
  - Test permission checking logic
  - Test session-only approvals
  - Test domain permission persistence
  - _Requirements: AC3, AC4, AC6_

- [ ] 3. Storage Integration
  - Load permissions from chrome.storage on init
  - Save permissions on change with debouncing
  - Handle storage errors gracefully
  - Add migration support for future schema changes
  - _Requirements: AC7_

- [ ] 4. Zustand Permission Store
  - Create src/stores/permissions.ts
  - Implement loadPermissions action
  - Implement setPendingRequest action
  - Implement approveRequest and denyRequest actions
  - Sync with PermissionManager singleton
  - _Requirements: AC8_

- [ ] 5. Checkpoint - Test Core Permission System
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Permission Dialog Component
  - Create src/components/PermissionDialog.tsx
  - Show tool name and target domain clearly
  - Display screenshot with click indicator for mouse actions
  - Display text preview for type actions
  - Add "Remember for this domain" checkbox
  - Add Approve/Deny buttons with keyboard shortcuts
  - _Requirements: AC9, AC10, AC11, AC12_

- [ ] 6.1 Write tests for permission dialog
  - Test dialog rendering with different action types
  - Test checkbox state persistence
  - Test button interactions
  - _Requirements: AC9, AC10_

- [ ] 7. Tool Execution Integration
  - Hook into tool execution flow in registry
  - Check permission before executing each tool
  - Show dialog when mode === 'prompt'
  - Handle user response and continue/abort execution
  - _Requirements: AC13, AC14_

- [ ] 8. Settings Page Permissions Section
  - Add permissions section to Settings page
  - List all domain permissions with status
  - Add edit/delete buttons per domain
  - Add reset all button with confirmation
  - _Requirements: AC15, AC16_

- [ ] 9. Integration Testing
  - Test end-to-end permission flow
  - Test permission dialog appears correctly
  - Test "Remember" checkbox saves preference
  - Test settings page updates permissions
  - _Requirements: All_

- [ ] 10. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Permission system is critical for user trust and safety
- Session-only approvals provide convenience without permanent storage
- Tool-specific overrides allow fine-grained control
- Dialog should be clear and non-intrusive
