/**
 * Test Connection Button Component
 * 
 * Button for testing API key validity and provider connectivity.
 * Shows loading state, success/error feedback, and handles different provider requirements.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HugeiconsIcon } from '@hugeicons/react';
import { Loading03Icon, CheckmarkCircle02Icon, CancelCircleIcon, Wifi01Icon } from '@hugeicons/core-free-icons';
import { ProviderType } from '@/providers/types';
import { getProviderInfo } from '@/providers/factory';

interface TestConnectionButtonProps {
  onTest: () => Promise<boolean>;
  provider: ProviderType;
  apiKey: string;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  disabled?: boolean;
}

export function TestConnectionButton({ 
  onTest, 
  provider, 
  apiKey, 
  isLoading, 
  isConnected, 
  error,
  disabled 
}: TestConnectionButtonProps) {
  const [lastTestResult, setLastTestResult] = useState<'success' | 'error' | null>(null);
  const providerInfo = getProviderInfo(provider);
  
  const handleTest = async () => {
    try {
      const success = await onTest();
      setLastTestResult(success ? 'success' : 'error');
    } catch (err) {
      setLastTestResult('error');
    }
  };
  
  // Check if test is possible
  const canTest = providerInfo.requiresApiKey ? apiKey.length > 0 : true;
  const buttonDisabled = disabled || isLoading || !canTest;
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          onClick={handleTest}
          disabled={buttonDisabled}
          variant={isConnected ? 'default' : 'outline'}
          className="flex items-center gap-2"
        >
          <HugeiconsIcon 
            icon={isLoading ? Loading03Icon : isConnected ? CheckmarkCircle02Icon : Wifi01Icon}
            className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
          />
          
          {isLoading ? 'Testing...' : isConnected ? 'Connected' : 'Test Connection'}
        </Button>
        
        {/* Connection status indicator */}
        {!isLoading && (
          <div className="flex items-center gap-1 text-sm">
            {isConnected ? (
              <div className="flex items-center gap-1 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                Connected
              </div>
            ) : lastTestResult === 'error' ? (
              <div className="flex items-center gap-1 text-red-600">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                Failed
              </div>
            ) : (
              <div className="flex items-center gap-1 text-muted-foreground">
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                Not tested
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Help text */}
      {!canTest && providerInfo.requiresApiKey && (
        <div className="text-xs text-muted-foreground">
          Enter an API key to test the connection
        </div>
      )}
      
      {/* Success feedback */}
      {isConnected && !error && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            Successfully connected to {providerInfo.name}! You can now use this provider for chat.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Error feedback */}
      {error && (
        <Alert className="border-red-500/50 bg-red-500/10">
          <HugeiconsIcon icon={CancelCircleIcon} className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            <div className="font-medium">Connection failed</div>
            <div className="text-sm mt-1">{error}</div>
            {providerInfo.requiresApiKey && (
              <div className="text-xs mt-2 text-muted-foreground">
                Make sure your API key is valid and has the necessary permissions.
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Provider-specific help */}
      {provider === 'ollama' && (
        <div className="text-xs text-muted-foreground">
          Make sure Ollama is running locally on port 11434
        </div>
      )}
    </div>
  );
}