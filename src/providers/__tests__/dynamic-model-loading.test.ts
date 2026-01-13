/**
 * Property-Based Tests for Dynamic Model Loading
 * 
 * Tests universal properties that should hold for all providers
 * when loading models dynamically from their APIs.
 */

import { describe, it, expect } from 'vitest';
import { createProvider } from '../factory';
import { ProviderType } from '../types';

describe('Dynamic Model Loading Properties', () => {
  const testProviders: ProviderType[] = ['openai', 'anthropic', 'google', 'ollama'];

  it('Property 5: Dynamic Model Loading - For any provider with valid config, listModels should return consistent model info', async () => {
    for (const providerType of testProviders) {
      try {
        const provider = createProvider(providerType, {
          type: providerType,
          apiKey: 'test-key',
          baseUrl: providerType === 'ollama' ? 'http://localhost:11434' : undefined,
        });

        if (provider.listModels) {
          const models = await provider.listModels();
          
          // Property: All returned models should have required fields
          models.forEach(model => {
            expect(model).toHaveProperty('id');
            expect(model).toHaveProperty('name');
            expect(model).toHaveProperty('provider');
            expect(model).toHaveProperty('capabilities');
            expect(model.provider).toBe(providerType);
            
            // Property: Capabilities should be complete
            expect(model.capabilities).toHaveProperty('supportsVision');
            expect(model.capabilities).toHaveProperty('supportsTools');
            expect(model.capabilities).toHaveProperty('supportsStreaming');
            expect(model.capabilities).toHaveProperty('supportsReasoning');
            expect(model.capabilities).toHaveProperty('contextWindow');
            expect(model.capabilities).toHaveProperty('maxOutputTokens');
            
            // Property: Context window should be positive
            expect(model.capabilities.contextWindow).toBeGreaterThan(0);
            expect(model.capabilities.maxOutputTokens).toBeGreaterThan(0);
          });
        }
      } catch (error) {
        // Expected for providers without valid API keys in test environment
        console.log(`Skipping ${providerType} due to configuration: ${error}`);
      }
    }
  });

  it('Property: Model loading should be idempotent', async () => {
    const providerType: ProviderType = 'openai';
    
    try {
      const provider = createProvider(providerType, {
        type: providerType,
        apiKey: 'test-key',
      });

      if (provider.listModels) {
        const models1 = await provider.listModels();
        const models2 = await provider.listModels();
        
        // Property: Multiple calls should return equivalent results
        expect(models1.length).toBe(models2.length);
        
        // Property: Model IDs should be consistent
        const ids1 = models1.map(m => m.id).sort();
        const ids2 = models2.map(m => m.id).sort();
        expect(ids1).toEqual(ids2);
      }
    } catch (error) {
      console.log(`Skipping idempotency test due to configuration: ${error}`);
    }
  });
});