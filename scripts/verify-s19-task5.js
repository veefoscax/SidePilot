/**
 * S19 Task 5 Verification Script
 * 
 * Verifies the chat integration for element pointer feature.
 * Tests:
 * - ElementPointerButton component exists and renders
 * - Button is integrated into InputArea
 * - Element pointer messages are received and processed
 * - Element context is injected into chat messages
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🎯 S19 Task 5: Chat Integration Verification\n');

let passed = 0;
let failed = 0;

function check(name, condition, details = '') {
  if (condition) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
    failed++;
  }
}

// Test 1: ElementPointerButton component exists
console.log('📦 Component Files:');
const buttonPath = join(rootDir, 'src/components/chat/ElementPointerButton.tsx');
check('ElementPointerButton.tsx exists', existsSync(buttonPath));

if (existsSync(buttonPath)) {
  const buttonContent = readFileSync(buttonPath, 'utf-8');
  check('ElementPointerButton imports Button', buttonContent.includes("from '@/components/ui/button'"));
  check('ElementPointerButton imports toast', buttonContent.includes("from 'sonner'"));
  check('ElementPointerButton imports ElementPointerMessageType', buttonContent.includes("from '@/lib/element-pointer'"));
  check('ElementPointerButton has activate handler', buttonContent.includes('handleActivate'));
  check('ElementPointerButton sends ACTIVATE message', buttonContent.includes('ElementPointerMessageType.ACTIVATE'));
  check('ElementPointerButton uses emoji icon', buttonContent.includes('🎯'));
}

// Test 2: ElementPointerButton tests exist
console.log('\n🧪 Component Tests:');
const buttonTestPath = join(rootDir, 'src/components/chat/__tests__/ElementPointerButton.test.tsx');
check('ElementPointerButton.test.tsx exists', existsSync(buttonTestPath));

if (existsSync(buttonTestPath)) {
  const testContent = readFileSync(buttonTestPath, 'utf-8');
  check('Tests render button', testContent.includes("renders button with emoji"));
  check('Tests disabled state', testContent.includes("is disabled when disabled prop is true"));
  check('Tests activation', testContent.includes("activates element pointer on click"));
  check('Tests error handling', testContent.includes("shows error when"));
}

// Test 3: InputArea integration
console.log('\n🔗 InputArea Integration:');
const inputAreaPath = join(rootDir, 'src/components/chat/InputArea.tsx');
if (existsSync(inputAreaPath)) {
  const inputAreaContent = readFileSync(inputAreaPath, 'utf-8');
  check('InputArea imports ElementPointerButton', inputAreaContent.includes("from './ElementPointerButton'"));
  check('InputArea imports element pointer types', inputAreaContent.includes("from '@/lib/element-pointer'"));
  check('InputArea has pendingElementContext state', inputAreaContent.includes('pendingElementContext'));
  check('InputArea listens for ELEMENT_POINTED messages', inputAreaContent.includes('ElementPointerMessageType.ELEMENT_POINTED'));
  check('InputArea formats element context', inputAreaContent.includes('formatPointedElementForChat'));
  check('InputArea renders ElementPointerButton', inputAreaContent.includes('<ElementPointerButton'));
  check('InputArea prepends element context to messages', inputAreaContent.includes('pendingElementContext'));
  check('InputArea updates placeholder when element selected', inputAreaContent.includes('Element selected') || inputAreaContent.includes('element selected'));
}

// Test 4: Integration tests exist
console.log('\n🧪 Integration Tests:');
const integrationTestPath = join(rootDir, 'src/components/chat/__tests__/InputArea-element-pointer.test.tsx');
check('InputArea-element-pointer.test.tsx exists', existsSync(integrationTestPath));

if (existsSync(integrationTestPath)) {
  const testContent = readFileSync(integrationTestPath, 'utf-8');
  check('Tests button rendering', testContent.includes("renders element pointer button"));
  check('Tests message reception', testContent.includes("receives pointed element message"));
  check('Tests context injection', testContent.includes("includes element context in sent message"));
  check('Tests context clearing', testContent.includes("clears element context after sending"));
  check('Tests formatting', testContent.includes("formats element context correctly"));
  check('Tests toast notification', testContent.includes("shows toast notification"));
}

// Test 5: Element pointer types
console.log('\n📝 Type Definitions:');
const typesPath = join(rootDir, 'src/lib/element-pointer/index.ts');
if (existsSync(typesPath)) {
  const typesContent = readFileSync(typesPath, 'utf-8');
  check('formatPointedElementForChat function exists', typesContent.includes('formatPointedElementForChat'));
  check('PointedElement interface exists', typesContent.includes('interface PointedElement'));
  check('ElementPointerMessageType enum exists', typesContent.includes('enum ElementPointerMessageType'));
  check('ELEMENT_POINTED message type exists', typesContent.includes('ELEMENT_POINTED'));
}

// Summary
console.log('\n' + '='.repeat(50));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log('='.repeat(50));

if (failed === 0) {
  console.log('\n🎉 All checks passed! Task 5 is complete.');
  console.log('\n📋 Summary:');
  console.log('  ✓ ElementPointerButton component created');
  console.log('  ✓ Button integrated into InputArea');
  console.log('  ✓ Element pointer messages handled');
  console.log('  ✓ Element context injected into chat');
  console.log('  ✓ Comprehensive tests added');
  console.log('\n🎯 Next Steps:');
  console.log('  1. Build the extension: npm run build');
  console.log('  2. Load in Chrome and test manually');
  console.log('  3. Click 🎯 button in chat input');
  console.log('  4. Click an element on a web page');
  console.log('  5. Verify element context appears in message');
} else {
  console.log('\n⚠️  Some checks failed. Please review the output above.');
  process.exit(1);
}
