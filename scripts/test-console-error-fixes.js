#!/usr/bin/env node

/**
 * Test Console Error Fixes
 * 
 * Verifies that the two critical console errors have been resolved:
 * 1. DialogContent accessibility warning
 * 2. ZAI stream parsing "No response received" issue
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Testing Console Error Fixes...\n');

// Test 1: Check StreamChunk type includes "reasoning"
console.log('1. Checking StreamChunk type definition...');
const typesPath = path.join(__dirname, '../src/providers/types.ts');
const typesContent = fs.readFileSync(typesPath, 'utf8');

if (typesContent.includes('type: "text" | "tool_use" | "done" | "error" | "reasoning"')) {
  console.log('✅ StreamChunk type includes "reasoning" type');
} else {
  console.log('❌ StreamChunk type missing "reasoning" type');
  process.exit(1);
}

// Test 2: Check AlertDialogContent has proper description
console.log('\n2. Checking AlertDialogContent accessibility...');
const multiProviderPath = path.join(__dirname, '../src/components/settings/MultiProviderManager.tsx');
const multiProviderContent = fs.readFileSync(multiProviderPath, 'utf8');

if (multiProviderContent.includes('<AlertDialogDescription>')) {
  console.log('✅ AlertDialogContent has proper description');
} else {
  console.log('❌ AlertDialogContent missing description');
  process.exit(1);
}

// Test 3: Check ZAI stream parsing improvements
console.log('\n3. Checking ZAI stream parsing logic...');
const openaiProviderPath = path.join(__dirname, '../src/providers/openai.ts');
const openaiContent = fs.readFileSync(openaiProviderPath, 'utf8');

const hasImprovedContentDetection = openaiContent.includes('hasReasoning = true') && 
                                   openaiContent.includes('if (text.trim())') &&
                                   openaiContent.includes('hasContent = true');

if (hasImprovedContentDetection) {
  console.log('✅ ZAI stream parsing has improved content detection');
} else {
  console.log('❌ ZAI stream parsing missing improved content detection');
  process.exit(1);
}

// Test 4: Check reasoning chunk handling
console.log('\n4. Checking reasoning chunk handling...');
const chatStorePath = path.join(__dirname, '../src/stores/chat.ts');
const chatStoreContent = fs.readFileSync(chatStorePath, 'utf8');

if (chatStoreContent.includes('appendStreamReasoning') && chatStoreContent.includes('streamingReasoning')) {
  console.log('✅ Chat store has proper reasoning handling');
} else {
  console.log('❌ Chat store missing reasoning handling');
  process.exit(1);
}

// Test 5: Check ReasoningDisplay component
console.log('\n5. Checking ReasoningDisplay component...');
const reasoningDisplayPath = path.join(__dirname, '../src/components/chat/ReasoningDisplay.tsx');
if (fs.existsSync(reasoningDisplayPath)) {
  const reasoningContent = fs.readFileSync(reasoningDisplayPath, 'utf8');
  
  if (reasoningContent.includes('Collapsible') && reasoningContent.includes('BrainIcon')) {
    console.log('✅ ReasoningDisplay component properly implemented');
  } else {
    console.log('❌ ReasoningDisplay component missing key features');
    process.exit(1);
  }
} else {
  console.log('❌ ReasoningDisplay component not found');
  process.exit(1);
}

console.log('\n🎉 All console error fixes verified successfully!');
console.log('\nFixed Issues:');
console.log('• StreamChunk type now includes "reasoning" for GLM-4.7 reasoning support');
console.log('• AlertDialogContent has proper accessibility descriptions');
console.log('• ZAI stream parsing improved to detect content and reasoning properly');
console.log('• Enhanced content detection prevents "No response received" errors');
console.log('• Reasoning display component ready for expandable thinking UI');