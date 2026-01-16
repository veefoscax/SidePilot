/**
 * General Settings Store
 * 
 * Zustand store for managing application-wide settings including:
 * - Language preferences (i18n)
 * - Theme preferences (System/Light/Dark)
 * 
 * Persists settings to Chrome storage for cross-session persistence.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { changeLanguage } from '@/lib/i18n';

export type Theme = 'system' | 'light' | 'dark';

interface SettingsState {
  // Settings
  language: string;
  theme: Theme;
  
  // Actions
  setLanguage: (language: string) => void;
  setTheme: (theme: Theme) => void;
  resetToDefaults: () => void;
}

const DEFAULT_SETTINGS = {
  language: 'en',
  theme: 'system' as Theme
};

/**
 * Chrome storage adapter for Zustand persistence
 */
const chromeStorage = createJSONStorage(() => ({
  getItem: async (name: string) => {
    try {
      const result = await chrome.storage.local.get(name);
      return result[name] ?? null;
    } catch (error) {
      console.error('[SettingsStore] Failed to get from Chrome storage:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string) => {
    try {
      await chrome.storage.local.set({ [name]: value });
    } catch (error) {
      console.error('[SettingsStore] Failed to set Chrome storage:', error);
    }
  },
  removeItem: async (name: string) => {
    try {
      await chrome.storage.local.remove(name);
    } catch (error) {
      console.error('[SettingsStore] Failed to remove from Chrome storage:', error);
    }
  },
}));

/**
 * Apply theme to the document
 */
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  
  if (theme === 'system') {
    // Use system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
    root.classList.toggle('light', !prefersDark);
  } else {
    // Apply explicit theme
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
  }
  
  console.log(`[SettingsStore] Theme applied: ${theme}`);
}

/**
 * Set up system theme change listener
 */
function setupSystemThemeListener(theme: Theme) {
  if (theme !== 'system') return;
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleChange = (e: MediaQueryListEvent) => {
    const currentTheme = useSettingsStore.getState().theme;
    if (currentTheme === 'system') {
      const root = document.documentElement;
      root.classList.toggle('dark', e.matches);
      root.classList.toggle('light', !e.matches);
    }
  };
  
  mediaQuery.addEventListener('change', handleChange);
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      
      setLanguage: (language: string) => {
        set({ language });
        // Update i18n
        changeLanguage(language as any).catch(err => {
          console.error('[SettingsStore] Failed to change language:', err);
        });
      },
      
      setTheme: (theme: Theme) => {
        set({ theme });
        // Apply theme immediately
        applyTheme(theme);
        // Set up listener for system theme changes
        setupSystemThemeListener(theme);
      },
      
      resetToDefaults: () => {
        set(DEFAULT_SETTINGS);
        // Apply default theme
        applyTheme(DEFAULT_SETTINGS.theme);
        // Reset language
        changeLanguage(DEFAULT_SETTINGS.language as any).catch(err => {
          console.error('[SettingsStore] Failed to reset language:', err);
        });
      }
    }),
    {
      name: 'sidepilot-settings',
      storage: chromeStorage,
      partialize: (state) => ({
        language: state.language,
        theme: state.theme
      }),
      onRehydrateStorage: () => (state) => {
        // Apply stored settings after rehydration
        if (state) {
          console.log('[SettingsStore] Rehydrated settings:', state);
          
          // Apply theme
          applyTheme(state.theme);
          setupSystemThemeListener(state.theme);
          
          // Apply language
          changeLanguage(state.language as any).catch(err => {
            console.error('[SettingsStore] Failed to apply stored language:', err);
          });
        }
      }
    }
  )
);

// Initialize system theme listener on store creation
setupSystemThemeListener(useSettingsStore.getState().theme);
