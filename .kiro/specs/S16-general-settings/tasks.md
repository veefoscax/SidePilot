# Implementation Plan: General Settings & Localization

## Overview

This implementation plan adds general settings and internationalization support, enabling users to change language preferences and theme settings.

## Tasks

- [x] 1. Localization Infrastructure
  - Install i18next and react-i18next packages
  - Configure i18n instance with language detector
  - Create translation files structure (locales/en.json, locales/pt.json)
  - Create TranslationProvider component
  - Add language detection from browser settings
  - _Requirements: AC1_

- [x] 1.1 Write tests for i18n setup
  - Test language detection
  - Test translation key resolution
  - Test fallback behavior
  - _Requirements: AC1_

- [x] 2. General Settings UI
  - Create src/sidepanel/pages/GeneralSettings.tsx
  - Add Language Selector dropdown component
  - Add Theme Toggle (System/Light/Dark)
  - Add "Reset to Defaults" button with confirmation
  - Add version info display
  - Persist all settings to chrome.storage
  - _Requirements: AC2_

- [x] 3. Checkpoint - Test Settings UI
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. String Migration
  - Extract all hardcoded strings from S01-S15 components
  - Create translation entries for each string
  - Update components to use useTranslation hook
  - Add missing translations for Portuguese
  - _Requirements: AC3_

- [x] 5. Theme System Integration
  - Implement System/Light/Dark theme switching
  - Use Tailwind dark mode classes
  - Persist theme preference
  - Apply theme immediately on change
  - _Requirements: AC4_

- [x] 6. Integration Testing
  - Test language switching persists
  - Test theme switching applies correctly
  - Verify fallback language behavior
  - Test all UI strings translated
  - _Requirements: All_

- [x] 7. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Start with English as base, Portuguese as first translation
- Translation keys should be namespaced by feature
- Consider right-to-left support for future
- Theme should sync with system preference by default
