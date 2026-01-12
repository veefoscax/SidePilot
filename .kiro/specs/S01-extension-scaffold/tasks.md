# S01: Extension Scaffold - Tasks

## Implementation Checklist

### 1. Project Initialization
- [ ] Create package.json with dependencies
- [ ] Install Vite, React, TypeScript
- [ ] Install Tailwind CSS
- [ ] Configure tsconfig.json

### 2. Vite Configuration
- [ ] Create vite.config.ts
- [ ] Configure multi-entry build (sidepanel, service-worker, content)
- [ ] Add path aliases (@/)
- [ ] Test build output

### 3. Tailwind & shadcn Setup
- [ ] Create tailwind.config.js with dark mode
- [ ] Create globals.css with CSS variables
- [ ] Create components.json for shadcn
- [ ] Install base shadcn components (button, input, card)

### 4. Manifest V3
- [ ] Create manifest.json
- [ ] Configure permissions
- [ ] Register side panel
- [ ] Register service worker
- [ ] Register content script

### 5. Side Panel App
- [ ] Create src/sidepanel/index.html
- [ ] Create src/sidepanel/index.tsx (React entry)
- [ ] Create src/sidepanel/App.tsx (root component)
- [ ] Add Tailwind styles
- [ ] Test side panel opens

### 6. Service Worker
- [ ] Create src/background/service-worker.ts
- [ ] Add basic message listener
- [ ] Add installation handler
- [ ] Test service worker runs

### 7. Content Script
- [ ] Create src/content/content.ts
- [ ] Add placeholder for future visual indicator
- [ ] Test content script injects

### 8. Utilities
- [ ] Create src/lib/storage.ts
- [ ] Create src/lib/messaging.ts
- [ ] Create src/lib/utils.ts (cn function for Tailwind)

### 9. Testing
- [ ] Build extension
- [ ] Load in Chrome developer mode
- [ ] Verify side panel opens
- [ ] Verify service worker runs
- [ ] Verify content script loads

## Success Criteria
- `npm run build` succeeds
- Extension loads without errors
- Side panel displays React app
- Console logs appear from all 3 contexts
