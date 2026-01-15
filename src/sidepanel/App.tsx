import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Card } from '@/components/ui/card';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Settings01Icon,
  Add01Icon,
  ArrowUp02Icon,
  StopIcon,
  BookOpen01Icon
} from '@hugeicons/core-free-icons';
import { initializeTheme } from '@/lib/theme';
import { useChatStore } from '@/stores/chat';
import { useMultiProviderStore } from '@/stores/multi-provider';
import { useShortcutsStore } from '@/stores/shortcuts';
import { toolRegistry } from '@/tools/registry';
import { UserMessage } from '@/components/chat/UserMessage';
import { AssistantMessage } from '@/components/chat/AssistantMessage';
import { InputArea } from '@/components/chat/InputArea';
import { ThinkingIndicator } from '@/components/chat/ThinkingIndicator';
import { ErrorCard } from '@/components/chat/ErrorCard';
import { ModelSelectorDropdown } from '@/components/chat/ModelSelectorDropdown';
import { ConversationManager } from '@/components/chat/ConversationManager';
import { MultiProviderManager } from '@/components/settings/MultiProviderManager';
import { BrowserAutomationSettings, type BrowserAutomationSettings as BrowserSettingsType } from '@/components/settings/BrowserAutomationSettings';
import { PermissionsManager } from '@/components/settings/PermissionsManager';
import { ConnectedPermissionDialog } from '@/components/PermissionDialog';
import { Textarea } from '@/components/ui/textarea';
import { Toaster } from 'sonner';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [input, setInput] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isConversationsOpen, setIsConversationsOpen] = useState(false);
  const [browserSettings, setBrowserSettings] = useState<BrowserSettingsType>({
    backend: 'builtin',
    humanLikeDelays: true,
    stealthMode: false,
    screenshotAnnotations: true,
    maxScreenshotWidth: 1920,
    maxScreenshotHeight: 1080
  });

  const {
    messages,
    isStreaming,
    streamingContent,
    streamingReasoning,
    error,
    addUserMessage,
    startStreaming,
    appendStreamContent,
    appendStreamReasoning,
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

  const {
    loadShortcuts,
    initializeDefaults,
    isLoaded: shortcutsLoaded
  } = useShortcutsStore();

  useEffect(() => {
    // Initialize theme detection and shortcuts store
    const initializeApp = async () => {
      try {
        // Initialize theme detection
        const detectedTheme = await initializeTheme();

        // Initialize shortcuts store
        await loadShortcuts();
        await initializeDefaults();

        setIsLoading(false);

        // Notify service worker of the detected theme to update icons
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          chrome.runtime.sendMessage({
            type: 'THEME_CHANGED',
            payload: { theme: detectedTheme }
          }).catch(() => {
            // Ignore if service worker is not available
          });
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [loadShortcuts, initializeDefaults]);

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    const currentProvider = getCurrentProvider();
    const activeProviderInstance = getCurrentProviderInstance();

    if (!currentProvider || !activeProviderInstance) {
      setError('No active model selected. Please configure a provider in Settings.');
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

      // Prepare tools based on provider type
      const tools = activeProviderInstance.type === 'anthropic'
        ? toolRegistry.getAnthropicTools().map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.input_schema
        }))
        : toolRegistry.getOpenAITools().map(tool => ({
          name: tool.function.name,
          description: tool.function.description,
          inputSchema: tool.function.parameters
        }));

      console.log('🔧 App.tsx - Tools prepared:', {
        providerType: activeProviderInstance.type,
        toolsCount: tools.length,
        toolNames: tools.map(t => t.name)
      });

      // Stream response from provider using the current model
      const stream = activeProviderInstance.stream(allMessages, {
        model: currentProvider.model.id,
        tools,
        systemPrompt: `You are SidePilot, an AI assistant with browser automation capabilities. You have access to the following tools:

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

Always use tools when appropriate instead of just describing how to do something manually.`,
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
              addToolResult(chunk.toolCall.id, {
                toolUseId: chunk.toolCall.id,
                error: toolError instanceof Error ? toolError.message : 'Tool execution failed',
              });
            }
          })();
        }
      }

      // Get final reasoning from store
      const finalReasoning = useChatStore.getState().streamingReasoning;

      endStreaming(
        fullContent || 'No response received',
        toolCalls.length > 0 ? toolCalls : undefined,
        finalReasoning || undefined
      );

    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  const handleSend = () => {
    const trimmedInput = input.trim();
    if (trimmedInput && !isStreaming) {
      handleSendMessage(trimmedInput);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const hasModelsAvailable = selectedModels.length > 0;
  const canSend = input.trim().length > 0 && !isStreaming && shortcutsLoaded;

  if (isLoading || !shortcutsLoaded) {
    return (
      <div className="h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-muted-foreground">Loading SidePilot...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <Toaster position="top-center" richColors />
      <ConnectedPermissionDialog />

      {/* Header - Fixed */}
      <div className="h-12 flex items-center justify-between px-4 shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        {/* Left: Model selector */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <ModelSelectorDropdown />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Sheet open={isConversationsOpen} onOpenChange={setIsConversationsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <HugeiconsIcon icon={BookOpen01Icon} className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>Conversations</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <ConversationManager />
              </div>
            </SheetContent>
          </Sheet>

          <Button
            variant="ghost"
            size="icon"
            onClick={clearMessages}
            disabled={messages.length === 0}
            className="h-8 w-8"
          >
            <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />
          </Button>

          <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <HugeiconsIcon icon={Settings01Icon} className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Settings</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <MultiProviderManager />
                <Separator />
                <BrowserAutomationSettings
                  settings={browserSettings}
                  onSettingsChange={setBrowserSettings}
                />
                <Separator />
                <PermissionsManager />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 relative">
        <ScrollArea className="h-full">
          <div className="px-4 py-6">
            {/* Empty state */}
            {messages.length === 0 && !isStreaming && (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="max-w-md text-center space-y-6">
                  <div className="w-10 h-10 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
                    <span className="text-xl">🚀</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">How can I help you today?</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose a suggestion below or type your own message
                    </p>
                  </div>

                  {/* Suggestion chips */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "Summarize this page",
                      "Find information",
                      "Extract data",
                      "Automate task"
                    ].map((suggestion) => (
                      <Card
                        key={suggestion}
                        className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <Button
                          variant="outline"
                          className="w-full h-auto p-0 border-none bg-transparent hover:bg-transparent text-sm"
                        >
                          {suggestion}
                        </Button>
                      </Card>
                    ))}
                  </div>

                  {!hasModelsAvailable && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        No models configured.
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => setIsSettingsOpen(true)}
                          className="h-auto p-0 ml-1 text-yellow-800 dark:text-yellow-200 underline"
                        >
                          Configure providers
                        </Button>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((message, index) => {
              const previousMessage = messages[index - 1];
              const nextMessage = messages[index + 1];

              // Simple grouping logic
              const isGrouped = previousMessage &&
                previousMessage.role === message.role &&
                (message.timestamp - previousMessage.timestamp) < 2 * 60 * 1000;

              const showTimestamp = !previousMessage ||
                previousMessage.role !== message.role ||
                (message.timestamp - previousMessage.timestamp) > 5 * 60 * 1000 ||
                (!nextMessage || nextMessage.role !== message.role);

              return (
                <div key={message.id} className="mb-4">
                  {message.role === 'user' ? (
                    <UserMessage
                      message={message}
                      isGrouped={isGrouped}
                      showTimestamp={showTimestamp}
                    />
                  ) : (
                    <AssistantMessage
                      message={message}
                      isGrouped={isGrouped}
                      showTimestamp={showTimestamp}
                    />
                  )}
                </div>
              );
            })}

            {/* Streaming message */}
            {isStreaming && streamingContent && (
              <div className="mb-4">
                <AssistantMessage
                  message={{
                    id: 'streaming',
                    role: 'assistant',
                    content: streamingContent,
                    reasoning: streamingReasoning || undefined,
                    timestamp: Date.now(),
                  }}
                  isStreaming={true}
                  isGrouped={false}
                  showTimestamp={false}
                />
              </div>
            )}

            {/* Thinking indicator - show when streaming but no content yet, or when we have reasoning but no content */}
            {isStreaming && !streamingContent && (
              <div className="mb-4">
                {streamingReasoning ? (
                  <AssistantMessage
                    message={{
                      id: 'thinking',
                      role: 'assistant',
                      content: '',
                      reasoning: streamingReasoning,
                      timestamp: Date.now(),
                    }}
                    isStreaming={true}
                    isGrouped={false}
                    showTimestamp={false}
                  />
                ) : (
                  <ThinkingIndicator />
                )}
              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="mb-4">
                <ErrorCard error={error} />
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="shrink-0">
        <InputArea
          onSend={handleSendMessage}
          disabled={isStreaming || !hasModelsAvailable}
          placeholder={
            !hasModelsAvailable
              ? "Configure a provider to start chatting..."
              : isStreaming
                ? "AI is responding..."
                : "Message SidePilot..."
          }
        />
      </div>
    </div>
  );
}

export default App;