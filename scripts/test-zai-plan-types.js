/**
 * Test ZAI Plan Types Support
 * 
 * Verifies that ZAI provider correctly handles both general and coding plans
 */

import { createProvider } from '../dist/src/providers/factory.js';
import { getProviderPlanTypes, supportsMultiplePlans } from '../dist/src/providers/provider-configs.js';

console.log('🧪 Testing ZAI Plan Types Support...\n');

// Test 1: Check if ZAI supports multiple plans
console.log('1. Testing plan type support:');
const hasMultiplePlans = supportsMultiplePlans('zai');
console.log(`   ZAI supports multiple plans: ${hasMultiplePlans ? '✅' : '❌'}`);

if (hasMultiplePlans) {
  const planTypes = getProviderPlanTypes('zai');
  console.log('   Available plan types:');
  for (const [planName, planConfig] of Object.entries(planTypes)) {
    console.log(`     - ${planName}: ${planConfig.description}`);
    console.log(`       Base URL: ${planConfig.baseUrl}`);
    console.log(`       Models: ${planConfig.defaultModels.join(', ')}`);
  }
}

console.log('\n2. Testing provider creation with different plan types:');

// Test 2: Create ZAI provider with general plan
try {
  const generalProvider = createProvider('zai', {
    apiKey: 'test-key',
    planType: 'general'
  });
  console.log(`   ✅ General plan provider created`);
  console.log(`      Base URL: ${generalProvider.config.baseUrl}`);
  
  const generalModels = generalProvider.getDefaultModels ? generalProvider.getDefaultModels() : [];
  console.log(`      Default models: ${generalModels.map(m => m.id).join(', ')}`);
} catch (error) {
  console.log(`   ❌ General plan failed: ${error.message}`);
}

// Test 3: Create ZAI provider with coding plan
try {
  const codingProvider = createProvider('zai', {
    apiKey: 'test-key',
    planType: 'coding'
  });
  console.log(`   ✅ Coding plan provider created`);
  console.log(`      Base URL: ${codingProvider.config.baseUrl}`);
  
  const codingModels = codingProvider.getDefaultModels ? codingProvider.getDefaultModels() : [];
  console.log(`      Default models: ${codingModels.map(m => m.id).join(', ')}`);
} catch (error) {
  console.log(`   ❌ Coding plan failed: ${error.message}`);
}

// Test 4: Create ZAI provider without plan type (should use default)
try {
  const defaultProvider = createProvider('zai', {
    apiKey: 'test-key'
  });
  console.log(`   ✅ Default plan provider created`);
  console.log(`      Base URL: ${defaultProvider.config.baseUrl}`);
} catch (error) {
  console.log(`   ❌ Default plan failed: ${error.message}`);
}

console.log('\n🎯 ZAI Plan Types Test Complete!');