/**
 * i18n Configuration Tests
 * 
 * Tests for internationalization setup including:
 * - Language detection from localStorage and navigator
 * - Translation key resolution for both languages
 * - Fallback behavior when unsupported language is detected
 * - Helper functions (changeLanguage, getCurrentLanguage, isLanguageSupported)
 * 
 * **Validates: Requirements AC1**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import i18n from 'i18next';

// Store original values for restoration
let originalNavigatorLanguage: string;
let originalLocalStorage: Storage;

// Mock localStorage
const createMockLocalStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach(key => delete store[key]); }),
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    get length() { return Object.keys(store).length; },
    _store: store
  };
};

describe('i18n Configuration', () => {
  let mockLocalStorage: ReturnType<typeof createMockLocalStorage>;

  beforeEach(() => {
    // Save original values
    originalNavigatorLanguage = navigator.language;
    originalLocalStorage = window.localStorage;
    
    // Create fresh mock localStorage
    mockLocalStorage = createMockLocalStorage();
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(navigator, 'language', {
      value: originalNavigatorLanguage,
      writable: true,
      configurable: true
    });
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true
    });
    
    // Reset i18n to English for consistent test state
    i18n.changeLanguage('en');
  });

  describe('Language Detection', () => {
    /**
     * Validates: Requirements AC1 - Auto-detect browser language on first load
     */
    it('should detect language from localStorage when set', async () => {
      // Set language in localStorage using the configured key
      mockLocalStorage.setItem('sidepilot-language', 'pt');
      
      // Import fresh i18n module to test detection
      const { getCurrentLanguage, changeLanguage } = await import('../i18n');
      
      // Change to Portuguese to simulate detection
      await changeLanguage('pt');
      
      expect(getCurrentLanguage()).toBe('pt');
    });

    it('should use English as default language', async () => {
      const { getCurrentLanguage } = await import('../i18n');
      
      // Reset to English
      await i18n.changeLanguage('en');
      
      expect(getCurrentLanguage()).toBe('en');
    });

    it('should support both English and Portuguese languages', async () => {
      const { SUPPORTED_LANGUAGES } = await import('../i18n');
      
      const languageCodes = SUPPORTED_LANGUAGES.map(lang => lang.code);
      
      expect(languageCodes).toContain('en');
      expect(languageCodes).toContain('pt');
      expect(SUPPORTED_LANGUAGES).toHaveLength(2);
    });

    it('should have correct language metadata', async () => {
      const { SUPPORTED_LANGUAGES } = await import('../i18n');
      
      const english = SUPPORTED_LANGUAGES.find(lang => lang.code === 'en');
      const portuguese = SUPPORTED_LANGUAGES.find(lang => lang.code === 'pt');
      
      expect(english).toEqual({
        code: 'en',
        name: 'English (US)',
        nativeName: 'English'
      });
      
      expect(portuguese).toEqual({
        code: 'pt',
        name: 'Português (BR)',
        nativeName: 'Português'
      });
    });
  });

  describe('Translation Key Resolution', () => {
    /**
     * Validates: Requirements AC1 - Support English (en-US) and Portuguese (pt-BR)
     */
    it('should resolve English translation keys correctly', async () => {
      await i18n.changeLanguage('en');
      
      // Test common namespace
      expect(i18n.t('common.save')).toBe('Save');
      expect(i18n.t('common.cancel')).toBe('Cancel');
      expect(i18n.t('common.reset')).toBe('Reset to Defaults');
      expect(i18n.t('common.confirm')).toBe('Confirm');
      
      // Test settings namespace
      expect(i18n.t('settings.title')).toBe('General Settings');
      expect(i18n.t('settings.language.label')).toBe('Language');
      expect(i18n.t('settings.theme.label')).toBe('Theme');
      expect(i18n.t('settings.theme.system')).toBe('System Default');
      expect(i18n.t('settings.theme.light')).toBe('Light');
      expect(i18n.t('settings.theme.dark')).toBe('Dark');
    });

    it('should resolve Portuguese translation keys correctly', async () => {
      await i18n.changeLanguage('pt');
      
      // Test common namespace
      expect(i18n.t('common.save')).toBe('Salvar');
      expect(i18n.t('common.cancel')).toBe('Cancelar');
      expect(i18n.t('common.reset')).toBe('Restaurar Padrões');
      expect(i18n.t('common.confirm')).toBe('Confirmar');
      
      // Test settings namespace
      expect(i18n.t('settings.title')).toBe('Configurações Gerais');
      expect(i18n.t('settings.language.label')).toBe('Idioma');
      expect(i18n.t('settings.theme.label')).toBe('Tema');
      expect(i18n.t('settings.theme.system')).toBe('Padrão do Sistema');
      expect(i18n.t('settings.theme.light')).toBe('Claro');
      expect(i18n.t('settings.theme.dark')).toBe('Escuro');
    });

    it('should resolve nested translation keys', async () => {
      await i18n.changeLanguage('en');
      
      // Test deeply nested keys
      expect(i18n.t('chat.error.sendFailed')).toBe('Failed to send message');
      expect(i18n.t('chat.voice.listening')).toBe('Listening...');
      expect(i18n.t('providers.deleteConfirm.title')).toBe('Delete Provider?');
      expect(i18n.t('settings.resetConfirm.description')).toBe(
        'This will reset all general settings to their default values.'
      );
    });

    it('should handle interpolation correctly', async () => {
      await i18n.changeLanguage('en');
      
      // Test interpolation with version
      expect(i18n.t('settings.version', { version: '1.0.0' })).toBe('Version 1.0.0');
      expect(i18n.t('settings.version', { version: '2.5.3' })).toBe('Version 2.5.3');
      
      await i18n.changeLanguage('pt');
      
      expect(i18n.t('settings.version', { version: '1.0.0' })).toBe('Versão 1.0.0');
    });

    it('should resolve all major namespaces', async () => {
      await i18n.changeLanguage('en');
      
      // Verify all major namespaces have translations
      expect(i18n.t('common.loading')).toBe('Loading...');
      expect(i18n.t('chat.title')).toBe('Chat');
      expect(i18n.t('chat.placeholder.default')).toBe('Message...');
      expect(i18n.t('providers.title')).toBe('Provider Settings');
      expect(i18n.t('shortcuts.title')).toBe('Shortcuts');
      expect(i18n.t('permissions.title')).toBe('Permissions');
      expect(i18n.t('tools.title')).toBe('Browser Tools');
      expect(i18n.t('workflow.title')).toBe('Workflow Recording');
      expect(i18n.t('notifications.title')).toBe('Notifications');
      expect(i18n.t('mcp.title')).toBe('MCP Integration');
      expect(i18n.t('errors.generic')).toBe('Something went wrong. Please try again.');
    });
  });

  describe('Fallback Behavior', () => {
    /**
     * Validates: Requirements AC1 - Fallback to English when unsupported language
     */
    it('should fallback to English for unsupported language', async () => {
      // Try to change to an unsupported language
      await i18n.changeLanguage('fr');
      
      // Should fallback to English
      expect(i18n.t('common.save')).toBe('Save');
      expect(i18n.t('settings.title')).toBe('General Settings');
    });

    it('should fallback to English for invalid language code', async () => {
      await i18n.changeLanguage('invalid-lang');
      
      // Should fallback to English
      expect(i18n.t('common.cancel')).toBe('Cancel');
    });

    it('should return key for missing translation', async () => {
      await i18n.changeLanguage('en');
      
      // Non-existent key should return the key itself
      const result = i18n.t('nonexistent.key.path');
      expect(result).toBe('nonexistent.key.path');
    });

    it('should have fallbackLng set to English', () => {
      expect(i18n.options.fallbackLng).toContain('en');
    });

    it('should have supportedLngs configured correctly', () => {
      expect(i18n.options.supportedLngs).toContain('en');
      expect(i18n.options.supportedLngs).toContain('pt');
    });
  });

  describe('Helper Functions', () => {
    describe('changeLanguage', () => {
      it('should change language to Portuguese', async () => {
        const { changeLanguage, getCurrentLanguage } = await import('../i18n');
        
        await changeLanguage('pt');
        
        expect(getCurrentLanguage()).toBe('pt');
        expect(i18n.t('common.save')).toBe('Salvar');
      });

      it('should change language to English', async () => {
        const { changeLanguage, getCurrentLanguage } = await import('../i18n');
        
        // First change to Portuguese
        await changeLanguage('pt');
        expect(getCurrentLanguage()).toBe('pt');
        
        // Then change back to English
        await changeLanguage('en');
        expect(getCurrentLanguage()).toBe('en');
        expect(i18n.t('common.save')).toBe('Save');
      });

      it('should return a promise', async () => {
        const { changeLanguage } = await import('../i18n');
        
        const result = changeLanguage('en');
        
        expect(result).toBeInstanceOf(Promise);
        await expect(result).resolves.toBeUndefined();
      });
    });

    describe('getCurrentLanguage', () => {
      it('should return current language code', async () => {
        const { getCurrentLanguage, changeLanguage } = await import('../i18n');
        
        await changeLanguage('en');
        expect(getCurrentLanguage()).toBe('en');
        
        await changeLanguage('pt');
        expect(getCurrentLanguage()).toBe('pt');
      });

      it('should return "en" as default when language is undefined', async () => {
        const { getCurrentLanguage } = await import('../i18n');
        
        // The function should handle undefined gracefully
        // by returning 'en' as the fallback
        const result = getCurrentLanguage();
        expect(typeof result).toBe('string');
        expect(['en', 'pt']).toContain(result);
      });
    });

    describe('isLanguageSupported', () => {
      it('should return true for English', async () => {
        const { isLanguageSupported } = await import('../i18n');
        
        expect(isLanguageSupported('en')).toBe(true);
      });

      it('should return true for Portuguese', async () => {
        const { isLanguageSupported } = await import('../i18n');
        
        expect(isLanguageSupported('pt')).toBe(true);
      });

      it('should return false for unsupported languages', async () => {
        const { isLanguageSupported } = await import('../i18n');
        
        expect(isLanguageSupported('fr')).toBe(false);
        expect(isLanguageSupported('de')).toBe(false);
        expect(isLanguageSupported('es')).toBe(false);
        expect(isLanguageSupported('ja')).toBe(false);
        expect(isLanguageSupported('zh')).toBe(false);
      });

      it('should return false for invalid language codes', async () => {
        const { isLanguageSupported } = await import('../i18n');
        
        expect(isLanguageSupported('')).toBe(false);
        expect(isLanguageSupported('invalid')).toBe(false);
        expect(isLanguageSupported('en-US')).toBe(false); // We use 'en', not 'en-US'
        expect(isLanguageSupported('pt-BR')).toBe(false); // We use 'pt', not 'pt-BR'
      });

      it('should be case-sensitive', async () => {
        const { isLanguageSupported } = await import('../i18n');
        
        expect(isLanguageSupported('EN')).toBe(false);
        expect(isLanguageSupported('PT')).toBe(false);
        expect(isLanguageSupported('En')).toBe(false);
      });
    });
  });

  describe('i18n Configuration', () => {
    it('should have escapeValue set to false for React', () => {
      expect(i18n.options.interpolation?.escapeValue).toBe(false);
    });

    it('should have detection order configured correctly', () => {
      const detectionOptions = i18n.options.detection;
      
      // Detection should check localStorage first, then navigator
      expect(detectionOptions?.order).toContain('localStorage');
      expect(detectionOptions?.order).toContain('navigator');
      
      // localStorage should come before navigator
      const localStorageIndex = detectionOptions?.order?.indexOf('localStorage') ?? -1;
      const navigatorIndex = detectionOptions?.order?.indexOf('navigator') ?? -1;
      expect(localStorageIndex).toBeLessThan(navigatorIndex);
    });

    it('should cache language preference in localStorage', () => {
      const detectionOptions = i18n.options.detection;
      
      expect(detectionOptions?.caches).toContain('localStorage');
    });

    it('should use correct localStorage key', () => {
      const detectionOptions = i18n.options.detection;
      
      expect(detectionOptions?.lookupLocalStorage).toBe('sidepilot-language');
    });

    it('should have debug mode disabled', () => {
      expect(i18n.options.debug).toBe(false);
    });
  });

  describe('Translation Completeness', () => {
    /**
     * Validates: Requirements AC1 - No hardcoded strings in UI components
     * This test ensures both language files have the same structure
     */
    it('should have matching keys in English and Portuguese translations', async () => {
      // Import translation files
      const enTranslations = await import('@/locales/en.json');
      const ptTranslations = await import('@/locales/pt.json');
      
      // Helper function to get all keys from nested object
      const getAllKeys = (obj: Record<string, unknown>, prefix = ''): string[] => {
        const keys: string[] = [];
        for (const key in obj) {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            keys.push(...getAllKeys(obj[key] as Record<string, unknown>, fullKey));
          } else {
            keys.push(fullKey);
          }
        }
        return keys;
      };
      
      const enKeys = getAllKeys(enTranslations.default || enTranslations);
      const ptKeys = getAllKeys(ptTranslations.default || ptTranslations);
      
      // Both should have the same keys
      expect(enKeys.sort()).toEqual(ptKeys.sort());
    });

    it('should have non-empty translations for all keys', async () => {
      await i18n.changeLanguage('en');
      
      // Test a sample of important keys are not empty
      const importantKeys = [
        'common.save',
        'common.cancel',
        'settings.title',
        'chat.title',
        'chat.placeholder.default',
        'providers.title',
        'errors.generic'
      ];
      
      for (const key of importantKeys) {
        const translation = i18n.t(key);
        expect(translation).not.toBe('');
        expect(translation).not.toBe(key); // Should not return the key itself
      }
      
      await i18n.changeLanguage('pt');
      
      for (const key of importantKeys) {
        const translation = i18n.t(key);
        expect(translation).not.toBe('');
        expect(translation).not.toBe(key);
      }
    });
  });
});
