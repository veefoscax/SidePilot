# S16: General Settings & Localization - Tasks

## Implementation Checklist

### 1. Localization Infrastructure
- [ ] Install i18next and react-i18next <!-- id: 0 -->
- [ ] Configure i18n instance with language detector <!-- id: 1 -->
- [ ] Create translation files structure (locales/en, locales/pt) <!-- id: 2 -->
- [ ] Create TranslationProvider component <!-- id: 3 -->

### 2. General Settings UI
- [ ] Create src/sidepanel/pages/GeneralSettings.tsx <!-- id: 4 -->
- [ ] Add Language Selector component <!-- id: 5 -->
- [ ] Add Theme Toggle (System/Light/Dark) <!-- id: 6 -->
- [ ] Add "Reset to Defaults" button <!-- id: 7 -->

### 3. Migration
- [ ] Extract all hardcoded strings from S01-S15 to translation files <!-- id: 8 -->
- [ ] Update components to use useTranslation hook <!-- id: 9 -->

### 4. Testing
- [ ] Test language switching persists <!-- id: 10 -->
- [ ] Test theme switching applies correctly <!-- id: 11 -->
- [ ] Verify fallback language behavior <!-- id: 12 -->
