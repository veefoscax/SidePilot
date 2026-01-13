/**
 * Model Selector Dropdown for Chat Header
 * 
 * Compact dropdown that allows switching between selected models mid-conversation.
 * Shows current model with provider badge and allows quick model switching.
 */

import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMultiProviderStore } from '@/stores/multi-provider';
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  WifiIcon,
  WifiOffIcon 
} from '@hugeicons/core-free-icons';

interface ModelSelectorDropdownProps {
  className?: string;
}

export function ModelSelectorDropdown({ className }: ModelSelectorDropdownProps) {
  const { 
    selectedModels, 
    currentModel, 
    setCurrentModel,
    getCurrentProvider 
  } = useMultiProviderStore();

  const currentProvider = getCurrentProvider();
  
  // If no models are selected, show a message
  if (selectedModels.length === 0) {
    return (
      <div className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}>
        <HugeiconsIcon icon={WifiOffIcon} className="h-3 w-3" />
        <span>No models selected</span>
      </div>
    );
  }

  // If only one model is selected, show it as a badge without dropdown
  if (selectedModels.length === 1) {
    const model = selectedModels[0];
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <HugeiconsIcon 
          icon={currentProvider ? WifiIcon : WifiOffIcon} 
          className="h-3 w-3 text-muted-foreground" 
        />
        <Badge variant="secondary" className="text-xs">
          {model.provider}
        </Badge>
        <span className="text-xs text-muted-foreground truncate max-w-32">
          {model.name}
        </span>
      </div>
    );
  }

  // Multiple models available - show dropdown
  const handleModelChange = (fullId: string) => {
    setCurrentModel(fullId);
  };

  const getCurrentModelDisplay = () => {
    if (!currentModel) return "Select model";
    
    const model = selectedModels.find(m => m.fullId === currentModel);
    if (!model) return "Select model";
    
    return (
      <div className="flex items-center gap-2 min-w-0">
        <Badge variant="secondary" className="text-xs shrink-0">
          {model.provider}
        </Badge>
        <span className="text-xs truncate">
          {model.name}
        </span>
      </div>
    );
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <HugeiconsIcon 
        icon={currentProvider ? WifiIcon : WifiOffIcon} 
        className="h-3 w-3 text-muted-foreground shrink-0" 
      />
      
      <Select value={currentModel || ""} onValueChange={handleModelChange}>
        <SelectTrigger className="h-7 min-w-0 border-none bg-transparent p-1 text-xs hover:bg-muted/50">
          <SelectValue>
            {getCurrentModelDisplay()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {selectedModels.map((model) => (
            <SelectItem key={model.fullId} value={model.fullId}>
              <div className="flex items-center gap-2 min-w-0">
                <Badge variant="outline" className="text-xs shrink-0">
                  {model.provider}
                </Badge>
                <span className="truncate">{model.name}</span>
                {model.capabilities.supportsVision && (
                  <span className="text-xs text-muted-foreground">👁️</span>
                )}
                {model.capabilities.supportsTools && (
                  <span className="text-xs text-muted-foreground">🔧</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}