/**
 * Property-Based Tests for Feature Compatibility Validation
 * 
 * Tests that feature compatibility validation works correctly
 * across different model configurations and requirements.
 */

import { describe, it, expect } from 'vitest';
import { ModelCapabilitySystem, FeatureRequirement } from '@/lib/model-capabilities';
import { ModelInfo, ModelCapabilities } from '../types';

describe('Feature Compatibility Validation Properties', () => {
  // Helper to create test model
  const createTestModel = (
    id: string,
    capabilities: Partial<ModelCapabilities>
  ): ModelInfo => ({
    id,
    name: id,
    provider: 'test',
    capabilities: {
      supportsVision: false,
      supportsTools: false,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: false,
      contextWindow: 4096,
      maxOutputTokens: 2048,
      ...capabilities,
    },
  });

  it('Property 15: Feature Compatibility Validation - For any model and requirements, validation should be consistent', () => {
    const testCases = [
      {
        model: createTestModel('gpt-4o', {
          supportsVision: true,
          supportsTools: true,
          contextWindow: 128000,
        }),
        requirements: { vision: true, tools: true } as FeatureRequirement,
        shouldSupport: true,
      },
      {
        model: createTestModel('o1', {
          supportsReasoning: true,
          supportsTools: false,
          contextWindow: 200000,
        }),
        requirements: { reasoning: true, tools: true } as FeatureRequirement,
        shouldSupport: false, // Missing tools
      },
      {
        model: createTestModel('basic-model', {
          contextWindow: 2048,
        }),
        requirements: { minContextWindow: 8000 } as FeatureRequirement,
        shouldSupport: false, // Insufficient context
      },
    ];

    testCases.forEach(({ model, requirements, shouldSupport }) => {
      const result = ModelCapabilitySystem.validateCapabilities(model, requirements);
      
      // Property: Validation result should match expected support
      expect(result.isSupported).toBe(shouldSupport);
      
      // Property: If not supported, should have warnings
      if (!shouldSupport) {
        expect(result.warnings.length).toBeGreaterThan(0);
      }
      
      // Property: Warnings should be descriptive
      result.warnings.forEach(warning => {
        expect(warning).toContain(model.name);
        expect(warning.length).toBeGreaterThan(10);
      });
    });
  });

  it('Property: Vision requirement validation should be accurate', () => {
    const visionModel = createTestModel('vision-model', { supportsVision: true });
    const nonVisionModel = createTestModel('text-model', { supportsVision: false });
    
    const visionRequirement: FeatureRequirement = { vision: true };
    
    // Property: Vision model should pass vision requirement
    const visionResult = ModelCapabilitySystem.validateCapabilities(visionModel, visionRequirement);
    expect(visionResult.isSupported).toBe(true);
    expect(visionResult.warnings.filter(w => w.includes('vision')).length).toBe(0);
    
    // Property: Non-vision model should fail vision requirement
    const nonVisionResult = ModelCapabilitySystem.validateCapabilities(nonVisionModel, visionRequirement);
    expect(nonVisionResult.isSupported).toBe(false);
    expect(nonVisionResult.warnings.some(w => w.includes('vision'))).toBe(true);
  });

  it('Property: Context window validation should be precise', () => {
    const smallContextModel = createTestModel('small', { contextWindow: 4096 });
    const largeContextModel = createTestModel('large', { contextWindow: 128000 });
    
    const contextRequirement: FeatureRequirement = { minContextWindow: 32000 };
    
    // Property: Small context model should fail large context requirement
    const smallResult = ModelCapabilitySystem.validateCapabilities(smallContextModel, contextRequirement);
    expect(smallResult.isSupported).toBe(false);
    expect(smallResult.warnings.some(w => w.includes('context window'))).toBe(true);
    
    // Property: Large context model should pass large context requirement
    const largeResult = ModelCapabilitySystem.validateCapabilities(largeContextModel, contextRequirement);
    expect(largeResult.isSupported).toBe(true);
    expect(largeResult.warnings.filter(w => w.includes('context window')).length).toBe(0);
  });

  it('Property: Feature compatibility checking should be consistent', () => {
    const models = [
      createTestModel('vision-model', { supportsVision: true }),
      createTestModel('tool-model', { supportsTools: true }),
      createTestModel('basic-model', {}),
    ];
    
    // Property: Vision compatibility should match model capabilities
    const visionCompatible = ModelCapabilitySystem.isFeatureCompatible(models, 'supportsVision');
    expect(visionCompatible).toBe(true); // vision-model has vision
    
    // Property: Tools compatibility should match model capabilities
    const toolsCompatible = ModelCapabilitySystem.isFeatureCompatible(models, 'supportsTools');
    expect(toolsCompatible).toBe(true); // tool-model has tools
    
    // Property: Reasoning compatibility should match model capabilities
    const reasoningCompatible = ModelCapabilitySystem.isFeatureCompatible(models, 'supportsReasoning');
    expect(reasoningCompatible).toBe(false); // no model has reasoning
  });

  it('Property: Recommended models should match use case requirements', () => {
    const models = [
      createTestModel('vision-model', { 
        supportsVision: true, 
        supportsTools: true,
        contextWindow: 128000 
      }),
      createTestModel('reasoning-model', { 
        supportsReasoning: true,
        contextWindow: 200000 
      }),
      createTestModel('coding-model', { 
        supportsTools: true,
        contextWindow: 32000 
      }),
      createTestModel('basic-model', { 
        contextWindow: 4096 
      }),
    ];
    
    // Property: Vision use case should return vision-capable models
    const visionRecommended = ModelCapabilitySystem.getRecommendedModels(models, 'vision');
    expect(visionRecommended.length).toBeGreaterThan(0);
    visionRecommended.forEach(model => {
      expect(model.capabilities.supportsVision).toBe(true);
      expect(model.capabilities.supportsTools).toBe(true);
    });
    
    // Property: Reasoning use case should return reasoning-capable models
    const reasoningRecommended = ModelCapabilitySystem.getRecommendedModels(models, 'reasoning');
    expect(reasoningRecommended.length).toBeGreaterThan(0);
    reasoningRecommended.forEach(model => {
      expect(model.capabilities.supportsReasoning).toBe(true);
    });
    
    // Property: Long-context use case should return high-context models
    const longContextRecommended = ModelCapabilitySystem.getRecommendedModels(models, 'long-context');
    expect(longContextRecommended.length).toBeGreaterThan(0);
    longContextRecommended.forEach(model => {
      expect(model.capabilities.contextWindow).toBeGreaterThanOrEqual(100000);
    });
  });
});