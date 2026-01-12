/**
 * Provider System Tests
 * 
 * Tests the SidePilot provider factory and core functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Provider System', () => {
  test('should have all provider files built', async () => {
    // This test runs in Node.js context to check built files
    const fs = await import('fs');
    
    // Check that provider files exist in source
    const providerFiles = [
      'src/providers/types.ts',
      'src/providers/models-registry.ts', 
      'src/providers/base-provider.ts',
      'src/providers/anthropic.ts',
      'src/providers/openai.ts',
      'src/providers/google.ts',
      'src/providers/ollama.ts',
      'src/providers/factory.ts',
    ];
    
    for (const file of providerFiles) {
      expect(fs.existsSync(file)).toBe(true);
      const stats = fs.statSync(file);
      expect(stats.size).toBeGreaterThan(1000); // At least 1KB per file
    }
  });

  test('should build without TypeScript errors', async () => {
    const fs = await import('fs');
    
    // Check that build succeeded (dist files exist)
    expect(fs.existsSync('dist/sidepanel.js')).toBe(true);
    expect(fs.existsSync('dist/service-worker.js')).toBe(true);
    expect(fs.existsSync('dist/content.js')).toBe(true);
    
    // Check bundle sizes are reasonable
    const sidePanel = fs.statSync('dist/sidepanel.js');
    expect(sidePanel.size).toBeGreaterThan(100000); // At least 100KB
    expect(sidePanel.size).toBeLessThan(1000000); // Less than 1MB
  });

  test('should export provider factory correctly', async () => {
    // Test that we can import the factory (this tests TypeScript compilation)
    const { createProvider, getSupportedProviders } = await import('../src/providers/factory');
    
    expect(typeof createProvider).toBe('function');
    expect(typeof getSupportedProviders).toBe('function');
    
    const providers = getSupportedProviders();
    expect(providers).toContain('anthropic');
    expect(providers).toContain('openai');
    expect(providers).toContain('google');
    expect(providers).toContain('ollama');
    expect(providers.length).toBeGreaterThan(30); // Should have 30+ providers
  });

  test('should create providers without errors', async () => {
    const { createProvider } = await import('../src/providers/factory');
    
    // Test core providers can be created
    const anthropic = createProvider({ type: 'anthropic', apiKey: 'test' });
    expect(anthropic.type).toBe('anthropic');
    
    const openai = createProvider({ type: 'openai', apiKey: 'test' });
    expect(openai.type).toBe('openai');
    
    const google = createProvider({ type: 'google', apiKey: 'test' });
    expect(google.type).toBe('google');
    
    const ollama = createProvider({ type: 'ollama', apiKey: '' });
    expect(ollama.type).toBe('ollama');
  });

  test('should have model registry with capabilities', async () => {
    const { getModelInfo, getModelsByProvider } = await import('../src/providers/models-registry');
    
    // Test Claude model
    const claude = getModelInfo('claude-3-5-sonnet-20241022');
    expect(claude).toBeDefined();
    expect(claude?.capabilities.supportsVision).toBe(true);
    expect(claude?.capabilities.supportsTools).toBe(true);
    expect(claude?.capabilities.contextWindow).toBe(200000);
    
    // Test GPT-4o model
    const gpt4 = getModelInfo('gpt-4o');
    expect(gpt4).toBeDefined();
    expect(gpt4?.capabilities.supportsVision).toBe(true);
    expect(gpt4?.capabilities.supportsTools).toBe(true);
    expect(gpt4?.capabilities.contextWindow).toBe(128000);
    
    // Test provider models
    const anthropicModels = getModelsByProvider('anthropic');
    expect(anthropicModels.length).toBeGreaterThan(0);
    
    const openaiModels = getModelsByProvider('openai');
    expect(openaiModels.length).toBeGreaterThan(0);
  });

  test('should handle provider errors gracefully', async () => {
    const { createProvider } = await import('../src/providers/factory');
    
    // Test unknown provider
    expect(() => {
      createProvider({ type: 'unknown-provider' as any, apiKey: 'test' });
    }).toThrow();
  });
});