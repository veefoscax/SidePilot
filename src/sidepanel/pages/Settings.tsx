/**
 * Settings Page Component
 * 
 * Advanced multi-provider settings interface for configuring multiple LLM providers
 * and managing a unified collection of models from all providers.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Notification01Icon,
  CheckmarkCircle02Icon,
  Alert02Icon,
  VolumeHighIcon
} from '@hugeicons/core-free-icons';

import { MultiProviderManager } from '@/components/settings/MultiProviderManager';
import {
  BrowserAutomationSettings as BrowserAutomationSettingsComponent,
  type BrowserAutomationSettings as BrowserAutomationSettingsConfig
} from '@/components/settings/BrowserAutomationSettings';
import { PermissionsManager } from '@/components/settings/PermissionsManager';
import { MCPSettings } from '@/components/settings/MCPSettings';
import { notifications, type NotificationConfig } from '@/lib/notifications';

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

/**
 * Default notification configuration
 */
const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  enabled: true,
  soundEnabled: false,
  types: {
    taskComplete: true,
    permissionRequired: true,
    error: true
  }
};

/**
 * NotificationSettings Component
 * 
 * Provides UI for configuring notification preferences:
 * - Master enable/disable toggle
 * - Individual toggles per notification type
 * - Sound toggle
 * - Test notification button
 * 
 * Requirements: AC4
 */
function NotificationSettings() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [config, setConfig] = useState<NotificationConfig>(DEFAULT_NOTIFICATION_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [testStatus, setTestStatus] = useState<'idle' | 'sent' | 'error'>('idle');

  // Load notification config on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        await notifications.loadConfig();
        setConfig(notifications.getConfig());
      } catch (error) {
        console.error('[NotificationSettings] Failed to load config:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadConfig();
  }, []);

  // Update config and persist
  const updateConfig = async (updates: Partial<NotificationConfig>) => {
    try {
      await notifications.updateConfig(updates);
      setConfig(notifications.getConfig());
    } catch (error) {
      console.error('[NotificationSettings] Failed to update config:', error);
    }
  };

  // Update individual notification type
  const updateNotificationType = async (type: keyof NotificationConfig['types'], enabled: boolean) => {
    await updateConfig({
      types: {
        ...config.types,
        [type]: enabled
      }
    });
  };

  // Test notification
  const handleTestNotification = async () => {
    try {
      setTestStatus('sent');
      await notifications.notifyTaskComplete('Test Task');
      // Reset status after 2 seconds
      setTimeout(() => setTestStatus('idle'), 2000);
    } catch (error) {
      console.error('[NotificationSettings] Test notification failed:', error);
      setTestStatus('error');
      setTimeout(() => setTestStatus('idle'), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-medium">Notifications</h3>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="space-y-4">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Notification01Icon} className="h-4 w-4 text-primary" />
            <div>
              <h3 className="text-base font-medium">Notifications</h3>
              <p className="text-sm text-muted-foreground">
                {config.enabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              <HugeiconsIcon
                icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon}
                className="h-4 w-4"
              />
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="space-y-4">
          {/* Master Toggle */}
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications-enabled" className="text-sm font-medium">
                    Enable notifications
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Show Chrome notifications for important events
                  </p>
                </div>
                <Switch
                  id="notifications-enabled"
                  checked={config.enabled}
                  onCheckedChange={(checked: boolean) => updateConfig({ enabled: checked })}
                />
              </div>

              <Separator />

              {/* Individual Type Toggles */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Notification Types</h4>
                
                <div className="space-y-3">
                  {/* Task Complete */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-4 w-4 text-green-500" />
                      <Label htmlFor="notify-task-complete" className="text-xs">
                        Task complete
                      </Label>
                    </div>
                    <Switch
                      id="notify-task-complete"
                      checked={config.types.taskComplete}
                      onCheckedChange={(checked: boolean) => updateNotificationType('taskComplete', checked)}
                      disabled={!config.enabled}
                    />
                  </div>

                  {/* Permission Required */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={Alert02Icon} className="h-4 w-4 text-yellow-500" />
                      <Label htmlFor="notify-permission" className="text-xs">
                        Permission required
                      </Label>
                    </div>
                    <Switch
                      id="notify-permission"
                      checked={config.types.permissionRequired}
                      onCheckedChange={(checked: boolean) => updateNotificationType('permissionRequired', checked)}
                      disabled={!config.enabled}
                    />
                  </div>

                  {/* Error */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={Alert02Icon} className="h-4 w-4 text-red-500" />
                      <Label htmlFor="notify-error" className="text-xs">
                        Errors
                      </Label>
                    </div>
                    <Switch
                      id="notify-error"
                      checked={config.types.error}
                      onCheckedChange={(checked: boolean) => updateNotificationType('error', checked)}
                      disabled={!config.enabled}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Sound Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={VolumeHighIcon} className="h-4 w-4 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <Label htmlFor="sound-enabled" className="text-xs">
                      Sound
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Play sound with notifications
                    </p>
                  </div>
                </div>
                <Switch
                  id="sound-enabled"
                  checked={config.soundEnabled}
                  onCheckedChange={(checked: boolean) => updateConfig({ soundEnabled: checked })}
                  disabled={!config.enabled}
                />
              </div>

              <Separator />

              {/* Test Notification Button */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Test Notification</Label>
                  <p className="text-xs text-muted-foreground">
                    Send a test notification to verify settings
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestNotification}
                  disabled={!config.enabled || testStatus === 'sent'}
                >
                  {testStatus === 'sent' ? (
                    <>
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-4 w-4 mr-1 text-green-500" />
                      Sent!
                    </>
                  ) : testStatus === 'error' ? (
                    <>
                      <HugeiconsIcon icon={Alert02Icon} className="h-4 w-4 mr-1 text-red-500" />
                      Failed
                    </>
                  ) : (
                    'Test'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

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
        <MCPSettings />
        <NotificationSettings />
        <PermissionsManager />
      </div>
    </div>
  );
}