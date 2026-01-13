#!/usr/bin/env node

/**
 * Debug Runtime Issues
 * 
 * Comprehensive debugging script to identify what's actually happening
 * in the extension runtime vs what we expect.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Debugging Runtime Issues...\n');

// Check 1: Verify build output includes our changes
console.log('1. Checking build output...');
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  const sidepanelJs = path.join(distPath, 'sidepanel.js');
  if (fs.existsSync(sidepanelJs)) {
    const content = fs.readFileSync(sidepanelJs, 'utf8');
    
    // Check if reasoning type is included
    if (content.includes('"reasoning"')) {
      console.log('✅ Build includes "reasoning" type');
    } else {
      console.log('❌ Build missing "reasoning" type - rebuild needed');
    }
    
    // Check if improved stream parsing is included
    if (content.includes('hasReasoning')) {
      console.log('✅ Build includes improved stream parsing');
    } else {
      console.log('❌ Build missing improved stream parsing - rebuild needed');
    }
  } else {
    console.log('❌ sidepanel.js not found in dist/');
  }
} else {
  console.log('❌ dist/ directory not found - build needed');
}

// Check 2: Verify source files have our changes
console.log('\n2. Verifying source file changes...');

// Check types.ts
const typesPath = path.join(__dirname, '../src/providers/types.ts');
const typesContent = fs.readFileSync(typesPath, 'utf8');
if (typesContent.includes('| "reasoning"')) {
  console.log('✅ types.ts includes reasoning type');
} else {
  console.log('❌ types.ts missing reasoning type');
}

// Check openai.ts
const openaiPath = path.join(__dirname, '../src/providers/openai.ts');
const openaiContent = fs.readFileSync(openaiPath, 'utf8');
if (openaiContent.includes('hasReasoning = true')) {
  console.log('✅ openai.ts has improved content detection');
} else {
  console.log('❌ openai.ts missing improved content detection');
}

// Check 3: Extension manifest and structure
console.log('\n3. Checking extension structure...');
const manifestPath = path.join(__dirname, '../dist/manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log('✅ Manifest version:', manifest.manifest_version);
  console.log('✅ Extension name:', manifest.name);
  
  if (manifest.side_panel) {
    console.log('✅ Side panel configured:', manifest.side_panel.default_path);
  } else {
    console.log('❌ Side panel not configured in manifest');
  }
} else {
  console.log('❌ Manifest not found in dist/');
}

// Check 4: Component integration
console.log('\n4. Checking component integration...');

// Check if ReasoningDisplay is properly imported
const assistantMessagePath = path.join(__dirname, '../src/components/chat/AssistantMessage.tsx');
const assistantContent = fs.readFileSync(assistantMessagePath, 'utf8');
if (assistantContent.includes('ReasoningDisplay') && assistantContent.includes('message.reasoning')) {
  console.log('✅ AssistantMessage properly integrates ReasoningDisplay');
} else {
  console.log('❌ AssistantMessage missing ReasoningDisplay integration');
}

// Check StreamingMessage
const streamingMessagePath = path.join(__dirname, '../src/components/chat/StreamingMessage.tsx');
const streamingContent = fs.readFileSync(streamingMessagePath, 'utf8');
if (streamingContent.includes('streamingReasoning') && streamingContent.includes('ReasoningDisplay')) {
  console.log('✅ StreamingMessage properly handles reasoning');
} else {
  console.log('❌ StreamingMessage missing reasoning handling');
}

// Check 5: Store integration
console.log('\n5. Checking store integration...');
const chatStorePath = path.join(__dirname, '../src/stores/chat.ts');
const chatStoreContent = fs.readFileSync(chatStorePath, 'utf8');
if (chatStoreContent.includes('appendStreamReasoning') && chatStoreContent.includes('streamingReasoning')) {
  console.log('✅ Chat store has reasoning support');
} else {
  console.log('❌ Chat store missing reasoning support');
}

// Check Chat.tsx integration
const chatPagePath = path.join(__dirname, '../src/sidepanel/pages/Chat.tsx');
const chatPageContent = fs.readFileSync(chatPagePath, 'utf8');
if (chatPageContent.includes('appendStreamReasoning') && chatPageContent.includes("chunk.type === 'reasoning'")) {
  console.log('✅ Chat page properly handles reasoning chunks');
} else {
  console.log('❌ Chat page missing reasoning chunk handling');
}

console.log('\n🎯 Debugging Summary:');
console.log('If you\'re still seeing issues, please:');
console.log('1. Reload the extension in Chrome (chrome://extensions/)');
console.log('2. Hard refresh the side panel (Ctrl+Shift+R)');
console.log('3. Check the browser console for specific error messages');
console.log('4. Try opening DevTools on the side panel itself');
console.log('\nTo open DevTools on side panel:');
console.log('- Right-click in the side panel → Inspect');
console.log('- Or go to chrome://extensions/ → SidePilot → Inspect views: side panel');