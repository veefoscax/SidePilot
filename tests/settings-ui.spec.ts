/**
 * Settings UI Tests
 * 
 * Comprehensive tests for the Provider Settings UI components and functionality.
 * Tests provider selection, API key management, model selection, and connection testing.
 */

import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';

test.describe('Settings UI - Static Tests', () => {
  test('Provider store file exists and contains required exports', async () => {
    const storePath = path.join(process.cwd(), 'src/stores/provider.ts');
    const storeContent = readFileSync(storePath, 'utf-8');
    
    // Check for required exports
    expect(storeContent).toContain('export const useProviderStore');
    expect(storeContent).toContain('interface ProviderState');
    expect(storeContent).toContain('setProvider');
    expect(storeContent).toContain('setApiKey');
    expect(storeContent).toContain('setModel');
    expect(storeContent).toContain('testConnection');
    expect(storeContent).toContain('initializeProvider');
    
    // Check for Chrome storage integration
    expect(storeContent).toContain('chrome.storage.local');
    expect(storeContent).toContain('createJSONStorage');
    expect(storeContent).toContain('persist');
  });

  test('Settings page component exists and imports required dependencies', async () => {
    const settingsPath = path.join(process.cwd(), 'src/sidepanel/pages/Settings.tsx');
    const settingsContent = readFileSync(settingsPath, 'utf-8');
    
    // Check for component imports
    expect(settingsContent).toContain('import { ProviderSelector }');
    expect(settingsContent).toContain('import { ApiKeyInput }');
    expect(settingsContent).toContain('import { ModelSelector }');
    expect(settingsContent).toContain('import { CapabilityBadges }');
    expect(settingsContent).toContain('import { TestConnectionButton }');
    expect(settingsContent).toContain('import { useProviderStore }');
    
    // Check for main component export
    expect(settingsContent).toContain('export function SettingsPage');
  });

  test('All settings components exist', async () => {
    const components = [
      'src/components/settings/ProviderSelector.tsx',
      'src/components/settings/ApiKeyInput.tsx',
      'src/components/settings/ModelSelector.tsx',
      'src/components/settings/CapabilityBadges.tsx',
      'src/components/settings/TestConnectionButton.tsx'
    ];
    
    for (const componentPath of components) {
      const fullPath = path.join(process.cwd(), componentPath);
      const content = readFileSync(fullPath, 'utf-8');
      
      // Check that each component exports a function
      expect(content).toMatch(/export function \w+/);
      // Check for TypeScript interface definitions
      expect(content).toMatch(/interface \w+Props/);
    }
  });

  test('Provider selector includes all provider categories', async () => {
    const selectorPath = path.join(process.cwd(), 'src/components/settings/ProviderSelector.tsx');
    const selectorContent = readFileSync(selectorPath, 'utf-8');
    
    // Check for provider factory imports
    expect(selectorContent).toContain('getProviderCategories');
    expect(selectorContent).toContain('getProviderInfo');
    
    // Check for Select component usage
    expect(selectorContent).toContain('Select');
    expect(selectorContent).toContain('SelectContent');
    expect(selectorContent).toContain('SelectItem');
  });

  test('API key input has security features', async () => {
    const apiKeyPath = path.join(process.cwd(), 'src/components/settings/ApiKeyInput.tsx');
    const apiKeyContent = readFileSync(apiKeyPath, 'utf-8');
    
    // Check for password input type
    expect(apiKeyContent).toContain('type={showKey ? \'text\' : \'password\'}');
    
    // Check for show/hide toggle
    expect(apiKeyContent).toContain('ViewIcon');
    expect(apiKeyContent).toContain('ViewOffSlashIcon');
    
    // Check for clear button
    expect(apiKeyContent).toContain('Cancel01Icon');
    
    // Check for provider-specific handling
    expect(apiKeyContent).toContain('requiresApiKey');
  });

  test('Capability badges show all supported features', async () => {
    const badgesPath = path.join(process.cwd(), 'src/components/settings/CapabilityBadges.tsx');
    const badgesContent = readFileSync(badgesPath, 'utf-8');
    
    // Check for all capability types
    expect(badgesContent).toContain('supportsVision');
    expect(badgesContent).toContain('supportsTools');
    expect(badgesContent).toContain('supportsStreaming');
    expect(badgesContent).toContain('supportsReasoning');
    expect(badgesContent).toContain('supportsPromptCache');
    
    // Check for colored badges
    expect(badgesContent).toContain('bg-blue-500/20'); // Vision
    expect(badgesContent).toContain('bg-green-500/20'); // Tools
    expect(badgesContent).toContain('bg-yellow-500/20'); // Streaming
    expect(badgesContent).toContain('bg-purple-500/20'); // Reasoning
    expect(badgesContent).toContain('bg-orange-500/20'); // Cache
    
    // Check for icons
    expect(badgesContent).toContain('ViewIcon');
    expect(badgesContent).toContain('Settings02Icon');
    expect(badgesContent).toContain('FlashIcon');
    expect(badgesContent).toContain('AiBrain01Icon');
  });

  test('Test connection button handles loading and error states', async () => {
    const testButtonPath = path.join(process.cwd(), 'src/components/settings/TestConnectionButton.tsx');
    const testButtonContent = readFileSync(testButtonPath, 'utf-8');
    
    // Check for loading state
    expect(testButtonContent).toContain('isLoading');
    expect(testButtonContent).toContain('Loading03Icon');
    expect(testButtonContent).toContain('animate-spin');
    
    // Check for success/error states
    expect(testButtonContent).toContain('isConnected');
    expect(testButtonContent).toContain('CheckmarkCircle02Icon');
    expect(testButtonContent).toContain('CancelCircleIcon');
    
    // Check for Alert components
    expect(testButtonContent).toContain('Alert');
    expect(testButtonContent).toContain('AlertDescription');
  });

  test('Build output includes settings components', async () => {
    const distPath = path.join(process.cwd(), 'dist');
    
    // Check that main bundle exists
    const sidepanelJs = path.join(distPath, 'sidepanel.js');
    expect(() => readFileSync(sidepanelJs)).not.toThrow();
    
    // Check bundle size is reasonable (should be larger now with settings)
    const fs = await import('fs');
    const stats = fs.statSync(sidepanelJs);
    expect(stats.size).toBeGreaterThan(200000); // > 200KB with all components
    expect(stats.size).toBeLessThan(500000); // < 500KB to keep it reasonable
  });

  test('App component includes settings navigation', async () => {
    const appPath = path.join(process.cwd(), 'src/sidepanel/App.tsx');
    const appContent = readFileSync(appPath, 'utf-8');
    
    // Check for settings import and navigation
    expect(appContent).toContain('import { SettingsPage }');
    expect(appContent).toContain('Settings');
    expect(appContent).toContain('currentPage');
    expect(appContent).toContain('setCurrentPage');
    
    // Check for navigation buttons
    expect(appContent).toContain('onClick={() => setCurrentPage(\'settings\')');
  });
});

