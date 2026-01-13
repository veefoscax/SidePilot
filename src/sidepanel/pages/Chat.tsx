/**
 * Chat Page
 * 
 * Main chat interface that combines all chat components.
 * Handles message sending, streaming, and provider integration.
 */

import { useChatStore } from '@/stores/chat';
import { useMultiProviderStore } from '@/stores/multi-provider';
import { toolRegistry } from '@/tools/registry';
import { MessageList } from '@/components/chat/MessageList';
import { InputArea } from '@/components/chat/InputArea';
import { ModelSelectorDropdown } from '@/components/chat/ModelSelectorDropdown';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  ArrowLeft01Icon, 
  Settings02Icon,
  Delete01Icon,
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
    clearMessages,
    addToolResult
  } = useChatStore();

  const { 
    getCurrentProvider,
    getCurrentProviderInstance,
    selectedModels
  } = useMultiProviderStore();

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    const currentProvider = getCurrentProvider();
    const activeProviderInstance = getCurrentProviderInstance();
    
    if (!currentProvider || !activeProviderInstance) {
      setError('No active model selected. Please select a model from the dropdown or configure a provider in Settings.');
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

      // Stream response from provider using the current model
      const stream = activeProviderInstance.stream(allMessages, {
        model: currentProvider.model.id, // Use the selected model ID
        tools: toolRegistry.getAnthropicTools(), // Add browser automation tools
      });
      let fullContent = '';
      const toolCalls: any[] = [];

      for await (const chunk of stream) {
        if (chunk.type === 'text') {
          const chunkContent = chunk.text || '';
          fullContent += chunkContent;
          appendStreamContent(chunkContent);
        } else if (chunk.type === 'tool_use' && chunk.toolCall) {
          // Handle tool calls
          console.log('Tool call received:', chunk.toolCall);
          toolCalls.push({
            id: chunk.toolCall.id,
            name: chunk.toolCall.name,
            input: chunk.toolCall.input,
            status: 'pending'
          });
          
          // Execute the tool
          try {
            const result = await toolRegistry.execute(chunk.toolCall.name, chunk.toolCall.input);
            addToolResult(chunk.toolCall.id, {
              toolUseId: chunk.toolCall.id,
              output: JSON.stringify(result.data),
              screenshot: result.screenshot,
            });
          } catch (toolError) {
            console.error('Tool execution error:', toolError);
            addToolResult(chunk.toolCall.id, {
              toolUseId: chunk.toolCall.id,
              error: toolError instanceof Error ? toolError.message : 'Tool execution failed',
            });
          }
        }
      }

      // End streaming and add assistant message
      endStreaming(fullContent || 'No response received', toolCalls.length > 0 ? toolCalls : undefined);

    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  // Check if we have models available for chat
  const hasModelsAvailable = selectedModels.length > 0;
  const currentProvider = getCurrentProvider();
  const hasActiveProvider = currentProvider && getCurrentProviderInstance();

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8 shrink-0"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4" />
          </Button>
          
          <div className="min-w-0 flex-1">
            <h1 className="font-semibold">Chat</h1>
            <ModelSelectorDropdown className="mt-1" />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
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

      {/* No models warning */}
      {!hasModelsAvailable && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
            <HugeiconsIcon icon={WifiOffIcon} className="h-4 w-4" />
            <span>No models selected for chat.</span>
            <Button
              variant="link"
              size="sm"
              onClick={onSettings}
              className="h-auto p-0 text-yellow-800 dark:text-yellow-200 underline"
            >
              Select models
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
          !hasModelsAvailable 
            ? "Select a model to start chatting..." 
            : !hasActiveProvider
              ? "Model not available..."
              : isStreaming 
                ? "AI is responding..." 
                : "Message..."
        }
      />
    </div>
  );
}