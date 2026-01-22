# SidePilot E2E Testing Guide

## 🎯 Overview

Comprehensive end-to-end testing for the SidePilot Chrome extension using Playwright. Tests all functionality programmatically with visual verification.

## 🚀 Quick Start

### 1. Run All Tests
```bash
node scripts/run-e2e-tests.js
```

This will:
- ✅ Build the extension
- ✅ Create screenshot directory
- ✅ Run 23 comprehensive tests
- ✅ Generate HTML report
- ✅ Open report in browser

### 2. Run Specific Tests
```bash
# Run only UI tests
npx playwright test tests/e2e-comprehensive.spec.ts --headed --grep "SidePilot Extension"

# Run only browser automation tests
npx playwright test tests/e2e-comprehensive.spec.ts --headed --grep "Browser Automation"

# Run with debug mode
npx playwright test tests/e2e-comprehensive.spec.ts --headed --debug
```

### 3. View Results
```bash
# Open HTML report
npx playwright show-report

# View screenshots
open screenshots/e2e-tests/
```

## 📋 Test Coverage

### UI Tests (Tests 1-21)
1. ✅ Extension loads successfully
2. ✅ Side panel opens and displays
3. ✅ Navigate to Settings page
4. ✅ Provider configuration UI
5. ✅ General settings
6. ✅ Navigate to Chat page
7. ✅ Chat input area
8. ✅ Model selector
9. ✅ Voice controls
10. ✅ Conversation management
11. ✅ Shortcuts/slash commands
12. ✅ Browser automation settings
13. ✅ Permissions manager
14. ✅ MCP integration
15. ✅ Workflow recording
16. ✅ Responsive layout (3 viewports)
17. ✅ Theme switching
18. ✅ Language switching
19. ✅ Error handling
20. ✅ Final state screenshot
21. ✅ Console errors check

### Browser Automation Tests (Tests 22-23)
22. ✅ CDP wrapper integration
23. ✅ Accessibility tree extraction

## 📸 Screenshot Verification

All tests capture screenshots for visual verification:

```
screenshots/e2e-tests/
├── 01-sidepanel-initial.png       # Initial side panel state
├── 02-settings-page.png           # Settings page
├── 03-add-provider.png            # Provider addition flow
├── 04-provider-dropdown.png       # Provider selection
├── 05-general-settings.png        # General settings
├── 06-chat-page.png               # Chat interface
├── 07-chat-input-filled.png       # Chat with message
├── 08-model-selector.png          # Model selection
├── 09-voice-controls.png          # Voice features
├── 10-conversation-management.png # Conversation tools
├── 11-slash-menu.png              # Slash commands
├── 12-browser-automation.png      # Automation settings
├── 13-permissions.png             # Permission manager
├── 14-mcp-integration.png         # MCP settings
├── 15-workflow-recording.png      # Recording UI
├── 16-responsive-narrow.png       # 400px width
├── 16-responsive-medium.png       # 600px width
├── 16-responsive-wide.png         # 800px width
├── 17-theme-before.png            # Light theme
├── 17-theme-after.png             # Dark theme
├── 18-language-before.png         # English
├── 18-language-after.png          # Portuguese
├── 19-error-handling.png          # Error states
├── 20-final-state.png             # Final UI state
├── 22-cdp-test-page.png           # CDP integration
└── ...
```

## 🔧 Advanced Usage

### Debug Mode
```bash
# Step through tests with Playwright Inspector
npx playwright test tests/e2e-comprehensive.spec.ts --debug
```

### Headed Mode (Watch Tests Run)
```bash
# See Chrome window during tests
npx playwright test tests/e2e-comprehensive.spec.ts --headed
```

### Specific Test
```bash
# Run single test by name
npx playwright test tests/e2e-comprehensive.spec.ts --headed -g "Side panel opens"
```

### Update Snapshots
```bash
# Update visual regression snapshots
npx playwright test tests/e2e-comprehensive.spec.ts --update-snapshots
```

## 📊 Test Reports

### HTML Report
- **Location**: `playwright-report/index.html`
- **Features**:
  - Test results with pass/fail status
  - Screenshots for each step
  - Console logs and errors
  - Execution timeline
  - Retry information

