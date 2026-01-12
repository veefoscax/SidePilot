# S01: Extension Scaffold - Tasks

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
- [ ] Test side panel opens <!-- id: 21 -->

### 6. Service Worker
- [x] Create src/background/service-worker.ts <!-- id: 22 -->
- [x] Add basic message listener <!-- id: 23 -->
- [x] Add installation handler <!-- id: 24 -->
- [ ] Test service worker runs <!-- id: 25 -->

### 7. Content Script
- [x] Create src/content/content.ts <!-- id: 26 -->
- [x] Add placeholder for future visual indicator <!-- id: 27 -->
- [ ] Test content script injects <!-- id: 28 -->

### 8. Utilities
- [x] Create src/lib/storage.ts <!-- id: 29 -->
- [x] Create src/lib/messaging.ts <!-- id: 30 -->
- [x] Create src/lib/utils.ts (cn function for Tailwind) <!-- id: 31 -->

### 9. Testing
- [x] Build extension <!-- id: 32 -->
- [x] Load in Chrome developer mode <!-- id: 33 -->
- [x] Verify side panel opens <!-- id: 34 -->
- [x] Verify service worker runs <!-- id: 35 -->
- [x] Verify content script loads <!-- id: 36 -->

## Success Criteria
- ✅ `npm run build` succeeds
- ✅ Extension loads without errors
- ✅ Side panel displays React app
- ✅ Console logs appear from all 3 contexts