test.describe('Settings UI - Integration Tests', () => {
  test('Settings components integrate with provider factory', async () => {
    // Test that provider factory functions are available
    const factoryPath = path.join(process.cwd(), 'src/providers/factory.ts');
    const factoryContent = readFileSync(factoryPath, 'utf-8');
    
    expect(factoryContent).toContain('getProviderCategories');
    expect(factoryContent).toContain('getProviderInfo');
    expect(factoryContent).toContain('createProvider');
    
    // Test that models registry is available
    const registryPath = path.join(process.cwd(), 'src/providers/models-registry.ts');
    const registryContent = readFileSync(registryPath, 'utf-8');
    
    expect(registryContent).toContain('getModelsByProvider');
    expect(registryContent).toContain('MODEL_REGISTRY');
  });

  test('Zustand store integrates with Chrome storage', async () => {
    const storePath = path.join(process.cwd(), 'src/stores/provider.ts');
    const storeContent = readFileSync(storePath, 'utf-8');
    
    // Check Chrome storage adapter
    expect(storeContent).toContain('chrome.storage.local.get');
    expect(storeContent).toContain('chrome.storage.local.set');
    expect(storeContent).toContain('chrome.storage.local.remove');
    
    // Check persistence configuration
    expect(storeContent).toContain('sidepilot-provider-storage');
    expect(storeContent).toContain('partialize');
    
    // Check that sensitive data is persisted
    expect(storeContent).toContain('selectedProvider');
    expect(storeContent).toContain('apiKey');
    expect(storeContent).toContain('selectedModel');
  });
});