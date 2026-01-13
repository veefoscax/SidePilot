# Implementation Plan: Model Capabilities

## Overview

This implementation plan adds model capability awareness to the UI, showing users what features each model supports and adapting the interface accordingly.

## Tasks

- [ ] 1. Capability Constants and Types
  - Add CAPABILITY_BADGES constant with icons and colors
  - Add CAPABILITY_WARNINGS constant with messages
  - Define CapabilityLevel type (full/partial/none)
  - _Requirements: AC1_

- [ ] 2. Model Warnings Component
  - Create src/components/settings/ModelWarnings.tsx
  - Check model capabilities and collect applicable warnings
  - Render Alert components with appropriate severity styling
  - Add to Settings page below model selector
  - Use HugeIcons for warning icons
  - _Requirements: AC2_

- [ ] 2.1 Write tests for model warnings
  - Test warning detection logic
  - Test alert rendering
  - _Requirements: AC2_

- [ ] 3. Vision Fallback Implementation
  - Create getPageRepresentation utility
  - Implement vision path (screenshot) for vision-capable models
  - Implement text path (accessibility tree) for text-only models
  - Add capability check before page representation
  - Integrate into chat flow
  - _Requirements: AC3_

- [ ] 4. Checkpoint - Test Vision Fallback
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Streaming Adaptation
  - Detect streaming capability from model info
  - Disable ThinkingIndicator when no streaming
  - Await full response before display for non-streaming
  - Show "Generating..." static message instead
  - _Requirements: AC4_

- [ ] 6. Tool Disable Logic
  - Check tools capability before sending tools to API
  - Hide browser tools UI section when no tools support
  - Update UI to reflect tool limitations
  - Add info message in chat explaining limitations
  - _Requirements: AC5_

- [ ] 7. Model Registry Verification
  - Verify all models have accurate capabilities
  - Add missing models from providers
  - Cross-reference with provider documentation
  - Test with various models to confirm
  - _Requirements: AC6_

- [ ] 8. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Model capabilities affect UX significantly
- Graceful degradation is key for non-capable models
- Keep model registry updated with new releases
- Consider capability auto-detection in future
