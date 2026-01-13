/**
 * ToolUseCard Component
 * 
 * Displays tool usage information with expandable input/output details.
 * Shows status badges and screenshot results when available.
 */

import { useState } from 'react';
import { type ToolCall, type ToolResult } from '@/stores/chat';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  ChevronDown, 
  ChevronUp, 
  Settings02Icon,
  Loading03Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon
} from '@hugeicons/core-free-icons';

interface ToolUseCardProps {
  toolCall: ToolCall;
  result?: ToolResult;
}

export function ToolUseCard({ toolCall, result }: ToolUseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get status badge variant and icon
  const getStatusInfo = (status: ToolCall['status']) => {
    switch (status) {
      case 'pending':
        return {
          variant: 'secondary' as const,
          icon: Loading03Icon,
          label: 'Pending'
        };
      case 'executing':
        return {
          variant: 'default' as const,
          icon: Loading03Icon,
          label: 'Executing'
        };
      case 'complete':
        return {
          variant: 'default' as const,
          icon: CheckmarkCircle01Icon,
          label: 'Complete'
        };
      case 'error':
        return {
          variant: 'destructive' as const,
          icon: Cancel01Icon,
          label: 'Error'
        };
    }
  };

  const statusInfo = getStatusInfo(toolCall.status);

  // Get tool icon based on tool name
  const getToolIcon = (toolName: string) => {
    // For now, use a generic settings icon
    // In the future, this could map to specific tool icons
    return Settings02Icon;
  };

  const ToolIcon = getToolIcon(toolCall.name);

  return (
    <Card className="bg-background/50 border-muted">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <HugeiconsIcon icon={ToolIcon} className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{toolCall.name}</span>
          <Badge variant={statusInfo.variant} className="text-xs">
            <HugeiconsIcon 
              icon={statusInfo.icon} 
              className={`h-3 w-3 mr-1 ${toolCall.status === 'executing' ? 'animate-spin' : ''}`} 
            />
            {statusInfo.label}
          </Badge>
        </div>
        
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <HugeiconsIcon 
            icon={isExpanded ? ChevronUp : ChevronDown} 
            className="h-3 w-3" 
          />
        </Button>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-muted px-3 pb-3">
          {/* Tool input */}
          <div className="mt-3">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Input</h4>
            <pre className="text-xs bg-muted/50 rounded p-2 overflow-x-auto">
              {JSON.stringify(toolCall.input, null, 2)}
            </pre>
          </div>

          {/* Tool output */}
          {result && (
            <div className="mt-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Output</h4>
              
              {result.error ? (
                <div className="text-xs bg-destructive/10 text-destructive rounded p-2">
                  {result.error}
                </div>
              ) : result.output ? (
                <pre className="text-xs bg-muted/50 rounded p-2 overflow-x-auto">
                  {result.output}
                </pre>
              ) : (
                <div className="text-xs text-muted-foreground italic">
                  No output available
                </div>
              )}
            </div>
          )}

          {/* Screenshot */}
          {result?.screenshot && (
            <div className="mt-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Screenshot</h4>
              <img 
                src={result.screenshot} 
                alt="Tool execution screenshot"
                className="max-w-full rounded border border-muted"
              />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}