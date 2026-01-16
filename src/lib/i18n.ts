/**
 * Internationalization (i18n) Configuration
 * 
 * Configures i18next for multi-language support with:
 * - Browser language detection
 * - Fallback to English
 * - React integration via hooks
 * - Persistence via localStorage
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from '@/locales/en.json';
import ptTranslations from '@/locales/pt.json';

// Supported languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English (US)', nativeName: 'English' },
  { code: 'pt', name: 'Português (BR)', nativeName: 'Português' }
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]['code'];

// Initialize i18next
i18n
  .use(LanguageDetector) // Detect browser language
  .use(initReactI18next) // React integration
  .init({
    resources: {
      en: { translation: enTranslations },
      pt: { translation: ptTranslations }
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'pt'],
    interpolation: {
      escapeValue: false // React already escapes values
    },
    detection: {
      // Detection order: localStorage first, then browser navigator
      order: ['localStorage', 'navigator'],
      // Cache user language in localStorage
      caches: ['localStorage'],
      // localStorage key for language preference
      lookupLocalStorage: 'sidepilot-language'
    },
    // Debug mode disabled for production build
    debug: false
  });

/**
 * Change the current language
 * @param language - Language code (e.g., 'en', 'pt')
 */
export function changeLanguage(language: SupportedLanguage): Promise<void> {
  return new Promise((resolve, reject) => {
    i18n.changeLanguage(language, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Get the current language
 */
export function getCurrentLanguage(): string {
  return i18n.language || 'en';
}

/**
 * Check if a language is supported
 */
export function isLanguageSupported(language: string): boolean {
  return SUPPORTED_LANGUAGES.some(lang => lang.code === language);
}

export default i18n;
