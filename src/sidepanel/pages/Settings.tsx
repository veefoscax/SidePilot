/**
 * Settings Page Component
 * 
 * Advanced multi-provider settings interface for configuring multiple LLM providers
 * and managing a unified collection of models from all providers.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';

import { MultiProviderManager } from '@/components/settings/MultiProviderManager';
import {
  BrowserAutomationSettings as BrowserAutomationSettingsComponent,
  type BrowserAutomationSettings as BrowserAutomationSettingsConfig
} from '@/components/settings/BrowserAutomationSettings';
import { PermissionsManager } from '@/components/settings/PermissionsManager';

interface SettingsPageProps {
  onBack?: () => void;
}

const DEFAULT_BROWSER_SETTINGS: BrowserAutomationSettingsConfig = {
  backend: 'builtin',
  humanLikeDelays: true,
  stealthMode: false,
  screenshotAnnotations: true,
  maxScreenshotWidth: 1920,
  maxScreenshotHeight: 1080,
};

export function SettingsPage({ onBack }: SettingsPageProps) {
  const [browserSettings, setBrowserSettings] = useState<BrowserAutomationSettingsConfig>(DEFAULT_BROWSER_SETTINGS);

  // Load settings from Chrome storage on mount
  useEffect(() => {
    chrome.storage.local.get(['browserAutomationSettings'], (result) => {
      if (result.browserAutomationSettings) {
        setBrowserSettings({ ...DEFAULT_BROWSER_SETTINGS, ...result.browserAutomationSettings });
      }
    });
  }, []);

  // Save settings to Chrome storage when they change
  const handleSettingsChange = (newSettings: BrowserAutomationSettingsConfig) => {
    setBrowserSettings(newSettings);
    chrome.storage.local.set({ browserAutomationSettings: newSettings });
  };

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

      <div className="p-4 space-y-6">
        <MultiProviderManager />
        <BrowserAutomationSettingsComponent
          settings={browserSettings}
          onSettingsChange={handleSettingsChange}
        />
        <PermissionsManager />
      </div>
    </div>
  );
}