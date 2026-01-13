# S05: CDP Wrapper - Tasks (ULTRATHINK Maximum Features)

## Implementation Checklist

### 1. Core CDP Wrapper Class
- [x] Create src/lib/cdp-wrapper.ts <!-- id: 0 -->
- [x] Define all TypeScript interfaces <!-- id: 1 -->
- [x] Create CDPWrapper class singleton <!-- id: 2 -->
- [x] Export cdpWrapper instance <!-- id: 3 -->

### 2. Debugger Management
- [x] attachDebugger(tabId) with CDP 1.3 <!-- id: 4 -->
- [x] detachDebugger(tabId) <!-- id: 5 -->
- [x] sendCommand(tabId, method, params) with auto-attach <!-- id: 6 -->
- [x] Track attached tabs in Set <!-- id: 7 -->
- [x] Handle chrome.runtime.lastError <!-- id: 8 -->
- [x] Auto-reconnect on disconnect <!-- id: 9 -->
- [x] Global CDP event handler registration <!-- id: 10 -->

### 3. DOM & Accessibility Tree (browser-use DomService parity)
- [x] Implement DOMSnapshot.captureSnapshot call <!-- id: 11 -->
- [x] Implement Accessibility.getFullAXTree call <!-- id: 12 -->
- [x] Implement DOM.getDocument with pierce iframes <!-- id: 13 -->
- [x] Parse computed styles (display, visibility, opacity) <!-- id: 14 -->
- [x] Implement paint order filtering for z-index <!-- id: 15 -->
- [x] Handle iframe content extraction <!-- id: 16 -->
- [x] Create WeakRef element map (__claudeElementMap) <!-- id: 17 -->
- [x] Generate stable ref IDs (__claudeRefCounter) <!-- id: 18 -->
- [x] Track element states (visible, enabled, focused, checked, expanded) <!-- id: 19 -->
- [x] Calculate bounding boxes with centerX/centerY <!-- id: 20 -->
- [x] Generate natural language descriptions <!-- id: 21 -->
- [x] Create text representation for LLM context <!-- id: 22 -->
- [x] Filter options: interactiveOnly, visibleOnly, maxDepth <!-- id: 23 -->

### 4. Element Reference System
- [x] getElementByRef(refId) - retrieve element info <!-- id: 24 -->
- [x] getElementByIndex(index) - browser-use style indexing <!-- id: 25 -->
- [x] findElementByDescription(description) - fuzzy matching <!-- id: 26 -->
- [x] highlightElement(ref, color) - visual overlay <!-- id: 27 -->
- [x] clearHighlights() - remove all overlays <!-- id: 28 -->
- [x] Handle WeakRef garbage collection gracefully <!-- id: 29 -->

### 5. Mouse Events (Complete Implementation)
- [x] dispatchMouseEvent(tabId, params) - base method <!-- id: 30 -->
- [x] click(tabId, options) - unified click method <!-- id: 31 -->
- [x] Support coordinates: { x, y } <!-- id: 32 -->
- [x] Support ref targeting: { ref: "ref_42" } <!-- id: 33 -->
- [x] Support index targeting: { index: 15 } <!-- id: 34 -->
- [x] Support description: { description: "..." } <!-- id: 35 -->
- [x] Support selector: { selector: ".btn" } <!-- id: 36 -->
- [x] rightClick(target) - context menu <!-- id: 37 -->
- [x] doubleClick(target) <!-- id: 38 -->
- [x] tripleClick(target) - select line <!-- id: 39 -->
- [x] hover(target) - mouse position without click <!-- id: 40 -->
- [x] drag(from, to) - drag and drop <!-- id: 41 -->
- [x] scroll(direction, amount) - directional scroll <!-- id: 42 -->
- [x] scrollToElement(ref) - scroll into view <!-- id: 43 -->
- [x] scrollToTop() / scrollToBottom() <!-- id: 44 -->

