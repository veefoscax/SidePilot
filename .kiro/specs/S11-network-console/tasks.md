# S11: Network & Console Tracking - Tasks

## Implementation Checklist

### 1. Verify CDP Integration
- [ ] Confirm `cdpWrapper.enableNetworkTracking()` works
- [ ] Confirm `cdpWrapper.enableConsoleTracking()` works
- [ ] Confirm `cdpWrapper.getNetworkRequests()` returns data
- [ ] Confirm `cdpWrapper.getConsoleLogs()` returns data

### 2. Network Tool
- [ ] Create `src/tools/network.ts`
- [ ] Implement tool with filter parameter
- [ ] Format output as JSON
- [ ] Add to tool registry

### 3. Console Tool
- [ ] Create `src/tools/console.ts`
- [ ] Implement tool with type filter
- [ ] Include stack traces for errors
- [ ] Add to tool registry

### 4. Testing
- [ ] Test network capture on API-heavy page
- [ ] Test console capture with console.log/error
- [ ] Test filtering works correctly
