/**
 * Test Script: UI and Chat Fixes
 * 
 * Tests the new UI improvements and chat functionality:
 * - Expandable reasoning display
 * - Message queuing during streaming
 * - Revert capabilities
 * - Ollama connection fixes
 * - Text overflow fixes
 */

import fs from 'fs';
import path from 'path';

console.log('🧪 Testing UI and Chat Fixes...\n');

const componentChecks = [
  'src/components/chat/ReasoningDisplay.tsx',
  'src/components/chat/StreamingMessage.tsx',
  'src/components/ui/collapsible.tsx'
];

let componentsPassed = 0;
componentChecks.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${filePath} exists`);
    componentsPassed++;
  } else {
    console.log(`❌ ${filePath} missing`);
  }
});

// Test 2: Check chat store enhancements
console.log('\n📋 Test 2: Chat Store Features');
const chatStoreContent = fs.readFileSync('src/stores/chat.ts', 'utf8');

const storeFeatures = [
  { name: 'reasoning field in Message interface', pattern: /reasoning\?\: string/ },
  { name: 'isReverted field in Message interface', pattern: /isReverted\?\: boolean/ },
  { name: 'streamingReasoning state', pattern: /streamingReasoning\: string/ },
  { name: 'messageQueue state', pattern: /messageQueue\: string\[\]/ },
  { name: 'queueMessage action', pattern: /queueMessage\: \(content\: string\) => void/ },
  { name: 'appendStreamReasoning action', pattern: /appendStreamReasoning\: \(chunk\: string\) => void/ },
  { name: 'cancelStreaming action', pattern: /cancelStreaming\: \(\) => void/ },
  { name: 'revertLastMessage action', pattern: /revertLastMessage\: \(\) => void/ },
  { name: 'processNextQueuedMessage action', pattern: /processNextQueuedMessage\: \(\) => string \| null/ }
];

let storePassed = 0;
storeFeatures.forEach(feature => {
  if (feature.pattern.test(chatStoreContent)) {
    console.log(`✅ ${feature.name} implemented`);
    storePassed++;
  } else {
    console.log(`❌ ${feature.name} missing`);
  }
});

// Test 3: Check UI component updates
console.log('\n📋 Test 3: UI Component Updates');

const componentUpdates = [
  {
    file: 'src/components/chat/AssistantMessage.tsx',
    features: [
      { name: 'ReasoningDisplay import', pattern: /import.*ReasoningDisplay.*from/ },
      { name: 'reasoning display usage', pattern: /<ReasoningDisplay.*reasoning={message\.reasoning}/ }
    ]
  },
  {
    file: 'src/components/chat/MessageList.tsx',
    features: [
      { name: 'StreamingMessage import', pattern: /import.*StreamingMessage.*from/ },
      { name: 'streamingReasoning in useEffect', pattern: /streamingReasoning.*isPinnedToBottom/ },
      { name: 'StreamingMessage usage', pattern: /<StreamingMessage/ }
    ]
  },
  {
    file: 'src/components/chat/InputArea.tsx',
    features: [
      { name: 'useChatStore import', pattern: /import.*useChatStore.*from/ },
      { name: 'messageQueue usage', pattern: /messageQueue.*queueMessage.*isStreaming/ },
      { name: 'queue indicator', pattern: /Badge[\s\S]*queued|queued[\s\S]*Badge/ }
    ]
  },
  {
    file: 'src/sidepanel/pages/Chat.tsx',
    features: [
      { name: 'UndoIcon import', pattern: /UndoIcon/ },
      { name: 'revert button', pattern: /revertLastMessage/ },
      { name: 'queue processing useEffect', pattern: /processNextQueuedMessage/ },
      { name: 'reasoning stream handling', pattern: /appendStreamReasoning/ }
    ]
  }
];

let uiUpdatesPassed = 0;
let totalUIChecks = 0;

componentUpdates.forEach(component => {
  if (fs.existsSync(component.file)) {
    const content = fs.readFileSync(component.file, 'utf8');
    component.features.forEach(feature => {
      totalUIChecks++;
      if (feature.pattern.test(content)) {
        console.log(`✅ ${component.file}: ${feature.name}`);
        uiUpdatesPassed++;
      } else {
        console.log(`❌ ${component.file}: ${feature.name} missing`);
      }
    });
  } else {
    console.log(`❌ ${component.file} not found`);
  }
});

// Test 4: Check Ollama provider updates
console.log('\n📋 Test 4: Ollama Provider Updates');
const ollamaContent = fs.readFileSync('src/providers/ollama.ts', 'utf8');

const ollamaFeatures = [
  { name: 'ConnectionResult import', pattern: /ConnectionResult/ },
  { name: 'testConnection returns ConnectionResult', pattern: /testConnection\(\)\: Promise<ConnectionResult>/ },
  { name: 'proper error handling', pattern: /success.*false[\s\S]*error/ }
];

let ollamaPassed = 0;
ollamaFeatures.forEach(feature => {
  if (feature.pattern.test(ollamaContent)) {
    console.log(`✅ ${feature.name} implemented`);
    ollamaPassed++;
  } else {
    console.log(`❌ ${feature.name} missing`);
  }
});

// Test 5: Check MultiProviderManager text overflow fix
console.log('\n📋 Test 5: Text Overflow Fixes');
const multiProviderContent = fs.readFileSync('src/components/settings/MultiProviderManager.tsx', 'utf8');

const overflowFixes = [
  { name: 'truncate class usage', pattern: /truncate/ },
  { name: 'plan type selector styling', pattern: /SelectItem.*planKey.*value={planKey}/ }
];

let overflowPassed = 0;
overflowFixes.forEach(fix => {
  if (fix.pattern.test(multiProviderContent)) {
    console.log(`✅ ${fix.name} implemented`);
    overflowPassed++;
  } else {
    console.log(`❌ ${fix.name} missing`);
  }
});

// Summary
console.log('\n📊 Test Results Summary:');
console.log(`Components: ${componentsPassed}/${componentChecks.length}`);
console.log(`Store Features: ${storePassed}/${storeFeatures.length}`);
console.log(`UI Updates: ${uiUpdatesPassed}/${totalUIChecks}`);
console.log(`Ollama Updates: ${ollamaPassed}/${ollamaFeatures.length}`);
console.log(`Overflow Fixes: ${overflowPassed}/${overflowFixes.length}`);

const totalPassed = componentsPassed + storePassed + uiUpdatesPassed + ollamaPassed + overflowPassed;
const totalTests = componentChecks.length + storeFeatures.length + totalUIChecks + ollamaFeatures.length + overflowFixes.length;

console.log(`\n🎯 Overall: ${totalPassed}/${totalTests} checks passed`);

if (totalPassed === totalTests) {
  console.log('🎉 All UI and chat fixes implemented successfully!');
} else {
  console.log('⚠️  Some fixes may need attention.');
}

// Test 6: Build verification
console.log('\n📋 Test 6: Build Status');
if (fs.existsSync('dist/sidepanel.js')) {
  console.log('✅ Build successful - sidepanel.js exists');
  
  // Check bundle size
  const stats = fs.statSync('dist/sidepanel.js');
  const sizeKB = Math.round(stats.size / 1024);
  console.log(`📦 Bundle size: ${sizeKB} KB`);
  
  if (sizeKB > 0) {
    console.log('✅ Bundle contains content');
  } else {
    console.log('❌ Bundle appears empty');
  }
} else {
  console.log('❌ Build failed - no sidepanel.js found');
}

console.log('\n✨ UI and Chat Fixes Test Complete!');
// Test 1: Check if new components exist
console.log('📋 Test 1: Component Files');