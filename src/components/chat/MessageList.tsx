/**
 * MessageList Component
 * 
 * Displays the list of chat messages with auto-scroll functionality.
 * Includes pin to bottom toggle and proper message rendering.
 */

import { useEffect, useRef, useState } from 'react';
import { useChatStore, type Message } from '@/stores/chat';
import { UserMessage } from './UserMessage';
import { AssistantMessage } from './AssistantMessage';
import { ThinkingIndicator } from './ThinkingIndicator';
import { ErrorCard } from './ErrorCard';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';

export function MessageList() {
  const { messages, isStreaming, streamingContent, error } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPinnedToBottom, setIsPinnedToBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Auto-scroll to bottom when new messages arrive or streaming updates
  useEffect(() => {
    if (isPinnedToBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent, isPinnedToBottom]);

  // Check if user has scrolled away from bottom
  const handleScroll = () => {
    if (!containerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50; // 50px threshold
    
    setIsPinnedToBottom(isAtBottom);
    setShowScrollButton(!isAtBottom && messages.length > 0);
  };

  // Scroll to bottom manually
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setIsPinnedToBottom(true);
    }
  };

  return (
    <div className="flex-1 relative">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-4 py-4 space-y-4"
      >
        {/* Empty state */}
        {messages.length === 0 && !isStreaming && (
          <div className="flex items-center justify-center h-full text-center">
            <div className="max-w-md">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
              <p className="text-muted-foreground text-sm">
                Send a message to begin chatting with your AI assistant.
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((message) => (
          <div key={message.id}>
            {message.role === 'user' ? (
              <UserMessage message={message} />
            ) : (
              <AssistantMessage message={message} />
            )}
          </div>
        ))}

        {/* Streaming message */}
        {isStreaming && streamingContent && (
          <AssistantMessage 
            message={{
              id: 'streaming',
              role: 'assistant',
              content: streamingContent,
              timestamp: Date.now(),
            }}
            isStreaming={true}
          />
        )}

        {/* Thinking indicator */}
        {isStreaming && !streamingContent && <ThinkingIndicator />}

        {/* Error display */}
        {error && <ErrorCard error={error} />}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <div className="absolute bottom-4 right-4">
          <Button
            size="icon"
            variant="secondary"
            onClick={scrollToBottom}
            className="rounded-full shadow-lg"
          >
            <HugeiconsIcon icon={ArrowDown01Icon} className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}