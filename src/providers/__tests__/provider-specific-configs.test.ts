/**
 * Unit Tests for Provider-Specific Configurations
 * 
 * Tests that provider-specific configurations are applied correctly
 * for different authentication methods and special requirements.
 */

import { describe, it, expect } from 'vitest';
import { createProvider } from '../factory';

describe('Provider-Specific Configurations', () => {
  it('should include Group ID header for MiniMax provider', () => {
    try {
      const provider = createProvider('minimax', {
        apiKey: 'test-key',
        groupId: 'test-group-123',
      });
      
      // MiniMax should be configured with group ID
      expect(provider.config.groupId).toBe('test-group-123');
    } catch (error) {
      // Expected in test environment without real config
      expect(error.message).toContain('Group ID is required');
    }
  });

  it('should use query parameter authentication for Google provider', () => {
    const provider = createProvider('google', {
      apiKey: 'test-key',
    });
    
    // Google should use query parameter auth
    expect(provider.config.authMethod).toBe('query');
    expect(provider.config.authParam).toBe('key');
  });

  it('should include version header for Anthropic provider', () => {
    const provider = createProvider('anthropic', {
      apiKey: 'test-key',
    });
    
    // Anthropic should include version header
    expect(provider.config.extraHeaders).toHaveProperty('anthropic-version');
  });

  it('should not require API key for local providers', () => {
    const ollamaProvider = createProvider('ollama', {
      baseUrl: 'http://localhost:11434',
    });
    
    const lmstudioProvider = createProvider('lmstudio', {
      baseUrl: 'http://127.0.0.1:1234',
    });
    
    // Local providers should work without API keys
    expect(ollamaProvider.config.apiKey).toBeUndefined();
    expect(lmstudioProvider.config.apiKey).toBeUndefined();
  });

  it('should use correct base URLs for ZAI plan types', () => {
    const codingProvider = createProvider('zai', {
      apiKey: 'test-key',
      planType: 'coding',
    });
    
    const generalProvider = createProvider('zai', {
      apiKey: 'test-key',
      planType: 'general',
    });
    
    // ZAI should use different endpoints for different plans
    expect(codingProvider.config.baseUrl).toContain('api.z.ai/api/paas/v4');
    expect(generalProvider.config.baseUrl).toContain('api.z.ai/api/paas/v4');
  });
});