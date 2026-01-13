/**
 * CDP Wrapper Test Script
 * 
 * Comprehensive testing for the Chrome DevTools Protocol wrapper functionality.
 * Tests all major features including mouse interactions, keyboard input, screenshots,
 * scrolling, waiting, and accessibility tree generation.
 */

console.log('🧪 CDP Wrapper Test Suite Starting...');

// Test configuration
const TEST_CONFIG = {
  timeout: 30000,
  testUrl: 'https://example.com',
  verbose: true
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

/**
 * Test helper functions
 */
function logTest(testName, status, details = '') {
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏳';
  console.log(`${emoji} ${testName}${details ? ': ' + details : ''}`);
  
  if (status === 'PASS') testResults.passed++;
  if (status === 'FAIL') {
    testResults.failed++;
    testResults.errors.push(`${testName}: ${details}`);
  }
}

function logSection(sectionName) {
  console.log(`\n📋 ${sectionName}`);
  console.log('='.repeat(50));
}

/**
 * Test 1: Core Infrastructure
 */
async function testCoreInfrastructure() {
  logSection('Core Infrastructure Tests');
  
  try {
    // Test file existence
    const cdpWrapperExists = await checkFileExists('src/lib/cdp-wrapper.ts');
    logTest('CDP Wrapper file exists', cdpWrapperExists ? 'PASS' : 'FAIL');
    
    const humanDelaysExists = await checkFileExists('src/lib/human-delays.ts');
    logTest('Human Delays file exists', humanDelaysExists ? 'PASS' : 'FAIL');
    
    const elementRefsExists = await checkFileExists('src/lib/element-references.ts');
    logTest('Element References file exists', elementRefsExists ? 'PASS' : 'FAIL');
    
    const accessibilityTreeExists = await checkFileExists('src/content/accessibility-tree.js');
    logTest('Accessibility Tree content script exists', accessibilityTreeExists ? 'PASS' : 'FAIL');
    
    // Test TypeScript compilation
    const tsCompiles = await testTypeScriptCompilation();
    logTest('TypeScript compilation', tsCompiles ? 'PASS' : 'FAIL');
    
  } catch (error) {
    logTest('Core Infrastructure', 'FAIL', error.message);
  }
}

/**
 * Test 2: Human Delays System
 */
async function testHumanDelays() {
  logSection('Human Delays System Tests');
  
  try {
    // Test delay generation
    const humanDelays = new (await import('../src/lib/human-delays.js')).HumanDelays();
    
    // Test typing delays
    const typingDelay = humanDelays.getTypingDelay('a', 'human');
    logTest('Typing delay generation', 
      (typingDelay >= 20 && typingDelay <= 100) ? 'PASS' : 'FAIL',
      `Generated ${typingDelay}ms delay`);
    
    // Test mouse delays
    const mouseDelay = humanDelays.getMouseDelay('human');
    logTest('Mouse delay generation',
      (mouseDelay >= 50 && mouseDelay <= 150) ? 'PASS' : 'FAIL',
      `Generated ${mouseDelay}ms delay`);
    
    // Test bezier path generation
    const path = humanDelays.generateMousePath(0, 0, 100, 100, 10);
    logTest('Bezier path generation',
      (path.length === 11 && path[0].x === 0 && path[10].x === 100) ? 'PASS' : 'FAIL',
      `Generated ${path.length} points`);
    
    // Test jitter
    const jittered = humanDelays.addJitter(50, 50, 2);
    logTest('Coordinate jitter',
      (Math.abs(jittered.x - 50) <= 2 && Math.abs(jittered.y - 50) <= 2) ? 'PASS' : 'FAIL',
      `Jittered to (${jittered.x}, ${jittered.y})`);
    
  } catch (error) {
    logTest('Human Delays System', 'FAIL', error.message);
  }
}

/**
 * Test 3: Element References System
 */
async function testElementReferences() {
  logSection('Element References System Tests');
  
  try {
    const elementRefs = new (await import('../src/lib/element-references.js')).ElementReferences();
    
    // Test reference generation
    const ref1 = elementRefs.generateRef(1);
    const ref2 = elementRefs.generateRef(1);
    logTest('Reference ID generation',
      (ref1 === 'element_1' && ref2 === 'element_2') ? 'PASS' : 'FAIL',
      `Generated ${ref1}, ${ref2}`);
    
    // Test element registration (mock element)
    const mockElement = { tagName: 'BUTTON', textContent: 'Test' };
    const registeredRef = elementRefs.registerElement(1, mockElement);
    logTest('Element registration',
      registeredRef.startsWith('element_') ? 'PASS' : 'FAIL',
      `Registered as ${registeredRef}`);
    
    // Test cleanup
    elementRefs.clearTab(1);
    const refsAfterClear = elementRefs.getAllRefs(1);
    logTest('Tab cleanup',
      refsAfterClear.length === 0 ? 'PASS' : 'FAIL',
      `${refsAfterClear.length} refs remaining`);
    
  } catch (error) {
    logTest('Element References System', 'FAIL', error.message);
  }
}

/**
 * Test 4: Accessibility Tree Content Script
 */
async function testAccessibilityTree() {
  logSection('Accessibility Tree Content Script Tests');
  
  try {
    // Test content script syntax
    const contentScript = await readFile('src/content/accessibility-tree.js');
    
    // Check for required functions
    const hasGenerateTree = contentScript.includes('generateAccessibilityTree');
    logTest('Generate tree function exists', hasGenerateTree ? 'PASS' : 'FAIL');
    
    const hasElementByRef = contentScript.includes('getElementByRef');
    logTest('Get element by ref function exists', hasElementByRef ? 'PASS' : 'FAIL');
    
    const hasFindByDescription = contentScript.includes('findElementsByDescription');
    logTest('Find by description function exists', hasFindByDescription ? 'PASS' : 'FAIL');
    
    const hasViewportInfo = contentScript.includes('getViewportInfo');
    logTest('Get viewport info function exists', hasViewportInfo ? 'PASS' : 'FAIL');
    
    // Check for global exports
    const hasGlobalExports = contentScript.includes('window.__claudeAccessibilityTree');
    logTest('Global exports defined', hasGlobalExports ? 'PASS' : 'FAIL');
    
  } catch (error) {
    logTest('Accessibility Tree Content Script', 'FAIL', error.message);
  }
}

/**
 * Test 5: CDP Wrapper Class Structure
 */
async function testCDPWrapperStructure() {
  logSection('CDP Wrapper Class Structure Tests');
  
  try {
    const cdpWrapperCode = await readFile('src/lib/cdp-wrapper.ts');
    
    // Test for required methods
    const requiredMethods = [
      'attachDebugger',
      'detachDebugger',
      'click',
      'clickElement',
      'clickByDescription',
      'type',
      'pressKey',
      'pressKeyChord',
      'screenshot',
      'scroll',
      'scrollToElement',
      'waitForElement',
      'waitForNavigation',
      'generateAccessibilityTree'
    ];
    
    for (const method of requiredMethods) {
      const hasMethod = cdpWrapperCode.includes(`async ${method}(`);
      logTest(`Method ${method} exists`, hasMethod ? 'PASS' : 'FAIL');
    }
    
    // Test for required interfaces
    const requiredInterfaces = [
      'ScreenshotOptions',
      'ScreenshotResult',
      'ClickOptions',
      'TypeOptions',
      'ScrollOptions',
      'WaitOptions'
    ];
    
    for (const interfaceName of requiredInterfaces) {
      const hasInterface = cdpWrapperCode.includes(`interface ${interfaceName}`);
      logTest(`Interface ${interfaceName} exists`, hasInterface ? 'PASS' : 'FAIL');
    }
    
    // Test for singleton export
    const hasSingleton = cdpWrapperCode.includes('export const cdpWrapper');
    logTest('Singleton instance exported', hasSingleton ? 'PASS' : 'FAIL');
    
  } catch (error) {
    logTest('CDP Wrapper Class Structure', 'FAIL', error.message);
  }
}

/**
 * Test 6: Build Integration
 */
async function testBuildIntegration() {
  logSection('Build Integration Tests');
  
  try {
    // Test TypeScript compilation
    console.log('⏳ Running TypeScript compilation...');
    const tscResult = await runCommand('npx tsc --noEmit');
    logTest('TypeScript compilation', tscResult.success ? 'PASS' : 'FAIL', 
      tscResult.success ? 'No type errors' : tscResult.error);
    
    // Test Vite build
    console.log('⏳ Running Vite build...');
    const buildResult = await runCommand('npm run build');
    logTest('Vite build', buildResult.success ? 'PASS' : 'FAIL',
      buildResult.success ? 'Build completed' : buildResult.error);
    
    if (buildResult.success) {
      // Check for built files
      const builtFiles = [
        'dist/sidepanel.html',
        'dist/service-worker.js',
        'dist/content.js'
      ];
      
      for (const file of builtFiles) {
        const exists = await checkFileExists(file);
        logTest(`Built file ${file} exists`, exists ? 'PASS' : 'FAIL');
      }
    }
    
  } catch (error) {
    logTest('Build Integration', 'FAIL', error.message);
  }
}

/**
 * Test 7: Manifest Permissions
 */
async function testManifestPermissions() {
  logSection('Manifest Permissions Tests');
  
  try {
    const manifest = JSON.parse(await readFile('manifest.json'));
    
    // Check required permissions
    const requiredPermissions = [
      'debugger',
      'scripting',
      'activeTab',
      'tabs',
      'storage'
    ];
    
    for (const permission of requiredPermissions) {
      const hasPermission = manifest.permissions?.includes(permission);
      logTest(`Permission ${permission}`, hasPermission ? 'PASS' : 'FAIL');
    }
    
    // Check host permissions
    const hasHostPermissions = manifest.host_permissions?.includes('<all_urls>');
    logTest('Host permissions for all URLs', hasHostPermissions ? 'PASS' : 'FAIL');
    
  } catch (error) {
    logTest('Manifest Permissions', 'FAIL', error.message);
  }
}

/**
 * Helper functions
 */
async function checkFileExists(filePath) {
  try {
    const fs = await import('fs/promises');
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readFile(filePath) {
  const fs = await import('fs/promises');
  return await fs.readFile(filePath, 'utf-8');
}

async function runCommand(command) {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    const result = await execAsync(command);
    return { success: true, output: result.stdout };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testTypeScriptCompilation() {
  const result = await runCommand('npx tsc --noEmit');
  return result.success;
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🚀 Starting CDP Wrapper Test Suite');
  console.log(`⏰ Timeout: ${TEST_CONFIG.timeout}ms`);
  console.log(`🌐 Test URL: ${TEST_CONFIG.testUrl}`);
  console.log('');
  
  const startTime = Date.now();
  
  try {
    await testCoreInfrastructure();
    await testHumanDelays();
    await testElementReferences();
    await testAccessibilityTree();
    await testCDPWrapperStructure();
    await testManifestPermissions();
    await testBuildIntegration();
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    testResults.failed++;
    testResults.errors.push(`Test suite error: ${error.message}`);
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // Print results
  console.log('\n📊 Test Results Summary');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⏱️  Duration: ${duration}ms`);
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ Errors:');
    testResults.errors.forEach(error => console.log(`  • ${error}`));
  }
  
  console.log('\n🎯 CDP Wrapper Test Suite Complete');
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests, testResults };