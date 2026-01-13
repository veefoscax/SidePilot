/**
 * Integration Tests for Provider System
 * 
 * Tests end-to-end provider setup, configuration, and usage
 * including UI state updates and provider switching.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createProvider, getSupportedProviders, getProviderInfo } from '../factory';
import { ModelCapabilitySystem } from '@/lib/model-capabilities';

describe('Provider System Integration', () => {
  it('should support all documented providers', () => {
    const supportedProviders = getSupportedProviders();
    
    // Should support at least 40 providers
    expect(supportedProviders.length).toBeGreaterThanOrEqual(40);
    
    // Should include core providers
    expect(supportedProviders).toContain('openai');
    expect(supportedProviders).toContain('anthropic');
    expect(supportedProviders).toContain('google');
    expect(supportedProviders).toContain('deepseek');
    expect(supportedProviders).toContain('groq');
    expect(supportedProviders).toContain('ollama');
    expect(supportedProviders).toContain('zai');
  });

  it('should provide complete provider information', () => {
    const supportedProviders = getSupportedProviders();
    
    supportedProviders.forEach(providerType => {
      const info = getProviderInfo(providerType);
      
      // Each provider should have complete info
      expect(info.name).toBeTruthy();
      expect(info.description).toBeTruthy();
      expect(typeof info.requiresApiKey).toBe('boolean');
      expect(typeof info.supportsStreaming).toBe('boolean');
      expect(typeof info.supportsTools).toBe('boolean');
      expect(typeof info.supportsVision).toBe('boolean');
    });
  });

  it('should create providers with valid configurations', () => {
    const testConfigs = [
      { type: 'openai' as const, config: { apiKey: 'test-key' } },
      { type: 'anthropic' as const, config: { apiKey: 'test-key' } },
      { type: 'ollama' as const, config: { baseUrl: 'http://localhost:11434' } },
      { type: 'lmstudio' as const, config: { baseUrl: 'http://127.0.0.1:1234' } },
    ];

    testConfigs.forEach(({ type, config }) => {
      const provider = createProvider(type, config);
      
      // Provider should be created successfully
      expect(provider).toBeDefined();
      expect(provider.type).toBe(type);
      expect(provider.config).toBeDefined();
      
      // Provider should have required methods
      expect(typeof provider.chat).toBe('function');
      expect(typeof provider.stream).toBe('function');
      expect(typeof provider.testConnection).toBe('function');
    });
  });

  it('should handle provider switching correctly', async () => {
    // Simulate provider switching scenario
    const provider1 = createProvider('openai', { apiKey: 'test-key-1' });
    const provider2 = createProvider('anthropic', { apiKey: 'test-key-2' });
    
    // Providers should have different configurations
    expect(provider1.type).toBe('openai');
    expect(provider2.type).toBe('anthropic');
    expect(provider1.config.apiKey).toBe('test-key-1');
    expect(provider2.config.apiKey).toBe('test-key-2');
    
    // Both should support required methods
    expect(provider1.chat).toBeDefined();
    expect(provider2.chat).toBeDefined();
  });

  it('should integrate with model capability system', () => {
    // Test capability system integration
    const testModels = [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'openai' as const,
        capabilities: {
          supportsVision: true,
          supportsTools: true,
          supportsStreaming: true,
          supportsReasoning: false,
          supportsPromptCache: false,
          contextWindow: 128000,
          maxOutputTokens: 4096,
        },
      },
    ];

    // Should validate capabilities correctly
    const result = ModelCapabilitySystem.validateCapabilities(testModels[0], {
      vision: true,
      tools: true,
    });
    
    expect(result.isSupported).toBe(true);
    expect(result.warnings.length).toBe(0);
    
    // Should get feature compatibility
    const compatibility = ModelCapabilitySystem.getFeatureCompatibility(testModels);
    expect(compatibility.vision).toBe(true);
    expect(compatibility.tools).toBe(true);
  });

  it('should handle error cases gracefully', () => {
    // Test invalid provider type
    expect(() => {
      createProvider('invalid-provider' as any, {});
    }).toThrow('Unknown provider type');
    
    // Test missing API key
    expect(() => {
      createProvider('openai', {});
    }).toThrow('API key is required');
    
    // Test invalid base URL
    expect(() => {
      createProvider('ollama', { baseUrl: 'invalid-url' });
    }).toThrow('Invalid base URL format');
  });

  it('should support configuration updates', () => {
    // Test configuration updates don't break provider instances
    const provider1 = createProvider('openai', { apiKey: 'key1' });
    const provider2 = createProvider('openai', { apiKey: 'key2' });
    
    // Should create separate instances with different configs
    expect(provider1.config.apiKey).toBe('key1');
    expect(provider2.config.apiKey).toBe('key2');
    expect(provider1).not.toBe(provider2);
  });
});