### 6. Human-Like Mouse Movement
- [x] moveMouseHumanlike(targetX, targetY) <!-- id: 45 -->
- [x] generateBezierPath() - cubic bezier with random control points <!-- id: 46 -->
- [x] Step-by-step movement with delays <!-- id: 47 -->
- [x] Random click position within element bounds <!-- id: 48 -->

### 7. Human-Like Delays Generator
- [x] Create HumanDelayGenerator class <!-- id: 49 -->
- [x] typeChar() - 50ms ± 30ms variance <!-- id: 50 -->
- [x] afterClick() - 100ms ± 25ms <!-- id: 51 -->
- [x] afterScroll() - 150ms ± 25ms <!-- id: 52 -->
- [x] mouseMoveStep() - per-step delay <!-- id: 53 -->
- [x] HumanDelayConfig interface <!-- id: 54 -->
- [x] Toggle human delays on/off from settings <!-- id: 55 -->

### 8. Keyboard Events (Complete Implementation)
- [x] type(text, options) - character by character <!-- id: 56 -->
- [x] Support delay modes: 'human' | 'fast' | number <!-- id: 57 -->
- [x] insertText(text) - instant paste via Input.insertText <!-- id: 58 -->
- [x] sendKeys(keys) - special keys array <!-- id: 59 -->
- [x] pressKey(key, modifiers) - single key <!-- id: 60 -->
- [x] pressKeyChord(chord) - parse "Ctrl+Shift+A" <!-- id: 61 -->
- [x] Complete key definitions map (Enter, Tab, Escape, arrows, etc.) <!-- id: 62 -->
- [x] Random typing delay variance <!-- id: 63 -->

### 9. Screenshots (Complete Implementation)
- [x] screenshot(options) - main method <!-- id: 64 -->
- [x] Get viewport dimensions via Page.getLayoutMetrics <!-- id: 65 -->
- [x] Page.captureScreenshot with format/quality <!-- id: 66 -->
- [x] Handle device pixel ratio scaling <!-- id: 67 -->
- [x] Capture full page option <!-- id: 68 -->
- [x] Capture specific element (clip option) <!-- id: 69 -->
- [x] Annotate with element bounding boxes <!-- id: 70 -->
- [x] Annotate with element index numbers <!-- id: 71 -->
- [x] highlightRefs option to emphasize elements <!-- id: 72 -->
- [x] Resize for token limits (maxWidth/maxHeight) <!-- id: 73 -->
- [x] Format options: PNG, JPEG, WebP <!-- id: 74 -->

### 10. Navigation & Browser Control
- [x] navigate(url) - Page.navigate <!-- id: 75 -->
- [x] search(query, engine) - construct search URL + navigate <!-- id: 76 -->
- [x] goBack() - Page.navigateHistory <!-- id: 77 -->
- [x] goForward() - Page.navigateHistory <!-- id: 78 -->
- [x] reload() - Page.reload <!-- id: 79 -->
- [x] wait(seconds) - explicit delay <!-- id: 80 -->

### 11. Smart Wait System
- [x] waitForElement(options) - poll for element <!-- id: 81 -->
- [x] Support ref, description, selector, index <!-- id: 82 -->
- [x] State conditions: visible/hidden/enabled/disabled <!-- id: 83 -->
- [x] waitForNavigation(timeout) - listen for load complete <!-- id: 84 -->
- [x] waitForNetworkIdle(idleTime, timeout) <!-- id: 85 -->
- [x] waitForSelector(css, timeout) <!-- id: 86 -->
- [x] waitForText(text, timeout) <!-- id: 87 -->
- [x] waitForUrl(pattern, timeout) <!-- id: 88 -->
- [x] Configurable timeout and poll interval <!-- id: 89 -->

