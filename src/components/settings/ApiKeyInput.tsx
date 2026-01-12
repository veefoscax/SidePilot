/**
 * API Key Input Component
 * 
 * Secure password input with reveal toggle, clear button, and validation.
 * Handles provider-specific requirements (some providers don't need API keys).
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { ViewIcon, ViewOffSlashIcon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { ProviderType } from '@/providers/types';
import { getProviderInfo } from '@/providers/factory';

interface ApiKeyInputProps {
  value: string;
  onChange: (value: string) => void;
  provider: ProviderType;
  disabled?: boolean;
}

export function ApiKeyInput({ value, onChange, provider, disabled }: ApiKeyInputProps) {
  const [showKey, setShowKey] = useState(false);
  const providerInfo = getProviderInfo(provider);
  
  // Some providers (like Ollama) don't require API keys
  if (!providerInfo.requiresApiKey) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          API Key
        </label>
        <div className="text-sm text-muted-foreground">
          No API key required for {providerInfo.name}
        </div>
      </div>
    );
  }
  
  const isValid = value.length > 0;
  const placeholder = `Enter your ${providerInfo.name} API key`;
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        API Key
        <span className="text-red-500 ml-1">*</span>
      </label>
      
      <div className="relative">
        <Input
          type={showKey ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`pr-20 ${!isValid && value.length > 0 ? 'border-red-500' : ''}`}
        />
        
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
          {/* Clear button */}
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => onChange('')}
              disabled={disabled}
            >
              <HugeiconsIcon icon={Cancel01Icon} className="h-3 w-3" />
            </Button>
          )}
          
          {/* Show/hide toggle */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setShowKey(!showKey)}
            disabled={disabled || !value}
          >
            <HugeiconsIcon 
              icon={showKey ? ViewOffSlashIcon : ViewIcon} 
              className="h-3 w-3" 
            />
          </Button>
        </div>
      </div>
      
      {/* Validation feedback */}
      {!isValid && value.length > 0 && (
        <div className="text-xs text-red-500">
          API key is required for {providerInfo.name}
        </div>
      )}
      
      {/* Help text */}
      <div className="text-xs text-muted-foreground">
        Get your API key from{' '}
        <a 
          href={providerInfo.website} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {providerInfo.website}
        </a>
      </div>
    </div>
  );
}