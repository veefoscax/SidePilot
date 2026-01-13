/**
 * Chat Page
 * 
 * Main chat interface that combines all chat components.
 * Handles message sending, streaming, and provider integration.
 */

import { useChatStore } from '@/stores/chat';
import { useMultiProviderStore } from '@/stores/multi-provider';
import { createProvider } from '@/providers/factory';
import { MessageList } from '@/components/chat/MessageList';
import { InputArea } from '@/components/chat/InputArea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  ArrowLeft01Icon, 
  Settings02Icon,
  Delete01Icon,
  WifiIcon,
  WifiOffIcon
} from '@hugeicons/core-free-icons';

interface ChatPageProps {
  onBack: () => void;
  onSettings: () => void;
}

export function ChatPage({ onBack, onSettings }: ChatPageProps) {
  const { 
    messages, 
    isStreaming, 
    addUserMessage, 
    startStreaming, 
    appendStreamContent, 
    endStreaming, 
    setError,
    clearMessages 
  } = useChatStore();

  const { 
    getCurrentProvider,
    getCurrentProviderInstance,
    getFirstConfiguredProvider
  } = useMultiProviderStore();

  // Check if we have an active provider configured
  const currentProvider = getCurrentProvider();
  const firstConfiguredProvider = getFirstConfiguredProvider();
  
  // Use current provider if available, otherwise fall back to first configured
  const activeProvider = currentProvider || firstConfiguredProvider;
  
  const providerInstance = getCurrentProviderInstance();
  const fallbackProviderInstance = !providerInstance && firstConfiguredProvider ? (() => {
    const { providers } = useMultiProviderStore.getState();
    const providerConfig = providers[firstConfiguredProvider.provider];
    try {
      return createProvider({
        type: firstConfiguredProvider.provider,
        apiKey: providerConfig.apiKey || '',
        baseUrl: providerConfig.baseUrl,
      });
    } catch (error) {
      console.error('Failed to create fallback provider instance:', error);
      return null;
    }
  })() : null;
  
  const activeProviderInstance = providerInstance || fallbackProviderInstance;
  const hasActiveProvider = activeProvider && activeProviderInstance;

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (!hasActiveProvider) {
      setError('No active provider configured. Please set up a provider in Settings.');
      return;
    }

    try {
      // Add user message to store
      addUserMessage(content);

      // Start streaming
      startStreaming();

      // Prepare messages for the provider
      const allMessages = [
        ...messages,
        { role: 'user' as const, content }
      ];

      // Stream response from provider
      const stream = activeProviderInstance.stream(allMessages, {
        model: activeProvider.model.id, // Pass the correct model ID
      });
      let fullContent = '';

      for await (const chunk of stream) {
        if (chunk.type === 'text') {
          const chunkContent = chunk.text || '';
          fullContent += chunkContent;
          appendStreamContent(chunkContent);
        } else if (chunk.type === 'tool_call') {
          // Handle tool calls (future implementation)
          console.log('Tool call received:', chunk);
        }
      }

      // End streaming and add assistant message
      endStreaming(fullContent || 'No response received');

    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  // Get current model info for display
  const getCurrentModelInfo = () => {
    if (!activeProvider) return null;
    
    return {
      provider: activeProvider.provider,
      model: activeProvider.model.name
    };
  };

  const modelInfo = getCurrentModelInfo();

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4" />
          </Button>
          
          <div>
            <h1 className="font-semibold">Chat</h1>
            {modelInfo && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <HugeiconsIcon 
                  icon={hasActiveProvider ? WifiIcon : WifiOffIcon} 
                  className="h-3 w-3" 
                />
                <span>{modelInfo.provider}</span>
                <span>•</span>
                <span>{modelInfo.model}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Message count badge */}
          {messages.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {messages.length} messages
            </Badge>
          )}

          {/* Clear chat button */}
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearMessages}
              className="h-8 w-8"
              title="Clear chat"
            >
              <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
            </Button>
          )}

          {/* Settings button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettings}
            className="h-8 w-8"
          >
            <HugeiconsIcon icon={Settings02Icon} className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* No provider warning */}
      {!hasActiveProvider && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
            <HugeiconsIcon icon={WifiOffIcon} className="h-4 w-4" />
            <span>
              {(() => {
                const { providers } = useMultiProviderStore.getState();
                const hasConfiguredProvider = Object.values(providers).some(p => p.isConfigured);
                
                if (hasConfiguredProvider) {
                  return "Loading models from configured provider...";
                } else {
                  return "No active provider configured.";
                }
              })()}
            </span>
            <Button
              variant="link"
              size="sm"
              onClick={onSettings}
              className="h-auto p-0 text-yellow-800 dark:text-yellow-200 underline"
            >
              {(() => {
                const { providers } = useMultiProviderStore.getState();
                const hasConfiguredProvider = Object.values(providers).some(p => p.isConfigured);
                return hasConfiguredProvider ? "Check settings" : "Set up provider";
              })()}
            </Button>
          </div>
        </div>
      )}

      {/* Message list */}
      <MessageList />

      {/* Input area */}
      <InputArea
        onSend={handleSendMessage}
        disabled={isStreaming || !hasActiveProvider}
        placeholder={
          !hasActiveProvider 
            ? "Configure a provider to start chatting..." 
            : isStreaming 
              ? "AI is responding..." 
              : "Message..."
        }
      />
    </div>
  );
}