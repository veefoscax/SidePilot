# S10: Tab Groups - Requirements

## User Stories

### US1: Create Tab Group
**As a** user
**I want** to group related tabs together
**So that** I can organize my browsing sessions

### US2: Manage Groups  
**As a** user
**I want** to update or remove tab groups
**So that** I can keep my browser organized

## Acceptance Criteria (EARS Notation)

### AC1: Create Group
WHEN the AI requests to create a tab group with specific tabs
THE SYSTEM SHALL create a Chrome tab group with the specified title and color
AND add the specified tabs to the group

### AC2: Update Group
WHEN the AI requests to update a tab group
THE SYSTEM SHALL modify the group's title, color, or collapsed state

### AC3: Ungroup Tabs
WHEN the AI requests to ungroup tabs
THE SYSTEM SHALL remove the tabs from their current group

### AC4: List Groups
WHEN the AI requests to list tab groups
THE SYSTEM SHALL return all active groups with their tabs

## Dependencies
- S01: Extension scaffold
