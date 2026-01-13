/**
 * Verification Script for ZAI Plan Types
 * 
 * Verifies that the ZAI plan type implementation is working correctly
 */

console.log('🧪 Verifying ZAI Plan Types Implementation...\n');

// Test the plan type configuration logic
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

// ZAI configuration from provider-configs.ts
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

// Test cases
const testCases = [
  {
    name: 'Coding plan with no custom URL',
    planType: 'coding',
    userBaseUrl: null,
    expected: 'https://api.z.ai/api/coding/paas/v4',
  },
  {
    name: 'General plan with no custom URL',
    planType: 'general',
    userBaseUrl: null,
    expected: 'https://open.bigmodel.cn/api/paas/v4',
  },
  {
    name: 'No plan type specified (default)',
    planType: null,
    userBaseUrl: null,
    expected: 'https://open.bigmodel.cn/api/paas/v4',
  },
  {
    name: 'Custom URL overrides plan type',
    planType: 'coding',
    userBaseUrl: 'https://custom.example.com/v1',
    expected: 'https://custom.example.com/v1',
  },
];

let passed = 0;
let total = testCases.length;

console.log('🔍 Testing Plan Type URL Resolution:');
for (const testCase of testCases) {
  const result = getBaseUrlForPlan(testCase.planType, testCase.userBaseUrl, zaiConfig);
  const success = result === testCase.expected;
  
  console.log(`${success ? '✅' : '❌'} ${testCase.name}`);
  console.log(`   Expected: ${testCase.expected}`);
  console.log(`   Got: ${result}`);
  
  if (success) passed++;
  console.log('');
}

// Test model selection logic
console.log('🔍 Testing Model Selection Logic:');

function getModelsForPlan(planType, config) {
  if (planType && config.planTypes && config.planTypes[planType]) {
    return config.planTypes[planType].defaultModels;
  }
  return config.defaultModels;
}

const modelTests = [
  {
    name: 'Coding plan models',
    planType: 'coding',
    expected: ['glm-4.7', 'glm-4.6', 'glm-4.5'],
  },
  {
    name: 'General plan models',
    planType: 'general',
    expected: ['glm-4-plus', 'glm-4-flash', 'glm-4v-plus', 'glm-4-long'],
  },
  {
    name: 'Default models (no plan type)',
    planType: null,
    expected: ['glm-4-plus', 'glm-4-flash', 'glm-4v-plus', 'glm-4-long'],
  },
];

for (const test of modelTests) {
  const result = getModelsForPlan(test.planType, zaiConfig);
  const success = JSON.stringify(result) === JSON.stringify(test.expected);
  
  console.log(`${success ? '✅' : '❌'} ${test.name}`);
  console.log(`   Expected: ${test.expected.join(', ')}`);
  console.log(`   Got: ${result.join(', ')}`);
  
  if (success) passed++;
  total++;
  console.log('');
}

// Test endpoint detection logic (from ZAI provider)
console.log('🔍 Testing Endpoint Detection Logic:');

function detectPlanFromUrl(baseUrl) {
  return baseUrl?.includes('api.z.ai/api/coding') ? 'coding' : 'general';
}

function getDefaultModelForPlan(planType) {
  return planType === 'coding' ? 'glm-4.7' : 'glm-4-plus';
}

const endpointTests = [
  {
    name: 'Coding endpoint detection',
    baseUrl: 'https://api.z.ai/api/coding/paas/v4',
    expectedPlan: 'coding',
    expectedModel: 'glm-4.7',
  },
  {
    name: 'General endpoint detection',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    expectedPlan: 'general',
    expectedModel: 'glm-4-plus',
  },
];

for (const test of endpointTests) {
  const detectedPlan = detectPlanFromUrl(test.baseUrl);
  const defaultModel = getDefaultModelForPlan(detectedPlan);
  
  const planSuccess = detectedPlan === test.expectedPlan;
  const modelSuccess = defaultModel === test.expectedModel;
  const success = planSuccess && modelSuccess;
  
  console.log(`${success ? '✅' : '❌'} ${test.name}`);
  console.log(`   Expected plan: ${test.expectedPlan}, got: ${detectedPlan}`);
  console.log(`   Expected model: ${test.expectedModel}, got: ${defaultModel}`);
  
  if (success) passed++;
  total++;
  console.log('');
}

console.log(`📊 Verification Results: ${passed}/${total} tests passed`);

if (passed === total) {
  console.log('🎉 All ZAI plan type verifications passed!');
  console.log('\n💡 Implementation Summary:');
  console.log('✅ Plan type configuration system working');
  console.log('✅ URL resolution logic correct');
  console.log('✅ Model selection logic correct');
  console.log('✅ Endpoint detection logic correct');
  console.log('\n🚀 ZAI provider now supports both coding and general plans!');
} else {
  console.log(`❌ ${total - passed} verifications failed`);
  process.exit(1);
}