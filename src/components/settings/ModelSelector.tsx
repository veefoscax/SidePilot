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
        {/* Skeleton loading effect */}
        <div className="relative">
          <div className="w-full h-10 bg-muted rounded-md border animate-pulse" />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <div className="w-4 h-4 bg-muted-foreground/30 rounded animate-pulse" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
          <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
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
              <span className="font-medium">{model.name}</span>
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
                <div className="flex items-center justify-between gap-2">
                  <span className="shrink-0">Model:</span>
                  <span className="text-right truncate min-w-0 flex-1">{selectedModel.name}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="shrink-0">Context:</span>
                  <span className="text-right">{(selectedModel.capabilities.contextWindow / 1000).toFixed(0)}K tokens</span>
                </div>
                {selectedModel.pricing && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="shrink-0">Pricing:</span>
                    <span className="text-right truncate min-w-0 flex-1">
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