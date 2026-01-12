# S16: General Settings & Localization - Requirements

## Feature Description
Implement a centralized General Settings page for application-wide preferences, starting with Internationalization (i18n) and Theme management.

## User Stories

### US1: Language Selection
**As a** user
**I want** to change the interface language to Portuguese
**So that** I can use the tool in my native language

### US2: Theme Preference
**As a** user
**I want** to explicitly set Light or Dark mode
**So that** I can override the system preference

## Acceptance Criteria

### AC1: Internationalization
- [ ] Support English (en-US) and Portuguese (pt-BR)
- [ ] Auto-detect browser language on first load
- [ ] Persist language preference
- [ ] No hardcoded strings in UI components

### AC2: Theme Management
- [ ] Options: "System Default", "Light", "Dark"
- [ ] Immediate application of theme
- [ ] Persist theme preference

## Dependencies
- S03: Provider Settings (reuses persistent store patterns)
