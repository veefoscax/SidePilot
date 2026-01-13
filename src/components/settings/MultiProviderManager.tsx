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

interface ProviderConfig {
  id: string;
  provider: ProviderType | null;
  apiKey: string;
  baseUrl: string;
  planType?: string; // For providers with multiple plan types (e.g., ZAI coding vs general)
  selectedModels: string[];
  isExpanded: boolean;
}

export function MultiProviderManager() {
  const store = useMultiProviderStore();
  const [providerConfigs, setProviderConfigs] = useState<ProviderConfig[]>([
    { id: '1', provider: null, apiKey: '', baseUrl: '', planType: undefined, selectedModels: [], isExpanded: true }
  ]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [draggedModel, setDraggedModel] = useState<string | null>(null);
  const [dragOverModel, setDragOverModel] = useState<string | null>(null);
  
  useEffect(() => {
    store.initializeStore();
    
    // Initialize provider configs from store
    const storeProviders = store.providers;
    if (storeProviders && Object.keys(storeProviders).length > 0) {
      const configuredProviders = Object.entries(storeProviders)
        .filter(([_, config]) => config.isConfigured)
        .map(([type, config], index) => ({
          id: (index + 1).toString(),
          provider: type as ProviderType,
          apiKey: config.apiKey || '',
          baseUrl: config.baseUrl || '',
          planType: config.planType,
          selectedModels: store.getSelectedModelsByProvider(type as ProviderType).map(m => m.id),
          isExpanded: false
        }));
      
      if (configuredProviders.length > 0) {
        setProviderConfigs(configuredProviders);
      }
    }
  }, []);

  // Show toast when provider has error
  useEffect(() => {
    providerConfigs.forEach(config => {
      if (config.provider && store.providers) {
        const storeConfig = store.providers[config.provider];
        // Add null safety checks
        if (storeConfig?.error && !storeConfig?.isConnected) {
          // Only show toast if we haven't shown it recently
          const lastErrorTime = localStorage.getItem(`error-toast-${config.provider}`);
          const now = Date.now();
          if (!lastErrorTime || now - parseInt(lastErrorTime) > 5000) { // 5 second cooldown
            toast.error(`${getProviderInfo(config.provider).name}: ${storeConfig.error}`);
            localStorage.setItem(`error-toast-${config.provider}`, now.toString());
          }
        }
      }
    });
  }, [providerConfigs, store.providers]);

  const addProviderConfig = () => {
    const newConfig: ProviderConfig = {
      id: Date.now().toString(),
      provider: null,
      apiKey: '',
      baseUrl: '',
      planType: undefined,
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

  const toggleExpanded = (id: string) => {
    updateProviderConfig(id, { isExpanded: !providerConfigs.find(c => c.id === id)?.isExpanded });
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    console.log('🚀 Drag started for:', id);
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    // Only handle provider drags, ignore model drags
    if (draggedModel) {
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (targetId: string) => {
    // Only set drag over if we're dragging a provider (not a model)
    if (draggedItem && !draggedModel) {
      setDragOverItem(targetId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    // Only handle provider drops, ignore model drops
    if (draggedModel) {
      return;
    }
    
    e.preventDefault();
    console.log('📦 Drop on:', targetId, 'from:', draggedItem);
    
    setDragOverItem(null);
    
    if (!draggedItem || draggedItem === targetId) {
      console.log('❌ Invalid drop - same item or no dragged item');
      return;
    }

    const draggedIndex = providerConfigs.findIndex(config => config.id === draggedItem);
    const targetIndex = providerConfigs.findIndex(config => config.id === targetId);
    
    console.log('📍 Moving from index', draggedIndex, 'to', targetIndex);
    
    if (draggedIndex === -1 || targetIndex === -1) return;

    const newConfigs = [...providerConfigs];
    const [draggedConfig] = newConfigs.splice(draggedIndex, 1);
    newConfigs.splice(targetIndex, 0, draggedConfig);
    
    console.log('✅ Reordered configs:', newConfigs.map(c => c.id));
    setProviderConfigs(newConfigs);
    setDraggedItem(null);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're leaving the entire drop zone and not dragging a model
    if (!draggedModel && !e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverItem(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
    setDraggedModel(null);
    setDragOverModel(null);
  };

  return (
    <div className="space-y-3">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">LLM Providers</h2>
        <Button size="sm" variant="outline" onClick={addProviderConfig}>
          <HugeiconsIcon icon={Add01Icon} className="h-3 w-3 mr-1" />
          Add Provider
        </Button>
      </div>

      {/* Draggable Provider Configuration Stack */}
      <div className="space-y-2">
        {providerConfigs.map((config) => (
          <div key={config.id} className="relative">
            {/* Drop zone indicator with spacing - only for provider drags */}
            {dragOverItem === config.id && draggedItem !== config.id && !draggedModel && (
              <div className="h-4 flex items-center justify-center mb-2">
                <div className="w-full h-1 bg-primary rounded-full" />
              </div>
            )}
            
            <div className={`transition-all duration-200 ${
              dragOverItem === config.id && draggedItem !== config.id && !draggedModel ? 'mb-4' : ''
            }`}>
              <ProviderConfigCard
                config={config}
                onUpdate={(updates) => updateProviderConfig(config.id, updates)}
                onRemove={() => removeProviderConfig(config.id)}
                onToggleExpanded={() => toggleExpanded(config.id)}
                onSaveAndCollapse={() => {
                  // Save current configuration to store before collapsing
                  if (config.provider) {
                    const providerInfo = getProviderInfo(config.provider);
                    if (providerInfo?.requiresApiKey) {
                      store.setProviderConfig(config.provider, { 
                        apiKey: config.apiKey,
                        baseUrl: config.baseUrl,
                        planType: config.planType
                      });
                    } else {
                      store.setProviderConfig(config.provider, { 
                        baseUrl: config.baseUrl,
                        planType: config.planType
                      });
                    }
                  }
                  updateProviderConfig(config.id, { isExpanded: false });
                }}
                onDragStart={(e) => handleDragStart(e, config.id)}
                onDragOver={handleDragOver}
                onDragEnter={() => handleDragEnter(config.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, config.id)}
                onDragEnd={handleDragEnd}
                isDragging={draggedItem === config.id}
                isDragOver={dragOverItem === config.id}
                draggedModel={draggedModel}
                setDraggedModel={setDraggedModel}
                dragOverModel={dragOverModel}
                setDragOverModel={setDragOverModel}
                store={store}
                canRemove={providerConfigs.length > 1}
              />
            </div>
          </div>
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
  onSaveAndCollapse: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: () => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isDragOver: boolean;
  draggedModel: string | null;
  setDraggedModel: (id: string | null) => void;
  dragOverModel: string | null;
  setDragOverModel: (id: string | null) => void;
  store: any;
  canRemove: boolean;
}

function ProviderConfigCard({ 
  config, 
  onUpdate, 
  onRemove, 
  onToggleExpanded, 
  onSaveAndCollapse,
  onDragStart,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onDragEnd,
  isDragging,
  isDragOver,
  draggedModel,
  setDraggedModel,
  dragOverModel,
  setDragOverModel,
  store, 
  canRemove
}: ProviderConfigCardProps) {
  const [isTesting, setIsTesting] = useState(false);
  const supportedProviders = getSupportedProviders(); // All 40+ providers
  
  const providerInfo = config.provider ? getProviderInfo(config.provider) : null;
  const storeConfig = config.provider && store.providers ? (store.providers[config.provider] || null) : null;
  const availableModels = config.provider && store.availableModelsByProvider ? (store.availableModelsByProvider[config.provider] || []) : [];
  const isLoadingModels = config.provider && store.loadingProviders ? store.loadingProviders.includes(config.provider) : false;
  
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
        // For ZAI, default to coding plan since that's what most users have
        if (providerType === 'zai') {
          defaultPlanType = 'coding';
        } else {
          // For other providers, use the first available plan
          defaultPlanType = Object.keys(planTypes)[0];
        }
      }
    }
    
    onUpdate({ 
      provider: providerType, 
      apiKey: '', 
      baseUrl: defaultBaseUrl,
      planType: defaultPlanType,
      selectedModels: [],
      isExpanded: true 
    });
  };

  const handlePlanTypeChange = (planType: string) => {
    onUpdate({ planType });
    if (config.provider && store.setProviderConfig) {
      store.setProviderConfig(config.provider, { 
        apiKey: config.apiKey, 
        baseUrl: config.baseUrl,
        planType: planType
      });
      // Reload models when plan type changes
      if (store.loadModelsForProvider) {
        store.loadModelsForProvider(config.provider);
      }
    }
  };

  const handleApiKeyChange = (apiKey: string) => {
    onUpdate({ apiKey });
    if (config.provider && apiKey.trim() && store.setProviderConfig) {
      store.setProviderConfig(config.provider, { 
        apiKey, 
        baseUrl: config.baseUrl,
        planType: config.planType
      });
      if (store.loadModelsForProvider) {
        store.loadModelsForProvider(config.provider);
      }
    }
  };

  const handleBaseUrlChange = (baseUrl: string) => {
    onUpdate({ baseUrl });
    if (config.provider && store.setProviderConfig) {
      store.setProviderConfig(config.provider, { 
        apiKey: config.apiKey, 
        baseUrl,
        planType: config.planType
      });
      // Reload models when URL changes
      if (baseUrl.trim() && store.loadModelsForProvider) {
        store.loadModelsForProvider(config.provider);
      }
    }
  };

  const handleTestConnection = async () => {
    if (!config.provider) return;
    
    console.log('🧪 Testing connection for:', config.provider);
    console.log('🔑 API Key:', config.apiKey ? '***' : 'empty');
    console.log('🌐 Base URL:', config.baseUrl);
    
    // Update store with current configuration before testing
    if (providerInfo?.requiresApiKey) {
      if (!config.apiKey.trim()) {
        toast.error('API key is required');
        return;
      }
      console.log('📝 Setting provider config with API key');
      store.setProviderConfig(config.provider, { 
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        planType: config.planType
      });
    } else {
      if (!config.baseUrl.trim()) {
        toast.error('Server URL is required');
        return;
      }
      console.log('📝 Setting provider config with base URL');
      store.setProviderConfig(config.provider, { 
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        planType: config.planType
      });
    }
    
    console.log('🔄 Starting connection test...');
    setIsTesting(true);
    
    try {
      // Add minimum delay to show loading state
      const [success] = await Promise.all([
        store.testProviderConnection(config.provider),
        new Promise(resolve => setTimeout(resolve, 500)) // Minimum 500ms delay
      ]);
      
      console.log('✅ Connection test result:', success);
      setIsTesting(false);
      
      // Show toast notification
      if (success) {
        toast.success(`${providerInfo?.name || config.provider} connected successfully`);
        // Auto-load models after successful connection
        if (store.loadModelsForProvider) {
          console.log('📥 Loading models...');
          store.loadModelsForProvider(config.provider);
        }
      } else {
        const error = storeConfig?.error || 'Connection failed';
        console.log('❌ Connection failed:', error);
        toast.error(`${providerInfo?.name || config.provider}: ${error}`);
      }
    } catch (error) {
      console.log('💥 Connection test threw error:', error);
      setIsTesting(false);
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      toast.error(`${providerInfo?.name || config.provider}: ${errorMessage}`);
    }
  };

  const handleModelToggle = (modelId: string) => {
    const isCurrentlySelected = config.selectedModels.includes(modelId);
    
    if (isCurrentlySelected) {
      // Remove from selected
      const newSelectedModels = config.selectedModels.filter(id => id !== modelId);
      onUpdate({ selectedModels: newSelectedModels });
      
      // Also remove from store
      if (config.provider) {
        const model = availableModels.find((m: any) => m.id === modelId);
        if (model) {
          store.removeSelectedModel(`${config.provider}:${modelId}`);
        }
      }
    } else {
      // Add to selected and move to top
      const newSelectedModels = [modelId, ...config.selectedModels];
      onUpdate({ selectedModels: newSelectedModels });
      
      // Also add to store
      if (config.provider) {
        const model = availableModels.find((m: any) => m.id === modelId);
        if (model) {
          store.addSelectedModel(model, config.provider);
        }
      }
    }
  };

  const handleSelectAll = () => {
    const allModelIds = availableModels.map((model: any) => model.id);
    onUpdate({ selectedModels: allModelIds });
    
    // Also add all to store
    if (config.provider) {
      availableModels.forEach((model: any) => {
        store.addSelectedModel(model, config.provider);
      });
    }
  };

  const handleSelectNone = () => {
    onUpdate({ selectedModels: [] });
    
    // Also remove all from store
    if (config.provider) {
      config.selectedModels.forEach(modelId => {
        store.removeSelectedModel(`${config.provider}:${modelId}`);
      });
    }
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
    <div
      className={`transition-all duration-200 ${
        isDragging ? 'opacity-30 scale-95 rotate-2 z-50' : ''
      } ${
        isDragOver && !isDragging && !draggedModel ? 'scale-105 shadow-lg border-primary border-2' : ''
      }`}
      onDragOver={(e) => {
        // Only handle if not dragging a model
        if (!draggedModel) {
          onDragOver(e);
        }
      }}
      onDragEnter={() => {
        // Only handle if not dragging a model
        if (!draggedModel) {
          onDragEnter();
        }
      }}
      onDragLeave={(e) => {
        // Only handle if not dragging a model
        if (!draggedModel) {
          onDragLeave(e);
        }
      }}
      onDrop={(e) => {
        // Only handle if not dragging a model
        if (!draggedModel) {
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
              {config.provider && storeConfig && (
                <>
                  {storeConfig.isConnected ? (
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-3 w-3 text-green-500" />
                  ) : storeConfig.error ? (
                    <div 
                      className="h-3 w-3 text-red-500 cursor-help" 
                      title={storeConfig.error}
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

      {config.isExpanded && (
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

          {/* Plan Type Selection - For providers with multiple plans */}
          {config.provider && supportsMultiplePlans(config.provider) && (
            <div className="space-y-1">
              <label className="text-xs font-medium">Plan Type</label>
              <Select
                value={config.planType || ''}
                onValueChange={handlePlanTypeChange}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Choose plan type..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(getProviderPlanTypes(config.provider) || {}).map(([planKey, planConfig]) => (
                    <SelectItem key={planKey} value={planKey}>
                      <div className="flex flex-col items-start w-full">
                        <span className="font-medium capitalize">{planKey} Plan</span>
                        <span className="text-xs text-muted-foreground truncate w-full">{planConfig.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {config.planType && (
                <div className="text-xs text-muted-foreground">
                  Using: {getProviderPlanTypes(config.provider)?.[config.planType]?.baseUrl}
                </div>
              )}
            </div>
          )}

          {/* API Key Input */}
          {config.provider && providerInfo?.requiresApiKey && (
            <div className="space-y-1">
              <label className="text-xs font-medium">API Key</label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Enter your API key..."
                  value={config.apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  className="flex-1 h-8"
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

          {/* Server URL Input for Local Providers */}
          {config.provider && !providerInfo?.requiresApiKey && (
            <div className="space-y-1">
              <label className="text-xs font-medium">Server URL</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder={`Enter server URL (e.g., ${config.provider === 'ollama' ? 'http://localhost:11434' : 'http://127.0.0.1:1234'})`}
                  value={config.baseUrl}
                  onChange={(e) => handleBaseUrlChange(e.target.value)}
                  className="flex-1 h-8"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTesting || !config.baseUrl.trim()}
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
          {config.provider && (
            (providerInfo?.requiresApiKey && config.apiKey.trim()) || 
            (!providerInfo?.requiresApiKey && config.baseUrl.trim())
          ) && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">Models</label>
                {availableModels.length > 0 && (
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
              
              {isLoadingModels ? (
                <div className="space-y-1">
                  {[1, 2].map(i => (
                    <div key={i} className="h-8 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : availableModels.length === 0 ? (
                <div className="p-2 text-center border rounded text-xs">
                  {storeConfig?.error ? (
                    <div className="text-red-500">
                      <div className="font-medium">Failed to load models</div>
                      <div className="text-xs mt-1 text-muted-foreground">{storeConfig.error}</div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">No models available</div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Selected Models - Top Section with Drag & Drop */}
                  {config.selectedModels.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground font-medium">Selected ({config.selectedModels.length})</div>
                      <div 
                        className="space-y-1 max-h-48 overflow-y-auto bg-muted/30 rounded p-3"
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        {config.selectedModels.map((modelId, index) => {
                          const model = availableModels.find((m: any) => m.id === modelId);
                          if (!model) return null;
                          
                          const isModelDragging = draggedModel === modelId;
                          const isModelDragOver = dragOverModel === modelId;
                          
                          return (
                            <div 
                              key={modelId} 
                              className={`flex items-center gap-2 p-3 bg-background border rounded text-xs transition-all duration-200 ${
                                isModelDragging ? 'opacity-30 scale-95 rotate-1 z-50' : 
                                isModelDragOver ? 'scale-105 border-primary border-2' : 'hover:bg-muted/50 cursor-move'
                              }`}
                              draggable={true}
                              onDragStart={(e) => {
                                e.stopPropagation();
                                setDraggedModel(modelId);
                                e.dataTransfer.setData('text/plain', modelId);
                                e.dataTransfer.effectAllowed = 'move';
                              }}
                              onDragEnd={(e) => {
                                e.stopPropagation();
                                setDraggedModel(null);
                                setDragOverModel(null);
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                e.dataTransfer.dropEffect = 'move';
                              }}
                              onDragEnter={(e) => {
                                e.stopPropagation();
                                if (draggedModel && draggedModel !== modelId) {
                                  setDragOverModel(modelId);
                                }
                              }}
                              onDragLeave={(e) => {
                                e.stopPropagation();
                                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                  setDragOverModel(null);
                                }
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDragOverModel(null);
                                
                                const draggedModelId = e.dataTransfer.getData('text/plain');
                                if (draggedModelId !== modelId) {
                                  const draggedIndex = config.selectedModels.indexOf(draggedModelId);
                                  const targetIndex = config.selectedModels.indexOf(modelId);
                                  
                                  const newSelectedModels = [...config.selectedModels];
                                  const [draggedModel] = newSelectedModels.splice(draggedIndex, 1);
                                  newSelectedModels.splice(targetIndex, 0, draggedModel);
                                  
                                  onUpdate({ selectedModels: newSelectedModels });
                                }
                              }}
                            >
                              <div className="cursor-move text-muted-foreground">
                                <HugeiconsIcon icon={DragDropVerticalIcon} className="h-3 w-3" />
                              </div>
                              <Checkbox
                                checked={true}
                                onCheckedChange={(checked) => {
                                  if (!checked) handleModelToggle(modelId);
                                }}
                                onClick={(e) => e.stopPropagation()}
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
                      Available ({availableModels.filter((m: any) => !config.selectedModels.includes(m.id)).length})
                    </div>
                    <div 
                      className="space-y-1 max-h-40 overflow-y-auto"
                      onDragStart={(e) => e.stopPropagation()}
                      onDragOver={(e) => e.stopPropagation()}
                      onDragEnter={(e) => e.stopPropagation()}
                      onDragLeave={(e) => e.stopPropagation()}
                      onDrop={(e) => e.stopPropagation()}
                    >
                      {availableModels
                        .filter((model: any) => !config.selectedModels.includes(model.id))
                        .map((model: any) => (
                          <div 
                            key={model.id} 
                            className="flex items-center gap-2 p-3 border rounded text-xs hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleModelToggle(model.id);
                            }}
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
          
          {/* Save & Collapse Button - Inside Stack */}
          {config.isExpanded && (
            <div className="pt-2 border-t">
              <Button size="sm" variant="outline" onClick={onSaveAndCollapse} className="w-full">
                <HugeiconsIcon icon={Save} className="h-3 w-3 mr-1" />
                Save
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
    </div>
  );
}