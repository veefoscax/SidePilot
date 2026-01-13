/**
 * Simple ZAI Plan Types Test
 * 
 * Tests the plan type configuration directly
 */

console.log('🧪 Testing ZAI Plan Types Configuration...\n');

// Test the configuration directly
const zaiConfig = {
  baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
  authMethod: 'bearer',
  requiresApiKey: true,
  defaultModels: ['glm-4-plus', 'glm-4-flash', 'glm-4v-plus', 'glm-4-long'],
  planTypes: {
    general: {
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
      description: 'General ZAI plan for standard usage',
      defaultModels: ['glm-4-plus', 'glm-4-flash', 'glm-4v-plus', 'glm-4-long'],
    },
    coding: {
      baseUrl: 'https://api.z.ai/api/coding/paas/v4',
      description: 'ZAI Coding plan optimized for development tasks',
      defaultModels: ['glm-4.7', 'glm-4.6', 'glm-4.5'],
    },
  },
};

console.log('1. ZAI Configuration:');
console.log(`   ✅ Supports multiple plans: ${!!zaiConfig.planTypes}`);
console.log(`   ✅ Default base URL: ${zaiConfig.baseUrl}`);

console.log('\n2. Available Plan Types:');
for (const [planName, planConfig] of Object.entries(zaiConfig.planTypes)) {
  console.log(`   📋 ${planName.toUpperCase()} PLAN:`);
  console.log(`      Description: ${planConfig.description}`);
  console.log(`      Base URL: ${planConfig.baseUrl}`);
  console.log(`      Models: ${planConfig.defaultModels.join(', ')}`);
  console.log('');
}

console.log('3. Plan Type Selection Logic:');

function getBaseUrlForPlan(planType, userBaseUrl, template) {
  // If user provided explicit base URL, use it
  if (userBaseUrl) {
    return userBaseUrl;
  }
  
  // If provider supports plan types and plan type is specified
  if (template.planTypes && planType && template.planTypes[planType]) {
    return template.planTypes[planType].baseUrl;
  }
  
  // Default to template base URL
  return template.baseUrl;
}

// Test different scenarios
const testCases = [
  { planType: 'coding', userBaseUrl: null, expected: 'https://api.z.ai/api/coding/paas/v4' },
  { planType: 'general', userBaseUrl: null, expected: 'https://open.bigmodel.cn/api/paas/v4' },
  { planType: null, userBaseUrl: null, expected: 'https://open.bigmodel.cn/api/paas/v4' },
  { planType: 'coding', userBaseUrl: 'https://custom.example.com', expected: 'https://custom.example.com' },
];

for (const testCase of testCases) {
  const result = getBaseUrlForPlan(testCase.planType, testCase.userBaseUrl, zaiConfig);
  const status = result === testCase.expected ? '✅' : '❌';
  console.log(`   ${status} Plan: ${testCase.planType || 'default'}, Custom URL: ${testCase.userBaseUrl || 'none'}`);
  console.log(`      Expected: ${testCase.expected}`);
  console.log(`      Got: ${result}`);
}

console.log('\n🎯 ZAI Plan Types Configuration Test Complete!');
console.log('\n💡 Usage Instructions:');
console.log('   For users with ZAI Coding Plan:');
console.log('   - Set planType to "coding" in provider configuration');
console.log('   - This will use: https://api.z.ai/api/coding/paas/v4');
console.log('   - Available models: glm-4.7, glm-4.6, glm-4.5');
console.log('');
console.log('   For users with ZAI General Plan:');
console.log('   - Set planType to "general" or leave empty');
console.log('   - This will use: https://open.bigmodel.cn/api/paas/v4');
console.log('   - Available models: glm-4-plus, glm-4-flash, glm-4v-plus, glm-4-long');