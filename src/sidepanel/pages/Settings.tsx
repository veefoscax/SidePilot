/**
 * Settings Page Component
 * 
 * Main settings interface for configuring LLM providers, API keys, models, and testing connections.
 * Integrates all settings components with the Zustand provider store.
 */

import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, Settings02Icon } from '@hugeicons/core-free-icons';

import { useProviderStore } from '@/stores/provider';
import { ProviderSelector } from '@/components/settings/ProviderSelector';
import { ApiKeyInput } from '@/components/settings/ApiKeyInput';
import { ModelSelector } from '@/components/settings/ModelSelector';
import { CapabilityBadges } from '@/components/settings/CapabilityBadges';
import { TestConnectionButton } from '@/components/settings/TestConnectionButton';

interface SettingsPageProps {
  onBack?: () => void;
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const {
    selectedProvider,
    apiKey,
    baseUrl,
    selectedModel,
    selectedModels,
    availableModels,
    isConnected,
    isLoading,
    isLoadingModels,
    error,
    setProvider,
    setApiKey,
    setBaseUrl,
    setModel,
    toggleModel,
    testConnection,
    initializeProvider,
    clearError,
  } = useProviderStore();
  
  // Get current model capabilities (use first selected model for display)
  const currentModel = availableModels.find(m => m.id === selectedModel);
  
  // Initialize provider on mount
  useEffect(() => {
    initializeProvider();
  }, [initializeProvider]);
  
  // Clear error when provider changes
  useEffect(() => {
    clearError();
  }, [selectedProvider, clearError]);
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex items-center gap-3 p-4">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Settings02Icon} className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Provider Settings</h1>
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-6">
        {/* Provider Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Provider Configuration</CardTitle>
            <CardDescription>
              Select your preferred LLM provider and configure authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Provider Selection */}
            <ProviderSelector
              value={selectedProvider}
              onChange={setProvider}
              disabled={isLoading}
            />
            
            <Separator />
            
            {/* API Key Input */}
            <ApiKeyInput
              value={apiKey}
              onChange={setApiKey}
              provider={selectedProvider}
              disabled={isLoading}
            />
            
            {/* Base URL for custom providers */}
            {(selectedProvider === 'openai-compat' || selectedProvider === 'ollama') && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Base URL
                  {selectedProvider === 'openai-compat' && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="url"
                  value={baseUrl || ''}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder={
                    selectedProvider === 'ollama' 
                      ? 'http://localhost:11434' 
                      : 'https://api.example.com/v1'
                  }
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  disabled={isLoading}
                />
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Model Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Model Selection</CardTitle>
            <CardDescription>
              Choose the specific model and view its capabilities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Model Selector */}
            <ModelSelector
              selectedModels={selectedModels}
              onToggleModel={toggleModel}
              models={availableModels}
              disabled={isLoading}
              isLoading={isLoadingModels}
            />
            
            {/* Loading indicator - now integrated into ModelSelector */}
            
            {/* Model Capabilities */}
            {currentModel && (
              <>
                <Separator />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Model Capabilities
                  </label>
                  <CapabilityBadges capabilities={currentModel.capabilities} />
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Connection Testing */}
        <Card>
          <CardHeader>
            <CardTitle>Connection Test</CardTitle>
            <CardDescription>
              Verify your configuration by testing the connection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TestConnectionButton
              onTest={testConnection}
              provider={selectedProvider}
              apiKey={apiKey}
              isLoading={isLoading}
              isConnected={isConnected}
              error={error}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}