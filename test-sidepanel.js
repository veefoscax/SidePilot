// Test script to verify side panel functionality
// This script can be run in the browser console after loading the extension

console.log('Testing SidePilot extension side panel...');

// Check if the extension is loaded
if (typeof chrome !== 'undefined' && chrome.sidePanel) {
  console.log('✅ Chrome sidePanel API is available');
  
  // Test opening the side panel
  chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT })
    .then(() => {
      console.log('✅ Side panel opened successfully');
    })
    .catch((error) => {
      console.error('❌ Failed to open side panel:', error);
    });
} else {
  console.error('❌ Chrome sidePanel API not available - extension may not be loaded');
}

// Check if the manifest is properly configured
fetch(chrome.runtime.getURL('manifest.json'))
  .then(response => response.json())
  .then(manifest => {
    console.log('✅ Manifest loaded:', manifest);
    if (manifest.side_panel) {
      console.log('✅ Side panel configured in manifest:', manifest.side_panel);
    } else {
      console.error('❌ Side panel not configured in manifest');
    }
  })
  .catch(error => {
    console.error('❌ Failed to load manifest:', error);
  });

// Check if the side panel HTML file exists
fetch(chrome.runtime.getURL('src/sidepanel/index.html'))
  .then(response => {
    if (response.ok) {
      console.log('✅ Side panel HTML file exists');
      return response.text();
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  })
  .then(html => {
    console.log('✅ Side panel HTML content loaded');
    // Check if it references the correct JS file
    if (html.includes('sidepanel.js')) {
      console.log('✅ Side panel HTML references sidepanel.js');
    } else {
      console.error('❌ Side panel HTML does not reference sidepanel.js');
    }
  })
  .catch(error => {
    console.error('❌ Failed to load side panel HTML:', error);
  });