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
}

export function ModelSelector({ value, onChange, models, disabled }: ModelSelectorProps) {
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
              <div className="flex flex-col">
                <span className="font-medium">{model.name}</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{(model.capabilities.contextWindow / 1000).toFixed(0)}K context</span>
                  {model.pricing && (
                    <span>
                      ${model.pricing.inputPer1M.toFixed(2)}/${model.pricing.outputPer1M.toFixed(2)} per 1M tokens
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
        <div className="text-xs text-muted-foreground">
          {(() => {
            const selectedModel = models.find(m => m.id === value);
            if (!selectedModel) return null;
            
            return (
              <div className="space-y-1">
                <div>Context: {(selectedModel.capabilities.contextWindow / 1000).toFixed(0)}K tokens</div>
                {selectedModel.pricing && (
                  <div>
                    Input: ${selectedModel.pricing.inputPer1M.toFixed(2)}/1M • 
                    Output: ${selectedModel.pricing.outputPer1M.toFixed(2)}/1M tokens
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