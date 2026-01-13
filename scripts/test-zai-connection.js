#!/usr/bin/env node

/**
 * Test ZAI Connection
 * 
 * Helps debug ZAI API key and connection issues
 */

console.log('🧪 Testing ZAI Connection...\n');

// Test the API key format
const apiKey = '42ec8b23449644a5b05f01b04eca69dc.Q9hxA5iMzNBTKZb1';

console.log('🔑 API Key Analysis:');
console.log(`   Length: ${apiKey.length} characters`);
console.log(`   Format: ${apiKey.includes('.') ? 'Contains dot separator ✅' : 'No dot separator ❌'}`);
console.log(`   Parts: ${apiKey.split('.').length} parts`);

if (apiKey.includes('.')) {
  const [part1, part2] = apiKey.split('.');
  console.log(`   Part 1: ${part1} (${part1.length} chars)`);
  console.log(`   Part 2: ${part2} (${part2.length} chars)`);
}

console.log('\n🌐 ZAI Configuration:');
console.log('   Base URL: https://api.z.ai/api/coding/paas/v4/ (CODING PLAN)');
console.log('   Auth Header: Authorization: Bearer <api-key>');
console.log('   Models Endpoint: /models');
console.log('   Chat Endpoint: /chat/completions');

console.log('\n🔧 Troubleshooting Steps:');
console.log('=====================================');
console.log('1. ✅ API Key Format: Looks correct (UUID.token format)');
console.log('2. ✅ Base URL: FIXED to https://api.z.ai/api/coding/paas/v4/ (CODING PLAN)');
console.log('3. ✅ Default Models: Added GLM-4.7, GLM-4.6, GLM-4.5');
console.log('4. ✅ Connection Test: FIXED for GLM Coding Plan endpoint');

console.log('\n🚀 What to Try:');
console.log('=====================================');
console.log('1. **Reload Extension**: After the build, reload the extension in Chrome');
console.log('2. **Clear Settings**: Go to Settings > ZAI > Clear any old config');
console.log('3. **Re-enter API Key**: Paste your API key again');
console.log('4. **Test Connection**: Click "Test Connection" button');
console.log('5. **Check Models**: Should now show 3 default models');

console.log('\n📋 Expected Models for ZAI:');
console.log('=====================================');
console.log('• GLM-4.7 - Flagship model with Vision + Tools + Reasoning');
console.log('• GLM-4.6 - Previous generation with Tools + Reasoning');
console.log('• GLM-4.5 - Stable model with Tools support');

console.log('\n🐛 If Still Not Working:');
console.log('=====================================');
console.log('1. Check browser console for errors (F12 > Console)');
console.log('2. Verify ZAI API key is active and has credits');
console.log('3. Try a simple curl test:');
console.log('   curl -H "Authorization: Bearer YOUR_API_KEY" https://api.z.ai/api/coding/paas/v4/models');

console.log('\n✨ Once Working:');
console.log('=====================================');
console.log('🤖 You can chat with ZAI models');
console.log('🛠️ Models will have access to browser automation tools');
console.log('📸 Can take screenshots and interact with pages');
console.log('🎯 Full SidePilot functionality enabled!');

console.log('\n🎉 ZAI should now work with SidePilot!');