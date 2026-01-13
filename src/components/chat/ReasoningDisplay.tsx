/**
 * ReasoningDisplay Component
 * 
 * Expandable component for displaying AI reasoning/thinking content.
 * Shows a collapsible section with the model's internal reasoning process.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, ArrowUp01Icon, BrainIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';

interface ReasoningDisplayProps {
  reasoning: string;
  isStreaming?: boolean;
  className?: string;
}

export function ReasoningDisplay({ 
  reasoning, 
  isStreaming = false, 
  className 
}: ReasoningDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  console.log('🧠 ReasoningDisplay render:', { 
    hasReasoning: !!reasoning, 
    reasoningLength: reasoning?.length || 0, 
    isStreaming, 
    isExpanded 
  });

  if (!reasoning && !isStreaming) {
    console.log('🧠 ReasoningDisplay: No reasoning content, not rendering');
    return null;
  }

  const handleToggle = () => {
    console.log('🧠 Reasoning toggle clicked:', { 
      isExpanded, 
      reasoning: reasoning?.substring(0, 50) + '...' 
    });
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={cn("mt-3", className)}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-2 w-full justify-start text-left hover:bg-muted/50"
            onClick={handleToggle}
          >
            <div className="flex items-center gap-2 w-full">
              <HugeiconsIcon 
                icon={BrainIcon} 
                className="h-3 w-3 text-muted-foreground shrink-0" 
              />
              <span className="text-xs text-muted-foreground flex-1">
                {isStreaming ? 'Thinking...' : `View reasoning (${reasoning?.length || 0} chars)`}
              </span>
              {!isStreaming && (
                <HugeiconsIcon 
                  icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon} 
                  className="h-3 w-3 text-muted-foreground shrink-0" 
                />
              )}
              {isStreaming && (
                <div className="flex gap-1 shrink-0">
                  <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                </div>
              )}
            </div>
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-2">
          <div className="bg-muted/30 rounded-lg p-3 border-l-2 border-primary/20">
            <div className="text-xs text-muted-foreground font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
              {reasoning || (isStreaming ? 'Processing...' : 'No reasoning available')}
              {isStreaming && (
                <span className="inline-block w-2 h-3 bg-primary animate-pulse ml-1" />
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}