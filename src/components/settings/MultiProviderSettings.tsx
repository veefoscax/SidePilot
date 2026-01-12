/**
 * Multi-Provider Settings Component
 * 
 * Advanced UI for managing multiple LLM providers and their models.
 * Features provider tabs, unified model selection, and comprehensive management.
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  Settings02Icon, 
  CheckmarkCircle01Icon, 
  Cancel01Icon, 
  Loading01Icon,
  Add01Icon,
  Delete01Icon
} from '@hugeicons/core-free-icons';

import { useMultiProviderStore } from '@/stores/multi-provider';
import { ProviderType } from '@/providers/types';
import { getProviderInfo, getProviderCategories } from '@/providers/factory';

export function MultiProviderSettings() {
  const {
    providers,
    selectedModels,
    currentModel,
    availableModelsByProvider,
    loadingProviders,
    isLoading,
    setProviderConfig,
    testProviderConnection,
    loadModelsForProvider,
    toggleSelectedModel,
    removeSelectedModel,
    setCurrentModel,
    initializeStore,
  } = useMultiProviderStore();

  const [activeTab, setActiveTab] = useState<'providers' | 'models'>('providers');
  
  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  // Get provider categories for organized display
  const categories = getProviderCategories();
  const configuredProviders = Object.values(providers).filter(p => p.isConfigured || p.type === 'ollama');

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <HugeiconsIcon icon={Settings02Icon} className="h-5 w-5" />
            Multi-Provider Settings
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure multiple LLM providers and manage your model collection
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">
            {configuredProviders.length} Providers
          </Badge>
          <Badge variant="outline">
            {selectedModels.length} Models
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="providers">Provider Setup</TabsTrigger>
          <TabsTrigger value="models">Model Collection</TabsTrigger>
        </TabsList>

        {/* Provider Configuration Tab */}
        <TabsContent value="providers" className="space-y-4">
          {Object.entries(categories).map(([categoryName, providerTypes]) => (
            <Card key={categoryName}>
              <CardHeader>
                <CardTitle className="text-base">{categoryName}</CardTitle>
                <CardDescription>
                  Configure providers in this category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {providerTypes.slice(0, 6).map((providerType) => (
                    <ProviderConfigCard
                      key={providerType}
                      providerType={providerType}
                      config={providers[providerType]}
                      onConfigChange={(config) => setProviderConfig(providerType, config)}
                      onTestConnection={() => testProviderConnection(providerType)}
                      onLoadModels={() => loadModelsForProvider(providerType)}
                      isLoading={loadingProviders.includes(providerType)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Model Collection Tab */}
        <TabsContent value="models" className="space-y-4">
          {/* Selected Models Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Your Model Collection</CardTitle>
              <CardDescription>
                Models selected from all configured providers. Switch between them in chat.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedModels.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No models selected yet.</p>
                  <p className="text-sm">Configure providers and select models to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedModels.map((model) => (
                    <SelectedModelCard
                      key={model.fullId}
                      model={model}
                      isCurrent={currentModel === model.fullId}
                      onSetCurrent={() => setCurrentModel(model.fullId)}
                      onRemove={() => removeSelectedModel(model.fullId)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Models by Provider */}
          {configuredProviders.map((provider) => {
            const models = availableModelsByProvider[provider.type] || [];
            const isLoadingProvider = loadingProviders.includes(provider.type);
            
            if (models.length === 0 && !isLoadingProvider) return null;

            return (
              <Card key={provider.type}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getProviderInfo(provider.type).name}
                    {isLoadingProvider && (
                      <HugeiconsIcon icon={Loading01Icon} className="h-4 w-4 animate-spin" />
                    )}
                  </CardTitle>
                  <CardDescription>
                    Select models to add to your collection
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingProvider ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-muted rounded-md animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {models.map((model) => {
                        const fullId = `${provider.type}:${model.id}`;
                        const isSelected = selectedModels.some(m => m.fullId === fullId);
                        
                        return (
                          <div key={model.id} className="flex items-center gap-3 p-3 border rounded-lg">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelectedModel(model, provider.type)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">{model.name}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <span>{(model.capabilities.contextWindow / 1000).toFixed(0)}K context</span>
                                {model.pricing && (
                                  <span>
                                    ${model.pricing.inputPer1M.toFixed(2)}/${model.pricing.outputPer1M.toFixed(2)} per 1M
                                  </span>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <Badge variant="secondary" className="text-xs">
                                Selected
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Provider Configuration Card Component
interface ProviderConfigCardProps {
  providerType: ProviderType;
  config: any;
  onConfigChange: (config: any) => void;
  onTestConnection: () => Promise<boolean>;
  onLoadModels: () => void;
  isLoading: boolean;
}

function ProviderConfigCard({ 
  providerType, 
  config, 
  onConfigChange, 
  onTestConnection, 
  onLoadModels,
  isLoading 
}: ProviderConfigCardProps) {
  const [isTesting, setIsTesting] = useState(false);
  const info = getProviderInfo(providerType);

  const handleTestConnection = async () => {
    setIsTesting(true);
    await onTestConnection();
    setIsTesting(false);
  };

  const handleApiKeyChange = (apiKey: string) => {
    onConfigChange({ apiKey });
  };

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg">
      {/* Provider Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium">{info.name}</div>
        <div className="text-xs text-muted-foreground">{info.description}</div>
      </div>

      {/* API Key Input */}
      <div className="w-48">
        {providerType !== 'ollama' ? (
          <input
            type="password"
            placeholder="API Key"
            value={config.apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
            className="w-full px-2 py-1 text-xs border rounded"
          />
        ) : (
          <div className="text-xs text-muted-foreground">Local (no key needed)</div>
        )}
      </div>

      {/* Status & Actions */}
      <div className="flex items-center gap-2">
        {config.isConnected ? (
          <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-4 w-4 text-green-500" />
        ) : config.error ? (
          <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4 text-red-500" />
        ) : null}
        
        <Button
          size="sm"
          variant="outline"
          onClick={handleTestConnection}
          disabled={isTesting || (!config.apiKey && providerType !== 'ollama')}
        >
          {isTesting ? (
            <HugeiconsIcon icon={Loading01Icon} className="h-3 w-3 animate-spin" />
          ) : (
            'Test'
          )}
        </Button>

        {config.isConfigured && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onLoadModels}
            disabled={isLoading}
          >
            {isLoading ? (
              <HugeiconsIcon icon={Loading01Icon} className="h-3 w-3 animate-spin" />
            ) : (
              'Load Models'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// Selected Model Card Component
interface SelectedModelCardProps {
  model: any;
  isCurrent: boolean;
  onSetCurrent: () => void;
  onRemove: () => void;
}

function SelectedModelCard({ model, isCurrent, onSetCurrent, onRemove }: SelectedModelCardProps) {
  const providerInfo = getProviderInfo(model.provider);

  return (
    <div className={`flex items-center gap-3 p-3 border rounded-lg ${isCurrent ? 'border-primary bg-primary/5' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{model.name}</span>
          <Badge variant="outline" className="text-xs">
            {providerInfo.name}
          </Badge>
          {isCurrent && (
            <Badge variant="default" className="text-xs">
              Current
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
          <span>{(model.capabilities.contextWindow / 1000).toFixed(0)}K context</span>
          {model.pricing && (
            <span>
              ${model.pricing.inputPer1M.toFixed(2)}/${model.pricing.outputPer1M.toFixed(2)} per 1M
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        {!isCurrent && (
          <Button size="sm" variant="ghost" onClick={onSetCurrent}>
            Set Current
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onRemove}>
          <HugeiconsIcon icon={Delete01Icon} className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}