# S05: CDP Wrapper - Tasks

## Implementation Checklist

### 1. CDP Wrapper Class
- [ ] Create src/lib/cdp-wrapper.ts <!-- id: 0 -->
- [ ] Define ScreenshotResult interface <!-- id: 1 -->
- [ ] Define MouseEventParams interface <!-- id: 2 -->
- [ ] Define NetworkRequest, ConsoleLog interfaces <!-- id: 3 -->
- [ ] Create CDPWrapper class singleton <!-- id: 4 -->

### 2. Debugger Management
- [ ] Implement attachDebugger() with CDP 1.3 <!-- id: 5 -->
- [ ] Implement detachDebugger() <!-- id: 6 -->
- [ ] Implement sendCommand() with auto-attach <!-- id: 7 -->
- [ ] Track attached tabs in Set <!-- id: 8 -->
- [ ] Handle chrome.runtime.lastError <!-- id: 9 -->

### 3. Mouse Events
- [ ] Implement dispatchMouseEvent() private method <!-- id: 10 -->
- [ ] Implement click() with single/double/triple click <!-- id: 11 -->
- [ ] Implement leftClickDrag() <!-- id: 12 -->
- [ ] Implement scroll() with direction control <!-- id: 13 -->
- [ ] Add delays between events for realism <!-- id: 14 -->

### 4. Keyboard Events
- [ ] Implement type() character by character <!-- id: 15 -->
- [ ] Implement insertText() for instant paste <!-- id: 16 -->
- [ ] Implement pressKey() for single keys <!-- id: 17 -->
- [ ] Implement pressKeyChord() for combinations <!-- id: 18 -->
- [ ] Create key definition mappings <!-- id: 19 -->

### 5. Screenshot
- [ ] Implement screenshot() method <!-- id: 20 -->
- [ ] Get viewport dimensions via scripting <!-- id: 21 -->
- [ ] Call Page.captureScreenshot <!-- id: 22 -->
- [ ] Return base64 with dimensions <!-- id: 23 -->
- [ ] Handle device pixel ratio <!-- id: 24 -->

### 6. Network Tracking
- [ ] Implement enableNetworkTracking() <!-- id: 25 -->
- [ ] Handle Network.requestWillBeSent events <!-- id: 26 -->
- [ ] Handle Network.responseReceived events <!-- id: 27 -->
- [ ] Implement getNetworkRequests() <!-- id: 28 -->
- [ ] Limit to MAX_REQUESTS (100) <!-- id: 29 -->

### 7. Console Tracking
- [ ] Implement enableConsoleTracking() <!-- id: 30 -->
- [ ] Handle Runtime.consoleAPICalled events <!-- id: 31 -->
- [ ] Handle Runtime.exceptionThrown events <!-- id: 32 -->
- [ ] Implement getConsoleLogs() <!-- id: 33 -->
- [ ] Limit to MAX_LOGS (100) <!-- id: 34 -->

### 8. Event Handler Registration
- [ ] Create global event handler <!-- id: 35 -->
- [ ] Route events to appropriate stores <!-- id: 36 -->
- [ ] Handle tab cleanup on detach <!-- id: 37 -->

### 9. Testing
- [ ] Test screenshot on various pages <!-- id: 38 -->
- [ ] Test click coordinates <!-- id: 39 -->
- [ ] Test typing in text fields <!-- id: 40 -->
- [ ] Test scroll in different directions <!-- id: 41 -->
- [ ] Test keyboard shortcuts (Ctrl+A) <!-- id: 42 -->
- [ ] Test network request capture <!-- id: 43 -->

## Success Criteria
- Screenshots capture correctly
- Clicks work at exact coordinates
- Typing appears in focused elements
- Scrolling moves page content
- Keyboard shortcuts execute
- Network requests logged accurately

### 10. Automated Testing (Playwright)
- [ ] Install Playwright dependencies <!-- id: 44 -->
- [ ] Create static build verification tests (verify dist/ output size & content) <!-- id: 45 -->
- [ ] Create integration tests for UI/Logic <!-- id: 46 -->
- [ ] Add test script to package.json <!-- id: 47 -->
- [ ] Update DEVLOG with test results and screenshots <!-- id: 48 -->
