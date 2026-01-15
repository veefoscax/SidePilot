/**
 * ShortcutChip Component
 * 
 * Renders shortcut references as clickable chips in chat messages.
 * Syntax: [[shortcut:id:name]]
 * 
 * Features:
 * - Displays as a compact chip with icon and command name
 * - Click to expand and show full prompt content in tooltip
 * - Integrates with shortcuts store to fetch prompt details
 * 
 * Usage:
 * To integrate into message rendering, use parseShortcutChips() to convert
 * message content containing [[shortcut:id:name]] syntax into React nodes:
 * 
 * @example
 * // In a message component:
 * const messageContent = "Use [[shortcut:123:screenshot]] to capture the page";
 * const parsedContent = parseShortcutChips(messageContent);
 * return <div>{parsedContent}</div>;
 * 
 * // This will render:
 * // "Use <ShortcutChip id="123" name="screenshot" /> to capture the page"
 */

import { useState, type ReactNode } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { SourceCodeIcon } from '@hugeicons/core-free-icons';
import { useShortcutsStore } from '@/stores/shortcuts';
import { SHORTCUT_CHIP_REGEX } from '@/lib/shortcuts';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface ShortcutChipProps {
  id: string;
  name: string;
}

/**
 * ShortcutChip - Renders a single shortcut chip
 */
export function ShortcutChip({ id, name }: ShortcutChipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { getById } = useShortcutsStore();
  const shortcut = getById(id);

  return (
    <TooltipProvider>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full cursor-pointer transition-all",
              "bg-primary/20 text-primary hover:bg-primary/30",
              "text-xs font-medium"
            )}
            onClick={() => setIsOpen(!isOpen)}
            data-testid={`shortcut-chip-${id}`}
          >
            <HugeiconsIcon icon={SourceCodeIcon} className="w-3 h-3" />
            /{name}
          </span>
        </TooltipTrigger>
        {shortcut && (
          <TooltipContent
            side="top"
            className="max-w-md p-3"
            sideOffset={8}
          >
            <div className="space-y-2">
              <div className="font-semibold text-sm">
                /{shortcut.command}
              </div>
              <pre className="text-xs whitespace-pre-wrap break-words font-mono bg-muted/50 p-2 rounded">
                {shortcut.prompt}
              </pre>
              {shortcut.url && (
                <div className="text-xs text-muted-foreground">
                  URL: {shortcut.url}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Used {shortcut.usageCount} {shortcut.usageCount === 1 ? 'time' : 'times'}
              </div>
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Parse message content and replace shortcut syntax with ShortcutChip components
 * 
 * @param content - Message content that may contain [[shortcut:id:name]] syntax
 * @returns Array of React nodes with text and ShortcutChip components
 * 
 * @example
 * parseShortcutChips("Use [[shortcut:123:screenshot]] to capture")
 * // Returns: ["Use ", <ShortcutChip id="123" name="screenshot" />, " to capture"]
 */
export function parseShortcutChips(content: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;

  // Use replace to iterate through all matches
  content.replace(SHORTCUT_CHIP_REGEX, (match, id, name, offset) => {
    // Add text before the match
    if (offset > lastIndex) {
      parts.push(content.slice(lastIndex, offset));
    }

    // Add the ShortcutChip component
    parts.push(<ShortcutChip key={`${id}-${offset}`} id={id} name={name} />);

    // Update lastIndex to after this match
    lastIndex = offset + match.length;

    return match;
  });

  // Add any remaining text after the last match
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  // If no matches were found, return the original content
  if (parts.length === 0) {
    parts.push(content);
  }

  return parts;
}

// Export for use in other components
export { SHORTCUT_CHIP_REGEX } from '@/lib/shortcuts';
