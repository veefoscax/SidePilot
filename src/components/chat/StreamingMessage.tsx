/**
 * StreamingMessage Component
 * 
 * Displays streaming assistant messages with live reasoning updates.
 * Shows both content and reasoning as they stream in real-time.
 */

import { useChatStore } from '@/stores/chat';
import { Markdown } from './Markdown';
import { ReasoningDisplay } from './ReasoningDisplay';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';

export function StreamingMessage() {
  const { 
    streamingContent, 
    streamingReasoning, 
    isStreaming,
    cancelStreaming 
  } = useChatStore();

  if (!isStreaming) {
    return null;
  }

  return (
    <div className="flex justify-start mb-4">
      <div className="flex flex-col items-start max-w-[85%]">
        <div className="bg-muted px-4 py-2.5 shadow-sm rounded-2xl rounded-bl-md relative">
          {/* Streaming content */}
          {streamingContent && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <Markdown content={streamingContent} />
            </div>
          )}
          
          {/* Streaming cursor */}
          <div className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
          
          {/* Cancel button */}
          <div className="absolute -right-2 top-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelStreaming}
              className="h-6 w-6 p-0 bg-background/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-destructive hover:text-destructive-foreground"
              title="Cancel response"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {/* Streaming reasoning */}
        {streamingReasoning && (
          <div className="w-full mt-2">
            <ReasoningDisplay 
              reasoning={streamingReasoning} 
              isStreaming={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}