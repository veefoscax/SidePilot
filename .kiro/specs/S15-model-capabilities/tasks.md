# S15: Model Capabilities - Tasks

## Implementation Checklist

### 1. Constants
- [ ] Add CAPABILITY_BADGES to types
- [ ] Add CAPABILITY_WARNINGS to types

### 2. ModelWarnings Component
- [ ] Create `src/components/settings/ModelWarnings.tsx`
- [ ] Check capabilities and collect warnings
- [ ] Render alerts with severity styling
- [ ] Add to Settings page below model selector

### 3. Vision Fallback
- [ ] Create getPageRepresentation utility
- [ ] Implement vision path (screenshot)
- [ ] Implement text path (accessibility)
- [ ] Integrate into chat flow

### 4. Streaming Adaptation
- [ ] Disable ThinkingIndicator when no streaming
- [ ] Await full response before display
- [ ] Show "Generating..." static message

### 5. Tool Disable
- [ ] Hide browser tools when no tools support
- [ ] Update UI to reflect limitations
- [ ] Add info message in chat

### 6. Model Registry Updates
- [ ] Verify all models have accurate capabilities
- [ ] Add missing models/providers
- [ ] Test with various models
