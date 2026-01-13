/**
 * Test Provider Connection Fixes
 * 
 * Comprehensive test suite for the enhanced provider system
 */

console.log('🧪 Testing Provider Connection Fixes...\n');

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    results.passed++;
    results.tests.push({ name, status: 'passed' });
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    results.failed++;
    results.tests.push({ name, status: 'failed', error: error.message });
  }
}

async function runTests() {
  console.log('1. Testing Provider Configuration Registry...');
  
  test('Provider configs module loads', () => {
    const configs = require('../dist/src/providers/provider-configs.js');
    if (!configs.PROVIDER_CONFIGS) throw new Error('PROVIDER_CONFIGS not exported');
    if (!configs.getProviderConfig) throw new Error('getProviderConfig not exported');
  });
  
  test('ZAI provider config is correct', () => {
    const { getProviderConfig } = require('../dist/src/providers/provider-configs.js');
    const zaiConfig = getProviderConfig('zai');
    
    if (zaiConfig.baseUrl !== 'https://open.bigmodel.cn/api/paas/v4') {
      throw new Error(`Wrong base URL: ${zaiConfig.baseUrl}`);
    }
    if (zaiConfig.authMethod !== 'bearer') {
      throw new Error(`Wrong auth method: ${zaiConfig.authMethod}`);
    }
    if (!zaiConfig.requiresApiKey) {
      throw new Error('Should require API key');
    }
    if (!zaiConfig.defaultModels.includes('glm-4-plus')) {
      throw new Error('Missing glm-4-plus model');
    }
  });
  
  test('All 40+ providers have configurations', () => {
    const { PROVIDER_CONFIGS } = require('../dist/src/providers/provider-configs.js');
    const providerCount = Object.keys(PROVIDER_CONFIGS).length;
    
    if (providerCount < 40) {
      throw new Error(`Only ${providerCount} providers configured, expected 40+`);
    }
    
    console.log(`   Found ${providerCount} provider configurations`);
  });
  
  console.log('\n2. Testing Enhanced Provider Factory...');
  
  test('Factory module loads', () => {
    const factory = require('../dist/src/providers/factory.js');
    if (!factory.createProvider) throw new Error('createProvider not exported');
    if (!factory.getSupportedProviders) throw new Error('getSupportedProviders not exported');
  });
  
  test('Factory validates missing API key', () => {
    const { createProvider } = require('../dist/src/providers/factory.js');
    
    try {
      createProvider('openai', {}); // No API key
      throw new Error('Should have thrown error for missing API key');
    } catch (error) {
      if (!error.message.includes('API key is required')) {
        throw new Error(`Wrong error message: ${error.message}`);
      }
    }
  });
  
  test('Factory validates invalid base URL', () => {
    const { createProvider } = require('../dist/src/providers/factory.js');
    
    try {
      createProvider('openai', {
        apiKey: 'test-key',
        baseUrl: 'invalid-url'
      });
      throw new Error('Should have thrown error for invalid base URL');
    } catch (error) {
      if (!error.message.includes('Invalid base URL')) {
        throw new Error(`Wrong error message: ${error.message}`);
      }
    }
  });
  
  test('Factory creates providers with correct configuration', () => {
    const { createProvider } = require('../dist/src/providers/factory.js');
    
    // Test with local provider (no API key required)
    const ollamaProvider = createProvider('ollama', {});
    if (ollamaProvider.type !== 'ollama') {
      throw new Error(`Wrong provider type: ${ollamaProvider.type}`);
    }
    
    // Test with API key provider
    const openaiProvider = createProvider('openai', {
      apiKey: 'test-key'
    });
    if (openaiProvider.type !== 'openai') {
      throw new Error(`Wrong provider type: ${openaiProvider.type}`);
    }
  });
  
  console.log('\n3. Testing ZAI Provider Implementation...');
  
  test('ZAI provider can be created', () => {
    const { createProvider } = require('../dist/src/providers/factory.js');
    const zaiProvider = createProvider('zai', {
      apiKey: 'test-key'
    });
    
    if (zaiProvider.type !== 'zai') {
      throw new Error(`Wrong provider type: ${zaiProvider.type}`);
    }
    
    if (!zaiProvider.config.baseUrl.includes('open.bigmodel.cn')) {
      throw new Error(`Wrong base URL: ${zaiProvider.config.baseUrl}`);
    }
  });
  
  test('ZAI provider has correct default models', () => {
    const { createProvider } = require('../dist/src/providers/factory.js');
    const zaiProvider = createProvider('zai', {
      apiKey: 'test-key'
    });
    
    const models = zaiProvider.getDefaultModels();
    const modelIds = models.map(m => m.id);
    
    if (!modelIds.includes('glm-4-plus')) {
      throw new Error('Missing glm-4-plus model');
    }
    if (!modelIds.includes('glm-4v-plus')) {
      throw new Error('Missing glm-4v-plus model');
    }
    if (!modelIds.includes('glm-4-long')) {
      throw new Error('Missing glm-4-long model');
    }
    
    console.log(`   Found ${models.length} ZAI models: ${modelIds.join(', ')}`);
  });
  
  console.log('\n4. Testing Connection State Management...');
  
  test('ConnectionState class works', () => {
    const { ConnectionState } = require('../dist/src/providers/connection-state.js');
    const state = new ConnectionState();
    
    if (state.getStatus() !== 'untested') {
      throw new Error(`Wrong initial status: ${state.getStatus()}`);
    }
    
    state.markSuccess();
    if (state.getStatus() !== 'healthy') {
      throw new Error(`Wrong status after success: ${state.getStatus()}`);
    }
    
    const error = new Error('Test error');
    state.markFailure(error);
    if (state.getStatus() !== 'degraded') {
      throw new Error(`Wrong status after failure: ${state.getStatus()}`);
    }
  });
  
  console.log('\n5. Testing Provider Types and Interfaces...');
  
  test('All required types are exported', () => {
    const types = require('../dist/src/providers/types.js');
    
    const requiredTypes = [
      'ProviderError',
      'AuthenticationError', 
      'RateLimitError',
      'NetworkError',
      'ModelNotFoundError'
    ];
    
    for (const typeName of requiredTypes) {
      if (!types[typeName]) {
        throw new Error(`Missing type: ${typeName}`);
      }
    }
  });
  
  console.log('\n6. Testing Build Integration...');
  
  test('All provider files build successfully', () => {
    const fs = require('fs');
    const path = require('path');
    
    const requiredFiles = [
      'dist/src/providers/types.js',
      'dist/src/providers/base-provider.js',
      'dist/src/providers/factory.js',
      'dist/src/providers/openai.js',
      'dist/src/providers/zai.js',
      'dist/src/providers/provider-configs.js',
      'dist/src/providers/connection-state.js'
    ];
    
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Missing built file: ${file}`);
      }
    }
    
    console.log(`   All ${requiredFiles.length} provider files built successfully`);
  });
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
  
  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests
      .filter(t => t.status === 'failed')
      .forEach(t => console.log(`   - ${t.name}: ${t.error}`));
  }
  
  console.log('\n🎉 Provider connection fixes testing completed!');
  
  return {
    success: results.failed === 0,
    passed: results.passed,
    failed: results.failed,
    total: results.passed + results.failed
  };
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = { runTests };