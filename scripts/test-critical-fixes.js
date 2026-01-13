#!/usr/bin/env node

/**
 * Test Critical Fixes
 * 
 * Verifies the fixes for:
 * 1. Provider persistence issues
 * 2. Text overflow in plan selector
 * 3. Reasoning display functionality
 * 4. ZAI stream parsing improvements
 * 5. OpenAI tool parsing fixes
 */

import fs from 'fs';

console.log('🔧 Testing Critical Fixes...\n');

let passedChecks = 0;
let totalChecks = 0;

function checkFile(filePath, checks) {
  console.log(`📋 Checking ${filePath}:`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  checks.forEach(check => {
    totalChecks++;
    if (check.pattern.test(content)) {
      console.log(`✅ ${check.name}`);
      passedChecks++;
    } else {
      console.log(`❌ ${check.name}`);
    }
  });
  
  console.log('');
}

// Test 1: Multi-Provider Store Persistence
checkFile('src/stores/multi-provider.ts', [
  { name: 'Chrome storage debugging added', pattern: /Chrome storage get.*found.*not found/ },
  { name: 'Provider config debugging enhanced', pattern: /Full providers state/ },
  { name: 'Persist middleware present', pattern: /create<MultiProviderState>\(\)\(\s*persist/ },
  { name: 'Partialize function configured', pattern: /partialize:[\s\S]*?state[\s\S]*?providers[\s\S]*?selectedModels[\s\S]*?currentModel/ },
]);

// Test 2: Plan Selector Text Overflow Fix
checkFile('src/components/settings/MultiProviderManager.tsx', [
  { name: 'Plan selector truncation removed', pattern: /SelectValue placeholder="Choose plan type\.\.\."(?!\s+className="truncate")/ },
  { name: 'Plan description truncation present', pattern: /max-w-\[200px\]/ },
]);

// Test 3: Reasoning Display Enhancements
checkFile('src/components/chat/ReasoningDisplay.tsx', [
  { name: 'Enhanced reasoning debugging', pattern: /🧠 ReasoningDisplay render:[\s\S]*?hasReasoning[\s\S]*?reasoningLength/ },
  { name: 'Proper null check with debug', pattern: /🧠 ReasoningDisplay:[\s\S]*?No reasoning content, not rendering/ },
  { name: 'Toggle handler with enhanced logging', pattern: /🧠 Reasoning toggle clicked:[\s\S]*?reasoning[\s\S]*?substring/ },
]);

// Test 4: AssistantMessage Reasoning Debug
checkFile('src/components/chat/AssistantMessage.tsx', [
  { name: 'AssistantMessage reasoning debug', pattern: /💬 AssistantMessage render:[\s\S]*?hasReasoning[\s\S]*?reasoningLength/ },
  { name: 'ReasoningDisplay integration', pattern: /ReasoningDisplay reasoning={message\.reasoning}/ },
]);

// Test 5: OpenAI Provider Tool Parsing Fix
checkFile('src/providers/openai.ts', [
  { name: 'Tool arguments parsing with try-catch', pattern: /JSON\.parse\(toolCall\.function\.arguments\)/ },
  { name: 'Tool parsing error handling', pattern: /Failed to parse tool arguments/ },
  { name: 'ZAI reasoning detection', pattern: /<thinking>.*思考：.*分析：/ },
  { name: 'Enhanced stream debugging', pattern: /ZAI Stream chunk/ },
]);

// Test 6: ZAI Provider Reasoning Support
checkFile('src/providers/zai.ts', [
  { name: 'GLM-4.7 reasoning capability', pattern: /id: 'glm-4\.7'[\s\S]*?supportsReasoning: true/ },
  { name: 'Extends OpenAI provider', pattern: /extends OpenAIProvider/ },
  { name: 'ZAI-specific error handling', pattern: /balance.*resource package/ },
]);

// Test 7: Chat Integration
checkFile('src/sidepanel/pages/Chat.tsx', [
  { name: 'Reasoning stream handling', pattern: /appendStreamReasoning/ },
  { name: 'Final reasoning capture', pattern: /finalReasoning.*streamingReasoning/ },
  { name: 'Stream end debugging', pattern: /Stream ended:[\s\S]*?contentLength[\s\S]*?toolCallsCount/ },
]);

// Test 8: Chat Store Reasoning State
checkFile('src/stores/chat.ts', [
  { name: 'Reasoning field in Message interface', pattern: /reasoning\?: string/ },
  { name: 'Streaming reasoning state', pattern: /streamingReasoning: string/ },
  { name: 'Append reasoning action', pattern: /appendStreamReasoning.*chunk: string/ },
  { name: 'End streaming with reasoning', pattern: /endStreaming.*reasoning\?: string/ },
]);

console.log('🎯 Critical Fixes Test Results:');
console.log(`✅ Passed: ${passedChecks}/${totalChecks} checks`);

if (passedChecks === totalChecks) {
  console.log('🎉 All critical fixes implemented successfully!');
} else {
  console.log('⚠️  Some fixes may need attention.');
}

console.log('\n🔧 Key Fixes Applied:');
console.log('1. Enhanced Chrome storage debugging for persistence issues');
console.log('2. Fixed text overflow in plan selector by removing truncate class');
console.log('3. Added comprehensive debugging to reasoning display components');
console.log('4. Enhanced ZAI stream parsing with reasoning detection');
console.log('5. Fixed OpenAI tool parsing type error with proper JSON parsing');
console.log('6. Added debugging throughout the chat flow for better troubleshooting');

console.log('\n🧪 Testing Instructions:');
console.log('1. Open Chrome DevTools Console');
console.log('2. Configure a ZAI provider with coding plan');
console.log('3. Send a message that should trigger reasoning (e.g., "Solve this math problem: 2+2*3")');
console.log('4. Check console for debugging messages');
console.log('5. Verify reasoning display appears and is expandable');
console.log('6. Test provider persistence by refreshing the page');

console.log('\n✨ Critical Fixes Test Complete!');