# Implementation Plan: Notifications

## Overview

This implementation plan adds system notification support, allowing SidePilot to notify users about task completion, permission requests, and errors even when the browser is minimized.

## Tasks

- [ ] 1. Notification Manager Implementation
  - Create src/lib/notifications.ts
  - Define NotificationConfig interface (enabled, soundEnabled, types)
  - Implement loadConfig from chrome.storage
  - Implement updateConfig with persistence
  - Implement notify base method using chrome.notifications API
  - Handle notification click to open extension
  - _Requirements: AC1, AC2_

- [ ] 1.1 Write tests for notification manager
  - Test config loading
  - Test notification creation
  - _Requirements: AC1_

- [ ] 2. Notification Types
  - Implement notifyTaskComplete with success icon
  - Implement notifyPermissionRequired with warning icon
  - Implement notifyError with error icon
  - Add sound option for each type
  - _Requirements: AC3_

- [ ] 3. Settings UI Integration
  - Add notifications section to Settings page
  - Add enable/disable master toggle
  - Add individual toggles per notification type
  - Add sound toggle
  - Add test notification button
  - Connect to notification manager
  - _Requirements: AC4_

- [ ] 4. Checkpoint - Test Core Notifications
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. System Integration
  - Call notifyTaskComplete when chat completes (with tab in background)
  - Call notifyPermissionRequired from permission system
  - Call notifyError from chat error handler
  - Only notify when side panel not focused
  - _Requirements: AC5_

- [ ] 6. Integration Testing
  - Test notifications appear correctly
  - Test disable toggle works
  - Test notification click opens extension
  - Test focus detection
  - _Requirements: All_

- [ ] 7. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Requires notifications permission in manifest
- Notifications should be non-spammy
- Click should bring user to relevant context
- Consider adding notification history in future
