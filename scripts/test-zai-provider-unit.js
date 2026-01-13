/**
 * Unit Test Verification for ZAI Provider Configuration
 * 
 * Simple verification script to test ZAI provider functionality
 */

import { createProvider } from '../dist/src/providers/factory.js';
import { getProviderPlanTypes, supportsMultiplePlans } from '../dist/src/providers/provider-configs.js';

console.log('🧪 Testing ZAI Provider Configuration...\n');

let testsPassed = 0;
let testsTotal = 0;

function test(description, testFn) {
  testsTotal++;
  try {
    testFn();
    console.log(`✅ ${description}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${description}`);
    console.log(`   Error: ${error.message}`);
  }
}

function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`);
      }
    },
    toContain: (expected) => {
      if (!actual.includes(expected)) {
        throw new Error(`Expected "${actual}" to contain "${expected}"`);
      }
    },
    toBeDefined: () => {
      if (actual === undefined) {
        throw new Error('Expected value to be defined');
      }
    },
    toHaveProperty: (prop) => {
      if (!(prop in actual)) {
        throw new Error(`Expected object to have property "${prop}"`);
      }
    },
    toHaveLength: (length) => {
      if (actual.length !== length) {
        throw new Error(`Expected length ${length}, got ${actual.length}`);
      }
    },
    toEqual: (expected) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    }
  };
}

// Test 1: Plan Type Support
test('should support multiple plan types', () => {
  expect(supportsMultiplePlans('zai')).toBe(true);
  
  const planTypes = getProviderPlanTypes('zai');
  expect(planTypes).toBeDefined();
  expect(planTypes).toHaveProperty('general');
  expect(planTypes).toHaveProperty('coding');
});

// Test 2: Plan Configurations
test('should have correct plan configurations', () => {
  const planTypes = getProviderPlanTypes('zai');
  
  // General plan
  expect(planTypes.general.baseUrl).toBe('https://open.bigmodel.cn/api/paas/v4');
  expect(planTypes.general.description).toContain('General ZAI plan');
  expect(planTypes.general.defaultModels).toContain('glm-4-plus');
  
  // Coding plan
  expect(planTypes.coding.baseUrl).toBe('https://api.z.ai/api/coding/paas/v4');
  expect(planTypes.coding.description).toContain('Coding plan');
  expect(planTypes.coding.defaultModels).toContain('glm-4.7');
});

// Test 3: Provider Creation with Coding Plan
test('should create provider with coding plan', () => {
  const provider = createProvider('zai', {
    apiKey: 'test-key',
    planType: 'coding'
  });
  
  expect(provider.config.baseUrl).toBe('https://api.z.ai/api/coding/paas/v4');
  expect(provider.type).toBe('zai');
});

// Test 4: Provider Creation with General Plan
test('should create provider with general plan', () => {
  const provider = createProvider('zai', {
    apiKey: 'test-key',
    planType: 'general'
  });
  
  expect(provider.config.baseUrl).toBe('https://open.bigmodel.cn/api/paas/v4');
  expect(provider.type).toBe('zai');
});

// Test 5: Default Plan Type
test('should default to general plan when no plan type specified', () => {
  const provider = createProvider('zai', {
    apiKey: 'test-key'
  });
  
  expect(provider.config.baseUrl).toBe('https://open.bigmodel.cn/api/paas/v4');
});

// Test 6: Custom Base URL Override
test('should allow custom base URL to override plan type', () => {
  const customUrl = 'https://custom.zai.example.com/v1';
  const provider = createProvider('zai', {
    apiKey: 'test-key',
    planType: 'coding',
    baseUrl: customUrl
  });
  
  expect(provider.config.baseUrl).toBe(customUrl);
});

// Test 7: GLM Model Loading for Coding Plan
test('should provide coding models for coding plan', () => {
  const provider = createProvider('zai', {
    apiKey: 'test-key',
    planType: 'coding'
  });
  
  const models = provider.getDefaultModels();
  
  expect(models).toHaveLength(3);
  expect(models.map(m => m.id)).toEqual(['glm-4.7', 'glm-4.6', 'glm-4.5']);
  expect(models[0].name).toBe('GLM-4.7 (Coding)');
  expect(models[0].provider).toBe('zai');
});

// Test 8: GLM Model Loading for General Plan
test('should provide general models for general plan', () => {
  const provider = createProvider('zai', {
    apiKey: 'test-key',
    planType: 'general'
  });
  
  const models = provider.getDefaultModels();
  
  expect(models).toHaveLength(4);
  expect(models.map(m => m.id)).toEqual(['glm-4-plus', 'glm-4-flash', 'glm-4v-plus', 'glm-4-long']);
  expect(models[0].name).toBe('GLM-4 Plus');
});

// Test 9: Default Model Selection
test('should set correct default model for each plan', () => {
  const codingProvider = createProvider('zai', {
    apiKey: 'test-key',
    planType: 'coding'
  });
  
  const generalProvider = createProvider('zai', {
    apiKey: 'test-key',
    planType: 'general'
  });
  
  expect(codingProvider.getDefaultModel()).toBe('glm-4.7');
  expect(generalProvider.getDefaultModel()).toBe('glm-4-plus');
});

// Test 10: Model Capabilities
test('should have correct capabilities for coding models', () => {
  const provider = createProvider('zai', {
    apiKey: 'test-key',
    planType: 'coding'
  });
  
  const models = provider.getDefaultModels();
  
  for (const model of models) {
    expect(model.capabilities.supportsTools).toBe(true);
    expect(model.capabilities.supportsStreaming).toBe(true);
    expect(model.capabilities.supportsVision).toBe(false); // Coding models don't support vision
    expect(model.capabilities.contextWindow).toBe(128000);
  }
});

console.log(`\n📊 Test Results: ${testsPassed}/${testsTotal} tests passed`);

if (testsPassed === testsTotal) {
  console.log('🎉 All ZAI provider tests passed!');
} else {
  console.log(`❌ ${testsTotal - testsPassed} tests failed`);
  process.exit(1);
}