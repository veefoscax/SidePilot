/**
 * Model Selector Component
 * 
 * Multi-select interface for choosing models from the current provider.
 * Shows model names with checkboxes and displays selected models with capabilities.
 */

import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ModelInfo } from '@/providers/types';

interface ModelSelectorProps {
  selectedModels: string[];
  onToggleModel: (modelId: string) => void;
  models: ModelInfo[];
  disabled?: boolean;
  isLoading?: boolean;
}

export function ModelSelector({ selectedModels, onToggleModel, models, disabled, isLoading }: ModelSelectorProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {t('providers.models')}
        </label>
        {/* Skeleton loading effect */}
        <div className="space-y-2">
          <div className="h-10 bg-muted rounded-md border animate-pulse" />
          <div className="h-10 bg-muted rounded-md border animate-pulse" />
          <div className="h-10 bg-muted rounded-md border animate-pulse" />
        </div>
      </div>
    );
  }
  
  if (models.length === 0 && !isLoading) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {t('providers.models')}
        </label>
        <div className="text-sm text-muted-foreground">
          {t('providers.addApiKeyToSeeModels')}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">
        {t('providers.modelsSelected', { count: selectedModels.length })}
      </label>
      
      {/* Model list with checkboxes */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {models.map((model) => (
          <Card key={model.id} className="p-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id={model.id}
                checked={selectedModels.includes(model.id)}
                onCheckedChange={() => onToggleModel(model.id)}
                disabled={disabled}
              />
              <div className="flex-1 min-w-0">
                <label 
                  htmlFor={model.id}
                  className="text-sm font-medium cursor-pointer"
                >
                  {model.name}
                </label>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{(model.capabilities.contextWindow / 1000).toFixed(0)}K {t('providers.context')}</span>
                  {model.pricing && (
                    <span>
                      ${model.pricing.inputPer1M.toFixed(2)}/${model.pricing.outputPer1M.toFixed(2)} {t('providers.per1M')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Selected models summary */}
      {selectedModels.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">{t('providers.selectedModels')}:</div>
          <div className="flex flex-wrap gap-1">
            {selectedModels.map((modelId) => {
              const model = models.find(m => m.id === modelId);
              return model ? (
                <Badge key={modelId} variant="secondary" className="text-xs">
                  {model.name}
                </Badge>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}