### Console Output
- Real-time test progress
- Screenshot count
- Error summaries
- Performance metrics

## 🐛 Troubleshooting

### Extension Not Loading
```bash
# Ensure extension is built
npm run build

# Check dist/ directory exists
ls -la dist/
```

### Tests Timing Out
```bash
# Increase timeout in playwright.config.ts
timeout: 60000  # 60 seconds
```

### Screenshots Not Captured
```bash
# Ensure directory exists
mkdir -p screenshots/e2e-tests

# Check permissions
chmod 755 screenshots/e2e-tests
```

### Chrome Not Opening
```bash
# Install Playwright browsers
npx playwright install chromium

# Check Playwright installation
npx playwright --version
```

## 🎨 Visual Regression Testing

### Capture Baseline
```bash
# First run captures baseline screenshots
npx playwright test tests/e2e-comprehensive.spec.ts --headed
```

### Compare Changes
```bash
# Subsequent runs compare against baseline
npx playwright test tests/e2e-comprehensive.spec.ts --headed

# View differences in report
npx playwright show-report
```

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - run: npx playwright test tests/e2e-comprehensive.spec.ts
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: screenshots
          path: screenshots/e2e-tests/
```

## 📝 Writing New Tests

### Test Structure
```typescript
test('Test name', async () => {
  // 1. Setup
  const element = sidePanelPage.locator('selector');
  
  // 2. Action
  await element.click();
  await sidePanelPage.waitForTimeout(500);
  
  // 3. Screenshot
  await sidePanelPage.screenshot({ 
    path: path.join(SCREENSHOTS_PATH, 'test-name.png'),
    fullPage: true 
  });
  
  // 4. Assertion
  await expect(element).toBeVisible();
  
  // 5. Log
  console.log('✅ Test passed');
});
```

### Best Practices
1. **Wait for stability**: Use `waitForLoadState('networkidle')`
2. **Take screenshots**: Capture before/after states
3. **Use semantic selectors**: Prefer `text=`, `aria-label`, `role=`
4. **Add timeouts**: Allow time for animations
5. **Log progress**: Use console.log for debugging
6. **Handle failures**: Use try/catch for optional features

## 🎯 Test Scenarios

### Critical Path
1. Extension loads → Side panel opens → Settings work → Chat works

### Provider Configuration
1. Add provider → Configure API key → Select model → Test connection

### Chat Flow
1. Type message → Send → Receive response → View tool calls

### Browser Automation
1. Navigate page → Extract content → Click element → Verify action

## 📈 Performance Metrics

Tests track:
- Extension load time
- Page navigation speed
- UI responsiveness
- Screenshot capture time
- Total test duration

## 🔐 Security Testing

Tests verify:
- API keys not exposed in screenshots
- Permissions properly gated
- Content script isolation
- Storage encryption (if enabled)

## 🌐 Cross-Browser Testing

Currently supports:
- ✅ Chrome/Chromium (primary)
- ⏳ Edge (planned)
- ⏳ Brave (planned)

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Chrome Extension Testing](https://playwright.dev/docs/chrome-extensions)
- [Visual Regression Testing](https://playwright.dev/docs/test-snapshots)
- [Debugging Tests](https://playwright.dev/docs/debug)

## 💡 Tips

1. **Run tests frequently** - Catch regressions early
2. **Review screenshots** - Visual verification is powerful
3. **Use headed mode** - Watch tests to understand failures
4. **Check console logs** - Errors often reveal root causes
5. **Update baselines** - When UI intentionally changes
6. **Test on clean state** - Clear storage between runs
7. **Mock external APIs** - For consistent test results
8. **Parallelize tests** - Speed up execution (with caution)

## 🎉 Success Criteria

All tests passing means:
- ✅ Extension loads without errors
- ✅ All UI components render correctly
- ✅ Navigation works smoothly
- ✅ Settings persist properly
- ✅ Chat interface functional
- ✅ Browser automation ready
- ✅ No console errors
- ✅ Responsive design works
- ✅ Theme/language switching works
- ✅ Error handling graceful

---

**Happy Testing! 🚀**
