/**
 * Browser Automation Settings Component
 * 
 * Provides UI for configuring browser automation backend:
 * - Built-in CDP Engine (default)
 * - Browser-Use Cloud SDK
 * - Browser-Use Native Backend
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Rocket01Icon,
  AiCloud01Icon,
  SourceCodeIcon,
  CheckmarkCircle02Icon,
  Alert02Icon,
  InformationCircleIcon,
  Download01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon
} from '@hugeicons/core-free-icons';
import { BrowserUseClient } from '@/lib/browser-use-client';
import { NativeHostClient } from '@/lib/native-host-client';

export interface BrowserAutomationSettings {
  backend: 'builtin' | 'browser-use-cloud' | 'browser-use-native';
  browserUseApiKey?: string;
  pythonPath?: string;
  browserUsePath?: string;
  autoInstall?: boolean;
  humanLikeDelays: boolean;
  stealthMode: boolean;
  screenshotAnnotations: boolean;
  maxScreenshotWidth: number;
  maxScreenshotHeight: number;
}

interface BrowserAutomationSettingsProps {
  settings: BrowserAutomationSettings;
  onSettingsChange: (settings: BrowserAutomationSettings) => void;
}

export function BrowserAutomationSettings({ settings, onSettingsChange }: BrowserAutomationSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [cloudStatus, setCloudStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [nativeStatus, setNativeStatus] = useState<'idle' | 'checking' | 'connected' | 'not-installed' | 'error'>('idle');
  const [cloudError, setCloudError] = useState<string>('');
  const [nativeError, setNativeError] = useState<string>('');
  const [nativeDetails, setNativeDetails] = useState<any>(null);

  // Test Browser-Use Cloud connection
  const testCloudConnection = async () => {
    if (!settings.browserUseApiKey) {
      setCloudError('API key is required');
      setCloudStatus('error');
      return;
    }

    setCloudStatus('testing');
    setCloudError('');

    try {
      const client = new BrowserUseClient({ apiKey: settings.browserUseApiKey });
      const isValid = await client.validateApiKey();

      if (isValid) {
        setCloudStatus('success');
      } else {
        setCloudStatus('error');
        setCloudError('Invalid API key');
      }
    } catch (error) {
      setCloudStatus('error');
      setCloudError(error instanceof Error ? error.message : 'Connection failed');
    }
  };

  // Check native host status
  const checkNativeStatus = async () => {
    setNativeStatus('checking');
    setNativeError('');

    try {
      const client = new NativeHostClient({
        hostName: 'com.sidepilot.browseruse',
        pythonPath: settings.pythonPath
      });

      const result = await client.testConnection();

      if (result.success) {
        setNativeStatus('connected');
        setNativeDetails(result.details);
      } else {
        if (result.error?.includes('not installed')) {
          setNativeStatus('not-installed');
        } else {
          setNativeStatus('error');
        }
        setNativeError(result.error || 'Connection failed');
        setNativeDetails(result.details);
      }
    } catch (error) {
      setNativeStatus('error');
      setNativeError(error instanceof Error ? error.message : 'Connection failed');
    }
  };

  // Install browser-use native
  const installNative = async () => {
    try {
      const client = new NativeHostClient({
        hostName: 'com.sidepilot.browseruse',
        pythonPath: settings.pythonPath
      });

      const success = await client.installBrowserUse();

      if (success) {
        await checkNativeStatus();
      } else {
        setNativeError('Installation failed');
      }
    } catch (error) {
      setNativeError(error instanceof Error ? error.message : 'Installation failed');
    }
  };

  // Download setup script
  const downloadSetupScript = () => {
    const platform = navigator.platform.toLowerCase();
    let scriptPlatform: 'windows' | 'macos' | 'linux';

    if (platform.includes('win')) {
      scriptPlatform = 'windows';
    } else if (platform.includes('mac')) {
      scriptPlatform = 'macos';
    } else {
      scriptPlatform = 'linux';
    }

    const script = NativeHostClient.createInstallScript(scriptPlatform);
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `sidepilot-install.${scriptPlatform === 'windows' ? 'bat' : 'sh'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Update settings
  const updateSettings = (updates: Partial<BrowserAutomationSettings>) => {
    onSettingsChange({ ...settings, ...updates });
  };

  // Check native status on mount
  useEffect(() => {
    if (settings.backend === 'browser-use-native') {
      checkNativeStatus();
    }
  }, [settings.backend]);

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="space-y-4">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-medium">Browser Automation</h3>
            <p className="text-sm text-muted-foreground">
              {settings.backend === 'builtin' && 'Built-in CDP Engine'}
              {settings.backend === 'browser-use-cloud' && 'Cloud-Powered Automation'}
              {settings.backend === 'browser-use-native' && 'Local Python Backend'}
            </p>
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
          {/* Backend Selection */}
          <div className="space-y-3">
            {/* Built-in CDP Engine */}
            <Card className={settings.backend === 'builtin' ? 'ring-2 ring-primary' : ''}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={Rocket01Icon} className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm">Built-in CDP</CardTitle>
                    <Badge variant="secondary" className="text-xs">Recommended</Badge>
                  </div>
                  <Button
                    variant={settings.backend === 'builtin' ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => updateSettings({ backend: 'builtin' })}
                  >
                    {settings.backend === 'builtin' ? 'Active' : 'Select'}
                  </Button>
                </div>
                <CardDescription className="text-xs mt-1">
                  Chrome DevTools Protocol - No setup required
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Browser-Use Cloud SDK */}
            <Card className={settings.backend === 'browser-use-cloud' ? 'ring-2 ring-primary' : ''}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={AiCloud01Icon} className="h-4 w-4 text-blue-500" />
                    <CardTitle className="text-sm">Cloud SDK</CardTitle>
                  </div>
                  <Button
                    variant={settings.backend === 'browser-use-cloud' ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => updateSettings({ backend: 'browser-use-cloud' })}
                  >
                    {settings.backend === 'browser-use-cloud' ? 'Active' : 'Select'}
                  </Button>
                </div>
                <CardDescription className="text-xs mt-1">
                  Advanced stealth browsers via{' '}
                  <a
                    href="https://browser-use.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    browser-use.com ↗
                  </a>
                </CardDescription>
              </CardHeader>
              {settings.backend === 'browser-use-cloud' && (
                <CardContent className="pt-0 space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="cloud-api-key" className="text-xs">API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="cloud-api-key"
                        type="password"
                        placeholder="Enter API key"
                        className="h-8 text-xs"
                        value={settings.browserUseApiKey || ''}
                        onChange={(e) => updateSettings({ browserUseApiKey: e.target.value })}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={testCloudConnection}
                        disabled={cloudStatus === 'testing' || !settings.browserUseApiKey}
                      >
                        {cloudStatus === 'testing' ? 'Testing...' : 'Test'}
                      </Button>
                    </div>
                  </div>

                  {cloudStatus === 'success' && (
                    <Alert className="py-2">
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-3 w-3" />
                      <AlertDescription className="text-xs">Connection successful</AlertDescription>
                    </Alert>
                  )}

                  {cloudStatus === 'error' && (
                    <Alert variant="destructive" className="py-2">
                      <HugeiconsIcon icon={Alert02Icon} className="h-3 w-3" />
                      <AlertDescription className="text-xs">{cloudError}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Browser-Use Native Backend */}
            <Card className={settings.backend === 'browser-use-native' ? 'ring-2 ring-primary' : ''}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={SourceCodeIcon} className="h-4 w-4 text-purple-500" />
                    <CardTitle className="text-sm">Native Python</CardTitle>
                  </div>
                  <Button
                    variant={settings.backend === 'browser-use-native' ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => updateSettings({ backend: 'browser-use-native' })}
                  >
                    {settings.backend === 'browser-use-native' ? 'Active' : 'Select'}
                  </Button>
                </div>
                <CardDescription className="text-xs mt-1">
                  Full browser-use Python library locally
                </CardDescription>
              </CardHeader>
              {settings.backend === 'browser-use-native' && (
                <CardContent className="pt-0 space-y-3">
                  {/* Status Display */}
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Status</Label>
                    <div className="flex items-center gap-2">
                      {nativeStatus === 'connected' && (
                        <Badge variant="default" className="bg-green-500 text-xs h-5">
                          <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                      {nativeStatus === 'not-installed' && (
                        <Badge variant="destructive" className="text-xs h-5">
                          <HugeiconsIcon icon={Alert02Icon} className="h-3 w-3 mr-1" />
                          Setup Required
                        </Badge>
                      )}
                      {nativeStatus === 'error' && (
                        <Badge variant="destructive" className="text-xs h-5">
                          <HugeiconsIcon icon={Alert02Icon} className="h-3 w-3 mr-1" />
                          Error
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={checkNativeStatus}
                        disabled={nativeStatus === 'checking'}
                      >
                        {nativeStatus === 'checking' ? 'Checking...' : 'Check'}
                      </Button>
                    </div>
                  </div>

                  {/* Connection Details */}
                  {nativeDetails && (
                    <div className="text-xs space-y-1 text-muted-foreground">
                      <div>Python: {nativeDetails.pythonPath} (v{nativeDetails.version})</div>
                      {nativeDetails.browserUseVersion && (
                        <div>browser-use: v{nativeDetails.browserUseVersion}</div>
                      )}
                    </div>
                  )}

                  {/* Setup Actions */}
                  {nativeStatus === 'not-installed' && (
                    <div className="space-y-2">
                      <Alert className="py-2">
                        <HugeiconsIcon icon={InformationCircleIcon} className="h-3 w-3" />
                        <AlertDescription className="text-xs">
                          Python 3.11+ and browser-use required
                        </AlertDescription>
                      </Alert>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs flex-1"
                          onClick={() => window.open('https://docs.browser-use.com/quickstart', '_blank')}
                        >
                          Setup Guide ↗
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs flex-1"
                          onClick={downloadSetupScript}
                        >
                          <HugeiconsIcon icon={Download01Icon} className="h-3 w-3 mr-1" />
                          Script
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Error Display */}
                  {nativeStatus === 'error' && nativeError && (
                    <Alert variant="destructive" className="py-2">
                      <HugeiconsIcon icon={Alert02Icon} className="h-3 w-3" />
                      <AlertDescription className="text-xs">{nativeError}</AlertDescription>
                    </Alert>
                  )}

                  {/* Python Path Configuration */}
                  <div className="space-y-2">
                    <Label htmlFor="python-path" className="text-xs">Python Path (optional)</Label>
                    <Input
                      id="python-path"
                      placeholder="/usr/bin/python3"
                      className="h-8 text-xs"
                      value={settings.pythonPath || ''}
                      onChange={(e) => updateSettings({ pythonPath: e.target.value })}
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Behavior Settings */}
          <Separator />
          
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Behavior Settings</h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="human-delays" className="text-xs">Human-like delays</Label>
                <Switch
                  id="human-delays"
                  checked={settings.humanLikeDelays}
                  onCheckedChange={(checked: boolean) => updateSettings({ humanLikeDelays: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="stealth-mode" className="text-xs">Stealth mode</Label>
                <Switch
                  id="stealth-mode"
                  checked={settings.stealthMode}
                  onCheckedChange={(checked: boolean) => updateSettings({ stealthMode: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="screenshot-annotations" className="text-xs">Screenshot annotations</Label>
                <Switch
                  id="screenshot-annotations"
                  checked={settings.screenshotAnnotations}
                  onCheckedChange={(checked: boolean) => updateSettings({ screenshotAnnotations: checked })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="max-width" className="text-xs">Max width</Label>
                <Input
                  id="max-width"
                  type="number"
                  className="h-8 text-xs"
                  value={settings.maxScreenshotWidth}
                  onChange={(e) => updateSettings({ maxScreenshotWidth: parseInt(e.target.value) || 1920 })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="max-height" className="text-xs">Max height</Label>
                <Input
                  id="max-height"
                  type="number"
                  className="h-8 text-xs"
                  value={settings.maxScreenshotHeight}
                  onChange={(e) => updateSettings({ maxScreenshotHeight: parseInt(e.target.value) || 1080 })}
                />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}