# S05: CDP Wrapper - Implementation Plan

## Overview

This implementation plan provides comprehensive Chrome DevTools Protocol wrapper functionality with maximum browser-use feature parity. The solution implements direct CDP access for browser automation without external dependencies.

## Tasks

- [x] 1. Core CDP Wrapper Implementation
  - Create src/lib/cdp-wrapper.ts with CDPWrapper singleton class
  - Define all TypeScript interfaces (ClickOptions, ScreenshotOptions, etc.)
  - Implement debugger attachment/detachment with auto-reconnect
  - Track attached tabs and handle chrome.runtime.lastError
  - _Requirements: AC1.1, AC1.2, AC1.3_

- [x] 1.1 Write unit tests for debugger management
  - Test attach/detach functionality
  - Test auto-reconnect behavior
  - Test error handling
  - _Requirements: AC1.1_

- [x] 2. DOM & Accessibility Tree Implementation
  - Implement DOMSnapshot.captureSnapshot for full DOM with bounding boxes
  - Implement Accessibility.getFullAXTree for accessibility tree
  - Parse computed styles (display, visibility, opacity)
  - Handle iframe content extraction
  - Create WeakRef element map with stable ref IDs
  - Generate natural language descriptions for elements
  - _Requirements: AC1.4, AC1.5, AC1.6, AC1.7, AC1.8, AC1.9, AC1.10_

- [x] 2.1 Write tests for accessibility tree generation
  - Test element reference system
  - Test description generation
  - Test bounding box calculation
  - _Requirements: AC1.7, AC1.9_

- [x] 3. Mouse Events Implementation
  - Implement dispatchMouseEvent base method
  - Add click methods (single, double, triple, right)
  - Support targeting: coordinates, ref, index, description, selector
  - Implement hover, drag & drop, scroll methods
  - Add human-like mouse movement with Bezier curves
  - _Requirements: AC2.1, AC2.2, AC2.3, AC2.4, AC2.5, AC2.6, AC2.7, AC2.8, AC2.9, AC2.10, AC2.11, AC2.12, AC2.13_

- [x] 3.1 Write tests for mouse interactions
  - Test click targeting methods
  - Test human-like movement generation
  - Test scroll behavior
  - _Requirements: AC2.1, AC2.5_

- [x] 4. Keyboard Events Implementation
  - Implement type() with character-by-character delays
  - Implement insertText() for instant paste
  - Implement sendKeys() for special keys
  - Implement pressKeyChord() for key combinations
  - Add random typing delay variance (20-100ms)
  - _Requirements: AC3.1, AC3.2, AC3.3, AC3.4, AC3.5, AC3.6, AC3.7_

- [x] 4.1 Write tests for keyboard interactions
  - Test typing with delays
  - Test key chord parsing
  - Test special key handling
  - _Requirements: AC3.1, AC3.4_

- [x] 5. Screenshot System Implementation
  - Implement Page.captureScreenshot for viewport
  - Add full page and element capture
  - Handle device pixel ratio scaling
  - Add element annotation with bounding boxes
  - Implement resize for token limits
  - _Requirements: AC4.1, AC4.2, AC4.3, AC4.4, AC4.5, AC4.6, AC4.7, AC4.8, AC4.9, AC4.10_

- [x] 5.1 Write tests for screenshot capture
  - Test annotation rendering
  - Test resizing behavior
  - _Requirements: AC4.5, AC4.8_

- [x] 6. Navigation & Browser Control
  - Implement navigate(url) with Page.navigate
  - Implement search(query, engine) with engine URL construction
  - Implement history navigation (back, forward)
  - Implement page reload
  - Add waitForNavigation and waitForNetworkIdle
  - _Requirements: AC5.1, AC5.2, AC5.3, AC5.4, AC5.5, AC5.6, AC5.7, AC5.8_

- [x] 7. Smart Wait System Implementation
  - Implement waitForElement with ref/description/selector/index support
  - Add state conditions: visible/hidden/enabled/disabled
  - Implement waitForSelector, waitForText, waitForUrl
  - Add configurable timeout and poll interval
  - Implement auto-retry with exponential backoff
  - _Requirements: AC6.1, AC6.2, AC6.3, AC6.4, AC6.5, AC6.6, AC6.7, AC6.8, AC6.9, AC6.10_

- [x] 8. Checkpoint - Test Core CDP Functionality
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Form Controls Implementation
  - Implement input() for text fields with clear option
  - Implement getDropdownOptions() and selectDropdown()
  - Implement setCheckbox() and setRadio()
  - Implement uploadFile() with DOM.setFileInputFiles
  - _Requirements: AC7.1, AC7.2, AC7.3, AC7.4, AC7.5, AC7.6, AC7.7, AC7.8_

