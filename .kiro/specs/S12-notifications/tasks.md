# S12: Notifications - Tasks

## Implementation Checklist

### 1. Notification Manager
- [ ] Create `src/lib/notifications.ts`
- [ ] Define NotificationConfig interface
- [ ] Implement loadConfig from storage
- [ ] Implement updateConfig with persistence
- [ ] Implement notify base method

### 2. Notification Types
- [ ] Implement notifyTaskComplete
- [ ] Implement notifyPermissionRequired
- [ ] Implement notifyError

### 3. Settings UI
- [ ] Add notifications section to Settings page
- [ ] Add enable/disable toggle
- [ ] Add test notification button
- [ ] Connect to notification manager

### 4. Integration
- [ ] Call notifyTaskComplete when chat completes
- [ ] Call notifyPermissionRequired from permission system
- [ ] Call notifyError from chat error handler

### 5. Testing
- [ ] Test notifications appear
- [ ] Test disable toggle works
- [ ] Test notification click opens extension
