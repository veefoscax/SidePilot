/**
 * Multi-Provider Manager Component
 * 
 * Store-driven interface for configuring multiple LLM providers.
 * All state is managed by the Zustand multi-provider store - no local data state.
 */

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  CheckmarkCircle01Icon, 
  Cancel01Icon, 
  Loading01Icon,
  Delete01Icon,
  Add01Icon,
  Edit02Icon,
  Save,
  DragDropVerticalIcon
} from '@hugeicons/core-free-icons';
import { toast } from 'sonner';

import { useMultiProviderStore } from '@/stores/multi-provider';
import { ProviderType } from '@/providers/types';
import { getProviderInfo, getSupportedProviders } from '@/providers/factory';
import { getProviderPlanTypes, supportsMultiplePlans } from '@/providers/provider-configs';

// UI-only state interface (no data state)
interface UIState {
  expandedProviders: Set<ProviderType>; // Which provider cards are expanded
  draggedProvider: ProviderType | null; // Currently dragged provider
  dragOverProvider: ProviderType | null; // Provider being dragged over
  draggedModel: string | null; // Currently dragged model
  dragOverModel: string | null; // Model being dragged over
  testingProviders: Set<ProviderType>; // Providers currently being tested
}

// Provider display data derived from store
interface ProviderDisplay {
  type: ProviderType;
  config: any; // ProviderConfig from store
  selectedModels: string[]; // Model IDs
  availableModels: any[]; // ModelInfo[]
  isLoadingModels: boolean;
  isExpanded: boolean;
  isTesting: boolean;
}
export function MultiProviderManager() {
  const store = useMultiProviderStore();
  
  // Only UI state - no data state
  const [uiState, setUIState] = useState<UIState>({
    expandedProviders: new Set(),
    draggedProvider: null,
    dragOverProvider: null,
    draggedModel: null,
    dragOverModel: null,
    testingProviders: new Set(),
  });
  
  // Derive display state from store (re-computed on every store change)
  const displayProviders = useMemo(() => {
    const orderedProviders = store.getOrderedConfiguredProviders();
    
    return orderedProviders.map(providerType => {
      const providerConfig = store.providers[providerType];
      const selectedModels = store.getSelectedModelsByProvider(providerType);
      const availableModels = store.availableModelsByProvider[providerType] || [];
      const isLoadingModels = store.loadingProviders.includes(providerType);
      
      return {
        type: providerType,
        config: providerConfig,
        selectedModels: selectedModels.map(m => m.id),
        availableModels,
        isLoadingModels,
        isExpanded: uiState.expandedProviders.has(providerType),
        isTesting: uiState.testingProviders.has(providerType),
      };
    });
  }, [
    store.providers, 
    store.selectedModels, 
    store.providerOrder, 
    store.availableModelsByProvider, 
    store.loadingProviders,
    uiState.expandedProviders,
    uiState.testingProviders
  ]);
  
  // Initialize store on mount
  useMemo(() => {
    store.initializeStore();
  }, []);
  
  const updateUIState = (updates: Partial<UIState>) => {
    setUIState(prev => ({ ...prev, ...updates }));
  };
  const addNewProvider = () => {
    // Find first unconfigured provider to add
    const supportedProviders = getSupportedProviders();
    const configuredTypes = new Set(Object.keys(store.providers).filter(type => 
      store.providers[type as ProviderType].isConfigured
    ));
    
    const availableProvider = supportedProviders.find(type => !configuredTypes.has(type));
    
    if (availableProvider) {
      // Add to provider order and expand it
      store.addProviderToOrder(availableProvider);
      updateUIState({
        expandedProviders: new Set([...uiState.expandedProviders, availableProvider])
      });
    } else {
      toast.info('All supported providers are already configured');
    }
  };
  
  const removeProvider = (providerType: ProviderType) => {
    // Remove from store
    store.removeProviderFromOrder(providerType);
    
    // Clear provider configuration
    store.setProviderConfig(providerType, {
      apiKey: '',
      baseUrl: '',
      planType: undefined,
      isConfigured: false,
      isConnected: false,
    });
    
    // Remove all selected models for this provider
    const selectedModels = store.getSelectedModelsByProvider(providerType);
    selectedModels.forEach(model => {
      store.removeSelectedModel(model.fullId);
    });
    
    // Update UI state
    updateUIState({
      expandedProviders: new Set([...uiState.expandedProviders].filter(p => p !== providerType))
    });
  };
  
  const toggleExpanded = (providerType: ProviderType) => {
    const newExpanded = new Set(uiState.expandedProviders);
    if (newExpanded.has(providerType)) {
      newExpanded.delete(providerType);
    } else {
      newExpanded.add(providerType);
    }
    updateUIState({ expandedProviders: newExpanded });
  };
  const handleProviderDragStart = (e: React.DragEvent, providerType: ProviderType) => {
    updateUIState({ draggedProvider: providerType });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', providerType);
  };
  
  const handleProviderDrop = (e: React.DragEvent, targetProvider: ProviderType) => {
    e.preventDefault();
    
    const draggedProvider = uiState.draggedProvider;
    if (!draggedProvider || draggedProvider === targetProvider) return;
    
    // Reorder providers in store
    const currentOrder = store.providerOrder;
    const draggedIndex = currentOrder.indexOf(draggedProvider);
    const targetIndex = currentOrder.indexOf(targetProvider);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const newOrder = [...currentOrder];
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);
    
    store.setProviderOrder(newOrder);
    
    updateUIState({ 
      draggedProvider: null, 
      dragOverProvider: null 
    });
  };
  
  const handleDragEnd = () => {
    updateUIState({
      draggedProvider: null,
      dragOverProvider: null,
      draggedModel: null,
      dragOverModel: null,
    });
  };

  return (
    <div className="space-y-3">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">LLM Providers</h2>
        <Button size="sm" variant="outline" onClick={addNewProvider}>
          <HugeiconsIcon icon={Add01Icon} className="h-3 w-3 mr-1" />
          Add Provider
        </Button>
      </div>

      {/* Provider Configuration Stack */}
      <div className="space-y-2">
        {displayProviders.length === 0 ? (
          <div className="p-4 text-center border rounded text-sm text-muted-foreground">
            No providers configured. Click "Add Provider" to get started.
          </div>
        ) : (
          displayProviders.map((provider) => (
            <div key={provider.type} className="relative">
              {/* Drop zone indicator */}
              {uiState.dragOverProvider === provider.type && 
               uiState.draggedProvider !== provider.type && 
               !uiState.draggedModel && (
                <div className="h-4 flex items-center justify-center mb-2">
                  <div className="w-full h-1 bg-primary rounded-full" />
                </div>
              )}
              
              <ProviderConfigCard
                provider={provider}
                store={store}
                uiState={uiState}
                onUpdateUIState={updateUIState}
                onRemove={() => removeProvider(provider.type)}
                onToggleExpanded={() => toggleExpanded(provider.type)}
                onDragStart={(e) => handleProviderDragStart(e, provider.type)}
                onDrop={(e) => handleProviderDrop(e, provider.type)}
                onDragEnd={handleDragEnd}
                canRemove={displayProviders.length > 1}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
// Individual Provider Configuration Card
interface ProviderConfigCardProps {
  provider: ProviderDisplay;
  store: any; // MultiProviderStore
  uiState: UIState;
  onUpdateUIState: (updates: Partial<UIState>) => void;
  onRemove: () => void;
  onToggleExpanded: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  canRemove: boolean;
}

function ProviderConfigCard({ 
  provider,
  store,
  uiState,
  onUpdateUIState,
  onRemove, 
  onToggleExpanded, 
  onDragStart,
  onDrop,
  onDragEnd,
  canRemove
}: ProviderConfigCardProps) {
  const supportedProviders = getSupportedProviders();
  const providerInfo = getProviderInfo(provider.type);
  
  const isDragging = uiState.draggedProvider === provider.type;
  const isDragOver = uiState.dragOverProvider === provider.type;
  
  const handleProviderChange = (providerType: ProviderType) => {
    const providerInfo = getProviderInfo(providerType);
    let defaultBaseUrl = '';
    let defaultPlanType = undefined;
    
    // Set default URLs for local providers
    if (!providerInfo.requiresApiKey) {
      if (providerType === 'ollama') {
        defaultBaseUrl = 'http://localhost:11434';
      } else if (providerType === 'lmstudio') {
        defaultBaseUrl = 'http://127.0.0.1:1234';
      }
    }
    
    // Set default plan type for providers that support multiple plans
    if (supportsMultiplePlans(providerType)) {
      const planTypes = getProviderPlanTypes(providerType);
      if (planTypes) {
        if (providerType === 'zai') {
          defaultPlanType = 'coding';
        } else {
          defaultPlanType = Object.keys(planTypes)[0];
        }
      }
    }
    
    // Update store directly
    store.setProviderConfig(providerType, { 
      apiKey: '', 
      baseUrl: defaultBaseUrl,
      planType: defaultPlanType,
    });
    
    // Add to provider order if not already there
    store.addProviderToOrder(providerType);
  };
  const handlePlanTypeChange = (planType: string) => {
    store.setProviderConfig(provider.type, { 
      apiKey: provider.config.apiKey, 
      baseUrl: provider.config.baseUrl,
      planType: planType
    });
    // Reload models when plan type changes
    store.loadModelsForProvider(provider.type);
  };

  const handleApiKeyChange = (apiKey: string) => {
    store.setProviderConfig(provider.type, { 
      apiKey, 
      baseUrl: provider.config.baseUrl,
      planType: provider.config.planType
    });
    if (apiKey.trim()) {
      store.loadModelsForProvider(provider.type);
    }
  };

  const handleBaseUrlChange = (baseUrl: string) => {
    store.setProviderConfig(provider.type, { 
      apiKey: provider.config.apiKey, 
      baseUrl,
      planType: provider.config.planType
    });
    // Reload models when URL changes
    if (baseUrl.trim()) {
      store.loadModelsForProvider(provider.type);
    }
  };

  const handleTestConnection = async () => {
    // Update store with current configuration before testing
    if (providerInfo?.requiresApiKey) {
      if (!provider.config.apiKey?.trim()) {
        toast.error('API key is required');
        return;
      }
    } else {
      if (!provider.config.baseUrl?.trim()) {
        toast.error('Server URL is required');
        return;
      }
    }
    
    // Set testing state
    const newTesting = new Set(uiState.testingProviders);
    newTesting.add(provider.type);
    onUpdateUIState({ testingProviders: newTesting });
    
    try {
      const success = await store.testProviderConnection(provider.type);
      
      // Show toast notification
      if (success) {
        toast.success(`${providerInfo?.name || provider.type} connected successfully`);
        // Auto-load models after successful connection
        store.loadModelsForProvider(provider.type);
      } else {
        const error = provider.config.error || 'Connection failed';
        toast.error(`${providerInfo?.name || provider.type}: ${error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      toast.error(`${providerInfo?.name || provider.type}: ${errorMessage}`);
    } finally {
      // Clear testing state
      const newTesting = new Set(uiState.testingProviders);
      newTesting.delete(provider.type);
      onUpdateUIState({ testingProviders: newTesting });
    }
  };
  const handleModelToggle = (modelId: string) => {
    const isCurrentlySelected = provider.selectedModels.includes(modelId);
    
    if (isCurrentlySelected) {
      // Remove from store
      const model = provider.availableModels.find(m => m.id === modelId);
      if (model) {
        store.removeSelectedModel(`${provider.type}:${modelId}`);
      }
    } else {
      // Add to store
      const model = provider.availableModels.find(m => m.id === modelId);
      if (model) {
        store.addSelectedModel(model, provider.type);
      }
    }
  };

  const handleSelectAll = () => {
    // Add all available models to store
    provider.availableModels.forEach(model => {
      store.addSelectedModel(model, provider.type);
    });
  };

  const handleSelectNone = () => {
    // Remove all selected models from store
    provider.selectedModels.forEach(modelId => {
      store.removeSelectedModel(`${provider.type}:${modelId}`);
    });
  };

  const getCardTitle = () => {
    return providerInfo?.name || provider.type;
  };

  const getModelCount = () => {
    if (provider.selectedModels.length === 0) return '';
    return `${provider.selectedModels.length} model${provider.selectedModels.length === 1 ? '' : 's'}`;
  };
  return (
    <div
      className={`transition-all duration-200 ${
        isDragging ? 'opacity-30 scale-95 rotate-2 z-50' : ''
      } ${
        isDragOver && !isDragging && !uiState.draggedModel ? 'scale-105 shadow-lg border-primary border-2' : ''
      }`}
      onDragOver={(e) => {
        // Only handle if not dragging a model
        if (!uiState.draggedModel) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }
      }}
      onDragEnter={() => {
        // Only handle if not dragging a model
        if (!uiState.draggedModel && uiState.draggedProvider && uiState.draggedProvider !== provider.type) {
          onUpdateUIState({ dragOverProvider: provider.type });
        }
      }}
      onDragLeave={(e) => {
        // Only handle if not dragging a model
        if (!uiState.draggedModel && !e.currentTarget.contains(e.relatedTarget as Node)) {
          onUpdateUIState({ dragOverProvider: null });
        }
      }}
      onDrop={(e) => {
        // Only handle if not dragging a model
        if (!uiState.draggedModel) {
          onDrop(e);
        }
      }}
    >
      <Card>
        <CardHeader className="pb-2 pt-3">
          <div className="flex items-center gap-2">
            {/* Drag Handle - Only for provider drag */}
            <div 
              className="cursor-move p-1 hover:bg-muted rounded -ml-2"
              draggable={true}
              onDragStart={(e) => {
                e.stopPropagation();
                onDragStart(e);
              }}
              onDragEnd={onDragEnd}
            >
              <HugeiconsIcon icon={DragDropVerticalIcon} className="h-4 w-4 text-muted-foreground" />
            </div>
            
            {/* Provider Title and Info */}
            <div className="flex-1 flex items-center justify-between">
              <CardTitle className="text-sm">{getCardTitle()}</CardTitle>
              
              <div className="flex items-center gap-2">
                {/* Model Count - Right Justified */}
                {getModelCount() && (
                  <Badge variant="secondary" className="text-xs">
                    {getModelCount()}
                  </Badge>
                )}
                
                {/* Connection Status */}
                {provider.config && (
                  <>
                    {provider.config.isConnected ? (
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-3 w-3 text-green-500" />
                    ) : provider.config.error ? (
                      <div 
                        className="h-3 w-3 text-red-500 cursor-help" 
                        title={provider.config.error}
                      >
                        <HugeiconsIcon icon={Cancel01Icon} className="h-3 w-3" />
                      </div>
                    ) : null}
                  </>
                )}
                
                {/* Action Icons */}
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleExpanded}
                    className="p-1 h-5 w-5"
                  >
                    <HugeiconsIcon icon={Edit02Icon} className="h-2 w-2" />
                  </Button>
                  {canRemove && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-5 w-5 text-muted-foreground hover:text-destructive"
                        >
                          <HugeiconsIcon icon={Delete01Icon} className="h-2 w-2" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Provider</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove this provider configuration? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={onRemove}>Remove</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        {provider.isExpanded && (
          <CardContent 
            className="pt-0 pb-3 space-y-3"
            onDragStart={(e) => e.stopPropagation()}
            onDragOver={(e) => e.stopPropagation()}
            onDragEnter={(e) => e.stopPropagation()}
            onDragLeave={(e) => e.stopPropagation()}
            onDrop={(e) => e.stopPropagation()}
          >
            {/* Provider Selection - All 40+ providers */}
            <div className="space-y-1">
              <label className="text-xs font-medium">Provider</label>
              <Select
                value={provider.type || ''}
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

            {/* Plan Type Selection - For providers with multiple plans */}
            {supportsMultiplePlans(provider.type) && (
              <div className="space-y-1">
                <label className="text-xs font-medium">Plan Type</label>
                <Select
                  value={provider.config.planType || ''}
                  onValueChange={handlePlanTypeChange}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Choose plan type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(getProviderPlanTypes(provider.type) || {}).map(([planKey, planConfig]) => (
                      <SelectItem key={planKey} value={planKey}>
                        <div className="flex flex-col items-start w-full min-w-0">
                          <span className="font-medium capitalize truncate w-full">{planKey} Plan</span>
                          <span className="text-xs text-muted-foreground truncate w-full max-w-[200px]">{planConfig.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {provider.config.planType && (
                  <div className="text-xs text-muted-foreground">
                    Using: {getProviderPlanTypes(provider.type)?.[provider.config.planType]?.baseUrl}
                  </div>
                )}
              </div>
            )}
            {/* API Key Input */}
            {providerInfo?.requiresApiKey && (
              <div className="space-y-1">
                <label className="text-xs font-medium">API Key</label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="Enter your API key..."
                    value={provider.config.apiKey || ''}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    className="flex-1 h-8"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={provider.isTesting || !provider.config.apiKey?.trim()}
                    className="h-8 px-2"
                  >
                    {provider.isTesting ? (
                      <HugeiconsIcon icon={Loading01Icon} className="h-3 w-3 animate-spin" />
                    ) : (
                      'Test'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Server URL Input for Local Providers */}
            {!providerInfo?.requiresApiKey && (
              <div className="space-y-1">
                <label className="text-xs font-medium">Server URL</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder={`Enter server URL (e.g., ${provider.type === 'ollama' ? 'http://localhost:11434' : 'http://127.0.0.1:1234'})`}
                    value={provider.config.baseUrl || ''}
                    onChange={(e) => handleBaseUrlChange(e.target.value)}
                    className="flex-1 h-8"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={provider.isTesting || !provider.config.baseUrl?.trim()}
                    className="h-8 px-2"
                  >
                    {provider.isTesting ? (
                      <HugeiconsIcon icon={Loading01Icon} className="h-3 w-3 animate-spin" />
                    ) : (
                      'Test'
                    )}
                  </Button>
                </div>
              </div>
            )}
            {/* Model Selection */}
            {((providerInfo?.requiresApiKey && provider.config.apiKey?.trim()) || 
              (!providerInfo?.requiresApiKey && provider.config.baseUrl?.trim())) && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium">Models</label>
                  {provider.availableModels.length > 0 && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSelectAll}
                        className="h-5 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSelectNone}
                        className="h-5 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        None
                      </Button>
                    </div>
                  )}
                </div>
                
                {provider.isLoadingModels ? (
                  <div className="space-y-1">
                    {[1, 2].map(i => (
                      <div key={i} className="h-8 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : provider.availableModels.length === 0 ? (
                  <div className="p-2 text-center border rounded text-xs">
                    {provider.config.error ? (
                      <div className="text-red-500">
                        <div className="font-medium">Failed to load models</div>
                        <div className="text-xs mt-1 text-muted-foreground">{provider.config.error}</div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">No models available</div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Selected Models - Top Section */}
                    {provider.selectedModels.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground font-medium">Selected ({provider.selectedModels.length})</div>
                        <div className="space-y-1 max-h-48 overflow-y-auto bg-muted/30 rounded p-3">
                          {provider.selectedModels.map((modelId, index) => {
                            const model = provider.availableModels.find(m => m.id === modelId);
                            if (!model) return null;
                            
                            return (
                              <div 
                                key={modelId} 
                                className="flex items-center gap-2 p-3 bg-background border rounded text-xs hover:bg-muted/50 transition-colors"
                              >
                                <Checkbox
                                  checked={true}
                                  onCheckedChange={(checked) => {
                                    if (!checked) handleModelToggle(modelId);
                                  }}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium">{model.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {(model.capabilities.contextWindow / 1000).toFixed(0)}K context
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-xs px-1">
                                  #{index + 1}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {/* Available Models - Bottom Section */}
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground font-medium">
                        Available ({provider.availableModels.filter(m => !provider.selectedModels.includes(m.id)).length})
                      </div>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {provider.availableModels
                          .filter(model => !provider.selectedModels.includes(model.id))
                          .map((model) => (
                            <div 
                              key={model.id} 
                              className="flex items-center gap-2 p-3 border rounded text-xs hover:bg-muted/50 transition-colors cursor-pointer"
                              onClick={() => handleModelToggle(model.id)}
                            >
                              <Checkbox
                                checked={false}
                                onCheckedChange={() => handleModelToggle(model.id)}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium">{model.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {(model.capabilities.contextWindow / 1000).toFixed(0)}K context
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Save Button */}
            <div className="pt-2 border-t">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onToggleExpanded} 
                className="w-full"
              >
                <HugeiconsIcon icon={Save} className="h-3 w-3 mr-1" />
                Save & Collapse
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}