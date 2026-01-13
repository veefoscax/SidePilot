/**
 * Browser Automation Settings Component
 * 
 * Provides UI for configuring browser automation backend:
 * - Built-in CDP Engine (default)
 * - Browser-Use Cloud SDK
 * - Browser-Use Native Backend
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RocketIcon, 
  CloudIcon, 
  CodeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InfoIcon,
  DownloadIcon,
  ExternalLinkIcon
} from '@hugeicons/react';
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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Browser Automation Backend</h3>
        <p className="text-sm text-muted-foreground">
          Choose how SidePilot controls the browser for AI automation tasks.
        </p>
      </div>

      {/* Backend Selection */}
      <div className="space-y-4">
        {/* Built-in CDP Engine */}
        <Card className={settings.backend === 'builtin' ? 'ring-2 ring-primary' : ''}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RocketIcon className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Built-in Browser Control</CardTitle>
                <Badge variant="secondary">Recommended</Badge>
              </div>
              <Button
                variant={settings.backend === 'builtin' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateSettings({ backend: 'builtin' })}
              >
                {settings.backend === 'builtin' ? 'Selected' : 'Select'}
              </Button>
            </div>
            <CardDescription>
              Uses Chrome's native DevTools Protocol for direct browser automation. No external services or setup required.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span>Click, type, scroll, navigate</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span>Screenshots with annotations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span>Smart element targeting</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span>Works offline</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span>Human-like interactions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span>Network monitoring</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                  <span>Basic stealth mode</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                  <span>No file system access</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Browser-Use Cloud SDK */}
        <Card className={settings.backend === 'browser-use-cloud' ? 'ring-2 ring-primary' : ''}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CloudIcon className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-base">Cloud-Powered Automation</CardTitle>
              </div>
              <Button
                variant={settings.backend === 'browser-use-cloud' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateSettings({ backend: 'browser-use-cloud' })}
              >
                {settings.backend === 'browser-use-cloud' ? 'Selected' : 'Select'}
              </Button>
            </div>
            <CardDescription>
              Powered by{' '}
              <a 
                href="https://browser-use.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center"
              >
                browser-use.com
                <ExternalLinkIcon className="h-3 w-3 ml-1" />
              </a>
              . Advanced stealth browsers with anti-detection capabilities.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span>Advanced stealth mode</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span>Sandboxed execution</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span>File system access</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span>Persistent sessions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span>Structured output</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span>Streaming responses</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="cloud-api-key">API Key</Label>
                <div className="flex space-x-2">
                  <Input
                    id="cloud-api-key"
                    type="password"
                    placeholder="Enter your browser-use.com API key"
                    value={settings.browserUseApiKey || ''}
                    onChange={(e) => updateSettings({ browserUseApiKey: e.target.value })}
                  />
                  <Button
                    variant="outline"
                    onClick={testCloudConnection}
                    disabled={cloudStatus === 'testing' || !settings.browserUseApiKey}
                  >
                    {cloudStatus === 'testing' ? 'Testing...' : 'Test'}
                  </Button>
                </div>
              </div>

              {cloudStatus === 'success' && (
                <Alert>
                  <CheckCircleIcon className="h-4 w-4" />
                  <AlertDescription>
                    API key is valid and connection successful.
                  </AlertDescription>
                </Alert>
              )}

              {cloudStatus === 'error' && (
                <Alert variant="destructive">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <AlertDescription>
                    {cloudError}
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-sm text-muted-foreground">
                Get your API key from{' '}
                <a 
                  href="https://cloud.browser-use.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  cloud.browser-use.com
                </a>
                . Pricing: ~$0.01-0.10 per task.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Browser-Use Native Backend */}
        <Card className={settings.backend === 'browser-use-native' ? 'ring-2 ring-primary' : ''}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CodeIcon className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-base">Local Python Backend</CardTitle>
              </div>
              <Button
                variant={settings.backend === 'browser-use-native' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateSettings({ backend: 'browser-use-native' })}
              >
                {settings.backend === 'browser-use-native' ? 'Selected' : 'Select'}
              </Button>
            </div>
            <CardDescription>
              Runs the full browser-use Python library on your machine. Maximum power with all features.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span>Full stealth mode</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span>File system access</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span>Custom skills</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span>Headless/headed mode</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span>Browser profiles</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span>Parallel execution</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              {/* Status Display */}
              <div className="flex items-center justify-between">
                <Label>Status</Label>
                <div className="flex items-center space-x-2">
                  {nativeStatus === 'connected' && (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  )}
                  {nativeStatus === 'not-installed' && (
                    <Badge variant="destructive">
                      <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                      Setup Required
                    </Badge>
                  )}
                  {nativeStatus === 'error' && (
                    <Badge variant="destructive">
                      <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                      Error
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={checkNativeStatus}
                    disabled={nativeStatus === 'checking'}
                  >
                    {nativeStatus === 'checking' ? 'Checking...' : 'Check Status'}
                  </Button>
                </div>
              </div>

              {/* Connection Details */}
              {nativeDetails && (
                <div className="text-sm space-y-1">
                  <div>Python: {nativeDetails.pythonPath} (v{nativeDetails.version})</div>
                  {nativeDetails.browserUseVersion && (
                    <div>browser-use: v{nativeDetails.browserUseVersion}</div>
                  )}
                </div>
              )}

              {/* Setup Actions */}
              {nativeStatus === 'not-installed' && (
                <div className="space-y-3">
                  <Alert>
                    <InfoIcon className="h-4 w-4" />
                    <AlertDescription>
                      Python 3.11+ and browser-use library required. Choose setup method:
                    </AlertDescription>
                  </Alert>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => window.open('https://docs.browser-use.com/quickstart', '_blank')}
                    >
                      <ExternalLinkIcon className="h-4 w-4 mr-2" />
                      Setup Guide
                    </Button>
                    <Button
                      variant="outline"
                      onClick={downloadSetupScript}
                    >
                      <DownloadIcon className="h-4 w-4 mr-2" />
                      Download Script
                    </Button>
                    {settings.autoInstall && (
                      <Button
                        onClick={installNative}
                        disabled={nativeStatus === 'checking'}
                      >
                        Auto Install
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Error Display */}
              {nativeStatus === 'error' && nativeError && (
                <Alert variant="destructive">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <AlertDescription>
                    {nativeError}
                  </AlertDescription>
                </Alert>
              )}

              {/* Python Path Configuration */}
              <div className="space-y-2">
                <Label htmlFor="python-path">Python Path (optional)</Label>
                <Input
                  id="python-path"
                  placeholder="/usr/bin/python3 or C:\\Python311\\python.exe"
                  value={settings.pythonPath || ''}
                  onChange={(e) => updateSettings({ pythonPath: e.target.value })}
                />
              </div>

              {/* Auto Install Toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-install">Enable auto-install</Label>
                <Switch
                  id="auto-install"
                  checked={settings.autoInstall || false}
                  onCheckedChange={(checked) => updateSettings({ autoInstall: checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Behavior Settings */}
      <div className="space-y-4">
        <h4 className="text-base font-medium">Behavior Settings</h4>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="human-delays">Human-like delays</Label>
            <Switch
              id="human-delays"
              checked={settings.humanLikeDelays}
              onCheckedChange={(checked) => updateSettings({ humanLikeDelays: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="stealth-mode">Stealth mode</Label>
            <Switch
              id="stealth-mode"
              checked={settings.stealthMode}
              onCheckedChange={(checked) => updateSettings({ stealthMode: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="screenshot-annotations">Screenshot annotations</Label>
            <Switch
              id="screenshot-annotations"
              checked={settings.screenshotAnnotations}
              onCheckedChange={(checked) => updateSettings({ screenshotAnnotations: checked })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="max-width">Max screenshot width</Label>
            <Input
              id="max-width"
              type="number"
              value={settings.maxScreenshotWidth}
              onChange={(e) => updateSettings({ maxScreenshotWidth: parseInt(e.target.value) || 1920 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-height">Max screenshot height</Label>
            <Input
              id="max-height"
              type="number"
              value={settings.maxScreenshotHeight}
              onChange={(e) => updateSettings({ maxScreenshotHeight: parseInt(e.target.value) || 1080 })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}