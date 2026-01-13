# S05: CDP Wrapper - Requirements (ULTRATHINK Maximum Browser-Use Parity)

## Feature Description
Implement a **maximum-capability** Chrome DevTools Protocol wrapper that achieves **100% browser-use feature parity** using native CDP access. This provides all browser automation capabilities without external dependencies.

## Integration Options in Settings UI

### Option 1: Built-in CDP Engine (Default) ⭐ RECOMMENDED

**Description for UI:**
> 🚀 **Built-in Browser Control**
> 
> Uses Chrome's native DevTools Protocol for direct browser automation. No external services or setup required.

**Features Available:**
- ✅ Click, type, scroll, navigate
- ✅ Screenshots with element annotations
- ✅ Smart element targeting (by description, index, or ref)
- ✅ Human-like delays and mouse movement
- ✅ Form filling (inputs, dropdowns, checkboxes)
- ✅ Tab management
- ✅ JavaScript execution
- ✅ Network and console monitoring
- ✅ Works offline
- ⚠️ Basic stealth (may be detected on some sites)
- ❌ File system access (Chrome limitation)

**Setup:** None - works out of the box!

---

### Option 2: Browser-Use Cloud SDK

**Description for UI:**
> ☁️ **Cloud-Powered Automation**
> 
> Powered by [browser-use.com](https://browser-use.com). Tasks run on remote stealth browsers with advanced anti-detection. Requires API key.

**Extra Features vs Built-in:**
- ✅ **Advanced Stealth Mode** - Undetectable on protected sites
- ✅ **Sandboxed Execution** - Isolated browser environments
- ✅ **File System Access** - Read/write files on cloud
- ✅ **Persistent Sessions** - Save browser state across tasks
- ✅ **Structured Output** - LLM-extracted JSON data
- ✅ **Streaming Responses** - Real-time task progress

**Setup:**
1. Get API key from [browser-use.com](https://cloud.browser-use.com)
2. Paste in the field below
3. Test connection

**Pricing:** Pay per task (~$0.01-0.10 per task depending on complexity)

---

### Option 3: Browser-Use Native Backend

**Description for UI:**
> 🐍 **Local Python Backend**
> 
> Runs the full browser-use Python library on your machine. Maximum power with all features, including file access.

**Extra Features vs Built-in:**
- ✅ **Full Stealth Mode** - Complete anti-detection
- ✅ **File System Access** - Read/write local files
- ✅ **Custom Skills** - Create reusable automation patterns
- ✅ **Headless/Headed Mode** - Choose visibility
- ✅ **Browser Profiles** - Save cookies, sessions
- ✅ **Parallel Execution** - Multiple browsers

**Requirements:**
- Python 3.11+ installed
- 500MB disk space for browser-use + Chromium

**Setup Flow in UI:**
1. **Check Status** - Button to detect if native host is installed
2. If NOT installed:
   - Show "Setup Required" message
   - **"Open Setup Guide" button** → Opens [browser-use quickstart](https://docs.browser-use.com/quickstart) in new tab
   - **Copy Install Command** button → Copies `pip install browser-use` to clipboard
   - **Download Installer Script** button → Downloads our setup script (PowerShell/Bash) that:
     - Installs browser-use via pip
     - Registers Native Messaging Host
     - Installs Chromium if needed
3. If installed:
   - Show "Connected ✅" status
   - Show version info
   - **"Test Connection"** button

**Native Messaging Host Registration:**
- Windows: Registry key + manifest JSON
- macOS: ~/Library/Application Support/Google/Chrome/NativeMessagingHosts/
- Linux: ~/.config/google-chrome/NativeMessagingHosts/

**Note:** One-time setup. After installation, it works automatically.

---

## User Stories

### US1: Screenshot & Visual Analysis
**As a** user (AI agent)
**I want** to capture annotated screenshots with element markers
**So that** I can see and understand page content

### US2: Smart Element Targeting
**As a** user (AI agent)
**I want** to interact with elements by index, ref, description, or coordinates
**So that** I can reliably target any element

### US3: Human-Like Input
**As a** user (AI agent)
**I want** to type and click with realistic timing
**So that** I avoid bot detection

### US4: DOM & Accessibility Understanding
**As a** user (AI agent)
**I want** to get a complete semantic representation of pages
**So that** I can make informed decisions

### US5: Form Automation
**As a** user (AI agent)
**I want** to fill forms, select dropdowns, upload files
**So that** I can complete complex workflows

### US6: Tab & Window Management
**As a** user (AI agent)
**I want** to manage multiple tabs and windows
**So that** I can work across pages

### US7: JavaScript Execution
**As a** user (AI agent)
**I want** to execute custom JavaScript
**So that** I can handle edge cases

### US8: Network & Content
**As a** user (AI agent)
**I want** to monitor network requests and extract content
**So that** I can understand page behavior

---

## Acceptance Criteria - MAXIMUM FEATURE SET

### AC1: DOM & Accessibility Tree (browser-use DomService parity)
- [ ] DOMSnapshot.captureSnapshot - Full DOM with bounding boxes
- [ ] Accessibility.getFullAXTree - Complete accessibility tree
- [ ] DOM.getDocument - Full DOM structure with pierce iframes
- [ ] Computed styles for visibility detection (display, visibility, opacity)
- [ ] Paint order filtering for z-index awareness
- [ ] iframe content extraction (configurable depth)
- [ ] Stable element ref IDs using WeakRef map
- [ ] Element state tracking (visible, enabled, focused, checked, expanded)
- [ ] Natural language descriptions for each element
- [ ] Text representation output for LLM context

### AC2: Mouse Events (Complete Input.dispatchMouseEvent)
- [ ] click(x, y) - Single left click
- [ ] click(ref: "element_42") - Click by ref ID
- [ ] click(index: 15) - Click by element index (browser-use style)
- [ ] click(description: "blue submit button") - Natural language targeting
- [ ] rightClick(target) - Context menu
- [ ] doubleClick(target) - Double click
- [ ] tripleClick(target) - Triple click (select line)
- [ ] hover(target) - Mouse hover without click
- [ ] drag(from, to) - Drag and drop
- [ ] scroll(direction, amount) - Directional scroll
- [ ] scrollToElement(ref) - Scroll element into view
- [ ] Bezier curve mouse movement (human-like)
- [ ] Random delay variance (50-150ms)

### AC3: Keyboard Events (Complete Input.dispatchKeyEvent)
- [ ] type(text) - Character by character with delays
- [ ] type(text, { delay: 'human' | 'fast' | number })
- [ ] insertText(text) - Instant paste
- [ ] sendKeys(keys) - Special keys (Enter, Escape, Tab, ArrowDown...)
- [ ] pressKeyChord(chord) - Combinations (Ctrl+A, Ctrl+V, Cmd+C)
- [ ] Random typing delay (20-100ms per char)
- [ ] Support all modifier keys (Ctrl, Alt, Shift, Meta)

### AC4: Screenshots (Page.captureScreenshot enhanced)
- [ ] Capture viewport
- [ ] Capture full page
- [ ] Capture specific element
- [ ] Handle device pixel ratio scaling
- [ ] Annotate with element bounding boxes
- [ ] Annotate with element index numbers (browser-use style)
- [ ] Highlight specific elements
- [ ] Resize for token limits (configurable max dimensions)
- [ ] Format options (PNG, JPEG, WebP)
- [ ] Quality settings for JPEG

### AC5: Navigation & Browser Control
- [ ] navigate(url) - Go to URL
- [ ] search(query, engine) - DuckDuckGo/Google/Bing search
- [ ] goBack() - Browser history back
- [ ] goForward() - Browser history forward
- [ ] reload() - Refresh page
- [ ] wait(seconds) - Explicit delay
- [ ] waitForNavigation(timeout) - Wait for page load
- [ ] waitForNetworkIdle(timeout) - Wait for network quiet

### AC6: Smart Wait System (browser-use style)
- [ ] waitForElement(options) - Wait for element to appear
- [ ] waitForElementState(ref, state) - visible/hidden/enabled/disabled
- [ ] waitForSelector(cssSelector) - CSS selector wait
- [ ] waitForText(text) - Wait for text to appear
- [ ] waitForUrl(pattern) - Wait for URL match
- [ ] Configurable timeout and poll interval
- [ ] Auto-retry with exponential backoff

### AC7: Form Controls (browser-use form parity)
- [ ] input(ref, text) - Fill text input
- [ ] input(ref, text, { clear: true }) - Clear and fill
- [ ] getDropdownOptions(ref) - Get select options
- [ ] selectDropdown(ref, value) - Select by value
- [ ] selectDropdown(ref, { text: "Option" }) - Select by text
- [ ] setCheckbox(ref, checked) - Check/uncheck
- [ ] setRadio(ref) - Select radio button
- [ ] uploadFile(ref, filePath) - File upload via DOM.setFileInputFiles

### AC8: Tab Management (chrome.tabs + CDP)
- [ ] getTabs() - List all tabs
- [ ] switchTab(tabId) - Switch to tab
- [ ] createTab(url) - Open new tab
- [ ] closeTab(tabId) - Close tab
- [ ] getActiveTab() - Get current tab info
- [ ] Tab groups support

### AC9: JavaScript Execution (Runtime.evaluate)
- [ ] evaluate(code) - Execute JS and get result
- [ ] evaluate(code, { returnByValue: true }) - Get JSON result
- [ ] callFunction(func, args) - Call function with args
- [ ] Shadow DOM access
- [ ] Custom selector support

### AC10: Content Extraction
- [ ] getText() - Get page text content
- [ ] getHtml() - Get page HTML
- [ ] extract(schema) - LLM-based structured extraction
- [ ] findText(query) - Find and scroll to text
- [ ] getLinks() - Get all links on page
- [ ] getImages() - Get all images on page

### AC11: Network Monitoring (Network domain)
- [ ] enableNetworkTracking() - Start monitoring
- [ ] getNetworkRequests() - Get recent requests
- [ ] getNetworkRequest(id) - Get specific request with response
- [ ] setExtraHeaders(headers) - Add custom headers
- [ ] setCookie(cookie) - Set cookies
- [ ] getCookies() - Get all cookies
- [ ] clearCookies() - Clear cookies

### AC12: Console Tracking (Runtime domain)
- [ ] enableConsoleTracking() - Start monitoring
- [ ] getConsoleLogs() - Get recent logs
- [ ] Clear/filter by type (log, warn, error, info)
- [ ] Capture exception stack traces

### AC13: Emulation (for testing/stealth)
- [ ] setViewport(width, height, deviceScaleFactor)
- [ ] setUserAgent(userAgent)
- [ ] setGeolocation(latitude, longitude)
- [ ] setTimezone(timezoneId)
- [ ] setLocale(locale)
- [ ] Mobile device emulation

### AC14: Visual Indicators (debugging/demo mode)
- [ ] showClickIndicator(x, y) - Visual feedback on click
- [ ] highlightElement(ref, color) - Highlight elements
- [ ] clearHighlights() - Remove highlights
- [ ] showAgentIndicator() - Pulsing border during automation
- [ ] hideIndicatorsDuringScreenshot() - Clean screenshots

### AC15: Human-Like Interactions (stealth)
- [ ] HumanDelayGenerator class
- [ ] Randomized typing speed (20-100ms variance)
- [ ] Natural mouse curves (Bezier paths)
- [ ] Random click position within element
- [ ] Scroll speed variation
- [ ] Occasional "mistakes" and corrections (optional)

---

## Settings UI Requirements

### Browser Automation Backend Section
```typescript
interface BrowserAutomationSettings {
  // Backend selection
  backend: 'builtin' | 'browser-use-cloud' | 'browser-use-native';
  
  // Browser-Use Cloud (if backend === 'browser-use-cloud')
  browserUseApiKey?: string;
  
  // Browser-Use Native (if backend === 'browser-use-native')
  pythonPath?: string;
  browserUsePath?: string;
  autoInstall?: boolean;
  
  // Behavior settings
  humanLikeDelays: boolean;
  stealthMode: boolean;
  screenshotAnnotations: boolean;
  maxScreenshotWidth: number;
  maxScreenshotHeight: number;
}
```

### Installation Flow for Native Backend
1. Check if Python installed
2. Offer to install browser-use via pip
3. Setup Native Messaging Host manifest
4. Test connection
5. Show success/error status

---

## Dependencies
- S01: Extension scaffold (service worker)
- S03: Provider settings (for multi-provider integration)

## Chrome APIs Used
- chrome.debugger (CDP access)
- chrome.scripting.executeScript
- chrome.tabs
- chrome.downloads (for file saving)
- chrome.runtime.connectNative (for native backend)

## Files to Create
- src/lib/cdp-wrapper.ts (main CDP wrapper)
- src/lib/accessibility-tree.ts (DOM/accessibility parsing)
- src/lib/element-references.ts (ref ID system)
- src/lib/human-delays.ts (human-like timing)
- src/lib/browser-use-client.ts (cloud SDK wrapper)
- src/lib/native-host-client.ts (native messaging client)
- src/content/accessibility-tree.js (content script)
- src/components/settings/BrowserAutomationSettings.tsx (settings UI)
