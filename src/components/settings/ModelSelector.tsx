/**
 * Model Selector Component
 * 
 * Dropdown for selecting models filtered by the current provider.
 * Shows model names, context windows, and capabilities.
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ModelInfo } from '@/providers/types';

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  models: ModelInfo[];
  disabled?: boolean;
  isLoading?: boolean;
}

export function ModelSelector({ value, onChange, models, disabled, isLoading }: ModelSelectorProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Model
        </label>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading models...
        </div>
      </div>
    );
  }
  
  if (models.length === 0) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Model
        </label>
        <div className="text-sm text-muted-foreground">
          No models available for this provider
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        Model
      </label>
      
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              <div className="flex flex-col w-full min-w-0">
                <span className="font-medium truncate">{model.name}</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="shrink-0">{(model.capabilities.contextWindow / 1000).toFixed(0)}K context</span>
                  {model.pricing && (
                    <span className="truncate">
                      ${model.pricing.inputPer1M.toFixed(2)}/${model.pricing.outputPer1M.toFixed(2)} per 1M
                    </span>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* Selected model info */}
      {value && (
        <div className="text-xs text-muted-foreground space-y-1">
          {(() => {
            const selectedModel = models.find(m => m.id === value);
            if (!selectedModel) return null;
            
            return (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span>Context:</span>
                  <span>{(selectedModel.capabilities.contextWindow / 1000).toFixed(0)}K tokens</span>
                </div>
                {selectedModel.pricing && (
                  <div className="flex justify-between items-center">
                    <span>Pricing:</span>
                    <span className="text-right">
                      ${selectedModel.pricing.inputPer1M.toFixed(2)} / ${selectedModel.pricing.outputPer1M.toFixed(2)} per 1M
                    </span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}