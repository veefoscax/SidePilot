import { initializeMessageListener } from '@/lib/messaging';

console.log('🚀 SidePilot service worker starting...');

// Initialize message handling
initializeMessageListener();

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
  console.log('📦 SidePilot installed:', details.reason);
  
  if (details.reason === 'install') {
    // Set up side panel on installation
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
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