# S03: Provider Settings UI - Tasks

## Implementation Checklist

### 1. Install shadcn Components
- [ ] Add Select component
- [ ] Add Input component
- [ ] Add Button component
- [ ] Add Badge component
- [ ] Add Card component
- [ ] Add Alert component

### 2. Zustand Store
- [ ] Create src/stores/provider.ts
- [ ] Define ProviderState interface
- [ ] Implement persist middleware with chrome.storage
- [ ] Add setProvider, setApiKey, setModel actions
- [ ] Add testConnection action
- [ ] Add initializeProvider action

### 3. Provider Selector
- [ ] Create src/components/settings/ProviderSelector.tsx
- [ ] List all 20+ providers with grouping
- [ ] Show provider names
- [ ] Handle selection change

### 4. API Key Input
- [ ] Create src/components/settings/ApiKeyInput.tsx
- [ ] Password input with eye toggle
- [ ] Clear button
- [ ] Input validation

### 5. Model Selector
- [ ] Create src/components/settings/ModelSelector.tsx
- [ ] Filter models by selected provider
- [ ] Show model name and size
- [ ] Handle selection

### 6. Capability Badges
- [ ] Create src/components/settings/CapabilityBadges.tsx
- [ ] Vision badge (blue)
- [ ] Tools badge (green)
- [ ] Streaming badge (yellow)
- [ ] Reasoning badge (purple)
- [ ] Context window display

### 7. Connection Test
- [ ] Create src/components/settings/TestConnectionButton.tsx
- [ ] Loading spinner during test
- [ ] Success/error feedback
- [ ] Disable while testing

### 8. Settings Page
- [ ] Create src/sidepanel/pages/Settings.tsx
- [ ] Compose all components
- [ ] Add navigation from main page
- [ ] Style with Tailwind dark mode

### 9. Testing
- [ ] Test provider selection persists
- [ ] Test API key saves securely
- [ ] Test connection test works
- [ ] Test model selection updates badges

## Success Criteria
- Settings page renders all components
- API key persists after reload
- Connection test validates keys
- Capability badges show correctly per model