### 12. Form Controls
- [x] input(ref, text) - fill text input <!-- id: 90 -->
- [x] input(ref, text, { clear: true }) - clear first <!-- id: 91 -->
- [x] getDropdownOptions(ref) - get select options <!-- id: 92 -->
- [x] selectDropdown(ref, value) - select by value <!-- id: 93 -->
- [x] selectDropdown(ref, { text }) - select by text <!-- id: 94 -->
- [x] setCheckbox(ref, checked) - check/uncheck <!-- id: 95 -->
- [x] setRadio(ref) - select radio <!-- id: 96 -->
- [x] uploadFile(ref, filePath) - DOM.setFileInputFiles <!-- id: 97 -->

### 13. Tab Management
- [x] getTabs() - chrome.tabs.query <!-- id: 98 -->
- [x] switchTab(tabId) - chrome.tabs.update active <!-- id: 99 -->
- [x] createTab(url) - chrome.tabs.create <!-- id: 100 -->
- [x] closeTab(tabId) - chrome.tabs.remove <!-- id: 101 -->
- [x] getActiveTab() - current active tab info <!-- id: 102 -->

### 14. JavaScript Execution
- [x] evaluate(code) - Runtime.evaluate <!-- id: 103 -->
- [x] evaluate(code, { returnByValue }) - get JSON result <!-- id: 104 -->
- [x] callFunction(func, args) - Runtime.callFunctionOn <!-- id: 105 -->
- [x] Handle async functions and promises <!-- id: 106 -->

### 15. Content Extraction
- [x] getText() - get body textContent <!-- id: 107 -->
- [x] getHtml() - get outerHTML <!-- id: 108 -->
- [x] extract(schema) - LLM-based structured extraction <!-- id: 109 -->
- [x] findText(query) - search and scroll to text <!-- id: 110 -->
- [x] getLinks() - extract all links <!-- id: 111 -->
- [x] getImages() - extract all images <!-- id: 112 -->

### 16. Network Monitoring
- [x] enableNetworkTracking() - Network.enable <!-- id: 113 -->
- [x] Handle Network.requestWillBeSent events <!-- id: 114 -->
- [x] Handle Network.responseReceived events <!-- id: 115 -->
- [x] getNetworkRequests() - get recent requests <!-- id: 116 -->
- [x] Limit to MAX_REQUESTS (100) <!-- id: 117 -->
- [x] setExtraHeaders(headers) - Network.setExtraHTTPHeaders <!-- id: 118 -->
- [x] setCookie(cookie) - Network.setCookie <!-- id: 119 -->
- [x] getCookies() - Network.getCookies <!-- id: 120 -->

### 17. Console Tracking
- [x] enableConsoleTracking() - Runtime.enable <!-- id: 121 -->
- [x] Handle Runtime.consoleAPICalled events <!-- id: 122 -->
- [x] Handle Runtime.exceptionThrown events <!-- id: 123 -->
- [x] getConsoleLogs() - get recent logs <!-- id: 124 -->
- [x] Limit to MAX_LOGS (100) <!-- id: 125 -->
- [x] Capture stack traces <!-- id: 126 -->

### 18. Emulation
- [x] setViewport(width, height, deviceScaleFactor) <!-- id: 127 -->
- [x] setUserAgent(userAgent) - Emulation.setUserAgentOverride <!-- id: 128 -->
- [x] setGeolocation(lat, lon) - Emulation.setGeolocationOverride <!-- id: 129 -->
- [x] setTimezone(id) - Emulation.setTimezoneOverride <!-- id: 130 -->
- [x] setLocale(locale) - Emulation.setLocaleOverride <!-- id: 131 -->

### 19. Visual Indicators
- [x] showClickIndicator(x, y) - visual dot on click <!-- id: 132 -->
- [x] showAgentIndicator() - pulsing border around page <!-- id: 133 -->
- [x] hideAgentIndicator() <!-- id: 134 -->
- [x] hideIndicatorsDuringScreenshot() <!-- id: 135 -->

### 20. Browser-Use Cloud SDK Integration
- [x] Create src/lib/browser-use-client.ts <!-- id: 136 -->
- [x] BrowserUseClient class wrapping SDK <!-- id: 137 -->
- [x] createTask(task) method <!-- id: 138 -->
- [x] task.complete() with streaming <!-- id: 139 -->
- [x] Error handling and retries <!-- id: 140 -->
- [x] API key validation <!-- id: 141 -->

