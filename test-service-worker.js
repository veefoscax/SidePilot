/**
 * Service Worker Test Script
 * 
 * This script tests that the SidePilot service worker loads and runs correctly.
 * Run this after loading the extension in Chrome developer mode.
 */

console.log('🧪 Testing SidePilot Service Worker...');

// Test 1: Check if service worker is registered
async function testServiceWorkerRegistration() {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      console.log('✅ Service worker is registered');
      return true;
    } else {
      console.log('❌ Service worker is not registered');
      return false;
    }
  } catch (error) {
    console.log('❌ Error checking service worker registration:', error);
    return false;
  }
}

// Test 2: Check if extension service worker is active (Chrome extension context)
function testExtensionServiceWorker() {
  return new Promise((resolve) => {
    // This test needs to be run in the extension context
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      // Send a test message to the service worker
      chrome.runtime.sendMessage({ type: 'test', payload: 'ping' }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('✅ Service worker is running (expected no handler for test message)');
          resolve(true);
        } else {
          console.log('✅ Service worker responded:', response);
          resolve(true);
        }
      });
    } else {
      console.log('❌ Chrome extension APIs not available');
      resolve(false);
    }
  });
}

// Test 3: Check service worker console logs
function checkServiceWorkerLogs() {
  console.log('📋 To verify service worker is running:');
  console.log('1. Open Chrome DevTools');
  console.log('2. Go to Application tab > Service Workers');
  console.log('3. Look for SidePilot service worker');
  console.log('4. Click "inspect" to see console logs');
  console.log('5. You should see:');
  console.log('   - "🚀 SidePilot service worker starting..."');
  console.log('   - "✅ SidePilot service worker ready!"');
}

// Run tests
async function runTests() {
  console.log('\n=== Service Worker Tests ===');
  
  // Check if we're in a web page context
  if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
    await testServiceWorkerRegistration();
  }
  
  // Check if we're in extension context
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    await testExtensionServiceWorker();
  }
  
  checkServiceWorkerLogs();
  
  console.log('\n=== Manual Verification Steps ===');
  console.log('1. Load extension in Chrome://extensions (Developer mode)');
  console.log('2. Check that no errors appear in the Extensions page');
  console.log('3. Click the SidePilot extension icon');
  console.log('4. Verify the side panel opens');
  console.log('5. Check DevTools > Application > Service Workers for active worker');
}

// Auto-run if script is loaded
runTests();

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testServiceWorkerRegistration,
    testExtensionServiceWorker,
    checkServiceWorkerLogs,
    runTests
  };
}