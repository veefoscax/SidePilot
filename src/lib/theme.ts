/**
 * Theme Detection and Management
 * 
 * Handles Chrome extension theme detection and synchronization
 * between system theme, Chrome theme, and extension UI.
 */

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeState {
  current: Theme;
  system: 'light' | 'dark';
  chrome: 'light' | 'dark';
  lastDetected: number;
}

/**
 * Detects the current system theme using media queries
 */
export function detectSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  return mediaQuery.matches ? 'dark' : 'light';
}

/**
 * Detects Chrome's theme by analyzing the browser UI colors
 * Uses multiple detection methods for better accuracy
 */
export async function detectChromeTheme(): Promise<'light' | 'dark'> {
  try {
    // Method 1: Use chrome.storage to check if theme was previously detected
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const stored = await chrome.storage.local.get(['chromeTheme', 'themeLastUpdated']);
      
      // If we have a recent theme detection (within 1 hour), use it
      if (stored.chromeTheme && stored.themeLastUpdated) {
        const oneHour = 60 * 60 * 1000;
        if (Date.now() - stored.themeLastUpdated < oneHour) {
          return stored.chromeTheme;
        }
      }
    }
    
    // Method 2: Analyze the extension's background color
    // Chrome applies theme colors to extension contexts
    if (typeof window !== 'undefined' && window.getComputedStyle) {
      const body = document.body;
      const computedStyle = window.getComputedStyle(body);
      const backgroundColor = computedStyle.backgroundColor;
      
      // Parse RGB values to determine if background is light or dark
      const rgbMatch = backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgbMatch) {
        const [, r, g, b] = rgbMatch.map(Number);
        // Calculate luminance using standard formula
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        const detectedTheme = luminance > 0.5 ? 'light' : 'dark';
        
        console.log(`🎨 Chrome theme detected via background analysis: ${detectedTheme} (luminance: ${luminance.toFixed(2)})`);
        return detectedTheme;
      }
    }
    
    // Method 3: Check CSS media query for prefers-color-scheme
    const systemTheme = detectSystemTheme();
    console.log(`🎨 Falling back to system theme: ${systemTheme}`);
    return systemTheme;
    
  } catch (error) {
    console.warn('Chrome theme detection failed, falling back to system theme:', error);
    return detectSystemTheme();
  }
}

/**
 * Gets the current theme state
 */
export async function getThemeState(): Promise<ThemeState> {
  const system = detectSystemTheme();
  const chrome = await detectChromeTheme();
  
  // For now, we'll use the system theme as the current theme
  // This can be enhanced to respect user preferences
  const current = system;
  
  return {
    current,
    system,
    chrome,
    lastDetected: Date.now()
  };
}

/**
 * Applies theme to the document
 */
export function applyTheme(theme: 'light' | 'dark') {
  const html = document.documentElement;
  
  // Remove existing theme classes
  html.classList.remove('light', 'dark');
  
  // Add new theme class
  html.classList.add(theme);
  
  // Store in localStorage for persistence
  try {
    localStorage.setItem('sidepilot-theme', theme);
  } catch (error) {
    console.warn('Could not store theme preference:', error);
  }
}

/**
 * Sets up theme change listeners for both system and Chrome theme changes
 */
export function setupThemeListeners(callback: (theme: 'light' | 'dark') => void) {
  if (typeof window === 'undefined') return;
  
  const listeners: (() => void)[] = [];
  
  // Listen for system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleSystemThemeChange = async (e: MediaQueryListEvent) => {
    const systemTheme = e.matches ? 'dark' : 'light';
    
    // Re-detect Chrome theme when system theme changes
    const chromeTheme = await detectChromeTheme();
    
    console.log(`🎨 System theme changed to: ${systemTheme}, Chrome theme: ${chromeTheme}`);
    callback(chromeTheme);
    
    // Store the detected theme
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({
        chromeTheme,
        systemTheme,
        themeLastUpdated: Date.now()
      });
    }
  };
  
  // Modern browsers
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    listeners.push(() => mediaQuery.removeEventListener('change', handleSystemThemeChange));
  } else {
    // Fallback for older browsers
    mediaQuery.addListener(handleSystemThemeChange);
    listeners.push(() => mediaQuery.removeListener(handleSystemThemeChange));
  }
  
  // Listen for Chrome storage changes (theme updates from service worker)
  if (typeof chrome !== 'undefined' && chrome.storage) {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.chromeTheme && changes.chromeTheme.newValue !== changes.chromeTheme.oldValue) {
        console.log(`🎨 Chrome theme updated via storage: ${changes.chromeTheme.newValue}`);
        callback(changes.chromeTheme.newValue);
      }
    };
    
    chrome.storage.onChanged.addListener(handleStorageChange);
    listeners.push(() => chrome.storage.onChanged.removeListener(handleStorageChange));
  }
  
  // Periodic theme re-detection (every 30 seconds)
  // This helps catch theme changes that might be missed by other methods
  const intervalId = setInterval(async () => {
    const currentTheme = await detectChromeTheme();
    
    // Get stored theme to compare
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const stored = await chrome.storage.local.get('chromeTheme');
      if (stored.chromeTheme !== currentTheme) {
        console.log(`🎨 Theme drift detected: ${stored.chromeTheme} → ${currentTheme}`);
        callback(currentTheme);
        
        // Update stored theme
        chrome.storage.local.set({
          chromeTheme: currentTheme,
          themeLastUpdated: Date.now()
        });
      }
    }
  }, 30000);
  
  listeners.push(() => clearInterval(intervalId));
  
  // Return cleanup function
  return () => {
    listeners.forEach(cleanup => cleanup());
  };
}

/**
 * Initializes theme system for the extension
 */
export async function initializeTheme(): Promise<'light' | 'dark'> {
  try {
    // Get current theme state
    const themeState = await getThemeState();
    
    // Apply the detected theme
    applyTheme(themeState.current);
    
    // Set up listeners for theme changes
    setupThemeListeners((newTheme) => {
      applyTheme(newTheme);
      
      // Notify service worker of theme change if possible
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({
          type: 'THEME_CHANGED',
          theme: newTheme
        }).catch(() => {
          // Ignore errors if service worker is not available
        });
      }
    });
    
    console.log(`🎨 Theme initialized: ${themeState.current} (system: ${themeState.system})`);
    
    return themeState.current;
    
  } catch (error) {
    console.error('Theme initialization failed:', error);
    // Fallback to dark theme
    applyTheme('dark');
    return 'dark';
  }
}

/**
 * Chrome-specific theme colors that match the browser UI
 */
export const CHROME_THEME_COLORS = {
  light: {
    background: '#ffffff',
    surface: '#f8f9fa',
    border: '#e5e7eb',
    text: '#1f2937',
    textSecondary: '#6b7280'
  },
  dark: {
    background: '#1f1f23',  // Chrome's actual dark background
    surface: '#26262a',     // Chrome's dark surface
    border: '#3f3f46',      // Chrome's dark border
    text: '#f9f9fb',        // Chrome's dark text
    textSecondary: '#9ca3af' // Chrome's dark secondary text
  }
} as const;