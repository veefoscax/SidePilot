#!/usr/bin/env node

/**
 * Debug Critical Issues
 * 
 * Tests the specific issues reported:
 * 1. Provider settings not sticking
 * 2. Chat showing unselected models
 * 3. No expanding thinking option
 * 4. ZAI "No response received"
 */

import fs from 'fs';

console.log('🐛 Debugging Critical Issues...\n');

// Test 1: Provider Persistence
console.log('📋 Test 1: Provider Persistence Issues');
const multiProviderPath = 'src/stores/multi-provider.ts';
if (fs.existsSync(multiProviderPath)) {
  const content = fs.readFileSync(multiProviderPath, 'utf8');
  
  const checks = [
    { name: 'Chrome storage adapter', pattern: /chromeStorage.*createJSONStorage/ },
    { name: 'Persist middleware', pattern: /persist.*chromeStorage/ },
    { name: 'Partialize function', pattern: /partialize.*providers.*selectedModels/ },
    { name: 'SetProviderConfig logging', pattern: /console\.log.*Setting provider config/ },
    { name: 'Auto-load models', pattern: /Auto-loading models/ },
  ];
  
  checks.forEach(check => {
    if (check.pattern.test(content)) {
      console.log(`✅ ${check.name} implemented`);
    } else {
      console.log(`❌ ${check.name} missing`);
    }
  });
} else {
  console.log('❌ Multi-provider store not found');
}

// Test 2: Reasoning Display
console.log('\n📋 Test 2: Reasoning Display Issues');
const reasoningPath = 'src/components/chat/ReasoningDisplay.tsx';
if (fs.existsSync(reasoningPath)) {
  const content = fs.readFileSync(reasoningPath, 'utf8');
  
  const checks = [
    { name: 'Collapsible import', pattern: /import.*Collapsible.*from.*collapsible/ },
    { name: 'Toggle handler', pattern: /const handleToggle = / },
    { name: 'Debug logging', pattern: /console\.log.*Reasoning toggle clicked/ },
    { name: 'Proper button setup', pattern: /CollapsibleTrigger asChild/ },
    { name: 'Content display', pattern: /CollapsibleContent/ },
  ];
  
  checks.forEach(check => {
    if (check.pattern.test(content)) {
      console.log(`✅ ${check.name} implemented`);
    } else {
      console.log(`❌ ${check.name} missing`);
    }
  });
} else {
  console.log('❌ ReasoningDisplay component not found');
}

// Test 3: ZAI Provider Issues
console.log('\n📋 Test 3: ZAI Provider Stream Issues');
const zaiPath = 'src/providers/zai.ts';
if (fs.existsSync(zaiPath)) {
  const content = fs.readFileSync(zaiPath, 'utf8');
  
  const checks = [
    { name: 'GLM-4.7 reasoning support', pattern: /glm-4\.7.*supportsReasoning: true/ },
    { name: 'Extends OpenAI provider', pattern: /extends OpenAIProvider/ },
    { name: 'Connection test method', pattern: /performConnectionTest/ },
    { name: 'Error handling', pattern: /handleErrorResponse/ },
  ];
  
  checks.forEach(check => {
    if (check.pattern.test(content)) {
      console.log(`✅ ${check.name} implemented`);
    } else {
      console.log(`❌ ${check.name} missing`);
    }
  });
} else {
  console.log('❌ ZAI provider not found');
}

// Test 4: OpenAI Stream Implementation
console.log('\n📋 Test 4: OpenAI Stream Implementation');
const openaiPath = 'src/providers/openai.ts';
if (fs.existsSync(openaiPath)) {
  const content = fs.readFileSync(openaiPath, 'utf8');
  
  const checks = [
    { name: 'Stream logging', pattern: /console\.log.*Stream request/ },
    { name: 'Content tracking', pattern: /let hasContent = false/ },
    { name: 'Chunk parsing', pattern: /parseStreamChunk/ },
    { name: 'Error fallback', pattern: /No response received.*API/ },
    { name: 'Stream completion', pattern: /Stream completed.*hasContent/ },
  ];
  
  checks.forEach(check => {
    if (check.pattern.test(content)) {
      console.log(`✅ ${check.name} implemented`);
    } else {
      console.log(`❌ ${check.name} missing`);
    }
  });
} else {
  console.log('❌ OpenAI provider not found');
}

// Test 5: Chat Integration
console.log('\n📋 Test 5: Chat Integration');
const chatPath = 'src/sidepanel/pages/Chat.tsx';
if (fs.existsSync(chatPath)) {
  const content = fs.readFileSync(chatPath, 'utf8');
  
  const checks = [
    { name: 'Reasoning stream handling', pattern: /appendStreamReasoning/ },
    { name: 'Final reasoning capture', pattern: /finalReasoning.*streamingReasoning/ },
    { name: 'Tool format conversion', pattern: /activeProviderInstance\.type === 'anthropic'/ },
    { name: 'Debug logging', pattern: /console\.log.*Stream ended/ },
  ];
  
  checks.forEach(check => {
    if (check.pattern.test(content)) {
      console.log(`✅ ${check.name} implemented`);
    } else {
      console.log(`❌ ${check.name} missing`);
    }
  });
} else {
  console.log('❌ Chat page not found');
}

// Test 6: Message Interface
console.log('\n📋 Test 6: Message Interface');
const chatStorePath = 'src/stores/chat.ts';
if (fs.existsSync(chatStorePath)) {
  const content = fs.readFileSync(chatStorePath, 'utf8');
  
  const checks = [
    { name: 'Reasoning field in Message', pattern: /reasoning\?: string/ },
    { name: 'Streaming reasoning state', pattern: /streamingReasoning: string/ },
    { name: 'Append reasoning action', pattern: /appendStreamReasoning/ },
    { name: 'End streaming with reasoning', pattern: /endStreaming.*reasoning\?/ },
  ];
  
  checks.forEach(check => {
    if (check.pattern.test(content)) {
      console.log(`✅ ${check.name} implemented`);
    } else {
      console.log(`❌ ${check.name} missing`);
    }
  });
} else {
  console.log('❌ Chat store not found');
}

console.log('\n🎯 Critical Issues Summary:');
console.log('1. Provider Persistence: Check Chrome storage and partialize function');
console.log('2. Reasoning Display: Verify Collapsible component and toggle handler');
console.log('3. ZAI Stream: Check if GLM-4.7 supports reasoning and stream parsing');
console.log('4. Model Selection: Verify selectedModels persistence and loading');

console.log('\n🔧 Debugging Steps:');
console.log('1. Open Chrome DevTools and check Console for errors');
console.log('2. Check Application > Storage > Local Storage for persistence');
console.log('3. Test reasoning display by clicking on messages with reasoning');
console.log('4. Verify ZAI API key and plan configuration');

console.log('\n✨ Debug Script Complete!');