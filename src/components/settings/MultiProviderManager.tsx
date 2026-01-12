/**
 * Multi-Provider Manager Component
 * 
 * Compact collapsible stack interface for configuring multiple LLM providers.
 * Each provider gets its own card with provider selection and model multi-select.
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  CheckmarkCircle01Icon, 
  Cancel01Icon, 
  Loading01Icon,
  Delete01Icon,
  Add01Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  Edit02Icon,
  ArrowUp01Icon,
  Save
} from '@hugeicons/core-free-icons';

import { useMultiProviderStore } from '@/stores/multi-provider';
import { ProviderType } from '@/providers/types';
import { getProviderInfo, getSupportedProviders } from '@/providers/factory';

interface ProviderConfig {
  id: string;
  provider: ProviderType | null;
  apiKey: string;
  selectedModels: string[];
  isExpanded: boolean;
}

export function MultiProviderManager() {
  const store = useMultiProviderStore();
  const [providerConfigs, setProviderConfigs] = useState<ProviderConfig[]>([
    { id: '1', provider: null, apiKey: '', selectedModels: [], isExpanded: true }
  ]);
  
  useEffect(() => {
    store.initializeStore();
  }, []);

  const addProviderConfig = () => {
    const newConfig: ProviderConfig = {
      id: Date.now().toString(),
      provider: null,
      apiKey: '',
      selectedModels: [],
      isExpanded: true
    };
    setProviderConfigs([...providerConfigs, newConfig]);
  };

  const removeProviderConfig = (id: string) => {
    setProviderConfigs(providerConfigs.filter(config => config.id !== id));
  };

  const updateProviderConfig = (id: string, updates: Partial<ProviderConfig>) => {
    setProviderConfigs(providerConfigs.map(config => 
      config.id === id ? { ...config, ...updates } : config
    ));
  };

  const moveProviderConfig = (id: string, direction: 'up' | 'down') => {
    const currentIndex = providerConfigs.findIndex(config => config.id === id);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= providerConfigs.length) return;
    
    const newConfigs = [...providerConfigs];
    [newConfigs[currentIndex], newConfigs[newIndex]] = [newConfigs[newIndex], newConfigs[currentIndex]];
    setProviderConfigs(newConfigs);
  };

  const toggleExpanded = (id: string) => {
    updateProviderConfig(id, { isExpanded: !providerConfigs.find(c => c.id === id)?.isExpanded });
  };

  const saveAndCollapseAll = () => {
    setProviderConfigs(providerConfigs.map(config => ({ ...config, isExpanded: false })));
  };

  return (
    <div className="space-y-3">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">LLM Providers</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={saveAndCollapseAll}>
            <HugeiconsIcon icon={Save} className="h-3 w-3 mr-1" />
            Save & Collapse
          </Button>
          <Button size="sm" variant="outline" onClick={addProviderConfig}>
            <HugeiconsIcon icon={Add01Icon} className="h-3 w-3 mr-1" />
            Add Provider
          </Button>
        </div>
      </div>

      {/* Compact Provider Configuration Stack */}
      <div className="space-y-2">
        {providerConfigs.map((config, index) => (
          <ProviderConfigCard
            key={config.id}
            config={config}
            onUpdate={(updates) => updateProviderConfig(config.id, updates)}
            onRemove={() => removeProviderConfig(config.id)}
            onToggleExpanded={() => toggleExpanded(config.id)}
            onMove={(direction) => moveProviderConfig(config.id, direction)}
            store={store}
            canRemove={providerConfigs.length > 1}
            canMoveUp={index > 0}
            canMoveDown={index < providerConfigs.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

// Individual Provider Configuration Card
interface ProviderConfigCardProps {
  config: ProviderConfig;
  onUpdate: (updates: Partial<ProviderConfig>) => void;
  onRemove: () => void;
  onToggleExpanded: () => void;
  onMove: (direction: 'up' | 'down') => void;
  store: any;
  canRemove: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

function ProviderConfigCard({ 
  config, 
  onUpdate, 
  onRemove, 
  onToggleExpanded, 
  onMove,
  store, 
  canRemove,
  canMoveUp,
  canMoveDown
}: ProviderConfigCardProps) {
  const [isTesting, setIsTesting] = useState(false);
  const supportedProviders = getSupportedProviders(); // All 40+ providers
  
  const providerInfo = config.provider ? getProviderInfo(config.provider) : null;
  const storeConfig = config.provider ? store.providers[config.provider] : null;
  const availableModels = config.provider ? (store.availableModelsByProvider?.[config.provider] || []) : [];
  const isLoadingModels = config.provider ? store.loadingProviders?.includes(config.provider) : false;
  
  const handleProviderChange = (providerType: ProviderType) => {
    onUpdate({ 
      provider: providerType, 
      apiKey: '', 
      selectedModels: [],
      isExpanded: true 
    });
  };

  const handleApiKeyChange = (apiKey: string) => {
    onUpdate({ apiKey });
    if (config.provider && apiKey.trim()) {
      store.setProviderConfig(config.provider, { apiKey });
      store.loadModelsForProvider(config.provider);
    }
  };

  const handleTestConnection = async () => {
    if (!config.provider) return;
    setIsTesting(true);
    await store.testProviderConnection(config.provider);
    setIsTesting(false);
  };

  const handleModelToggle = (modelId: string) => {
    const newSelectedModels = config.selectedModels.includes(modelId)
      ? config.selectedModels.filter(id => id !== modelId)
      : [...config.selectedModels, modelId];
    onUpdate({ selectedModels: newSelectedModels });
  };

  const moveModel = (modelId: string, direction: 'up' | 'down') => {
    const currentIndex = config.selectedModels.indexOf(modelId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= config.selectedModels.length) return;
    
    const newSelectedModels = [...config.selectedModels];
    [newSelectedModels[currentIndex], newSelectedModels[newIndex]] = [newSelectedModels[newIndex], newSelectedModels[currentIndex]];
    onUpdate({ selectedModels: newSelectedModels });
  };

  const getCardTitle = () => {
    if (!config.provider) return 'Select Provider';
    return providerInfo?.name || config.provider;
  };

  const getModelCount = () => {
    if (config.selectedModels.length === 0) return '';
    return `${config.selectedModels.length} model${config.selectedModels.length === 1 ? '' : 's'}`;
  };

  return (
    <Card className="transition-all duration-200">
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpanded}
              className="p-1 h-5 w-5"
            >
              <HugeiconsIcon 
                icon={config.isExpanded ? ArrowDown01Icon : ArrowRight01Icon} 
                className="h-3 w-3" 
              />
            </Button>
            <CardTitle className="text-sm">{getCardTitle()}</CardTitle>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Model Count - Right Justified */}
            {getModelCount() && (
              <Badge variant="secondary" className="text-xs">
                {getModelCount()}
              </Badge>
            )}
            
            {/* Connection Status */}
            {config.provider && storeConfig && (
              <>
                {storeConfig.isConnected ? (
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-3 w-3 text-green-500" />
                ) : storeConfig.error ? (
                  <HugeiconsIcon icon={Cancel01Icon} className="h-3 w-3 text-red-500" />
                ) : null}
              </>
            )}
            
            {/* Action Icons */}
            <div className="flex items-center">
              {canMoveUp && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMove('up')}
                  className="p-1 h-5 w-5"
                >
                  <HugeiconsIcon icon={ArrowUp01Icon} className="h-2 w-2" />
                </Button>
              )}
              {canMoveDown && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMove('down')}
                  className="p-1 h-5 w-5"
                >
                  <HugeiconsIcon icon={ArrowDown01Icon} className="h-2 w-2" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleExpanded}
                className="p-1 h-5 w-5"
              >
                <HugeiconsIcon icon={Edit02Icon} className="h-2 w-2" />
              </Button>
              {canRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRemove}
                  className="p-1 h-5 w-5 text-muted-foreground hover:text-destructive"
                >
                  <HugeiconsIcon icon={Delete01Icon} className="h-2 w-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      {config.isExpanded && (
        <CardContent className="pt-0 pb-3 space-y-3">
          {/* Provider Selection - All 40+ providers */}
          <div className="space-y-1">
            <label className="text-xs font-medium">Provider</label>
            <Select
              value={config.provider || ''}
              onValueChange={handleProviderChange}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Choose a provider..." />
              </SelectTrigger>
              <SelectContent>
                {supportedProviders.map((providerType) => {
                  const info = getProviderInfo(providerType);
                  return (
                    <SelectItem key={providerType} value={providerType}>
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium">{info.name}</span>
                        <span className="text-xs text-muted-foreground ml-2 truncate">
                          {info.description}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* API Key Input */}
          {config.provider && config.provider !== 'ollama' && (
            <div className="space-y-1">
              <label className="text-xs font-medium">API Key</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Enter your API key..."
                  value={config.apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  className="flex-1 px-2 py-1 text-xs border rounded h-8"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTesting || !config.apiKey.trim()}
                  className="h-8 px-2"
                >
                  {isTesting ? (
                    <HugeiconsIcon icon={Loading01Icon} className="h-3 w-3 animate-spin" />
                  ) : (
                    'Test'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Model Selection */}
          {config.provider && (config.apiKey.trim() || config.provider === 'ollama') && (
            <div className="space-y-1">
              <label className="text-xs font-medium">Models</label>
              
              {isLoadingModels ? (
                <div className="space-y-1">
                  {[1, 2].map(i => (
                    <div key={i} className="h-8 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : availableModels.length === 0 ? (
                <div className="p-2 text-center text-muted-foreground border rounded text-xs">
                  No models available
                </div>
              ) : (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {availableModels.map((model: any) => {
                    const isSelected = config.selectedModels.includes(model.id);
                    const selectedIndex = config.selectedModels.indexOf(model.id);
                    
                    return (
                      <div key={model.id} className="flex items-center gap-2 p-2 border rounded text-xs">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleModelToggle(model.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{model.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {(model.capabilities.contextWindow / 1000).toFixed(0)}K context
                          </div>
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs px-1">
                              #{selectedIndex + 1}
                            </Badge>
                            {selectedIndex > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveModel(model.id, 'up')}
                                className="p-1 h-4 w-4"
                              >
                                <HugeiconsIcon icon={ArrowUp01Icon} className="h-2 w-2" />
                              </Button>
                            )}
                            {selectedIndex < config.selectedModels.length - 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveModel(model.id, 'down')}
                                className="p-1 h-4 w-4"
                              >
                                <HugeiconsIcon icon={ArrowDown01Icon} className="h-2 w-2" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}