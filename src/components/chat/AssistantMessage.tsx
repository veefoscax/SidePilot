/**
 * AssistantMessage Component
 * 
 * Displays assistant messages with modern chat UI patterns.
 * Follows proven UX patterns with hidden timestamps, message grouping, and clean layout.
 */

import { useState } from 'react';
import { type Message } from '@/stores/chat';
import { Markdown } from './Markdown';
import { ToolUseCard } from './ToolUseCard';
import { VoiceControls } from './VoiceControls';

interface AssistantMessageProps {
  message: Message;
  isStreaming?: boolean;
  isGrouped?: boolean;
  showTimestamp?: boolean;
}

export function AssistantMessage({ 
  message, 
  isStreaming = false, 
  isGrouped = false,
  showTimestamp = false 
}: AssistantMessageProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleSpeakMessage = () => {
    // Extract plain text from markdown content for TTS
    const plainText = message.content?.replace(/[#*`_~\[\]()]/g, '') || '';
    return plainText;
  };

  return (
    <div className={`flex justify-start group ${isGrouped ? 'mb-1' : 'mb-3'}`}>
      <div className="flex flex-col items-start max-w-[80%]">
        {/* Timestamp - shown on hover or when explicitly requested */}
        {(showTimestamp || isHovered) && !isStreaming && (
          <div className="text-xs text-muted-foreground mb-1 px-1">
            {new Date(message.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        )}
        
        {/* Message bubble */}
        <div 
          className={`bg-muted px-4 py-2.5 shadow-sm relative transition-all duration-200 hover:shadow-md ${
            isGrouped 
              ? 'rounded-2xl rounded-bl-md' 
              : 'rounded-2xl rounded-bl-sm'
          }`}
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

          {/* Voice controls - only show on hover and when not streaming */}
          {!isStreaming && isHovered && message.content && (
            <div className="absolute -right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <VoiceControls
                onSpeakText={handleSpeakMessage}
                className="bg-background/80 backdrop-blur-sm rounded-full p-1 shadow-sm"
              />
            </div>
          )}

          {/* Streaming indicator */}
          {isStreaming && (
            <div className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
          )}
        </div>
      </div>
    </div>
  );
}