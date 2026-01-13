/**
 * Test Model Selector Dropdown Functionality
 * 
 * This script tests the model selector dropdown in the chat header
 * to ensure it properly displays selected models and allows switching.
 */

console.log('🧪 Testing Model Selector Dropdown...');

// Test 1: Check if ModelSelectorDropdown component exists
try {
  const chatPage = document.querySelector('[data-testid="chat-page"]');
  if (!chatPage) {
    console.log('⚠️ Chat page not found - extension may not be loaded');
    return;
  }
  
  console.log('✅ Chat page found');
  
  // Test 2: Look for model selector in header
  const modelSelector = document.querySelector('[data-testid="model-selector"]');
  if (modelSelector) {
    console.log('✅ Model selector found in header');
    
    // Test 3: Check if it shows current model
    const currentModel = modelSelector.textContent;
    console.log('📋 Current model display:', currentModel);
    
    // Test 4: Check if dropdown is functional (if multiple models)
    const selectTrigger = modelSelector.querySelector('[role="combobox"]');
    if (selectTrigger) {
      console.log('✅ Dropdown trigger found');
      
      // Simulate click to test dropdown
      selectTrigger.click();
      
      setTimeout(() => {
        const dropdown = document.querySelector('[role="listbox"]');
        if (dropdown) {
          console.log('✅ Dropdown opened successfully');
          const options = dropdown.querySelectorAll('[role="option"]');
          console.log(`📋 Found ${options.length} model options`);
          
          // Close dropdown
          selectTrigger.click();
        } else {
          console.log('⚠️ Dropdown did not open - may be single model or no models');
        }
      }, 100);
      
    } else {
      console.log('📋 No dropdown trigger - likely single model or no models selected');
    }
    
  } else {
    console.log('❌ Model selector not found in header');
  }
  
  // Test 5: Check store state
  if (window.useMultiProviderStore) {
    const store = window.useMultiProviderStore.getState();
    console.log('📊 Store state:');
    console.log('  - Selected models:', store.selectedModels.length);
    console.log('  - Current model:', store.currentModel);
    console.log('  - Available providers:', Object.keys(store.providers).filter(p => store.providers[p].isConfigured));
  }
  
} catch (error) {
  console.error('❌ Test failed:', error);
}

console.log('🏁 Model selector test completed');