- [x] 10. Tab Management Implementation
  - Implement getTabs(), switchTab(), createTab(), closeTab()
  - Implement getActiveTab() with tab info
  - Add tab groups support
  - _Requirements: AC8.1, AC8.2, AC8.3, AC8.4, AC8.5, AC8.6_

- [x] 11. JavaScript Execution Implementation
  - Implement evaluate() with Runtime.evaluate
  - Support returnByValue option for JSON results
  - Implement callFunction() with arguments
  - Handle async functions and promises
  - _Requirements: AC9.1, AC9.2, AC9.3, AC9.4_

- [x] 12. Content Extraction Implementation
  - Implement getText(), getHtml()
  - Implement extract() for LLM-based structured extraction
  - Implement findText() with scroll-to functionality
  - Implement getLinks(), getImages()
  - _Requirements: AC10.1, AC10.2, AC10.3, AC10.4, AC10.5, AC10.6_

- [x] 13. Network Monitoring Implementation
  - Implement enableNetworkTracking()
  - Handle Network.requestWillBeSent and responseReceived events
  - Implement getNetworkRequests() with MAX_REQUESTS limit
  - Add setExtraHeaders(), setCookie(), getCookies(), clearCookies()
  - _Requirements: AC11.1, AC11.2, AC11.3, AC11.4, AC11.5, AC11.6, AC11.7, AC11.8_

- [x] 14. Console Tracking Implementation
  - Implement enableConsoleTracking()
  - Handle Runtime.consoleAPICalled and exceptionThrown events
  - Implement getConsoleLogs() with MAX_LOGS limit
  - Capture exception stack traces
  - _Requirements: AC12.1, AC12.2, AC12.3, AC12.4, AC12.5, AC12.6_

- [x] 15. Emulation Implementation
  - Implement setViewport() with device scale factor
  - Implement setUserAgent(), setGeolocation(), setTimezone(), setLocale()
  - Add mobile device emulation support
  - _Requirements: AC13.1, AC13.2, AC13.3, AC13.4, AC13.5, AC13.6_

- [x] 16. Visual Indicators Implementation
  - Implement showClickIndicator() with visual dot
  - Implement showAgentIndicator() with pulsing border
  - Implement hideIndicatorsDuringScreenshot()
  - _Requirements: AC14.1, AC14.2, AC14.3, AC14.4_

- [x] 17. Human Delays System Implementation
  - Create src/lib/human-delays.ts with HumanDelayGenerator class
  - Implement randomized typing speed (20-100ms variance)
  - Implement natural mouse curves with Bezier paths
  - Add random click position jitter within elements
  - Add scroll speed variation
  - _Requirements: AC15.1, AC15.2, AC15.3, AC15.4, AC15.5, AC15.6_

- [x] 18. Checkpoint - Test Advanced Features
  - Ensure all tests pass, ask the user if questions arise.

- [x] 19. Browser-Use Cloud SDK Integration
  - Create src/lib/browser-use-client.ts
  - Implement BrowserUseClient class with API key auth
  - Add task creation and streaming methods
  - Implement session management
  - _Requirements: Settings UI Option 2_

- [x] 20. Native Backend Integration
  - Create src/lib/native-host-client.ts
  - Implement NativeHostClient with chrome.runtime.connectNative
  - Add Python environment detection
  - Implement connection testing and health monitoring
  - _Requirements: Settings UI Option 3_

- [x] 21. Settings UI Component
  - Create src/components/settings/BrowserAutomationSettings.tsx
  - Implement backend selection (builtin/cloud/native)
  - Add API key input for cloud SDK
  - Add Python path configuration for native
  - Add human delays and screenshot settings
  - Implement connection test buttons
  - _Requirements: Settings UI Requirements_

- [x] 22. Integration Testing
  - Test CDP wrapper with real browser interactions
  - Test cloud SDK connection and task execution
  - Test native backend setup flow
  - Test settings persistence
  - _Requirements: All_

- [x] 23. Documentation and Examples
  - Update PROVIDER_LIST.md with CDP wrapper info
  - Add troubleshooting guide for common issues
  - Create usage examples for each feature category
  - _Requirements: Supporting documentation_

- [x] 24. Final Checkpoint - Complete System Verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required for comprehensive CDP wrapper implementation
- Each task references specific acceptance criteria for traceability
- Checkpoints (8, 18, 24) ensure system stability before proceeding
- ZAI-style endpoint configuration should be verified against actual API docs
- Human delays are critical for stealth mode anti-detection