### 21. Browser-Use Native Backend Integration
- [x] Create src/lib/native-host-client.ts <!-- id: 142 -->
- [x] NativeHostClient class using chrome.runtime.connectNative <!-- id: 143 -->
- [x] Python environment detection <!-- id: 144 -->
- [x] Auto-install browser-use via pip <!-- id: 145 -->
- [x] Native Messaging Host manifest generation <!-- id: 146 -->
- [x] Message protocol between extension and Python <!-- id: 147 -->
- [x] Connection health checks <!-- id: 148 -->

### 22. Settings UI
- [x] Create src/components/settings/BrowserAutomationSettings.tsx <!-- id: 149 -->
- [x] Backend selector (builtin/cloud/native) <!-- id: 150 -->
- [x] API key input for cloud backend <!-- id: 151 -->
- [x] Python path configuration for native <!-- id: 152 -->
- [x] Auto-install button for native <!-- id: 153 -->
- [x] Connection test buttons <!-- id: 154 -->
- [x] Human-like delays toggle <!-- id: 155 -->
- [x] Screenshot annotation toggle <!-- id: 156 -->
- [x] Max screenshot dimensions <!-- id: 157 -->
- [x] Integrate into provider settings page <!-- id: 158 -->

### 23. Testing
- [x] Test screenshot on various pages <!-- id: 159 -->
- [x] Test smart click by ref/index/description <!-- id: 160 -->
- [x] Test accessibility tree generation <!-- id: 161 -->
- [x] Test human-like mouse movement <!-- id: 162 -->
- [x] Test smart waits with timeouts <!-- id: 163 -->
- [x] Test form controls (input, dropdown, checkbox) <!-- id: 164 -->
- [x] Test file upload <!-- id: 165 -->
- [x] Test keyboard shortcuts <!-- id: 166 -->
- [x] Test network monitoring <!-- id: 167 -->
- [x] Test cloud SDK integration (if API key available) <!-- id: 168 -->
- [x] Test native backend (if Python available) <!-- id: 169 -->

### 24. Automated Testing (Playwright)
- [x] Install Playwright dependencies <!-- id: 170 -->
- [x] Create build verification tests <!-- id: 171 -->
- [x] Create integration tests for CDP commands <!-- id: 172 -->
- [x] Add test script to package.json <!-- id: 173 -->
- [x] Update DEVLOG with results <!-- id: 174 -->

---

## Success Criteria
- ✅ Accessibility tree generates complete semantic structure
- ✅ Smart click works by ref, index, description, or coordinates
- ✅ Human-like interactions with Bezier curves and random delays
- ✅ All form controls work (input, dropdown, checkbox, file upload)
- ✅ Smart waits properly poll for element states
- ✅ Screenshots support annotations and resizing
- ✅ Network and console monitoring functional
- ✅ Settings UI allows backend selection
- ✅ Cloud SDK integration (optional)
- ✅ Native backend integration (optional)

## Browser-Use Feature Parity

| Browser-Use Feature | Built-in CDP | Cloud SDK | Native |
|---------------------|--------------|-----------|--------|
| click/input/scroll | ✅ | ✅ | ✅ |
| Accessibility Tree | ✅ | ✅ | ✅ |
| Human-like delays | ✅ | ✅ | ✅ |
| Screenshot | ✅ | ✅ | ✅ |
| Form automation | ✅ | ✅ | ✅ |
| File upload | ✅ | ✅ | ✅ |
| Search engines | ✅ | ✅ | ✅ |
| Tab management | ✅ | ✅ | ✅ |
| JavaScript eval | ✅ | ✅ | ✅ |
| Network headers | ✅ | ✅ | ✅ |
| Stealth mode | ⚠️ Basic | ✅ Full | ✅ Full |
| File system access | ❌ | ✅ | ✅ |