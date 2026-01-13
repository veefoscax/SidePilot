/**
 * UserMessage Component
 * 
 * Displays user messages with modern chat UI patterns.
 * Follows iMessage/WhatsApp style with hidden timestamps and message grouping.
 */

import { useState } from 'react';
import { type Message } from '@/stores/chat';

interface UserMessageProps {
  message: Message;
  isGrouped?: boolean;
  showTimestamp?: boolean;
}

export function UserMessage({ message, isGrouped = false, showTimestamp = false }: UserMessageProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className={`flex justify-end group ${isGrouped ? 'mb-1' : 'mb-3'}`}>
      <div className="flex flex-col items-end max-w-[80%]">
        {/* Timestamp - shown on hover or when explicitly requested */}
        {(showTimestamp || isHovered) && (
          <div className="text-xs text-muted-foreground mb-1 px-1">
            {new Date(message.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        )}
        
        {/* Message bubble */}
        <div 
          className={`bg-primary text-primary-foreground px-4 py-2.5 shadow-sm transition-all duration-200 hover:shadow-md ${
            isGrouped 
              ? 'rounded-2xl rounded-br-md' 
              : 'rounded-2xl rounded-br-sm'
          }`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {message.content || 'No content'}
          </div>
        </div>
      </div>
    </div>
  );
}