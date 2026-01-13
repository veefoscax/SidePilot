/**
 * UserMessage Component
 * 
 * Displays user messages with distinct styling from assistant messages.
 * Uses primary color scheme to differentiate from assistant responses.
 */

import { type Message } from '@/stores/chat';

interface UserMessageProps {
  message: Message;
}

export function UserMessage({ message }: UserMessageProps) {
  return (
    <div className="flex justify-end mb-4">
      <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-3 max-w-[80%] shadow-sm">
        <div className="whitespace-pre-wrap break-words">
          {message.content}
        </div>
        <div className="text-xs opacity-70 mt-2">
          {new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
}