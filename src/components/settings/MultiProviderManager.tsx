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
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [draggedModel, setDraggedModel] = useState<string | null>(null);
  const [dragOverModel, setDragOverModel] = useState<string | null>(null);
  
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
                onSaveAndCollapse={() => updateProviderConfig(config.id, { isExpanded: false })}
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
    const isCurrentlySelected = config.selectedModels.includes(modelId);
    
    if (isCurrentlySelected) {
      // Remove from selected
      const newSelectedModels = config.selectedModels.filter(id => id !== modelId);
      onUpdate({ selectedModels: newSelectedModels });
    } else {
      // Add to selected and move to top
      const newSelectedModels = [modelId, ...config.selectedModels];
      onUpdate({ selectedModels: newSelectedModels });
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
      onDragEnter={(e) => {
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
                    <HugeiconsIcon icon={Cancel01Icon} className="h-3 w-3 text-red-500" />
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