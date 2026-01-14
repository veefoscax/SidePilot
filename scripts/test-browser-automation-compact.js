#!/usr/bin/env node

/**
 * Test Script: Browser Automation Settings Compact & Collapsible
 * 
 * Verifies that BrowserAutomationSettings component has been successfully
 * refactored to be compact and collapsible.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing Browser Automation Settings Compact & Collapsible Implementation\n');

let passCount = 0;
let failCount = 0;

function test(description, condition) {
  if (condition) {
    console.log(`✅ ${description}`);
    passCount++;
  } else {
    console.log(`❌ ${description}`);
    failCount++;
  }
}

// Read the component file
const componentPath = path.join(__dirname, '../src/components/settings/BrowserAutomationSettings.tsx');
const componentContent = fs.readFileSync(componentPath, 'utf-8');

console.log('📋 Component Structure Tests:\n');

// Test 1: Collapsible import
test(
  'Collapsible component imported',
  componentContent.includes("import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'")
);

// Test 2: Arrow icons imported
test(
  'Arrow icons imported for expand/collapse',
  componentContent.includes('ArrowDown01Icon') && componentContent.includes('ArrowUp01Icon')
);

// Test 3: isExpanded state
test(
  'isExpanded state added',
  componentContent.includes('const [isExpanded, setIsExpanded] = useState(true)')
);

// Test 4: Collapsible wrapper
test(
  'Collapsible wrapper implemented',
  componentContent.includes('<Collapsible open={isExpanded} onOpenChange={setIsExpanded}>')
);

// Test 5: CollapsibleTrigger button
test(
  'CollapsibleTrigger button with arrow icons',
  componentContent.includes('<CollapsibleTrigger asChild>') &&
  componentContent.includes('icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon}')
);

// Test 6: CollapsibleContent wrapper
test(
  'CollapsibleContent wraps settings',
  componentContent.includes('<CollapsibleContent className="space-y-4">')
);

console.log('\n📐 Compact Design Tests:\n');

// Test 7: Compact header with current backend display
test(
  'Compact header shows current backend',
  componentContent.includes('text-base font-medium">Browser Automation') &&
  componentContent.includes("settings.backend === 'builtin' && 'Built-in CDP Engine'")
);

// Test 8: Reduced card padding
test(
  'Card headers use compact padding (py-3)',
  componentContent.includes('className="py-3"')
);

// Test 9: Smaller text sizes
test(
  'Uses smaller text sizes (text-sm, text-xs)',
  componentContent.includes('text-sm') && componentContent.includes('text-xs')
);

// Test 10: Compact button sizes
test(
  'Buttons use compact sizes (h-7, h-8)',
  componentContent.includes('className="h-7 text-xs"') && componentContent.includes('className="h-8 text-xs"')
);

// Test 11: Reduced gaps
test(
  'Uses smaller gaps (gap-2, gap-3)',
  componentContent.includes('gap-2') && componentContent.includes('gap-3')
);

console.log('\n🎨 UI Improvements Tests:\n');

// Test 12: Conditional content display
test(
  'Cloud SDK content only shows when selected',
  componentContent.includes("{settings.backend === 'browser-use-cloud' && (") &&
  componentContent.includes('<CardContent className="pt-0 space-y-3">')
);

// Test 13: Native backend content only shows when selected
test(
  'Native backend content only shows when selected',
  componentContent.includes("{settings.backend === 'browser-use-native' && (")
);

// Test 14: Compact badges
test(
  'Badges use compact sizing (text-xs, h-5)',
  componentContent.includes('className="text-xs h-5"')
);

// Test 15: Separator between sections
test(
  'Separator between backend selection and behavior settings',
  componentContent.includes('<Separator />')
);

console.log('\n🔧 Functionality Tests:\n');

// Test 16: All three backends still present
test(
  'All three backend options present (Built-in, Cloud, Native)',
  componentContent.includes("backend: 'builtin'") &&
  componentContent.includes("backend: 'browser-use-cloud'") &&
  componentContent.includes("backend: 'browser-use-native'")
);

// Test 17: Behavior settings preserved
test(
  'Behavior settings section preserved',
  componentContent.includes('Behavior Settings') &&
  componentContent.includes('humanLikeDelays') &&
  componentContent.includes('stealthMode') &&
  componentContent.includes('screenshotAnnotations')
);

// Test 18: Screenshot size inputs preserved
test(
  'Screenshot size inputs preserved',
  componentContent.includes('maxScreenshotWidth') &&
  componentContent.includes('maxScreenshotHeight')
);

console.log('\n📦 Build Verification:\n');

// Test 19: Build output exists
const distPath = path.join(__dirname, '../dist/sidepanel.js');
test(
  'Build output exists',
  fs.existsSync(distPath)
);

// Test 20: Build size reasonable
if (fs.existsSync(distPath)) {
  const stats = fs.statSync(distPath);
  const sizeMB = stats.size / (1024 * 1024);
  test(
    `Build size reasonable (${sizeMB.toFixed(2)} MB < 2 MB)`,
    sizeMB < 2
  );
}

// Summary
console.log('\n' + '='.repeat(60));
console.log(`✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log(`📊 Total: ${passCount + failCount}`);
console.log('='.repeat(60));

if (failCount === 0) {
  console.log('\n🎉 All tests passed! Browser Automation Settings is now compact and collapsible.');
  console.log('\n📝 Key Improvements:');
  console.log('   • Collapsible interface with expand/collapse toggle');
  console.log('   • Compact header showing current backend');
  console.log('   • Reduced padding and spacing (Nova style)');
  console.log('   • Smaller text sizes (text-xs, text-sm)');
  console.log('   • Compact buttons and inputs (h-7, h-8)');
  console.log('   • Conditional content display (only show details when backend selected)');
  console.log('   • All functionality preserved');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please review the implementation.');
  process.exit(1);
}
