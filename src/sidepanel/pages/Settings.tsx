/**
 * Settings Page Component
 * 
 * Advanced multi-provider settings interface for configuring multiple LLM providers
 * and managing a unified collection of models from all providers.
 */

import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';

import { MultiProviderManager } from '@/components/settings/MultiProviderManager';

interface SettingsPageProps {
  onBack?: () => void;
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex items-center gap-3 p-4">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-lg font-semibold">SidePilot Settings</h1>
            <p className="text-sm text-muted-foreground">
              Configure multiple LLM providers and manage your model collection
            </p>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <MultiProviderManager />
      </div>
    </div>
  );
}