# S11: Network & Console Tracking - Tasks

## Implementation Checklist

### 1. Verify CDP Integration
- [ ] Confirm `cdpWrapper.enableNetworkTracking()` works <!-- id: 0 -->
- [ ] Confirm `cdpWrapper.enableConsoleTracking()` works <!-- id: 1 -->
- [ ] Confirm `cdpWrapper.getNetworkRequests()` returns data <!-- id: 2 -->
- [ ] Confirm `cdpWrapper.getConsoleLogs()` returns data <!-- id: 3 -->

### 2. Network Tool
- [ ] Create `src/tools/network.ts` <!-- id: 4 -->
- [ ] Implement tool with filter parameter <!-- id: 5 -->
- [ ] Format output as JSON <!-- id: 6 -->
- [ ] Add to tool registry <!-- id: 7 -->

### 3. Console Tool
- [ ] Create `src/tools/console.ts` <!-- id: 8 -->
- [ ] Implement tool with type filter <!-- id: 9 -->
- [ ] Include stack traces for errors <!-- id: 10 -->
- [ ] Add to tool registry <!-- id: 11 -->

### 4. Testing
- [ ] Test network capture on API-heavy page <!-- id: 12 -->
- [ ] Test console capture with console.log/error <!-- id: 13 -->
- [ ] Test filtering works correctly <!-- id: 14 -->

### 5. Automated Testing (Playwright)
- [ ] Install Playwright dependencies <!-- id: 15 -->
- [ ] Create static build verification tests (verify dist/ output size & content) <!-- id: 16 -->
- [ ] Create integration tests for UI/Logic <!-- id: 17 -->
- [ ] Add test script to package.json <!-- id: 18 -->
- [ ] Update DEVLOG with test results and screenshots <!-- id: 19 -->
