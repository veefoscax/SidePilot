# S03: Provider Settings UI - Requirements

## Feature Description
Build settings UI for configuring LLM providers, entering API keys, selecting models, and viewing capabilities.

## User Stories

### US1: Provider Selection
**As a** user
**I want** to select my preferred LLM provider from a dropdown
**So that** I can use my API key

### US2: API Key Input
**As a** user
**I want** to securely enter my API key
**So that** the extension can authenticate with the provider

### US3: Model Selection
**As a** user
**I want** to select which model to use
**So that** I can choose speed vs. capability

### US4: Capability Display
**As a** user
**I want** to see what the model supports (vision, tools, streaming)
**So that** I know what features will work

### US5: Connection Test
**As a** user
**I want** to test my API key
**So that** I know it's valid before using it

## Acceptance Criteria

### AC1: Provider Selector
- [ ] Dropdown with provider logos/icons
- [ ] Groups by tier (recommended, popular, extended)
- [ ] Show provider name and description

### AC2: API Key Input
- [ ] Password field with reveal toggle
- [ ] Secure storage in chrome.storage.local
- [ ] Clear button
- [ ] Validation feedback

### AC3: Model Selector
- [ ] Filterable by current provider
- [ ] Show model name and context window
- [ ] Default to best model for provider

### AC4: Capability Badges
- [ ] 👁️ Vision badge (blue)
- [ ] 🔧 Tools badge (green)
- [ ] ⚡ Streaming badge (yellow)
- [ ] 🧠 Reasoning badge (purple)
- [ ] Context window display

### AC5: Connection Test
- [ ] "Test Connection" button
- [ ] Loading state during test
- [ ] Success/error feedback

### AC6: Persistence
- [ ] Save selected provider
- [ ] Save API key securely
- [ ] Save selected model
- [ ] Load on extension start

## Dependencies
- S01: Extension scaffold (React, shadcn)
- S02: Provider factory (types, providers)

## shadcn Components to Use
- Select (provider, model dropdowns)
- Input (API key)
- Button (test, save)
- Badge (capabilities)
- Card (settings sections)
- Alert (success/error)
