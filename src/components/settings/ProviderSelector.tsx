/**
 * Provider Selector Component
 * 
 * Dropdown for selecting LLM providers with categorization and provider information.
 * Supports 40+ providers organized by tiers (Core, Popular, Extended, etc.)
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProviderType } from '@/providers/types';
import { getProviderCategories, getProviderInfo } from '@/providers/factory';

interface ProviderSelectorProps {
  value: ProviderType;
  onChange: (provider: ProviderType) => void;
  disabled?: boolean;
}

export function ProviderSelector({ value, onChange, disabled }: ProviderSelectorProps) {
  const categories = getProviderCategories();
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        LLM Provider
      </label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a provider" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(categories).map(([categoryName, providers]) => (
            <div key={categoryName}>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {categoryName}
              </div>
              {providers.map((providerType) => {
                const info = getProviderInfo(providerType);
                return (
                  <SelectItem key={providerType} value={providerType}>
                    <div className="flex flex-col w-full min-w-0">
                      <span className="font-medium truncate">{info.name}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {info.description}
                      </span>
                    </div>
                  </SelectItem>
                );
              })}
            </div>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}