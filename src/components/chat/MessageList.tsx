/**
 * MessageList Component
 * 
 * Displays chat messages with modern UX patterns including message grouping,
 * smart timestamp display, and improved spacing following iMessage/WhatsApp conventions.
 */

import { useEffect, useRef, useState } from 'react';
import { useChatStore, type Message } from '@/stores/chat';
import { UserMessage } from './UserMessage';
import { AssistantMessage } from './AssistantMessage';
import { StreamingMessage } from './StreamingMessage';
import { ThinkingIndicator } from './ThinkingIndicator';
import { ErrorCard } from './ErrorCard';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';

// Helper function to determine if messages should be grouped
function shouldGroupMessages(current: Message, previous: Message): boolean {
  if (!previous) return false;

  // Same sender
  if (current.role !== previous.role) return false;

  // Within 2 minutes of each other
  const timeDiff = current.timestamp - previous.timestamp;
  if (timeDiff > 2 * 60 * 1000) return false; // 2 minutes

  return true;
}

// Helper function to determine if timestamp should be shown
function shouldShowTimestamp(current: Message, previous: Message, next: Message): boolean {
  if (!previous) return true; // First message

  // Show timestamp if significant time gap (>5 minutes)
  const timeDiff = current.timestamp - previous.timestamp;
  if (timeDiff > 5 * 60 * 1000) return true;

  // Show timestamp if sender changes
  if (current.role !== previous.role) return true;

  // Show timestamp if it's the last message in a group
  if (!next || !shouldGroupMessages(next, current)) return true;

  return false;
}

export function MessageList() {
  const { messages, isStreaming, streamingContent, streamingReasoning, error } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPinnedToBottom, setIsPinnedToBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Auto-scroll to bottom when new messages arrive or streaming updates
  useEffect(() => {
    if (isPinnedToBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent, streamingReasoning, isPinnedToBottom]);

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
    <div className="flex-1 min-h-0 relative overflow-hidden">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-4 py-6"
      >
        {/* Empty state */}
        {messages.length === 0 && !isStreaming && (
          <div className="flex items-center justify-center h-full text-center">
            <div className="max-w-md">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
              <p className="text-muted-foreground text-sm">
                Send a message to begin chatting with your AI assistant.
              </p>
            </div>
          </div>
        )}

        {/* Messages with grouping logic */}
        {messages.map((message, index) => {
          const previousMessage = messages[index - 1];
          const nextMessage = messages[index + 1];

          const isGrouped = shouldGroupMessages(message, previousMessage);
          const showTimestamp = shouldShowTimestamp(message, previousMessage, nextMessage);

          return (
            <div key={message.id}>
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
        {isStreaming && (streamingContent || streamingReasoning) && (
          <StreamingMessage />
        )}

        {/* Thinking indicator - only when streaming but no content yet */}
        {isStreaming && !streamingContent && !streamingReasoning && <ThinkingIndicator />}

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
            className="rounded-full shadow-lg hover:shadow-xl transition-shadow"
          >
            <HugeiconsIcon icon={ArrowDown01Icon} className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}