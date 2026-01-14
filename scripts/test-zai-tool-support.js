/**
 * Z.AI Tool Support Test Script
 * 
 * Tests if Z.AI API actually supports tool calling with different configurations
 */

console.log('🧪 Z.AI Tool Support Test');
console.log('='.repeat(60));

console.log('\n📋 Based on your console logs:');
console.log('-'.repeat(60));
console.log('✅ Tools ARE being sent to Z.AI API');
console.log('✅ API responds successfully (no errors)');
console.log('❌ API does NOT return tool_calls in response');
console.log('❌ Model responds with text instead of calling tools');

console.log('\n🔍 Possible Causes:');
console.log('-'.repeat(60));
console.log('1. Model does not actually support function calling');
console.log('2. API endpoint does not support tools');
console.log('3. Model needs explicit system prompt to use tools');
console.log('4. Tool definitions format incompatible with Z.AI');

console.log('\n🎯 Next Steps to Try:');
console.log('-'.repeat(60));

console.log('\n1️⃣ Check what was sent in the request:');
console.log('   - In console, expand the "🔥 ZAI Stream request: Object"');
console.log('   - Look for: toolsCount, hasTools, tools array');
console.log('   - Verify tools array has 6 items with proper format');

console.log('\n2️⃣ Try different model:');
console.log('   - Switch from glm-4.7 to glm-4-plus');
console.log('   - Or try glm-4.6 if available');
console.log('   - Some models may not support tools despite docs');

console.log('\n3️⃣ Try explicit system prompt:');
console.log('   Add this to your message:');
console.log('   "You have access to browser automation tools.');
console.log('    Use the screenshot tool to capture this page."');

console.log('\n4️⃣ Check API endpoint:');
console.log('   - General plan: https://open.bigmodel.cn/api/paas/v4');
console.log('   - Coding plan: https://api.z.ai/api/coding/v4');
console.log('   - Tool support may differ between plans');

console.log('\n5️⃣ Test with OpenAI/Anthropic:');
console.log('   - Configure OpenAI or Anthropic provider');
console.log('   - Send same message: "Take a screenshot"');
console.log('   - Verify tools work with known-good providers');

console.log('\n📊 What to Report:');
console.log('-'.repeat(60));
console.log('Please expand the "🔥 ZAI Stream request: Object" log and tell me:');
console.log('   - toolsCount: ?');
console.log('   - hasTools: ?');
console.log('   - tools[0].function.name: ?');
console.log('   - Model ID: ?');
console.log('   - Base URL: ?');

console.log('\n💡 Likely Conclusion:');
console.log('-'.repeat(60));
console.log('Based on the response, Z.AI GLM models may NOT actually support');
console.log('function calling despite the documentation. This is common with');
console.log('Chinese LLM providers where documentation is ahead of implementation.');
console.log('');
console.log('Recommendation: Test with OpenAI GPT-4o or Anthropic Claude to');
console.log('verify the tool system works, then report to Z.AI support that');
console.log('function calling is not working as documented.');

console.log('\n' + '='.repeat(60));
