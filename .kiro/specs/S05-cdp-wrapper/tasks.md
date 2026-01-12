# S05: CDP Wrapper - Tasks

## Implementation Checklist

### 1. CDP Wrapper Class
- [ ] Create src/lib/cdp-wrapper.ts
- [ ] Define ScreenshotResult interface
- [ ] Define MouseEventParams interface
- [ ] Define NetworkRequest, ConsoleLog interfaces
- [ ] Create CDPWrapper class singleton

### 2. Debugger Management
- [ ] Implement attachDebugger() with CDP 1.3
- [ ] Implement detachDebugger()
- [ ] Implement sendCommand() with auto-attach
- [ ] Track attached tabs in Set
- [ ] Handle chrome.runtime.lastError

### 3. Mouse Events
- [ ] Implement dispatchMouseEvent() private method
- [ ] Implement click() with single/double/triple click
- [ ] Implement leftClickDrag()
- [ ] Implement scroll() with direction control
- [ ] Add delays between events for realism

### 4. Keyboard Events
- [ ] Implement type() character by character
- [ ] Implement insertText() for instant paste
- [ ] Implement pressKey() for single keys
- [ ] Implement pressKeyChord() for combinations
- [ ] Create key definition mappings

### 5. Screenshot
- [ ] Implement screenshot() method
- [ ] Get viewport dimensions via scripting
- [ ] Call Page.captureScreenshot
- [ ] Return base64 with dimensions
- [ ] Handle device pixel ratio

### 6. Network Tracking
- [ ] Implement enableNetworkTracking()
- [ ] Handle Network.requestWillBeSent events
- [ ] Handle Network.responseReceived events
- [ ] Implement getNetworkRequests()
- [ ] Limit to MAX_REQUESTS (100)

### 7. Console Tracking
- [ ] Implement enableConsoleTracking()
- [ ] Handle Runtime.consoleAPICalled events
- [ ] Handle Runtime.exceptionThrown events
- [ ] Implement getConsoleLogs()
- [ ] Limit to MAX_LOGS (100)

### 8. Event Handler Registration
- [ ] Create global event handler
- [ ] Route events to appropriate stores
- [ ] Handle tab cleanup on detach

### 9. Testing
- [ ] Test screenshot on various pages
- [ ] Test click coordinates
- [ ] Test typing in text fields
- [ ] Test scroll in different directions
- [ ] Test keyboard shortcuts (Ctrl+A)
- [ ] Test network request capture

## Success Criteria
- Screenshots capture correctly
- Clicks work at exact coordinates
- Typing appears in focused elements
- Scrolling moves page content
- Keyboard shortcuts execute
- Network requests logged accurately
