# SidePilot Test Suite

## 📚 Test Types

### 1. E2E Tests (End-to-End)
**File**: `e2e-comprehensive.spec.ts`  
**Purpose**: Test entire extension functionality with real Chrome browser

```bash
# Run all E2E tests with report
npm run test:e2e

# Watch tests execute
npm run test:e2e:headed

# Debug step-by-step
npm run test:e2e:debug

# Test only UI
npm run test:e2e:ui

# Test only browser automation
npm run test:e2e:tools
```

**Coverage**:
- ✅ Extension loading
- ✅ Side panel UI
- ✅ Settings configuration
- ✅ Chat interface
- ✅ Provider management
- ✅ Voice controls
- ✅ Shortcuts
- ✅ Permissions
- ✅ MCP integration
- ✅ Responsive design
- ✅ Theme/language switching
- ✅ Error handling
- ✅ Browser automation tools

### 2. Unit Tests
**Location**: `src/**/__tests__/*.test.ts(x)`  
**Purpose**: Test individual components and functions

```bash
# Run all unit tests
npm run test:unit

# Run once (CI mode)
npm run test:unit:run

# Watch mode
npm run test:unit
```

**Coverage**:
- React components
- Stores (Zustand)
- Utilities
- Providers
- Tools
- Libraries

### 3. Integration Tests
**Files**: Various `*.spec.ts` files  
**Purpose**: Test component interactions

```bash
# Run all Playwright tests
npm test

# Run with UI
npm run test:ui
```

## 🎯 Quick Start

### Run Everything
```bash
# 1. Build extension
npm run build

# 2. Run E2E tests (recommended)
npm run test:e2e

# 3. Run unit tests
npm run test:unit:run
```

### Watch Tests During Development
```bash
# Terminal 1: Build on change
npm run dev

# Terminal 2: Run unit tests on change
npm run test:unit

# Terminal 3: Run E2E when needed
npm run test:e2e:headed
```

## 📸 Screenshots

E2E tests capture 20+ screenshots:
- **Location**: `screenshots/e2e-tests/`
- **Purpose**: Visual verification of UI
- **Format**: PNG, full page
- **Naming**: Sequential (01-*, 02-*, etc.)

## 📊 Reports

### Playwright HTML Report
- **Location**: `playwright-report/index.html`
- **Open**: `npx playwright show-report`
- **Features**:
  - Test results
  - Screenshots
  - Console logs
  - Execution timeline

### Vitest UI
- **Open**: `npm run test:unit`
- **Features**:
  - Live test results
  - Code coverage
  - Test filtering
  - Watch mode

## 🐛 Debugging

### E2E Tests
```bash
# Step through with Playwright Inspector
npm run test:e2e:debug

# Watch in headed mode
npm run test:e2e:headed

# Run specific test
npx playwright test tests/e2e-comprehensive.spec.ts -g "Side panel opens"
```

### Unit Tests
```bash
# Run specific test file
npx vitest src/components/chat/__tests__/InputArea.test.tsx

# Run with coverage
npx vitest --coverage

# Debug in VS Code
# Add breakpoint, press F5, select "Debug Vitest"
```

## 🔧 Configuration

### Playwright Config
**File**: `playwright.config.ts`
- Timeout: 30s per test
- Retries: 2 on CI, 0 locally
- Workers: 1 (for extension tests)
- Reporter: HTML + list

### Vitest Config
**File**: `vite.config.ts`
- Environment: jsdom
- Coverage: v8
- Globals: true
- Setup: `src/test-setup.ts`

## 📝 Writing Tests

### E2E Test Template
```typescript
test('Feature name', async () => {
  // 1. Navigate/setup
  const element = sidePanelPage.locator('selector');
  
  // 2. Interact
  await element.click();
  await sidePanelPage.waitForTimeout(500);
  
  // 3. Screenshot
  await sidePanelPage.screenshot({ 
    path: path.join(SCREENSHOTS_PATH, 'feature.png'),
    fullPage: true 
  });
  
  // 4. Assert
  await expect(element).toBeVisible();
  
  // 5. Log
  console.log('✅ Feature tested');
});
```

### Unit Test Template
```typescript
import { render, screen } from '@testing-library/react';
import { expect, test, describe } from 'vitest';
import { Component } from './Component';

describe('Component', () => {
  test('renders correctly', () => {
    render(<Component />);
    expect(screen.getByText('Expected text')).toBeInTheDocument();
  });
  
  test('handles interaction', async () => {
    const { user } = render(<Component />);
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Result')).toBeInTheDocument();
  });
});
```

## 🎨 Best Practices

### E2E Tests
1. ✅ Use semantic selectors (`text=`, `role=`, `aria-label`)
2. ✅ Wait for stability (`waitForLoadState('networkidle')`)
3. ✅ Take screenshots for visual verification
4. ✅ Test happy path + error cases
5. ✅ Clean up after tests
6. ✅ Use descriptive test names
7. ✅ Log progress for debugging

### Unit Tests
1. ✅ Test one thing per test
2. ✅ Use descriptive test names
3. ✅ Mock external dependencies
4. ✅ Test edge cases
5. ✅ Keep tests fast (<100ms)
6. ✅ Use test utilities (render, screen, user)
7. ✅ Avoid implementation details

## 🚀 CI/CD

### GitHub Actions
```yaml
- name: Run E2E Tests
  run: |
    npm run build
    npx playwright install --with-deps chromium
    npm run test:e2e

- name: Upload Screenshots
  uses: actions/upload-artifact@v3
  with:
    name: screenshots
    path: screenshots/e2e-tests/
```

## 📈 Coverage Goals

- **E2E**: 100% of user flows
- **Unit**: 80%+ code coverage
- **Integration**: Critical paths

## 🔍 Troubleshooting

### Extension Not Loading
```bash
# Rebuild
npm run build

# Check dist/
ls -la dist/

# Verify manifest
cat dist/manifest.json
```

### Tests Timing Out
```bash
# Increase timeout in playwright.config.ts
timeout: 60000

# Or per test
test('name', async () => {
  test.setTimeout(60000);
  // ...
});
```

### Screenshots Missing
```bash
# Create directory
mkdir -p screenshots/e2e-tests

# Check permissions
chmod 755 screenshots/e2e-tests
```

## 📚 Resources

- [Playwright Docs](https://playwright.dev/)
- [Vitest Docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Chrome Extension Testing](https://playwright.dev/docs/chrome-extensions)

## 💡 Tips

1. **Run E2E tests before commits** - Catch regressions
2. **Review screenshots** - Visual bugs are obvious
3. **Use headed mode** - Understand failures
4. **Keep tests fast** - Mock when possible
5. **Test real scenarios** - Not implementation
6. **Update snapshots** - When UI changes intentionally
7. **Parallelize carefully** - Extensions need isolation

---

**Happy Testing! 🎉**
