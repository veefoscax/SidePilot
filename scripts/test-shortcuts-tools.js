/**
 * Test script for shortcuts tools integration
 * 
 * Verifies that shortcuts_list and shortcuts_execute tools are properly
 * registered in the tool registry and have correct schemas.
 */

console.log('🧪 Testing Shortcuts Tools Integration\n');

// Test 1: Check tool registry exports
console.log('1️⃣ Checking tool registry exports...');
try {
  const registryModule = await import('../src/tools/registry.ts');
  const { toolRegistry } = registryModule;
  
  if (!toolRegistry) {
    throw new Error('toolRegistry not exported');
  }
  
  console.log('✅ Tool registry exported correctly\n');
} catch (error) {
  console.error('❌ Failed to import tool registry:', error.message);
  process.exit(1);
}

// Test 2: Check shortcuts tools are registered
console.log('2️⃣ Checking shortcuts tools registration...');
try {
  const registryModule = await import('../src/tools/registry.ts');
  const { toolRegistry } = registryModule;
  
  const shortcutsListTool = toolRegistry.getTool('shortcuts_list');
  const shortcutsExecuteTool = toolRegistry.getTool('shortcuts_execute');
  
  if (!shortcutsListTool) {
    throw new Error('shortcuts_list tool not registered');
  }
  
  if (!shortcutsExecuteTool) {
    throw new Error('shortcuts_execute tool not registered');
  }
  
  console.log('✅ shortcuts_list tool registered');
  console.log('✅ shortcuts_execute tool registered\n');
} catch (error) {
  console.error('❌ Failed to check tool registration:', error.message);
  process.exit(1);
}

// Test 3: Check Anthropic schemas
console.log('3️⃣ Checking Anthropic schemas...');
try {
  const registryModule = await import('../src/tools/registry.ts');
  const { toolRegistry } = registryModule;
  
  const anthropicSchemas = toolRegistry.getAnthropicSchemas();
  const shortcutsListSchema = anthropicSchemas.find(s => s.name === 'shortcuts_list');
  const shortcutsExecuteSchema = anthropicSchemas.find(s => s.name === 'shortcuts_execute');
  
  if (!shortcutsListSchema) {
    throw new Error('shortcuts_list Anthropic schema not found');
  }
  
  if (!shortcutsExecuteSchema) {
    throw new Error('shortcuts_execute Anthropic schema not found');
  }
  
  console.log('✅ shortcuts_list Anthropic schema:', JSON.stringify(shortcutsListSchema, null, 2));
  console.log('✅ shortcuts_execute Anthropic schema:', JSON.stringify(shortcutsExecuteSchema, null, 2));
  console.log();
} catch (error) {
  console.error('❌ Failed to check Anthropic schemas:', error.message);
  process.exit(1);
}

// Test 4: Check OpenAI schemas
console.log('4️⃣ Checking OpenAI schemas...');
try {
  const registryModule = await import('../src/tools/registry.ts');
  const { toolRegistry } = registryModule;
  
  const openaiSchemas = toolRegistry.getOpenAISchemas();
  const shortcutsListSchema = openaiSchemas.find(s => s.function.name === 'shortcuts_list');
  const shortcutsExecuteSchema = openaiSchemas.find(s => s.function.name === 'shortcuts_execute');
  
  if (!shortcutsListSchema) {
    throw new Error('shortcuts_list OpenAI schema not found');
  }
  
  if (!shortcutsExecuteSchema) {
    throw new Error('shortcuts_execute OpenAI schema not found');
  }
  
  console.log('✅ shortcuts_list OpenAI schema:', JSON.stringify(shortcutsListSchema, null, 2));
  console.log('✅ shortcuts_execute OpenAI schema:', JSON.stringify(shortcutsExecuteSchema, null, 2));
  console.log();
} catch (error) {
  console.error('❌ Failed to check OpenAI schemas:', error.message);
  process.exit(1);
}

// Test 5: Verify tool descriptions are appropriate for LLM
console.log('5️⃣ Verifying tool descriptions...');
try {
  const registryModule = await import('../src/tools/registry.ts');
  const { toolRegistry } = registryModule;
  
  const shortcutsListTool = toolRegistry.getTool('shortcuts_list');
  const shortcutsExecuteTool = toolRegistry.getTool('shortcuts_execute');
  
  // Check shortcuts_list description
  if (!shortcutsListTool.description.includes('saved prompts') && 
      !shortcutsListTool.description.includes('shortcuts')) {
    throw new Error('shortcuts_list description should mention saved prompts or shortcuts');
  }
  
  // Check shortcuts_execute description
  if (!shortcutsExecuteTool.description.includes('Execute') && 
      !shortcutsExecuteTool.description.includes('execute')) {
    throw new Error('shortcuts_execute description should mention execution');
  }
  
  if (!shortcutsExecuteTool.description.includes('shortcuts_list')) {
    throw new Error('shortcuts_execute description should reference shortcuts_list');
  }
  
  console.log('✅ shortcuts_list description:', shortcutsListTool.description);
  console.log('✅ shortcuts_execute description:', shortcutsExecuteTool.description);
  console.log();
} catch (error) {
  console.error('❌ Failed to verify tool descriptions:', error.message);
  process.exit(1);
}

// Test 6: Count total tools
console.log('6️⃣ Counting total registered tools...');
try {
  const registryModule = await import('../src/tools/registry.ts');
  const { toolRegistry } = registryModule;
  
  const allTools = toolRegistry.getAllTools();
  console.log(`✅ Total tools registered: ${allTools.length}`);
  console.log('   Tools:', allTools.map(t => t.name).join(', '));
  console.log();
} catch (error) {
  console.error('❌ Failed to count tools:', error.message);
  process.exit(1);
}

console.log('✅ All shortcuts tools integration tests passed!');
