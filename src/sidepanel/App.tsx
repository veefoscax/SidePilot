import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { MessageList } from '@/components/chat/MessageList';
import { UserMessage } from '@/components/chat/UserMessage';
import { AssistantMessage } from '@/components/chat/AssistantMessage';
import { ThinkingIndicator } from '@/components/chat/ThinkingIndicator';
import { ErrorCard } from '@/components/chat/ErrorCard';
import { ModelSelectorDropdown } from '@/components/chat/ModelSelectorDropdown';
import { ConversationManager } from '@/components/chat/ConversationManager';
import { MultiProviderManager } from '@/components/settings/MultiProviderManager';
import { Textarea } from '@/components/ui/textarea';
import { Toaster } from 'sonner';
import { cn } from '@/lib/utils';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isLoading, setIsLoading] = useState(true);
  const [input, setInput] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isConversationsOpen, setIsConversationsOpen] = useState(false);

  const { 
    messages, 
    isStreaming, 
    streamingContent, 
    error,
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
    selectedModels
  } = useMultiProviderStore();

  useEffect(() => {
    // Initialize theme detection
    initializeTheme().then((detectedTheme) => {
      setTheme(detectedTheme);
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
    });
  }, []);

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

      // Stream response from provider using the current model
      const stream = activeProviderInstance.stream(allMessages, {
        model: currentProvider.model.id,
      });
      let fullContent = '';

      for await (const chunk of stream) {
        if (chunk.type === 'text') {
          const chunkContent = chunk.text || '';
          fullContent += chunkContent;
          appendStreamContent(chunkContent);
        } else if (chunk.type === 'tool_call') {
          console.log('Tool call received:', chunk);
        }
      }

      endStreaming(fullContent || 'No response received');

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

  const currentProvider = getCurrentProvider();
  const hasModelsAvailable = selectedModels.length > 0;
  const canSend = input.trim().length > 0 && !isStreaming;

  if (isLoading) {
    return (
      <div className="h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-muted-foreground">Loading SidePilot...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 shrink-0">
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
            <SheetContent className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>Settings</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <MultiProviderManager />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Separator />

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
                    timestamp: Date.now(),
                  }}
                  isStreaming={true}
                  isGrouped={false}
                  showTimestamp={false}
                />
              </div>
            )}

            {/* Thinking indicator */}
            {isStreaming && !streamingContent && (
              <div className="mb-4">
                <ThinkingIndicator />
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

      <Separator />

      {/* Input Area */}
      <div className="p-4 shrink-0">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                !hasModelsAvailable 
                  ? "Configure a provider to start chatting..." 
                  : isStreaming 
                    ? "AI is responding..." 
                    : "Message SidePilot..."
              }
              disabled={isStreaming || !hasModelsAvailable}
              className="min-h-[44px] max-h-32 resize-none"
              rows={1}
            />
          </div>
          
          <Button
            size="icon"
            onClick={isStreaming ? () => {} : handleSend}
            disabled={!canSend && !isStreaming}
            className="h-11 w-11 shrink-0"
          >
            <HugeiconsIcon 
              icon={isStreaming ? StopIcon : ArrowUp02Icon} 
              className="h-4 w-4" 
            />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default App;