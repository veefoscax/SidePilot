#!/usr/bin/env node

/**
 * E2E Test Runner for SidePilot Extension
 * 
 * This script:
 * 1. Builds the extension
 * 2. Creates screenshot directory
 * 3. Runs comprehensive E2E tests
 * 4. Generates HTML report
 * 5. Opens report in browser
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots', 'e2e-tests');
const REPORT_DIR = path.join(__dirname, '..', 'playwright-report');

console.log('🚀 SidePilot E2E Test Runner\n');

// Step 1: Build extension
console.log('📦 Step 1: Building extension...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build complete\n');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Step 2: Create screenshots directory
console.log('📁 Step 2: Creating screenshots directory...');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  console.log(`✅ Created: ${SCREENSHOTS_DIR}\n`);
} else {
  console.log(`✅ Directory exists: ${SCREENSHOTS_DIR}\n`);
}

// Step 3: Run E2E tests
console.log('🧪 Step 3: Running E2E tests...');
console.log('⚠️  Chrome will open in headed mode (required for extensions)\n');

try {
  execSync('npx playwright test tests/e2e-comprehensive.spec.ts --headed --reporter=html', { 
    stdio: 'inherit',
    env: { ...process.env, PWDEBUG: '0' }
  });
  console.log('\n✅ Tests complete\n');
} catch (error) {
  console.error('\n⚠️  Some tests may have failed. Check the report for details.\n');
}

// Step 4: Generate summary
console.log('📊 Step 4: Generating test summary...');

const screenshotFiles = fs.readdirSync(SCREENSHOTS_DIR)
  .filter(f => f.endsWith('.png'))
  .sort();

console.log(`\n📸 Screenshots captured: ${screenshotFiles.length}`);
screenshotFiles.forEach((file, index) => {
  console.log(`   ${index + 1}. ${file}`);
});

// Step 5: Open report
console.log('\n📄 Step 5: Opening test report...');
try {
  execSync('npx playwright show-report', { stdio: 'inherit' });
} catch (error) {
  console.log('ℹ️  Report available at: playwright-report/index.html');
}

console.log('\n✅ E2E testing complete!');
console.log(`\n📁 Screenshots: ${SCREENSHOTS_DIR}`);
console.log(`📄 Report: ${REPORT_DIR}/index.html`);
console.log('\n💡 Tips:');
console.log('   - Review screenshots to verify UI rendering');
console.log('   - Check console errors in the report');
console.log('   - Run with --debug flag for step-by-step debugging');
console.log('   - Use --headed to watch tests execute\n');
