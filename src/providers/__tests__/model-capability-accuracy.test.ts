/**
 * Property-Based Tests for Model Capability Accuracy
 * 
 * Tests that model capabilities are accurately reported and consistent
 * across different providers and model types.
 * 
 * VERIFICATION NOTES (Task 7 - Model Registry Verification):
 * - o1 now supports vision, tools, and streaming (Dec 2024 update)
 * - o1-mini does NOT support vision, tools, or streaming
 * - GLM-4 Plus does NOT support vision (GLM-4V does)
 * - DeepSeek R1 does NOT support tools during reasoning
 */

import { describe, it, expect } from 'vitest';
import { MODEL_REGISTRY, getModelInfo, getModelsByProvider, getModelsByCapability } from '../models-registry';

describe('Model Capability Accuracy Properties', () => {
  // Updated capabilities based on official documentation (Jan 2025)
  const knownCapabilities = {
    // OpenAI models
    'gpt-4o': { vision: true, tools: true, reasoning: false, streaming: true },
    'gpt-4o-mini': { vision: true, tools: true, reasoning: false, streaming: true },
    'o1': { vision: true, tools: true, reasoning: true, streaming: true }, // Updated Dec 2024
    'o1-mini': { vision: false, tools: false, reasoning: true, streaming: false }, // Limited capabilities
    'o3-mini': { vision: false, tools: true, reasoning: true, streaming: true },
    // Anthropic models
    'claude-3-5-sonnet-20241022': { vision: true, tools: true, reasoning: false, streaming: true },
    'claude-3-5-haiku-20241022': { vision: true, tools: true, reasoning: false, streaming: true },
    'claude-3-opus-20240229': { vision: true, tools: true, reasoning: false, streaming: true },
    'claude-3-haiku-20240307': { vision: true, tools: true, reasoning: false, streaming: true },
    // Google models
    'gemini-2.0-flash-exp': { vision: true, tools: true, reasoning: false, streaming: true },
    'gemini-1.5-pro': { vision: true, tools: true, reasoning: false, streaming: true },
    'gemini-1.5-flash': { vision: true, tools: true, reasoning: false, streaming: true },
    // DeepSeek models
    'deepseek-chat': { vision: false, tools: true, reasoning: false, streaming: true },
    'deepseek-reasoner': { vision: false, tools: false, reasoning: true, streaming: true }, // R1 no tools
    // ZAI models
    'glm-4-plus': { vision: false, tools: true, reasoning: false, streaming: true }, // No vision
    'glm-4v-plus': { vision: true, tools: true, reasoning: false, streaming: true }, // Vision model
    'glm-4.7': { vision: false, tools: true, reasoning: true, streaming: true },
    // Groq models
    'llama-3.3-70b-versatile': { vision: false, tools: true, reasoning: false, streaming: true },
    // Mistral models
    'mistral-large-latest': { vision: false, tools: true, reasoning: false, streaming: true },
    // xAI models
    'grok-2-1212': { vision: true, tools: true, reasoning: false, streaming: true },
  };

  it('Property 7: Model Capability Accuracy - For any known model, capabilities should match expected values', async () => {
    // Test directly against MODEL_REGISTRY instead of provider.listModels()
    // This ensures we're testing the actual registry values
    for (const [modelId, expectedCaps] of Object.entries(knownCapabilities)) {
      const modelInfo = getModelInfo(modelId);
      
      if (modelInfo) {
        // Property: Vision capability should match known values
        expect(modelInfo.capabilities.supportsVision).toBe(expectedCaps.vision);
        
        // Property: Tools capability should match known values
        expect(modelInfo.capabilities.supportsTools).toBe(expectedCaps.tools);
        
        // Property: Reasoning capability should match known values
        expect(modelInfo.capabilities.supportsReasoning).toBe(expectedCaps.reasoning);
        
        // Property: Streaming capability should match known values
        expect(modelInfo.capabilities.supportsStreaming).toBe(expectedCaps.streaming);
      }
    }
  });

  it('Property: All models in registry should have valid capabilities structure', () => {
    for (const [, modelData] of Object.entries(MODEL_REGISTRY)) {
      // Property: Every model must have capabilities object
      expect(modelData.capabilities).toBeDefined();
      
      // Property: All capability flags must be boolean
      expect(typeof modelData.capabilities.supportsVision).toBe('boolean');
      expect(typeof modelData.capabilities.supportsTools).toBe('boolean');
      expect(typeof modelData.capabilities.supportsStreaming).toBe('boolean');
      expect(typeof modelData.capabilities.supportsReasoning).toBe('boolean');
      
      // Property: Context window must be positive number
      expect(modelData.capabilities.contextWindow).toBeGreaterThan(0);
      
      // Property: Max output tokens must be positive number
      expect(modelData.capabilities.maxOutputTokens).toBeGreaterThan(0);
    }
  });

  it('Property: Context window should be reasonable for model type', () => {
    // Test directly against MODEL_REGISTRY
    for (const [, modelData] of Object.entries(MODEL_REGISTRY)) {
      const modelId = Object.keys(MODEL_REGISTRY).find(
        key => MODEL_REGISTRY[key] === modelData
      ) || '';
      
      // Property: GPT-4 models should have large context windows
      if (modelId.includes('gpt-4')) {
        expect(modelData.capabilities.contextWindow).toBeGreaterThanOrEqual(8000);
      }
      
      // Property: O1 models should have very large context windows
      if (modelId.includes('o1') || modelId.includes('o3')) {
        expect(modelData.capabilities.contextWindow).toBeGreaterThanOrEqual(100000);
      }
      
      // Property: Gemini models should have massive context windows
      if (modelId.includes('gemini')) {
        expect(modelData.capabilities.contextWindow).toBeGreaterThanOrEqual(1000000);
      }
      
      // Property: Context window should be larger than max output
      expect(modelData.capabilities.contextWindow).toBeGreaterThan(modelData.capabilities.maxOutputTokens);
    }
  });

  it('Property: Vision models should have appropriate context windows', () => {
    // Test directly against MODEL_REGISTRY
    for (const [, modelData] of Object.entries(MODEL_REGISTRY)) {
      // Property: Vision models need larger context windows for image processing
      if (modelData.capabilities.supportsVision) {
        expect(modelData.capabilities.contextWindow).toBeGreaterThanOrEqual(4000);
      }
    }
  });

  it('Property: Reasoning models should be correctly identified', () => {
    const reasoningModels = ['o1', 'o1-mini', 'o3-mini', 'deepseek-reasoner', 'glm-4.7'];
    
    for (const modelId of reasoningModels) {
      const modelInfo = getModelInfo(modelId);
      if (modelInfo) {
        expect(modelInfo.capabilities.supportsReasoning).toBe(true);
      }
    }
  });

  it('Property: Models without tool support should be correctly identified', () => {
    // These models are known to NOT support tools
    const noToolsModels = ['o1-mini', 'deepseek-reasoner'];
    
    for (const modelId of noToolsModels) {
      const modelInfo = getModelInfo(modelId);
      if (modelInfo) {
        expect(modelInfo.capabilities.supportsTools).toBe(false);
      }
    }
  });

  it('Property: getModelsByProvider should return correct models', () => {
    const anthropicModels = getModelsByProvider('anthropic');
    expect(anthropicModels.length).toBeGreaterThan(0);
    
    // All returned models should be from Anthropic
    for (const model of anthropicModels) {
      expect(model.provider).toBe('anthropic');
    }
    
    // Should include Claude 3.5 Sonnet
    const hasSonnet = anthropicModels.some(m => m.id === 'claude-3-5-sonnet-20241022');
    expect(hasSonnet).toBe(true);
  });

  it('Property: getModelsByCapability should filter correctly', () => {
    const visionModels = getModelsByCapability('supportsVision');
    
    // All returned models should support vision
    for (const model of visionModels) {
      expect(model.capabilities.supportsVision).toBe(true);
    }
    
    // Should include GPT-4o (known vision model)
    const hasGpt4o = visionModels.some(m => m.id === 'gpt-4o');
    expect(hasGpt4o).toBe(true);
    
    // Should NOT include DeepSeek chat (no vision)
    const hasDeepseek = visionModels.some(m => m.id === 'deepseek-chat');
    expect(hasDeepseek).toBe(false);
  });
});