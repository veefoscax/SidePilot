# S12: Notifications - Tasks

## Implementation Checklist

### 1. Notification Manager
- [ ] Create `src/lib/notifications.ts` <!-- id: 0 -->
- [ ] Define NotificationConfig interface <!-- id: 1 -->
- [ ] Implement loadConfig from storage <!-- id: 2 -->
- [ ] Implement updateConfig with persistence <!-- id: 3 -->
- [ ] Implement notify base method <!-- id: 4 -->

### 2. Notification Types
- [ ] Implement notifyTaskComplete <!-- id: 5 -->
- [ ] Implement notifyPermissionRequired <!-- id: 6 -->
- [ ] Implement notifyError <!-- id: 7 -->

### 3. Settings UI
- [ ] Add notifications section to Settings page <!-- id: 8 -->
- [ ] Add enable/disable toggle <!-- id: 9 -->
- [ ] Add test notification button <!-- id: 10 -->
- [ ] Connect to notification manager <!-- id: 11 -->

### 4. Integration
- [ ] Call notifyTaskComplete when chat completes <!-- id: 12 -->
- [ ] Call notifyPermissionRequired from permission system <!-- id: 13 -->
- [ ] Call notifyError from chat error handler <!-- id: 14 -->

### 5. Testing
- [ ] Test notifications appear <!-- id: 15 -->
- [ ] Test disable toggle works <!-- id: 16 -->
- [ ] Test notification click opens extension <!-- id: 17 -->

### 6. Automated Testing (Playwright)
- [ ] Install Playwright dependencies <!-- id: 18 -->
- [ ] Create static build verification tests (verify dist/ output size & content) <!-- id: 19 -->
- [ ] Create integration tests for UI/Logic <!-- id: 20 -->
- [ ] Add test script to package.json <!-- id: 21 -->
- [ ] Update DEVLOG with test results and screenshots <!-- id: 22 -->
