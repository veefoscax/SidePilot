/**
 * SlashMenu Component
 * 
 * Displays a command menu when user types "/" in the chat input.
 * Shows system commands, user shortcuts, and action items with
 * real-time filtering and keyboard navigation.
 */

import * as React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Camera01Icon,
  Navigation01Icon,
  FileSearchIcon,
  Code01Icon,
  Bug01Icon,
  Analytics01Icon,
  Add01Icon,
  Settings02Icon,
  VideoReplayIcon,
} from '@hugeicons/core-free-icons';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useShortcutsStore } from '@/stores/shortcuts';
import { SlashMenuItem } from '@/lib/shortcuts';

interface SlashMenuProps {
  query: string;
  onSelect: (item: SlashMenuItem) => void;
  onClose: () => void;
  className?: string;
}

/**
 * System command icons mapping
 */
const SYSTEM_ICONS: Record<string, any> = {
  screenshot: Camera01Icon,
  navigate: Navigation01Icon,
  summarize: FileSearchIcon,
  extract: FileSearchIcon,
  debug: Bug01Icon,
  analyze: Analytics01Icon,
};

/**
 * SlashMenu component with keyboard navigation and filtering
 */
export function SlashMenu({ query, onSelect, onClose, className }: SlashMenuProps) {
  const { shortcuts } = useShortcutsStore();
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  
  // Build menu items from system commands, user shortcuts, and actions
  const items: SlashMenuItem[] = React.useMemo(() => {
    const systemItems: SlashMenuItem[] = [
      {
        id: 'screenshot',
        name: 'Screenshot',
        icon: Camera01Icon,
        action: 'chip',
        groupId: 'system',
        keywords: 'screenshot capture image photo',
      },
      {
        id: 'navigate',
        name: 'Navigate',
        icon: Navigation01Icon,
        action: 'chip',
        groupId: 'system',
        keywords: 'navigate go url link',
      },
      {
        id: 'summarize',
        name: 'Summarize',
        icon: FileSearchIcon,
        action: 'chip',
        groupId: 'system',
        keywords: 'summarize summary tldr',
      },
      {
        id: 'extract',
        name: 'Extract',
        icon: FileSearchIcon,
        action: 'chip',
        groupId: 'system',
        keywords: 'extract data information',
      },
      {
        id: 'debug',
        name: 'Debug',
        icon: Bug01Icon,
        action: 'chip',
        groupId: 'system',
        keywords: 'debug error console',
      },
      {
        id: 'analyze',
        name: 'Analyze',
        icon: Analytics01Icon,
        action: 'chip',
        groupId: 'system',
        keywords: 'analyze analysis performance',
      },
    ];
    
    // User shortcuts
    const shortcutItems: SlashMenuItem[] = shortcuts.map(s => ({
      id: s.id,
      name: s.name || s.command,
      action: 'chip' as const,
      groupId: 'shortcuts' as const,
      keywords: `${s.command} ${s.name || ''} ${s.prompt}`.toLowerCase(),
    }));
    
    // Action items
    const actionItems: SlashMenuItem[] = [
      {
        id: 'record-workflow',
        name: 'Record workflow',
        icon: VideoReplayIcon,
        action: 'open-modal',
        groupId: 'actions',
        keywords: 'record workflow automation',
      },
      {
        id: 'create-shortcut',
        name: 'Create shortcut',
        icon: Add01Icon,
        action: 'open-modal',
        groupId: 'actions',
        keywords: 'create new shortcut command',
      },
      {
        id: 'manage-shortcuts',
        name: 'Manage shortcuts',
        icon: Settings02Icon,
        action: 'open-modal',
        groupId: 'actions',
        keywords: 'manage settings shortcuts',
      },
    ];
    
    return [...systemItems, ...shortcutItems, ...actionItems];
  }, [shortcuts]);
  
  // Filter items based on query
  const filteredItems = React.useMemo(() => {
    if (!query.trim()) {
      return items;
    }
    
    const lowerQuery = query.toLowerCase();
    return items.filter(item => {
      const nameMatch = item.name.toLowerCase().includes(lowerQuery);
      const keywordsMatch = item.keywords?.toLowerCase().includes(lowerQuery);
      return nameMatch || keywordsMatch;
    });
  }, [items, query]);
  
  // Group filtered items
  const groupedItems = React.useMemo(() => {
    const groups: Record<string, SlashMenuItem[]> = {
      system: [],
      shortcuts: [],
      actions: [],
    };
    
    filteredItems.forEach(item => {
      groups[item.groupId].push(item);
    });
    
    return groups;
  }, [filteredItems]);
  
  // Reset selected index when filtered items change
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems]);
  
  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredItems.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          onSelect(filteredItems[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredItems, selectedIndex, onSelect, onClose]);
  
  // Handle item selection
  const handleSelect = (item: SlashMenuItem) => {
    onSelect(item);
  };
  
  return (
    <Command className={className}>
      <CommandList>
        <CommandEmpty>No commands found.</CommandEmpty>
        
        {groupedItems.system.length > 0 && (
          <CommandGroup heading="System">
            {groupedItems.system.map((item, index) => {
              const globalIndex = filteredItems.indexOf(item);
              const Icon = item.icon;
              
              return (
                <CommandItem
                  key={item.id}
                  value={item.name}
                  onSelect={() => handleSelect(item)}
                  data-selected={globalIndex === selectedIndex}
                  className="cursor-pointer"
                >
                  {Icon && <HugeiconsIcon icon={Icon} className="h-4 w-4" />}
                  <span>/{item.name.toLowerCase()}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
        
        {groupedItems.shortcuts.length > 0 && (
          <CommandGroup heading="Shortcuts">
            {groupedItems.shortcuts.map((item, index) => {
              const globalIndex = filteredItems.indexOf(item);
              const shortcut = shortcuts.find(s => s.id === item.id);
              
              return (
                <CommandItem
                  key={item.id}
                  value={item.name}
                  onSelect={() => handleSelect(item)}
                  data-selected={globalIndex === selectedIndex}
                  className="cursor-pointer"
                >
                  <span>/{shortcut?.command || item.name.toLowerCase()}</span>
                  {shortcut?.usageCount ? (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {shortcut.usageCount} uses
                    </span>
                  ) : null}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
        
        {groupedItems.actions.length > 0 && (
          <CommandGroup heading="Actions">
            {groupedItems.actions.map((item, index) => {
              const globalIndex = filteredItems.indexOf(item);
              const Icon = item.icon;
              
              return (
                <CommandItem
                  key={item.id}
                  value={item.name}
                  onSelect={() => handleSelect(item)}
                  data-selected={globalIndex === selectedIndex}
                  className="cursor-pointer"
                >
                  {Icon && <HugeiconsIcon icon={Icon} className="h-4 w-4" />}
                  <span>{item.name}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );
}
