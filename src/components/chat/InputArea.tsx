/**
 * InputArea Component
 * 
 * Chat input interface with multiline textarea and send functionality.
 * Handles Enter/Shift+Enter key combinations and streaming state.
 */

import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VoiceControls } from './VoiceControls';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon, Clock01Icon } from '@hugeicons/core-free-icons';
import { useChatStore } from '@/stores/chat';

interface InputAreaProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function InputArea({ 
  onSend, 
  disabled = false, 
  placeholder = "Message..." 
}: InputAreaProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { messageQueue, queueMessage, isStreaming } = useChatStore();

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSend = () => {
    const trimmedInput = input.trim();
    if (trimmedInput) {
      if (isStreaming) {
        // Queue the message if currently streaming
        queueMessage(trimmedInput);
        setInput('');
        
        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      } else if (!disabled) {
        // Send immediately if not streaming
        onSend(trimmedInput);
        setInput('');
        
        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    // Append voice transcript to current input
    setInput(prev => prev + (prev ? ' ' : '') + transcript);
    
    // Focus textarea after voice input
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const canSend = input.trim().length > 0;

  return (
    <div className="border-t bg-background p-4">
      {/* Queued messages indicator */}
      {messageQueue.length > 0 && (
        <div className="max-w-4xl mx-auto mb-2">
          <Badge variant="secondary" className="text-xs">
            <HugeiconsIcon icon={Clock01Icon} className="h-3 w-3 mr-1" />
            {messageQueue.length} message{messageQueue.length > 1 ? 's' : ''} queued
          </Badge>
        </div>
      )}
      
      <div className="relative max-w-4xl mx-auto">
        <div className="flex gap-2 items-end">
          {/* Textarea */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isStreaming 
                  ? "Type to queue next message..." 
                  : disabled 
                    ? "AI is responding..." 
                    : placeholder
              }
              disabled={disabled && !isStreaming}
              className="min-h-[44px] max-h-32 resize-none pr-20"
              rows={1}
            />
            
            {/* Voice controls in textarea */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              <VoiceControls
                onTranscript={handleVoiceTranscript}
                disabled={disabled && !isStreaming}
                className="mr-1"
              />
              
              {/* Character count (optional, for very long messages) */}
              {input.length > 500 && (
                <div className="text-xs text-muted-foreground bg-background/80 px-1 rounded">
                  {input.length}
                </div>
              )}
            </div>
          </div>

          {/* Send button */}
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!canSend}
            className="h-11 w-11 shrink-0"
          >
            <HugeiconsIcon icon={ArrowRight01Icon} className="h-4 w-4" />
          </Button>
        </div>

        {/* Keyboard shortcut hint */}
        <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
          <span>
            Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to {isStreaming ? 'queue' : 'send'}, 
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs ml-1">Shift + Enter</kbd> for new line
          </span>
          
          {isStreaming && (
            <span className="text-primary">AI is typing...</span>
          )}
        </div>
      </div>
    </div>
  );
}