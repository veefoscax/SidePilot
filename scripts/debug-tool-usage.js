/**
 * Debug Tool Usage Script
 * 
 * Helps diagnose why Z.AI (or other providers) aren't using tools.
 * Run this after reloading the extension to check tool integration.
 */

console.log('🔍 Tool Usage Debug Script');
console.log('='.repeat(60));

// Step 1: Check if tools are registered
console.log('\n📋 Step 1: Checking Tool Registry');
console.log('-'.repeat(60));

try {
  // This would need to be run in the extension context
  console.log('✅ Tool registry should contain 6 browser tools:');
  console.log('   1. screenshot - Capture page screenshots');
  console.log('   2. click - Click on elements');
  console.log('   3. type - Type text into inputs');
  console.log('   4. navigate - Navigate to URLs or search');
  console.log('   5. wait - Wait for elements/conditions');
  console.log('   6. extract - Extract page content');
} catch (error) {
  console.error('❌ Failed to check tool registry:', error);
}

// Step 2: Check tool format conversion
console.log('\n🔄 Step 2: Tool Format Conversion');
console.log('-'.repeat(60));
console.log('Tools should be converted to OpenAI format:');
console.log(`{
  type: 'function',
  function: {
    name: 'screenshot',
    description: '...',
    parameters: {
      type: 'object',
      properties: { ... },
      required: [ ... ]
    }
  }
}`);

// Step 3: What to look for in console logs
console.log('\n🔥 Step 3: Console Log Checklist');
console.log('-'.repeat(60));
console.log('After sending a message, look for these logs:');
console.log('');
console.log('1. "🔥 ZAI Stream request:" - Should show:');
console.log('   - toolsCount: 6 (or more)');
console.log('   - hasTools: true');
console.log('   - tools: [array of 6 tool definitions]');
console.log('');
console.log('2. "📦 ZAI Raw buffer received:" - Shows API response');
console.log('   - Look for "tool_calls" in the response');
console.log('   - Check if model is returning tool calls');
console.log('');
console.log('3. "ZAI Stream chunk:" - Shows parsed chunks');
console.log('   - type: "content" for text');
console.log('   - type: "reasoning" for thinking');
console.log('   - type: "other" might indicate tool calls');
console.log('');
console.log('4. "Tool call received:" - Confirms tool execution');
console.log('   - Should show tool name and parameters');

// Step 4: Common issues
console.log('\n⚠️  Step 4: Common Issues & Solutions');
console.log('-'.repeat(60));
console.log('');
console.log('Issue 1: toolsCount is 0 or hasTools is false');
console.log('  → Tools not being passed to provider');
console.log('  → Check Chat.tsx handleSendMessage function');
console.log('');
console.log('Issue 2: Tools sent but model never calls them');
console.log('  → Model might not support tools (API limitation)');
console.log('  → Try different model (glm-4-plus vs glm-4.7)');
console.log('  → Check Z.AI documentation for tool support');
console.log('');
console.log('Issue 3: Model returns tool_calls but not executed');
console.log('  → Check parseStreamChunk in openai.ts');
console.log('  → Look for "Tool call received:" log');
console.log('');
console.log('Issue 4: Authentication or balance errors');
console.log('  → Check API key is valid');
console.log('  → Verify Z.AI account has sufficient balance');
console.log('  → Check if coding plan is active');

// Step 5: Test prompts
console.log('\n💬 Step 5: Test Prompts to Try');
console.log('-'.repeat(60));
console.log('');
console.log('1. "Take a screenshot of this page"');
console.log('   → Should trigger screenshot tool');
console.log('');
console.log('2. "Navigate to google.com"');
console.log('   → Should trigger navigate tool');
console.log('');
console.log('3. "Click on the first link on this page"');
console.log('   → Should trigger screenshot (to see elements) then click');
console.log('');
console.log('4. "Extract all links from this page"');
console.log('   → Should trigger extract tool');

// Step 6: API compatibility check
console.log('\n🔌 Step 6: Z.AI API Compatibility');
console.log('-'.repeat(60));
console.log('');
console.log('Z.AI uses OpenAI-compatible API format, but:');
console.log('');
console.log('✅ Confirmed working:');
console.log('   - Chat completions');
console.log('   - Streaming responses');
console.log('   - Reasoning content (GLM-4.7)');
console.log('');
console.log('❓ Needs verification:');
console.log('   - Tool/function calling support');
console.log('   - Tool call format compatibility');
console.log('   - Which models support tools');
console.log('');
console.log('📚 Documentation to check:');
console.log('   - https://open.bigmodel.cn/dev/api');
console.log('   - Look for "function calling" or "tools" section');
console.log('   - Check model capabilities table');

// Step 7: Next steps
console.log('\n🎯 Step 7: Debugging Steps');
console.log('-'.repeat(60));
console.log('');
console.log('1. Reload extension (chrome://extensions → reload)');
console.log('2. Open DevTools console for the extension');
console.log('3. Send test message: "Take a screenshot of this page"');
console.log('4. Check console for "🔥 ZAI Stream request:" log');
console.log('5. Verify toolsCount > 0 and tools array is populated');
console.log('6. Check if API response includes tool_calls');
console.log('7. If no tool_calls, try different model or check API docs');
console.log('');
console.log('📊 Report findings:');
console.log('   - toolsCount: ?');
console.log('   - hasTools: ?');
console.log('   - API response includes tool_calls: ?');
console.log('   - Model being used: ?');
console.log('   - Base URL: ?');

console.log('\n' + '='.repeat(60));
console.log('✅ Debug guide complete. Follow steps above to diagnose.');
console.log('='.repeat(60));
