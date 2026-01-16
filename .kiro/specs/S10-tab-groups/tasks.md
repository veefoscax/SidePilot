# Implementation Plan: Tab Groups

## Overview

This implementation plan creates a tab groups system using Chrome's tabGroups API, enabling AI to organize browser tabs into logical groups with colors and titles.

## Tasks

- [x] 1. Core Tab Groups Implementation
  - Create src/lib/tab-groups.ts
  - Implement TabGroupManager class singleton
  - Implement createGroup(tabs, title, color)
  - Implement updateGroup(groupId, options)
  - Implement ungroupTabs(tabIds)
  - Implement listGroups() with tab info
  - _Requirements: AC1, AC2_

- [x] 1.1 Write tests for tab group manager
  - Test group creation
  - Test group updates
  - Test ungrouping
  - _Requirements: AC1_

- [x] 2. Tool Integration
  - Create src/tools/tab-groups.ts
  - Define tool parameters (action, tabs, title, color)
  - Implement execute function for all actions
  - Add to tool registry
  - Add Anthropic and OpenAI schemas
  - _Requirements: AC3_

- [x] 3. Checkpoint - Verify Tab Groups API
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Testing and Validation
  - Test create group with multiple tabs
  - Test update group color (grey/blue/red/yellow/green/pink/purple/cyan)
  - Test update group title
  - Test collapse/expand group
  - Test ungroup tabs
  - Test list all groups with metadata
  - _Requirements: AC4_

- [x] 5. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Requires tabGroups permission in manifest
- Chrome 89+ supports tab groups
- Colors are limited to Chrome's predefined set
- Groups persist across browser restarts
