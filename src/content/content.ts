console.log('🎯 SidePilot content script loaded on:', window.location.href);

// Import workflow capture module
import './workflow-capture';

// Placeholder for future visual indicators
// This will be expanded in later specs for:
// - Visual feedback during automation
// - Element highlighting
// - Click indicators

// Basic content script functionality
const initializeContentScript = () => {
  // Add a small indicator that SidePilot is active
  const indicator = document.createElement('div');
  indicator.id = 'sidepilot-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    width: 8px;
    height: 8px;
    background: #10b981;
    border-radius: 50%;
    z-index: 999999;
    opacity: 0.7;
    pointer-events: none;
  `;

  document.body.appendChild(indicator);

  // Remove indicator after 3 seconds
  setTimeout(() => {
    indicator.remove();
  }, 3000);
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeContentScript);
} else {
  initializeContentScript();
}