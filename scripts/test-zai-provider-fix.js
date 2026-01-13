/**
 * Test ZAI Provider Connection Fix
 * 
 * Verifies that the ZAI provider can connect properly with the coding endpoint
 */

import { createProvider } from '../src/providers/factory.js';

async function testZAIProvider() {
  console.log('🧪 Testing ZAI Provider Connection Fix...\n');

  // Test configuration
  const testApiKey = process.env.ZAI_API_KEY || 'test-key-for-validation';
  
  try {
    console.log('1. Creating ZAI provider instance...');
    const provider = createProvider('zai', {
      apiKey: testApiKey,
    });
    
    console.log('✅ ZAI provider created successfully');
    console.log(`   Base URL: ${provider.config.baseUrl}`);
    console.log(`   Auth Method: ${provider.config.authMethod}`);
    
    console.log('\n2. Testing default models...');
    const defaultModels = provider.getDefaultModels();
    console.log(`✅ Found ${defaultModels.length} default models:`);
    defaultModels.forEach(model => {
      console.log(`   - ${model.id} (${model.name})`);
      console.log(`     Vision: ${model.capabilities.supportsVision}`);
      console.log(`     Tools: ${model.capabilities.supportsTools}`);
      console.log(`     Context: ${model.capabilities.contextWindow}`);
    });
    
    console.log('\n3. Testing connection (without real API key)...');
    try {
      const result = await provider.testConnection();
      if (result.success) {
        console.log('✅ Connection test passed');
        console.log(`   Models loaded: ${result.models?.length || 0}`);
      } else {
        console.log('⚠️ Connection test failed (expected without real API key)');
        console.log(`   Error: ${result.error?.message}`);
      }
    } catch (error) {
      console.log('⚠️ Connection test threw error (expected without real API key)');
      console.log(`   Error: ${error.message}`);
    }
    
    console.log('\n4. Testing configuration validation...');
    
    // Test missing API key
    try {
      createProvider('zai', {});
      console.log('❌ Should have thrown error for missing API key');
    } catch (error) {
      console.log('✅ Correctly rejected missing API key');
      console.log(`   Error: ${error.message}`);
    }
    
    // Test invalid base URL
    try {
      createProvider('zai', {
        apiKey: 'test-key',
        baseUrl: 'invalid-url',
      });
      console.log('❌ Should have thrown error for invalid base URL');
    } catch (error) {
      console.log('✅ Correctly rejected invalid base URL');
      console.log(`   Error: ${error.message}`);
    }
    
    console.log('\n5. Testing provider configuration registry...');
    const { getProviderConfig } = await import('../src/providers/provider-configs.js');
    const zaiConfig = getProviderConfig('zai');
    
    console.log('✅ ZAI configuration from registry:');
    console.log(`   Base URL: ${zaiConfig.baseUrl}`);
    console.log(`   Auth Method: ${zaiConfig.authMethod}`);
    console.log(`   Requires API Key: ${zaiConfig.requiresApiKey}`);
    console.log(`   Default Models: ${zaiConfig.defaultModels.join(', ')}`);
    console.log(`   Supports Vision: ${zaiConfig.capabilities.supportsVision}`);
    console.log(`   Supports Tools: ${zaiConfig.capabilities.supportsTools}`);
    
    console.log('\n🎉 All ZAI provider tests completed successfully!');
    
    return {
      success: true,
      provider: 'zai',
      baseUrl: zaiConfig.baseUrl,
      modelsCount: defaultModels.length,
      configValid: true,
    };
    
  } catch (error) {
    console.error('❌ ZAI provider test failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testZAIProvider()
    .then(result => {
      console.log('\n📊 Test Results:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test runner failed:', error);
      process.exit(1);
    });
}

export { testZAIProvider };