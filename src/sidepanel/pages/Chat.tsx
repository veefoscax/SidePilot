/**
 * Chat Page
 * 
 * Main chat interface that combines all chat components.
 * Handles message sending, streaming, and provider integration.
 */

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useChatStore } from '@/stores/chat';
import { useMultiProviderStore } from '@/stores/multi-provider';
import { toolRegistry } from '@/tools/registry';
import { notifications } from '@/lib/notifications';
import { MessageList } from '@/components/chat/MessageList';
import { InputArea } from '@/components/chat/InputArea';
import { ModelSelectorDropdown } from '@/components/chat/ModelSelectorDropdown';
import { CapabilityWarnings } from '@/components/chat/CapabilityWarnings';
import { VoiceControls } from '@/components/chat/VoiceControls';
import { RecordingBar } from '@/components/RecordingBar';
import { CallMode } from '@/components/voice/CallMode';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  Settings02Icon,
  Delete01Icon,
  WifiOffIcon,
  UndoIcon,
  InformationCircleIcon
} from '@hugeicons/core-free-icons';

interface ChatPageProps {
  onBack: () => void;
  onSettings: () => void;
}

export function ChatPage({ onBack, onSettings }: ChatPageProps) {
  const { t } = useTranslation();
  const {
    messages,
    isStreaming,
    messageQueue,
    addUserMessage,
    startStreaming,
    appendStreamContent,
    appendStreamReasoning,
    endStreaming,
    setError,
    clearMessages,
    addToolResult,
    revertLastMessage,
    processNextQueuedMessage
  } = useChatStore();

  const {
    getCurrentProvider,
    getCurrentProviderInstance,
    selectedModels
  } = useMultiProviderStore();

  // Process queued messages when streaming ends
  useEffect(() => {
    if (!isStreaming && messageQueue.length > 0) {
      const nextMessage = processNextQueuedMessage();
      if (nextMessage) {
        // Send the next queued message
        setTimeout(() => {
          handleSendMessage(nextMessage);
        }, 100); // Small delay to ensure UI updates
      }
    }
  }, [isStreaming, messageQueue.length]);

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    const currentProvider = getCurrentProvider();
    const activeProviderInstance = getCurrentProviderInstance();

    if (!currentProvider || !activeProviderInstance) {
      setError(t('chat.error.noModel'));
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

      // Check if model supports tools before preparing them
      const supportsTools = currentProvider.model.capabilities?.supportsTools ?? true;

      // Stream response from provider using the current model
      const tools = supportsTools
        ? (activeProviderInstance.type === 'anthropic'
          ? toolRegistry.getAnthropicTools().map(tool => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.input_schema
          }))
          : toolRegistry.getOpenAITools().map(tool => ({
            name: tool.function.name,
            description: tool.function.description,
            inputSchema: tool.function.parameters
          })))
        : undefined; // Don't send tools if model doesn't support them

      console.log('🔧 Chat.tsx - Tools prepared:', {
        providerType: activeProviderInstance.type,
        supportsTools,
        toolsCount: tools?.length ?? 0,
        toolNames: tools?.map(t => t.name) ?? [],
        firstTool: tools?.[0],
        allTools: tools
      });

      console.log('🔧 Chat.tsx - About to call stream with options:', {
        model: currentProvider.model.id,
        hasTools: !!tools,
        toolsCount: tools?.length ?? 0,
        hasSystemPrompt: true
      });

      // Build system prompt based on tool support
      const systemPrompt = supportsTools
        ? `You are SidePilot, an AI assistant with browser automation capabilities. You have access to the following tools:

- screenshot: Capture and annotate web pages with element bounding boxes
- click: Click on elements using coordinates, references, or natural language descriptions
- type: Type text into input fields with human-like delays
- navigate: Navigate to URLs or perform web searches
- wait: Wait for elements, page loads, or specific conditions
- extract: Extract text, HTML, links, images, or structured data from pages

When a user asks you to interact with a web page, USE THESE TOOLS. For example:
- "Take a screenshot" → Use the screenshot tool
- "Click the button" → Use the click tool
- "Go to google.com" → Use the navigate tool
- "Extract all links" → Use the extract tool

Always use tools when appropriate instead of just describing how to do something manually.`
        : `You are SidePilot, an AI assistant. Note: This model does not support tool use, so browser automation features are not available. You can still help with questions, explanations, and general assistance, but you cannot directly interact with web pages.`;

      const stream = activeProviderInstance.stream(allMessages, {
        model: currentProvider.model.id, // Use the selected model ID
        tools, // Pass tools in unified format (or undefined if not supported)
        systemPrompt,
      });
      let fullContent = '';
      const toolCalls: any[] = [];

      for await (const chunk of stream) {
        if (chunk.type === 'text') {
          const chunkContent = chunk.text || '';
          fullContent += chunkContent;
          appendStreamContent(chunkContent);
        } else if (chunk.type === 'reasoning') {
          // Handle reasoning/thinking content
          const reasoningContent = chunk.text || '';
          appendStreamReasoning(reasoningContent);
        } else if (chunk.type === 'tool_use' && chunk.toolCall) {
          // Handle tool calls
          console.log('🔧 Tool call received:', chunk.toolCall);

          // Add tool call to the list with pending status
          const toolCall = {
            id: chunk.toolCall.id,
            name: chunk.toolCall.name,
            input: chunk.toolCall.input,
            status: 'pending' as const
          };
          toolCalls.push(toolCall);

          // Execute the tool asynchronously
          (async () => {
            try {
              console.log('🔧 Executing tool:', chunk.toolCall.name, 'with input:', chunk.toolCall.input);

              // Update status to executing
              const toolCallIndex = toolCalls.findIndex(tc => tc.id === chunk.toolCall.id);
              if (toolCallIndex !== -1) {
                toolCalls[toolCallIndex].status = 'executing';
              }

              // Execute the tool with current tab context
              const result = await toolRegistry.execute(chunk.toolCall.name, chunk.toolCall.input);

              console.log('🔧 Tool execution result:', result);

              // Check if permission is required
              if (result.error === 'PERMISSION_REQUIRED') {
                console.log('🔧 Permission required for tool:', chunk.toolCall.name);

                // Notify permission required if side panel is not focused
                if (!document.hasFocus()) {
                  notifications.notifyPermissionRequired(chunk.toolCall.name).catch(notifyErr => {
                    console.warn('Failed to send permission notification:', notifyErr);
                  });
                }

                addToolResult(chunk.toolCall.id, {
                  toolUseId: chunk.toolCall.id,
                  error: 'Permission required. Please grant permission in the dialog and retry.',
                  output: result.output,
                });
                return;
              }

              // Add the tool result
              if (result.error) {
                console.error('🔧 Tool execution error:', result.error);

                // Notify error if side panel is not focused
                if (!document.hasFocus()) {
                  notifications.notifyError(`Tool "${chunk.toolCall.name}" failed: ${result.error}`).catch(notifyErr => {
                    console.warn('Failed to send tool error notification:', notifyErr);
                  });
                }

                addToolResult(chunk.toolCall.id, {
                  toolUseId: chunk.toolCall.id,
                  error: result.error,
                });
              } else {
                console.log('🔧 Tool execution successful');
                addToolResult(chunk.toolCall.id, {
                  toolUseId: chunk.toolCall.id,
                  output: result.output || 'Tool executed successfully',
                  screenshot: result.screenshot,
                });
              }
            } catch (toolError) {
              console.error('🔧 Tool execution exception:', toolError);
              const toolErrorMessage = toolError instanceof Error ? toolError.message : 'Tool execution failed';

              // Notify error if side panel is not focused
              if (!document.hasFocus()) {
                notifications.notifyError(`Tool "${chunk.toolCall.name}" failed: ${toolErrorMessage}`).catch(notifyErr => {
                  console.warn('Failed to send tool error notification:', notifyErr);
                });
              }

              addToolResult(chunk.toolCall.id, {
                toolUseId: chunk.toolCall.id,
                error: toolErrorMessage,
              });
            }
          })();
        }
      }

      // End streaming and add assistant message
      const finalReasoning = useChatStore.getState().streamingReasoning;

      // Debug logging
      console.log('Stream ended:', {
        fullContent,
        contentLength: fullContent.length,
        toolCallsCount: toolCalls.length,
        finalReasoning: finalReasoning?.substring(0, 100) + '...'
      });

      endStreaming(
        fullContent || 'No response received',
        toolCalls.length > 0 ? toolCalls : undefined,
        finalReasoning || undefined
      );

      // Notify task complete if side panel is not focused (user is in another tab)
      if (!document.hasFocus()) {
        // Generate a task name from the first user message or use a default
        const taskName = content.length > 50 ? content.substring(0, 50) + '...' : content;
        notifications.notifyTaskComplete(taskName).catch(err => {
          console.warn('Failed to send task complete notification:', err);
        });
      }

    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);

      // Notify error if side panel is not focused
      if (!document.hasFocus()) {
        notifications.notifyError(errorMessage).catch(notifyErr => {
          console.warn('Failed to send error notification:', notifyErr);
        });
      }
    }
  };

  // Check if we have models available for chat
  const hasModelsAvailable = selectedModels.length > 0;
  const currentProvider = getCurrentProvider();
  const hasActiveProvider = currentProvider && getCurrentProviderInstance();

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Recording Bar - appears at top when recording */}
      <RecordingBar />

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur">
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
              {t('chat.messageCount', { count: messages.length })}
            </Badge>
          )}

          {/* Revert last message button */}
          {messages.length > 0 && messages[messages.length - 1].role === 'assistant' && !isStreaming && (
            <Button
              variant="ghost"
              size="icon"
              onClick={revertLastMessage}
              className="h-8 w-8"
              title={t('chat.revertLast')}
            >
              <HugeiconsIcon icon={UndoIcon} className="h-4 w-4" />
            </Button>
          )}

          {/* Clear chat button */}
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearMessages}
              className="h-8 w-8"
              title={t('chat.clear')}
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
            <span>{t('chat.noModelsSelected')}</span>
            <Button
              variant="link"
              size="sm"
              onClick={onSettings}
              className="h-auto p-0 text-yellow-800 dark:text-yellow-200 underline"
            >
              {t('chat.selectModels')}
            </Button>
          </div>
        </div>
      )}

      {/* Model capability warnings */}
      {currentProvider && (
        <CapabilityWarnings
          model={currentProvider.model}
          requirements={{ tools: true }} // Chat interface requires tools
          className="p-4 border-b"
        />
      )}

      {/* Tools disabled info message */}
      {currentProvider && !currentProvider.model.capabilities?.supportsTools && (
        <Alert className="mx-4 mt-2 mb-0">
          <HugeiconsIcon icon={InformationCircleIcon} className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <span className="font-medium">{t('chat.toolsDisabled.title')}</span>{' '}
            {t('chat.toolsDisabled.description', { modelName: currentProvider.model.name })}
          </AlertDescription>
        </Alert>
      )}

      {/* Message list */}
      <MessageList />

      {/* Voice Controls */}
      <div className="shrink-0 border-t bg-card px-4 py-2">
        <VoiceControls
          onTranscript={handleSendMessage}
          disabled={isStreaming || !hasActiveProvider}
        />
      </div>

      {/* Input area */}
      <div className="shrink-0">
        <InputArea
          onSend={handleSendMessage}
          disabled={isStreaming || !hasActiveProvider}
          placeholder={
            !hasModelsAvailable
              ? t('chat.placeholder.selectModel')
              : !hasActiveProvider
                ? t('chat.placeholder.modelNotAvailable')
                : isStreaming
                  ? t('chat.placeholder.responding')
                  : t('chat.placeholder.default')
          }
        />
      </div>

      {/* Call Mode Overlay */}
      <CallMode />
    </div>
  );
}