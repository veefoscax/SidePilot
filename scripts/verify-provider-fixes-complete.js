/**
 * Verify Provider Connection Fixes - Complete System Test
 * 
 * Final verification that all provider connection fixes are working correctly
 */

console.log('🔍 Verifying Complete Provider Connection Fixes...\n');

const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, fn) {
  try {
    const result = fn();
    if (result === false) {
      throw new Error('Test returned false');
    }
    console.log(`✅ ${name}`);
    results.passed++;
    results.tests.push({ name, status: 'passed' });
    return true;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    results.failed++;
    results.tests.push({ name, status: 'failed', error: error.message });
    return false;
  }
}

async function verifyComplete() {
  console.log('1. Core System Verification...');
  
  // Verify all required files exist
  const fs = require('fs');
  const requiredFiles = [
    'src/providers/types.ts',
    'src/providers/base-provider.ts',
    'src/providers/connection-state.ts',
    'src/providers/provider-configs.ts',
    'src/providers/factory.ts',
    'src/providers/openai.ts',
    'src/providers/zai.ts',
    'src/stores/provider.ts',
    'dist/sidepanel.js'
  ];
  
  test('All required files exist', () => {
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Missing file: ${file}`);
      }
    }
    return true;
  });
  
  console.log('\n2. Provider Configuration Registry...');
  
  test('Provider configs load correctly', () => {
    const configs = require('../dist/src/providers/provider-configs.js');
    const providerCount = Object.keys(configs.PROVIDER_CONFIGS).length;
    
    if (providerCount < 40) {
      throw new Error(`Only ${providerCount} providers, expected 40+`);
    }
    
    console.log(`   📊 ${providerCount} providers configured`);
    return true;
  });
  
  test('ZAI configuration is correct', () => {
    const { getProviderConfig } = require('../dist/src/providers/provider-configs.js');
    const zaiConfig = getProviderConfig('zai');
    
    const expectedUrl = 'https://open.bigmodel.cn/api/paas/v4';
    if (zaiConfig.baseUrl !== expectedUrl) {
      throw new Error(`Wrong ZAI base URL: ${zaiConfig.baseUrl}, expected: ${expectedUrl}`);
    }
    
    if (!zaiConfig.defaultModels.includes('glm-4-plus')) {
      throw new Error('Missing glm-4-plus in ZAI default models');
    }
    
    console.log(`   🎯 ZAI: ${zaiConfig.baseUrl} with ${zaiConfig.defaultModels.length} models`);
    return true;
  });
  
  test('All providers have required configuration', () => {
    const { PROVIDER_CONFIGS } = require('../dist/src/providers/provider-configs.js');
    
    for (const [type, config] of Object.entries(PROVIDER_CONFIGS)) {
      if (!config.baseUrl) {
        throw new Error(`Provider ${type} missing baseUrl`);
      }
      if (!config.authMethod) {
        throw new Error(`Provider ${type} missing authMethod`);
      }
      if (!Array.isArray(config.defaultModels)) {
        throw new Error(`Provider ${type} missing defaultModels array`);
      }
    }
    
    return true;
  });
  
  console.log('\n3. Enhanced Provider Factory...');
  
  test('Factory validates configurations', () => {
    const { createProvider } = require('../dist/src/providers/factory.js');
    
    // Test missing API key validation
    try {
      createProvider('openai', {});
      throw new Error('Should have thrown error for missing API key');
    } catch (error) {
      if (!error.message.includes('API key is required')) {
        throw new Error(`Wrong error message: ${error.message}`);
      }
    }
    
    // Test invalid base URL validation
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
    
    return true;
  });
  
  test('Factory creates providers correctly', () => {
    const { createProvider } = require('../dist/src/providers/factory.js');
    
    // Test local provider (no API key required)
    const ollama = createProvider('ollama', {});
    if (ollama.type !== 'ollama') {
      throw new Error(`Wrong ollama type: ${ollama.type}`);
    }
    
    // Test API key provider
    const openai = createProvider('openai', { apiKey: 'test-key' });
    if (openai.type !== 'openai') {
      throw new Error(`Wrong openai type: ${openai.type}`);
    }
    
    // Test ZAI provider
    const zai = createProvider('zai', { apiKey: 'test-key' });
    if (zai.type !== 'zai') {
      throw new Error(`Wrong zai type: ${zai.type}`);
    }
    
    console.log(`   🏭 Created providers: ollama, openai, zai`);
    return true;
  });
  
  console.log('\n4. ZAI Provider Implementation...');
  
  test('ZAI provider has correct models', () => {
    const { createProvider } = require('../dist/src/providers/factory.js');
    const zai = createProvider('zai', { apiKey: 'test-key' });
    
    const models = zai.getDefaultModels();
    const modelIds = models.map(m => m.id);
    
    const expectedModels = ['glm-4-plus', 'glm-4-flash', 'glm-4v-plus', 'glm-4-long'];
    for (const expected of expectedModels) {
      if (!modelIds.includes(expected)) {
        throw new Error(`Missing ZAI model: ${expected}`);
      }
    }
    
    console.log(`   🤖 ZAI models: ${modelIds.join(', ')}`);
    return true;
  });
  
  test('ZAI provider has correct capabilities', () => {
    const { createProvider } = require('../dist/src/providers/factory.js');
    const zai = createProvider('zai', { apiKey: 'test-key' });
    
    const models = zai.getDefaultModels();
    const visionModel = models.find(m => m.id === 'glm-4v-plus');
    
    if (!visionModel) {
      throw new Error('Missing glm-4v-plus vision model');
    }
    
    if (!visionModel.capabilities.supportsVision) {
      throw new Error('glm-4v-plus should support vision');
    }
    
    const longModel = models.find(m => m.id === 'glm-4-long');
    if (longModel.capabilities.contextWindow !== 1000000) {
      throw new Error(`Wrong context window for glm-4-long: ${longModel.capabilities.contextWindow}`);
    }
    
    console.log(`   👁️ Vision support: ${visionModel.capabilities.supportsVision}`);
    console.log(`   📏 Long context: ${longModel.capabilities.contextWindow.toLocaleString()} tokens`);
    return true;
  });
  
  console.log('\n5. Connection State Management...');
  
  test('ConnectionState works correctly', () => {
    const { ConnectionState } = require('../dist/src/providers/connection-state.js');
    const state = new ConnectionState();
    
    // Test initial state
    if (state.getStatus() !== 'untested') {
      throw new Error(`Wrong initial status: ${state.getStatus()}`);
    }
    
    // Test success
    state.markSuccess();
    if (state.getStatus() !== 'healthy') {
      throw new Error(`Wrong status after success: ${state.getStatus()}`);
    }
    
    // Test failure
    const error = new Error('Test error');
    state.markFailure(error);
    if (state.getStatus() !== 'degraded') {
      throw new Error(`Wrong status after failure: ${state.getStatus()}`);
    }
    
    // Test multiple failures
    state.markFailure(error);
    state.markFailure(error);
    if (state.getStatus() !== 'unhealthy') {
      throw new Error(`Wrong status after multiple failures: ${state.getStatus()}`);
    }
    
    console.log(`   📊 Status progression: untested → healthy → degraded → unhealthy`);
    return true;
  });
  
  console.log('\n6. Error Handling System...');
  
  test('Error types are available', () => {
    const types = require('../dist/src/providers/types.js');
    
    const errorTypes = [
      'ProviderError',
      'AuthenticationError',
      'RateLimitError', 
      'NetworkError',
      'ModelNotFoundError'
    ];
    
    for (const errorType of errorTypes) {
      if (!types[errorType]) {
        throw new Error(`Missing error type: ${errorType}`);
      }
    }
    
    console.log(`   🚨 Error types: ${errorTypes.join(', ')}`);
    return true;
  });
  
  console.log('\n7. Build Integration...');
  
  test('Build output is correct', () => {
    const stats = fs.statSync('dist/sidepanel.js');
    const sizeKB = Math.round(stats.size / 1024);
    
    if (sizeKB < 1000) {
      throw new Error(`Bundle too small: ${sizeKB}KB, expected >1000KB`);
    }
    
    if (sizeKB > 2000) {
      throw new Error(`Bundle too large: ${sizeKB}KB, expected <2000KB`);
    }
    
    console.log(`   📦 Bundle size: ${sizeKB}KB (within expected range)`);
    return true;
  });
  
  // Summary
  console.log('\n📊 Verification Results:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
  
  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests
      .filter(t => t.status === 'failed')
      .forEach(t => console.log(`   - ${t.name}: ${t.error}`));
  } else {
    console.log('\n🎉 All provider connection fixes verified successfully!');
    console.log('\n✨ Key Achievements:');
    console.log('   • 40+ providers configured with accurate settings');
    console.log('   • ZAI provider fixed with correct coding endpoint');
    console.log('   • Enhanced error handling with specific error types');
    console.log('   • Connection state management with health tracking');
    console.log('   • Comprehensive configuration validation');
    console.log('   • Build successful with optimized bundle size');
  }
  
  return {
    success: results.failed === 0,
    passed: results.passed,
    failed: results.failed,
    total: results.passed + results.failed
  };
}

// Run verification if this script is executed directly
if (require.main === module) {
  verifyComplete()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyComplete };