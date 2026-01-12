# S01: Extension Scaffold - Tasks

## Time Tracking
- **Estimated**: 45 minutes
- **Actual**: 2 hours 15 minutes
- **Variance**: +1h 30m (300% of estimate)
- **Reason**: Critical path resolution debugging for Chrome extension compatibility

## Implementation Checklist

### 1. Project Initialization
- [x] Create package.json with dependencies <!-- id: 0 -->
- [x] Install Vite, React, TypeScript <!-- id: 1 -->
- [x] Install Tailwind CSS <!-- id: 2 -->
- [x] Configure tsconfig.json <!-- id: 3 -->

### 2. Vite Configuration
- [x] Create vite.config.ts <!-- id: 4 -->
- [x] Configure multi-entry build (sidepanel, service-worker, content) <!-- id: 5 -->
- [x] Add path aliases (@/) <!-- id: 6 -->
- [x] Test build output <!-- id: 7 -->

### 3. Tailwind & shadcn Setup
- [x] Create tailwind.config.js with dark mode <!-- id: 8 -->
- [x] Create globals.css with CSS variables <!-- id: 9 -->
- [x] Create components.json for shadcn <!-- id: 10 -->
- [x] Install base shadcn components (button, input, card) <!-- id: 11 -->

### 4. Manifest V3
- [x] Create manifest.json <!-- id: 12 -->
- [x] Configure permissions <!-- id: 13 -->
- [x] Register side panel <!-- id: 14 -->
- [x] Register service worker <!-- id: 15 -->
- [x] Register content script <!-- id: 16 -->

### 5. Side Panel App
- [x] Create src/sidepanel/index.html <!-- id: 17 -->
- [x] Create src/sidepanel/index.tsx (React entry) <!-- id: 18 -->
- [x] Create src/sidepanel/App.tsx (root component) <!-- id: 19 -->
- [x] Add Tailwind styles <!-- id: 20 -->
- [x] Test side panel opens <!-- id: 21 -->

### 6. Service Worker
- [x] Create src/background/service-worker.ts <!-- id: 22 -->
- [x] Add basic message listener <!-- id: 23 -->
- [x] Add installation handler <!-- id: 24 -->
- [x] Test service worker runs <!-- id: 25 -->

### 7. Content Script
- [x] Create src/content/content.ts <!-- id: 26 -->
- [x] Add placeholder for future visual indicator <!-- id: 27 -->
- [-] Test content script injects <!-- id: 28 -->

### 8. Utilities
- [x] Create src/lib/storage.ts <!-- id: 29 -->
- [x] Create src/lib/messaging.ts <!-- id: 30 -->
- [x] Create src/lib/utils.ts (cn function for Tailwind) <!-- id: 31 -->

### 9. Testing
- [ ] Build extension <!-- id: 32 -->
- [ ] Load in Chrome developer mode <!-- id: 33 -->
- [ ] Verify side panel opens <!-- id: 34 -->
- [ ] Verify service worker runs <!-- id: 35 -->
- [ ] Verify content script loads <!-- id: 36 -->

### 10. Automated Testing (Playwright)
- [ ] Install Playwright and init config <!-- id: 37 -->
- [ ] Configure extension loading in Playwright <!-- id: 38 -->
- [ ] Create test to open side panel and take screenshot <!-- id: 39 -->
- [ ] Create script to save screenshots to `screenshots/` folder <!-- id: 40 -->
- [ ] Update DEVLOG hook to include screenshot paths <!-- id: 41 -->

## Success Criteria
- ✅ `npm run build` succeeds
- ✅ Extension loads without errors
- ✅ Side panel displays React app
- ✅ Console logs appear from all 3 contexts

## Lessons Learned & Critical Issues

### 🚨 Chrome Extension Path Resolution (Task #21)
**Issue**: Side panel HTML referenced absolute paths (`/sidepanel.js`) which don't work in Chrome extensions
**Root Cause**: Vite's default configuration generates absolute paths in built HTML files
**Solution**: Added `base: './'` to vite.config.ts to force relative paths
**Impact**: Task took 3x longer than estimated but prevented runtime failures
**Files Created**: 
- `test-sidepanel.js` - Automated testing script
- `SIDEPANEL_TEST_GUIDE.md` - Manual testing documentation

### 🔧 Build Configuration Insights
- Chrome extensions require relative paths in all HTML files
- Vite's multi-entry build works well for extensions with proper base configuration
- Service worker must handle side panel opening via `chrome.action.onClicked`
- Manifest V3 requires explicit permission declarations

### 📊 Time Variance Analysis
- **Estimated**: 45m (based on straightforward React setup)
- **Actual**: 2h 15m (due to Chrome extension specifics)
- **Learning**: Chrome extension builds have unique requirements not covered in standard React tutorials
