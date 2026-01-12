import { initializeMessageListener, registerHandler } from '@/lib/messaging';

console.log('🚀 SidePilot service worker starting...');

// Initialize message handling
initializeMessageListener();

// Register theme change handlers
registerHandler('THEME_CHANGED', async (payload) => {
  console.log(`🎨 Theme changed to: ${payload.theme}`);
  
  // Store theme preference
  await chrome.storage.local.set({
    chromeTheme: payload.theme,
    themeLastUpdated: Date.now()
  });
  
  // Update icons based on theme
  await updateIconsForTheme(payload.theme);
  
  return { success: true };
});

registerHandler('CHROME_THEME_CHANGED', async (payload) => {
  console.log(`🎨 Chrome theme changed to: ${payload.theme}`);
  
  // Store Chrome theme change
  await chrome.storage.local.set({
    chromeTheme: payload.theme,
    themeLastUpdated: Date.now()
  });
  
  // Update icons based on theme
  await updateIconsForTheme(payload.theme);
  
  return { success: true };
});

// Update extension icons based on theme
async function updateIconsForTheme(theme: 'light' | 'dark') {
  try {
    // Use theme-specific icons
    // For light themes, use dark icons
    // For dark themes, use light icons
    const iconSuffix = theme === 'light' ? '-light' : '-dark';
    
    await chrome.action.setIcon({
      path: {
        16: `icons/icon16${iconSuffix}.png`,
        48: `icons/icon48${iconSuffix}.png`, 
        128: `icons/icon128${iconSuffix}.png`
      }
    });
    
    console.log(`✅ Icons updated for ${theme} theme`);
    
  } catch (error) {
    console.log(`⚠️ Could not update icons for ${theme} theme:`, error.message);
    
    // Fallback to default icons
    await chrome.action.setIcon({
      path: {
        16: 'icons/icon16.png',
        48: 'icons/icon48.png', 
        128: 'icons/icon128.png'
      }
    });
  }
}

// Theme-aware icon and UI management
async function detectAndApplyTheme() {
  try {
    console.log('🎨 Setting up Chrome theme detection...');
    
    // Detect initial theme by analyzing Chrome's UI
    // We'll use a more sophisticated approach
    const initialTheme = await detectChromeThemeInServiceWorker();
    
    // Store theme detection capability for side panel
    await chrome.storage.local.set({
      themeDetectionEnabled: true,
      chromeTheme: initialTheme,
      themeLastUpdated: Date.now()
    });
    
    // Set initial icons based on detected theme
    await updateIconsForTheme(initialTheme);
    
    console.log(`✅ Chrome theme detected: ${initialTheme}`);
    
    // Set up periodic theme checking
    setupPeriodicThemeCheck();
    
  } catch (error) {
    console.log('⚠️ Theme setup error:', error.message);
  }
}

// Detect Chrome theme from service worker context
async function detectChromeThemeInServiceWorker(): Promise<'light' | 'dark'> {
  try {
    // Check system preference first as a baseline
    // Since we can't access matchMedia in service worker, we'll use a heuristic
    
    // Check if we have stored theme from side panel
    const stored = await chrome.storage.local.get(['chromeTheme', 'systemTheme']);
    if (stored.chromeTheme) {
      console.log(`🎨 Using stored theme: ${stored.chromeTheme}`);
      return stored.chromeTheme;
    }
    
    // Default to dark theme (most common for developers)
    console.log('🎨 No stored theme, defaulting to dark');
    return 'dark';
    
  } catch (error) {
    console.log('⚠️ Service worker theme detection failed:', error.message);
    return 'dark';
  }
}

// Set up periodic theme checking
function setupPeriodicThemeCheck() {
  // Check theme every 60 seconds
  setInterval(async () => {
    try {
      const currentTheme = await detectChromeThemeInServiceWorker();
      const stored = await chrome.storage.local.get('chromeTheme');
      
      if (stored.chromeTheme !== currentTheme) {
        console.log(`🎨 Theme change detected: ${stored.chromeTheme} → ${currentTheme}`);
        
        await chrome.storage.local.set({
          chromeTheme: currentTheme,
          themeLastUpdated: Date.now()
        });
        
        // Notify all extension contexts of theme change
        chrome.runtime.sendMessage({
          type: 'CHROME_THEME_CHANGED',
          payload: { theme: currentTheme }
        }).catch(() => {
          // Ignore if no listeners
        });
      }
    } catch (error) {
      // Ignore periodic check errors
    }
  }, 60000);
}

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
  console.log('📦 SidePilot installed:', details.reason);
  
  if (details.reason === 'install') {
    // Set up side panel on installation
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    
    // Update icon for current theme
    detectAndApplyTheme();
  }
});

// Action click handler (extension icon)
chrome.action.onClicked.addListener(async (tab) => {
  console.log('🎯 Extension icon clicked, opening side panel');
  
  if (tab.id) {
    await chrome.sidePanel.open({ tabId: tab.id });
  }
});

console.log('✅ SidePilot service worker ready!');