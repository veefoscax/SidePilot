/**
 * AssistantMessage Component
 * 
 * Displays assistant messages with markdown rendering and tool call integration.
 * Supports streaming state for real-time message display.
 */

import { type Message } from '@/stores/chat';
import { Markdown } from './Markdown';
import { ToolUseCard } from './ToolUseCard';
import { VoiceControls } from './VoiceControls';
import { useState } from 'react';

interface AssistantMessageProps {
  message: Message;
  isStreaming?: boolean;
}

export function AssistantMessage({ message, isStreaming = false }: AssistantMessageProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleSpeakMessage = () => {
    // Extract plain text from markdown content for TTS
    const plainText = message.content?.replace(/[#*`_~\[\]()]/g, '') || '';
    return plainText;
  };

  return (
    <div className="flex justify-start mb-4">
      <div 
        className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 max-w-[80%] shadow-sm relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
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

        {/* Message actions */}
        <div className="flex items-center justify-between mt-2">
          {/* Timestamp */}
          <div className="text-xs text-muted-foreground">
            {!isStreaming && new Date(message.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>

          {/* Voice controls - only show on hover and when not streaming */}
          {!isStreaming && isHovered && message.content && (
            <VoiceControls
              onSpeakText={handleSpeakMessage}
              className="opacity-70 hover:opacity-100 transition-opacity"
            />
          )}
        </div>

        {/* Streaming indicator */}
        {isStreaming && (
          <div className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
        )}
      </div>
    </div>
  );
}