# S03: Provider Settings UI - Tasks

## Implementation Checklist

### 1. Install shadcn Components
- [ ] Add Select component <!-- id: 0 -->
- [ ] Add Input component <!-- id: 1 -->
- [ ] Add Button component <!-- id: 2 -->
- [ ] Add Badge component <!-- id: 3 -->
- [ ] Add Card component <!-- id: 4 -->
- [ ] Add Alert component <!-- id: 5 -->

### 2. Zustand Store
- [ ] Create src/stores/provider.ts <!-- id: 6 -->
- [ ] Define ProviderState interface <!-- id: 7 -->
- [ ] Implement persist middleware with chrome.storage <!-- id: 8 -->
- [ ] Add setProvider, setApiKey, setModel actions <!-- id: 9 -->
- [ ] Add testConnection action <!-- id: 10 -->
- [ ] Add initializeProvider action <!-- id: 11 -->

### 3. Provider Selector
- [ ] Create src/components/settings/ProviderSelector.tsx <!-- id: 12 -->
- [ ] List all 20+ providers with grouping <!-- id: 13 -->
- [ ] Show provider names <!-- id: 14 -->
- [ ] Handle selection change <!-- id: 15 -->

### 4. API Key Input
- [ ] Create src/components/settings/ApiKeyInput.tsx <!-- id: 16 -->
- [ ] Password input with eye toggle <!-- id: 17 -->
- [ ] Clear button <!-- id: 18 -->
- [ ] Input validation <!-- id: 19 -->

### 5. Model Selector
- [ ] Create src/components/settings/ModelSelector.tsx <!-- id: 20 -->
- [ ] Filter models by selected provider <!-- id: 21 -->
- [ ] Show model name and size <!-- id: 22 -->
- [ ] Handle selection <!-- id: 23 -->

### 6. Capability Badges
- [ ] Create src/components/settings/CapabilityBadges.tsx <!-- id: 24 -->
- [ ] Vision badge (blue) <!-- id: 25 -->
- [ ] Tools badge (green) <!-- id: 26 -->
- [ ] Streaming badge (yellow) <!-- id: 27 -->
- [ ] Reasoning badge (purple) <!-- id: 28 -->
- [ ] Context window display <!-- id: 29 -->

### 7. Connection Test
- [ ] Create src/components/settings/TestConnectionButton.tsx <!-- id: 30 -->
- [ ] Loading spinner during test <!-- id: 31 -->
- [ ] Success/error feedback <!-- id: 32 -->
- [ ] Disable while testing <!-- id: 33 -->

### 8. Settings Page
- [ ] Create src/sidepanel/pages/Settings.tsx <!-- id: 34 -->
- [ ] Compose all components <!-- id: 35 -->
- [ ] Add navigation from main page <!-- id: 36 -->
- [ ] Style with Tailwind dark mode <!-- id: 37 -->

### 9. Testing
- [ ] Test provider selection persists <!-- id: 38 -->
- [ ] Test API key saves securely <!-- id: 39 -->
- [ ] Test connection test works <!-- id: 40 -->
- [ ] Test model selection updates badges <!-- id: 41 -->

## Success Criteria
- Settings page renders all components
- API key persists after reload
- Connection test validates keys
- Capability badges show correctly per model

### 10. Automated Testing (Playwright)
- [ ] Install Playwright dependencies <!-- id: 42 -->
- [ ] Create static build verification tests (verify dist/ output size & content) <!-- id: 43 -->
- [ ] Create integration tests for UI/Logic <!-- id: 44 -->
- [ ] Add test script to package.json <!-- id: 45 -->
- [ ] Update DEVLOG with test results and screenshots <!-- id: 46 -->
