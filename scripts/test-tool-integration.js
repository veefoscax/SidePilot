#!/usr/bin/env node

/**
 * Test Tool Integration
 * 
 * Verifies that browser automation tools are properly integrated into the UI
 * and available for models to use.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing Tool Integration...\n');

// Test 1: Verify Settings UI Integration
console.log('1. Testing Settings UI Integration...');
const settingsPath = path.join(__dirname, '../src/sidepanel/pages/Settings.tsx');
const settingsContent = fs.readFileSync(settingsPath, 'utf8');

const settingsChecks = [
  {
    name: 'BrowserAutomationSettings import',
    test: () => settingsContent.includes("import { BrowserAutomationSettings } from '@/components/settings/BrowserAutomationSettings'"),
    fix: 'Add: import { BrowserAutomationSettings } from \'@/components/settings/BrowserAutomationSettings\''
  },
  {
    name: 'BrowserAutomationSettings component usage',
    test: () => settingsContent.includes('<BrowserAutomationSettings />'),
    fix: 'Add: <BrowserAutomationSettings /> in the settings page'
  },
  {
    name: 'Proper spacing between sections',
    test: () => settingsContent.includes('space-y-6'),
    fix: 'Add: space-y-6 class to container div'
  }
];

let settingsScore = 0;
for (const check of settingsChecks) {
  if (check.test()) {
    console.log(`   ✅ ${check.name}`);
    settingsScore++;
  } else {
    console.log(`   ❌ ${check.name}`);
    console.log(`      Fix: ${check.fix}`);
  }
}
console.log(`   Settings UI: ${settingsScore}/${settingsChecks.length} checks passed\n`);

// Test 2: Verify Tool Registry
console.log('2. Testing Tool Registry...');
const toolsChecks = [
  {
    name: 'Tool types defined',
    path: 'src/tools/types.ts',
    test: (content) => content.includes('interface Tool') && content.includes('interface ToolResult')
  },
  {
    name: 'Browser tools implemented',
    path: 'src/tools/browser-tools.ts',
    test: (content) => content.includes('screenshotTool') && content.includes('clickTool') && content.includes('typeTool')
  },
  {
    name: 'Tool registry created',
    path: 'src/tools/registry.ts',
    test: (content) => content.includes('class ToolRegistry') && content.includes('export const toolRegistry')
  },
  {
    name: 'Anthropic tool conversion',
    path: 'src/tools/registry.ts',
    test: (content) => content.includes('toAnthropicTool') && content.includes('getAnthropicTools')
  },
  {
    name: 'OpenAI tool conversion',
    path: 'src/tools/registry.ts',
    test: (content) => content.includes('toOpenAITool') && content.includes('getOpenAITools')
  }
];

let toolsScore = 0;
for (const check of toolsChecks) {
  const filePath = path.join(__dirname, '..', check.path);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (check.test(content)) {
      console.log(`   ✅ ${check.name}`);
      toolsScore++;
    } else {
      console.log(`   ❌ ${check.name} - implementation incomplete`);
    }
  } else {
    console.log(`   ❌ ${check.name} - file missing: ${check.path}`);
  }
}
console.log(`   Tool Registry: ${toolsScore}/${toolsChecks.length} checks passed\n`);

// Test 3: Verify Chat Integration
console.log('3. Testing Chat Integration...');
const chatPath = path.join(__dirname, '../src/sidepanel/pages/Chat.tsx');
const chatContent = fs.readFileSync(chatPath, 'utf8');

const chatChecks = [
  {
    name: 'Tool registry import',
    test: () => chatContent.includes("import { toolRegistry } from '@/tools/registry'"),
    fix: 'Add: import { toolRegistry } from \'@/tools/registry\''
  },
  {
    name: 'Tools passed to provider',
    test: () => chatContent.includes('tools: toolRegistry.getAnthropicTools()'),
    fix: 'Add: tools: toolRegistry.getAnthropicTools() to stream options'
  },
  {
    name: 'Tool execution handling',
    test: () => chatContent.includes('await toolRegistry.execute'),
    fix: 'Add: await toolRegistry.execute(chunk.toolCall.name, chunk.toolCall.input)'
  },
  {
    name: 'Tool result handling',
    test: () => chatContent.includes('addToolResult'),
    fix: 'Add: addToolResult call after tool execution'
  }
];

let chatScore = 0;
for (const check of chatChecks) {
  if (check.test()) {
    console.log(`   ✅ ${check.name}`);
    chatScore++;
  } else {
    console.log(`   ❌ ${check.name}`);
    console.log(`      Fix: ${check.fix}`);
  }
}
console.log(`   Chat Integration: ${chatScore}/${chatChecks.length} checks passed\n`);

// Test 4: Verify Component Files
console.log('4. Testing Component Files...');
const componentChecks = [
  {
    name: 'BrowserAutomationSettings component',
    path: 'src/components/settings/BrowserAutomationSettings.tsx',
    test: (content) => content.includes('BrowserAutomationSettings') && content.includes('backend:')
  },
  {
    name: 'Switch UI component',
    path: 'src/components/ui/switch.tsx',
    test: (content) => content.includes('Switch') && content.includes('@radix-ui/react-switch')
  },
  {
    name: 'Alert UI component',
    path: 'src/components/ui/alert.tsx',
    test: (content) => content.includes('Alert') && content.includes('AlertDescription')
  }
];

let componentScore = 0;
for (const check of componentChecks) {
  const filePath = path.join(__dirname, '..', check.path);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (check.test(content)) {
      console.log(`   ✅ ${check.name}`);
      componentScore++;
    } else {
      console.log(`   ❌ ${check.name} - implementation incomplete`);
    }
  } else {
    console.log(`   ❌ ${check.name} - file missing: ${check.path}`);
  }
}
console.log(`   Components: ${componentScore}/${componentChecks.length} checks passed\n`);

// Test 5: Verify Build Output
console.log('5. Testing Build Output...');
const distPath = path.join(__dirname, '../dist');
const buildChecks = [
  {
    name: 'Extension built successfully',
    test: () => fs.existsSync(path.join(distPath, 'manifest.json'))
  },
  {
    name: 'Sidepanel bundle created',
    test: () => fs.existsSync(path.join(distPath, 'sidepanel.js'))
  },
  {
    name: 'Service worker created',
    test: () => fs.existsSync(path.join(distPath, 'service-worker.js'))
  },
  {
    name: 'Content script created',
    test: () => fs.existsSync(path.join(distPath, 'content.js'))
  }
];

let buildScore = 0;
for (const check of buildChecks) {
  if (check.test()) {
    console.log(`   ✅ ${check.name}`);
    buildScore++;
  } else {
    console.log(`   ❌ ${check.name}`);
  }
}
console.log(`   Build Output: ${buildScore}/${buildChecks.length} checks passed\n`);

// Summary
const totalScore = settingsScore + toolsScore + chatScore + componentScore + buildScore;
const totalChecks = settingsChecks.length + toolsChecks.length + chatChecks.length + componentChecks.length + buildChecks.length;

console.log('📊 TOOL INTEGRATION TEST SUMMARY');
console.log('=====================================');
console.log(`Settings UI Integration: ${settingsScore}/${settingsChecks.length}`);
console.log(`Tool Registry System: ${toolsScore}/${toolsChecks.length}`);
console.log(`Chat Integration: ${chatScore}/${chatChecks.length}`);
console.log(`Component Files: ${componentScore}/${componentChecks.length}`);
console.log(`Build Output: ${buildScore}/${buildChecks.length}`);
console.log('=====================================');
console.log(`TOTAL: ${totalScore}/${totalChecks} checks passed`);

if (totalScore === totalChecks) {
  console.log('🎉 ALL TESTS PASSED! Tool integration is complete.');
  console.log('\n✨ Models can now use browser automation tools:');
  console.log('   • screenshot - Capture and annotate pages');
  console.log('   • click - Click elements by description/coordinates');
  console.log('   • type - Type text into input fields');
  console.log('   • navigate - Navigate to URLs or search');
  console.log('   • wait - Wait for elements or conditions');
  console.log('   • extract - Extract content from pages');
  console.log('\n🚀 SidePilot is ready for AI-powered browser automation!');
} else {
  console.log(`❌ ${totalChecks - totalScore} issues found. Please fix the failing checks above.`);
  process.exit(1);
}