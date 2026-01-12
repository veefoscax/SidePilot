/**
 * Simple test script for SidePilot providers
 * 
 * This script tests the provider factory and basic functionality
 * without requiring actual API keys.
 */

import { createProvider, getSupportedProviders, getProviderCategories } from './factory';
import { ProviderType } from './types';
import { getModelInfo, getModelsByProvider, getDefaultModel } from './models-registry';

async function testProviderFactory() {
  console.log('🧪 Testing SidePilot Provider Factory...\n');

  // Test 1: List supported providers
  console.log('📋 Supported Providers:');
  const providers = getSupportedProviders();
  console.log(`   Found ${providers.length} providers: ${providers.slice(0, 5).join(', ')}...`);

  // Test 2: Provider categories
  console.log('\n📂 Provider Categories:');
  const categories = getProviderCategories();
  Object.entries(categories).forEach(([category, providerList]) => {
    console.log(`   ${category}: ${providerList.length} providers`);
  });

  // Test 3: Model registry
  console.log('\n🤖 Model Registry:');
  const claudeModel = getModelInfo('claude-3-5-sonnet-20241022');
  if (claudeModel) {
    console.log(`   Claude 3.5 Sonnet: ${claudeModel.capabilities.contextWindow} context, supports vision: ${claudeModel.capabilities.supportsVision}`);
  }

  const gpt4Model = getModelInfo('gpt-4o');
  if (gpt4Model) {
    console.log(`   GPT-4o: ${gpt4Model.capabilities.contextWindow} context, supports tools: ${gpt4Model.capabilities.supportsTools}`);
  }

  // Test 4: Provider creation (without API keys)
  console.log('\n🏭 Provider Creation:');
  
  try {
    // This should fail gracefully without API key
    const anthropicProvider = createProvider({
      type: 'anthropic',
      apiKey: 'test-key'
    });
    console.log(`   ✅ Anthropic provider created: ${anthropicProvider.type}`);
  } catch (error) {
    console.log(`   ⚠️ Anthropic provider creation failed (expected): ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  try {
    const openaiProvider = createProvider({
      type: 'openai',
      apiKey: 'test-key'
    });
    console.log(`   ✅ OpenAI provider created: ${openaiProvider.type}`);
  } catch (error) {
    console.log(`   ⚠️ OpenAI provider creation failed (expected): ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Test 5: Default models
  console.log('\n🎯 Default Models:');
  const testProviders: ProviderType[] = ['anthropic', 'openai', 'deepseek', 'groq'];
  testProviders.forEach(provider => {
    const defaultModel = getDefaultModel(provider);
    console.log(`   ${provider}: ${defaultModel}`);
  });

  // Test 6: Models by provider
  console.log('\n📊 Models by Provider:');
  const anthropicModels = getModelsByProvider('anthropic');
  console.log(`   Anthropic: ${anthropicModels.length} models (${anthropicModels.map(m => m.id).join(', ')})`);

  const openaiModels = getModelsByProvider('openai');
  console.log(`   OpenAI: ${openaiModels.length} models (${openaiModels.map(m => m.id).join(', ')})`);

  console.log('\n✅ Provider factory tests completed!');
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  testProviderFactory().catch(console.error);
}

export { testProviderFactory };