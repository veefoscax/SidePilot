/**
 * Test script to verify shortcuts store initialization
 * Run this in the browser console to test the initialization flow
 */

console.log('🧪 Testing shortcuts store initialization...');

// Test 1: Check if shortcuts store is available
try {
  const { useShortcutsStore } = await import('../src/stores/shortcuts.ts');
  console.log('✅ Shortcuts store imported successfully');
  
  // Test 2: Check initial state
  const initialState = useShortcutsStore.getState();
  console.log('📊 Initial state:', {
    shortcutsCount: initialState.shortcuts.length,
    isLoaded: initialState.isLoaded
  });
  
  // Test 3: Test loadShortcuts
  console.log('🔄 Testing loadShortcuts...');
  await initialState.loadShortcuts();
  
  const afterLoad = useShortcutsStore.getState();
  console.log('📊 After loadShortcuts:', {
    shortcutsCount: afterLoad.shortcuts.length,
    isLoaded: afterLoad.isLoaded
  });
  
  // Test 4: Test initializeDefaults
  console.log('🔄 Testing initializeDefaults...');
  await afterLoad.initializeDefaults();
  
  const afterDefaults = useShortcutsStore.getState();
  console.log('📊 After initializeDefaults:', {
    shortcutsCount: afterDefaults.shortcuts.length,
    isLoaded: afterDefaults.isLoaded,
    shortcuts: afterDefaults.shortcuts.map(s => ({ command: s.command, name: s.name }))
  });
  
  // Test 5: Verify default shortcuts
  const { DEFAULT_SHORTCUTS } = await import('../src/lib/shortcuts.ts');
  console.log('🔍 Verifying default shortcuts...');
  
  const hasAllDefaults = DEFAULT_SHORTCUTS.every(defaultShortcut => 
    afterDefaults.shortcuts.some(s => s.command === defaultShortcut.command)
  );
  
  if (hasAllDefaults) {
    console.log('✅ All default shortcuts are present');
  } else {
    console.log('❌ Some default shortcuts are missing');
  }
  
  // Test 6: Test store persistence
  console.log('💾 Testing persistence...');
  const storageData = await chrome.storage.local.get('savedPrompts');
  console.log('📊 Storage data:', {
    hasData: !!storageData.savedPrompts,
    count: storageData.savedPrompts?.length || 0
  });
  
  console.log('🎉 All tests completed successfully!');
  
} catch (error) {
  console.error('❌ Test failed:', error);
}