/**
 * AssistantMessage Component
 * 
 * Displays assistant messages with markdown rendering and tool call integration.
 * Supports streaming state for real-time message display.
 */

import { type Message } from '@/stores/chat';
import { Markdown } from './Markdown';
import { ToolUseCard } from './ToolUseCard';

interface AssistantMessageProps {
  message: Message;
  isStreaming?: boolean;
}

export function AssistantMessage({ message, isStreaming = false }: AssistantMessageProps) {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 max-w-[80%] shadow-sm">
        {/* Message content with markdown */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <Markdown content={message.content || 'No content'} />
        </div>

        {/* Tool calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.toolCalls.map((toolCall) => {
              // Find corresponding tool result
              const toolResult = message.toolResults?.find(
                result => result.toolUseId === toolCall.id
              );
              
              return (
                <ToolUseCard
                  key={toolCall.id}
                  toolCall={toolCall}
                  result={toolResult}
                />
              );
            })}
          </div>
        )}

        {/* Timestamp */}
        {!isStreaming && (
          <div className="text-xs text-muted-foreground mt-2">
            {new Date(message.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        )}

        {/* Streaming indicator */}
        {isStreaming && (
          <div className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
        )}
      </div>
    </div>
  );
}