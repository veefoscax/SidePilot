/**
 * Model Capability System
 * 
 * Provides capability validation and feature compatibility checking
 * for different LLM models across providers.
 */

import { ModelInfo, ModelCapabilities } from '@/providers/types';

export interface CapabilityValidationResult {
  isSupported: boolean;
  warnings: string[];
  suggestions: string[];
}

export interface FeatureRequirement {
  vision?: boolean;
  tools?: boolean;
  streaming?: boolean;
  reasoning?: boolean;
  minContextWindow?: number;
  minOutputTokens?: number;
}

export class ModelCapabilitySystem {
  /**
   * Validate if a model supports the required features
   */
  static validateCapabilities(
    model: ModelInfo,
    requirements: FeatureRequirement
  ): CapabilityValidationResult {
    const warnings: string[] = [];
    const suggestions: string[] = [];
    let isSupported = true;

    // Check vision capability
    if (requirements.vision && !model.capabilities.supportsVision) {
      isSupported = false;
      warnings.push(`${model.name} does not support vision/image processing`);
      suggestions.push('Consider using GPT-4o, Claude 3.5 Sonnet, or Gemini Pro Vision for image tasks');
    }

    // Check tools capability
    if (requirements.tools && !model.capabilities.supportsTools) {
      isSupported = false;
      warnings.push(`${model.name} does not support function calling/tools`);
      suggestions.push('Consider using GPT-4o, Claude 3.5 Sonnet, or Gemini Pro for tool usage');
    }

    // Check streaming capability
    if (requirements.streaming && !model.capabilities.supportsStreaming) {
      warnings.push(`${model.name} may not support streaming responses`);
      suggestions.push('Response may appear all at once instead of streaming');
    }

    // Check reasoning capability
    if (requirements.reasoning && !model.capabilities.supportsReasoning) {
      warnings.push(`${model.name} does not provide visible reasoning/thinking process`);
      suggestions.push('Consider using O1, O3, DeepSeek Reasoner, or GLM-4.7 for reasoning tasks');
    }

    // Check context window
    if (requirements.minContextWindow && model.capabilities.contextWindow < requirements.minContextWindow) {
      isSupported = false;
      warnings.push(`${model.name} context window (${model.capabilities.contextWindow}) is smaller than required (${requirements.minContextWindow})`);
      suggestions.push('Consider using models with larger context windows like Claude 3.5 Sonnet or GPT-4 Turbo');
    }

    // Check output tokens
    if (requirements.minOutputTokens && model.capabilities.maxOutputTokens < requirements.minOutputTokens) {
      warnings.push(`${model.name} max output (${model.capabilities.maxOutputTokens}) may be insufficient for long responses`);
      suggestions.push('Consider breaking large tasks into smaller chunks');
    }

    return {
      isSupported,
      warnings,
      suggestions
    };
  }

  /**
   * Get capability warnings for UI display
   */
  static getCapabilityWarnings(model: ModelInfo): string[] {
    const warnings: string[] = [];

    // Warn about models without tool support
    if (!model.capabilities.supportsTools) {
      warnings.push('No function calling support');
    }

    // Warn about models without vision
    if (!model.capabilities.supportsVision) {
      warnings.push('No image processing support');
    }

    // Warn about small context windows
    if (model.capabilities.contextWindow < 8000) {
      warnings.push('Limited context window');
    }

    // Warn about reasoning models without tools
    if (model.capabilities.supportsReasoning && !model.capabilities.supportsTools) {
      warnings.push('Reasoning model without tool support');
    }

    return warnings;
  }

  /**
   * Get recommended models for specific use cases
   */
  static getRecommendedModels(
    availableModels: ModelInfo[],
    useCase: 'general' | 'vision' | 'reasoning' | 'coding' | 'long-context'
  ): ModelInfo[] {
    const filtered = availableModels.filter(model => {
      switch (useCase) {
        case 'vision':
          return model.capabilities.supportsVision && model.capabilities.supportsTools;
        case 'reasoning':
          return model.capabilities.supportsReasoning;
        case 'coding':
          return model.capabilities.supportsTools && model.capabilities.contextWindow >= 16000;
        case 'long-context':
          return model.capabilities.contextWindow >= 100000;
        case 'general':
        default:
          return model.capabilities.supportsTools && model.capabilities.supportsStreaming;
      }
    });

    // Sort by capability score (more capabilities = higher score)
    return filtered.sort((a, b) => {
      const scoreA = this.calculateCapabilityScore(a.capabilities);
      const scoreB = this.calculateCapabilityScore(b.capabilities);
      return scoreB - scoreA;
    });
  }

  /**
   * Calculate a capability score for ranking models
   */
  private static calculateCapabilityScore(capabilities: ModelCapabilities): number {
    let score = 0;
    
    if (capabilities.supportsVision) score += 10;
    if (capabilities.supportsTools) score += 8;
    if (capabilities.supportsReasoning) score += 6;
    if (capabilities.supportsStreaming) score += 4;
    if (capabilities.supportsPromptCache) score += 2;
    
    // Context window bonus
    if (capabilities.contextWindow >= 100000) score += 5;
    else if (capabilities.contextWindow >= 32000) score += 3;
    else if (capabilities.contextWindow >= 16000) score += 1;
    
    return score;
  }

  /**
   * Check if a feature is compatible with the current model selection
   */
  static isFeatureCompatible(
    models: ModelInfo[],
    feature: keyof ModelCapabilities
  ): boolean {
    return models.some(model => model.capabilities[feature]);
  }

  /**
   * Get feature compatibility status for UI indicators
   */
  static getFeatureCompatibility(models: ModelInfo[]) {
    return {
      vision: this.isFeatureCompatible(models, 'supportsVision'),
      tools: this.isFeatureCompatible(models, 'supportsTools'),
      streaming: this.isFeatureCompatible(models, 'supportsStreaming'),
      reasoning: this.isFeatureCompatible(models, 'supportsReasoning'),
      promptCache: this.isFeatureCompatible(models, 'supportsPromptCache'),
    };
  }
}