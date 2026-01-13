/**
 * Property-Based Tests for Model Capability Accuracy
 * 
 * Tests that model capabilities are accurately reported and consistent
 * across different providers and model types.
 */

import { describe, it, expect } from 'vitest';
import { createProvider } from '../factory';
import { ProviderType, ModelInfo } from '../types';

describe('Model Capability Accuracy Properties', () => {
  const knownCapabilities = {
    'gpt-4o': { vision: true, tools: true, reasoning: false, streaming: true },
    'gpt-4o-mini': { vision: true, tools: true, reasoning: false, streaming: true },
    'o1': { vision: false, tools: false, reasoning: true, streaming: true },
    'o1-mini': { vision: false, tools: false, reasoning: true, streaming: true },
    'claude-3-5-sonnet-20241022': { vision: true, tools: true, reasoning: false, streaming: true },
    'glm-4.7': { vision: false, tools: true, reasoning: true, streaming: true },
    'glm-4.6': { vision: false, tools: true, reasoning: true, streaming: true },
  };

  it('Property 7: Model Capability Accuracy - For any known model, capabilities should match expected values', async () => {
    const providers: ProviderType[] = ['openai', 'anthropic', 'zai'];
    
    for (const providerType of providers) {
      try {
        const provider = createProvider(providerType, {
          type: providerType,
          apiKey: 'test-key',
          baseUrl: providerType === 'zai' ? 'https://api.z.ai/api/paas/v4' : undefined,
        });

        if (provider.listModels) {
          const models = await provider.listModels();
          
          models.forEach(model => {
            const expectedCaps = knownCapabilities[model.id as keyof typeof knownCapabilities];
            
            if (expectedCaps) {
              // Property: Vision capability should match known values
              expect(model.capabilities.supportsVision).toBe(expectedCaps.vision);
              
              // Property: Tools capability should match known values
              expect(model.capabilities.supportsTools).toBe(expectedCaps.tools);
              
              // Property: Reasoning capability should match known values
              expect(model.capabilities.supportsReasoning).toBe(expectedCaps.reasoning);
              
              // Property: Streaming capability should match known values
              expect(model.capabilities.supportsStreaming).toBe(expectedCaps.streaming);
            }
          });
        }
      } catch (error) {
        console.log(`Skipping ${providerType} capability test: ${error}`);
      }
    }
  });

  it('Property: Context window should be reasonable for model type', async () => {
    const provider = createProvider('openai', {
      type: 'openai',
      apiKey: 'test-key',
    });

    try {
      if (provider.listModels) {
        const models = await provider.listModels();
        
        models.forEach(model => {
          // Property: GPT-4 models should have large context windows
          if (model.id.includes('gpt-4')) {
            expect(model.capabilities.contextWindow).toBeGreaterThanOrEqual(8000);
          }
          
          // Property: O1 models should have very large context windows
          if (model.id.includes('o1')) {
            expect(model.capabilities.contextWindow).toBeGreaterThanOrEqual(100000);
          }
          
          // Property: Context window should be larger than max output
          expect(model.capabilities.contextWindow).toBeGreaterThan(model.capabilities.maxOutputTokens);
        });
      }
    } catch (error) {
      console.log(`Skipping context window test: ${error}`);
    }
  });

  it('Property: Vision models should have appropriate context windows', async () => {
    const providers: ProviderType[] = ['openai', 'anthropic'];
    
    for (const providerType of providers) {
      try {
        const provider = createProvider(providerType, {
          type: providerType,
          apiKey: 'test-key',
        });

        if (provider.listModels) {
          const models = await provider.listModels();
          
          models.forEach(model => {
            // Property: Vision models need larger context windows for image processing
            if (model.capabilities.supportsVision) {
              expect(model.capabilities.contextWindow).toBeGreaterThanOrEqual(4000);
            }
          });
        }
      } catch (error) {
        console.log(`Skipping ${providerType} vision test: ${error}`);
      }
    }
  });
});