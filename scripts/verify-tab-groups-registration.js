/**
 * Verification script for tab groups tool registration
 * 
 * Verifies that:
 * 1. Tab groups tool is registered in the registry
 * 2. Tool can be retrieved by name
 * 3. Schemas are generated correctly
 */

import { toolRegistry } from '../src/tools/registry.ts';

console.log('🔍 Verifying Tab Groups Tool Registration\n');

// Test 1: Check if tool is registered
console.log('Test 1: Tool registration');
const allTools = toolRegistry.getAllTools();
console.log(`✓ Total tools registered: ${allTools.length}`);
console.log(`✓ Tool names: ${allTools.map(t => t.name).join(', ')}\n`);

// Test 2: Retrieve tab groups tool
console.log('Test 2: Retrieve tab_groups tool');
const tabGroupsTool = toolRegistry.getTool('tab_groups');
if (tabGroupsTool) {
  console.log('✓ Tab groups tool found');
  console.log(`  Name: ${tabGroupsTool.name}`);
  console.log(`  Description: ${tabGroupsTool.description}\n`);
} else {
  console.error('❌ Tab groups tool not found!\n');
  process.exit(1);
}

// Test 3: Generate Anthropic schema
console.log('Test 3: Anthropic schema generation');
const anthropicSchemas = toolRegistry.getAnthropicSchemas();
const tabGroupsAnthropicSchema = anthropicSchemas.find(s => s.name === 'tab_groups');
if (tabGroupsAnthropicSchema) {
  console.log('✓ Anthropic schema generated');
  console.log(`  Actions: ${tabGroupsAnthropicSchema.input_schema.properties.action.enum.join(', ')}`);
  console.log(`  Colors: ${tabGroupsAnthropicSchema.input_schema.properties.color.enum.join(', ')}\n`);
} else {
  console.error('❌ Anthropic schema not found!\n');
  process.exit(1);
}

// Test 4: Generate OpenAI schema
console.log('Test 4: OpenAI schema generation');
const openaiSchemas = toolRegistry.getOpenAISchemas();
const tabGroupsOpenAISchema = openaiSchemas.find(s => s.function.name === 'tab_groups');
if (tabGroupsOpenAISchema) {
  console.log('✓ OpenAI schema generated');
  console.log(`  Actions: ${tabGroupsOpenAISchema.function.parameters.properties.action.enum.join(', ')}`);
  console.log(`  Colors: ${tabGroupsOpenAISchema.function.parameters.properties.color.enum.join(', ')}\n`);
} else {
  console.error('❌ OpenAI schema not found!\n');
  process.exit(1);
}

console.log('✅ All verification tests passed!');
console.log('\nTab groups tool is properly registered and ready to use.');
