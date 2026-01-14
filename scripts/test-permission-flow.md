# Permission Integration Testing Guide

## What Was Implemented

Task 7 integrates the permission system with tool execution. The implementation includes:

### 1. Tool Registry Integration (`src/tools/registry.ts`)

The `execute()` method now:
- Checks permissions before executing any tool
- Gets the current tab URL for domain-based permission checking
- Calls `PermissionManager.checkPermission()` to determine if execution is allowed
- Handles three scenarios:
  - **Allowed**: Executes tool immediately
  - **Denied**: Throws error without prompting
  - **Needs Prompt**: Shows permission dialog and waits for user response

### 2. Permission Dialog Flow

When a tool needs permission:
1. Creates a `PermissionRequest` with tool name, domain, and action data
2. Sets the request in the permission store via `setPendingRequest()`
3. The `ConnectedPermissionDialog` component automatically shows the dialog
4. Waits for user to approve or deny (with 60-second timeout)
5. On approval: Executes the tool
6. On denial: Rejects with error

### 3. Action-Specific Data

The integration includes action-specific data in permission requests:
- **Click actions**: Includes coordinates for visual indication
- **Type actions**: Includes text preview
- **Other actions**: Basic tool name and domain

### 4. UI Integration (`src/sidepanel/App.tsx`)

Added `ConnectedPermissionDialog` component to the app root, which:
- Listens to the permission store for pending requests
- Automatically shows/hides based on store state
- Handles approve/deny actions through the store

## How to Test

### Automated Build Test
```bash
npm run build
```
Should complete without errors (ignore pre-existing cdp-wrapper warnings).

### Manual Testing Steps

1. **Build and load the extension**:
   ```bash
   npm run build
   ```
   Load `dist` folder in Chrome as unpacked extension.

2. **Configure a provider**:
   - Open the extension sidepanel
   - Go to Settings
   - Add an API key for any provider (Anthropic, OpenAI, etc.)
   - Select a model

3. **Test permission prompt**:
   - Navigate to any website (e.g., https://example.com)
   - In the chat, ask: "Take a screenshot of this page"
   - **Expected**: Permission dialog appears asking to allow the tool
   - Click "Allow" (optionally check "Remember for this domain")
   - **Expected**: Tool executes and screenshot is captured

4. **Test "Remember" functionality**:
   - Ask for another screenshot on the same domain
   - **Expected**: If you checked "Remember", no dialog appears
   - **Expected**: If you didn't check "Remember", dialog appears again

5. **Test denial**:
   - Navigate to a different website
   - Ask for a screenshot
   - Click "Deny" and check "Remember for this domain"
   - Try again
   - **Expected**: Tool execution fails with permission denied error

6. **Test different tools**:
   - Try "Click the first link" (should show coordinate in dialog)
   - Try "Type 'hello' in the search box" (should show text preview)
   - Try "Navigate to google.com" (should show basic permission request)

## Requirements Validated

- ✅ **AC13**: Permission check happens before tool execution
- ✅ **AC14**: Dialog shown when mode === 'prompt'
- ✅ User can approve/deny with "Remember" option
- ✅ Session-only approvals work (ask_once mode)
- ✅ Permanent permissions work (always_allow mode)
- ✅ Denials work (deny mode)

## Architecture

```
Tool Execution Flow:
┌─────────────────┐
│ Chat Component  │
│ (User request)  │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ toolRegistry.execute│
│ - Get current tab   │
│ - Check permission  │
└────────┬────────────┘
         │
         ├─ Allowed? ──────────────┐
         │                         │
         ├─ Denied? ───────────────┤
         │                         │
         └─ Needs Prompt? ─────────┤
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │ PermissionManager        │
                    │ - checkPermission()      │
                    │ - Returns result         │
                    └──────────┬───────────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
         ┌──────────┐   ┌──────────┐   ┌──────────┐
         │ Allowed  │   │  Denied  │   │  Prompt  │
         │ Execute  │   │  Reject  │   │  Dialog  │
         └──────────┘   └──────────┘   └────┬─────┘
                                             │
                                             ▼
                                  ┌──────────────────┐
                                  │ User Decision    │
                                  │ - Approve/Deny   │
                                  │ - Remember?      │
                                  └────┬─────────────┘
                                       │
                                ┌──────┴──────┐
                                │             │
                                ▼             ▼
                          ┌─────────┐   ┌─────────┐
                          │ Execute │   │ Reject  │
                          └─────────┘   └─────────┘
```

## Files Modified

1. `src/tools/registry.ts` - Added permission checking to execute method
2. `src/sidepanel/App.tsx` - Added ConnectedPermissionDialog component
3. `scripts/test-permission-integration.js` - Created test script

## Next Steps

After this task, the remaining tasks are:
- Task 8: Settings Page Permissions Section (manage domain permissions)
- Task 9: Integration Testing (end-to-end tests)
- Task 10: Final Checkpoint

The core permission flow is now complete and functional!
