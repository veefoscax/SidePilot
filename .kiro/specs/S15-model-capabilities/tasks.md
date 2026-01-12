# S15: Model Capabilities - Tasks

## Implementation Checklist

### 1. Constants
- [ ] Add CAPABILITY_BADGES to types <!-- id: 0 -->
- [ ] Add CAPABILITY_WARNINGS to types <!-- id: 1 -->

### 2. ModelWarnings Component
- [ ] Create `src/components/settings/ModelWarnings.tsx` <!-- id: 2 -->
- [ ] Check capabilities and collect warnings <!-- id: 3 -->
- [ ] Render alerts with severity styling <!-- id: 4 -->
- [ ] Add to Settings page below model selector <!-- id: 5 -->

### 3. Vision Fallback
- [ ] Create getPageRepresentation utility <!-- id: 6 -->
- [ ] Implement vision path (screenshot) <!-- id: 7 -->
- [ ] Implement text path (accessibility) <!-- id: 8 -->
- [ ] Integrate into chat flow <!-- id: 9 -->

### 4. Streaming Adaptation
- [ ] Disable ThinkingIndicator when no streaming <!-- id: 10 -->
- [ ] Await full response before display <!-- id: 11 -->
- [ ] Show "Generating..." static message <!-- id: 12 -->

### 5. Tool Disable
- [ ] Hide browser tools when no tools support <!-- id: 13 -->
- [ ] Update UI to reflect limitations <!-- id: 14 -->
- [ ] Add info message in chat <!-- id: 15 -->

### 6. Model Registry Updates
- [ ] Verify all models have accurate capabilities <!-- id: 16 -->
- [ ] Add missing models/providers <!-- id: 17 -->
- [ ] Test with various models <!-- id: 18 -->
