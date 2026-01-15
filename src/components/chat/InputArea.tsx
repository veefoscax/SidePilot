/**
 * InputArea Component
 * 
 * Chat input interface with multiline textarea and send functionality.
 * Handles Enter/Shift+Enter key combinations and streaming state.
 * Integrates slash menu for shortcuts and commands.
 */

import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VoiceControls } from './VoiceControls';
import { SlashMenu } from './SlashMenu';
import { ShortcutEditor } from './ShortcutEditor';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon, Clock01Icon } from '@hugeicons/core-free-icons';
import { useChatStore } from '@/stores/chat';
import { useShortcutsStore } from '@/stores/shortcuts';
import { SlashMenuItem } from '@/lib/shortcuts';

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
  const menuRef = useRef<HTMLDivElement>(null);
  const { messageQueue, queueMessage, isStreaming } = useChatStore();
  const { recordUsage, getById } = useShortcutsStore();

  // Slash menu state
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashPosition, setSlashPosition] = useState(0);

  // Shortcut editor state
  const [showShortcutEditor, setShowShortcutEditor] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  // Close slash menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showSlashMenu &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowSlashMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSlashMenu]);

  // Detect "/" in input to show slash menu
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;

    setInput(newValue);

    // Check if user just typed "/" at the start or after a space
    if (cursorPosition > 0) {
      const charBeforeCursor = newValue[cursorPosition - 1];
      const charBeforeSlash = cursorPosition > 1 ? newValue[cursorPosition - 2] : '';

      console.log('[SlashMenu Debug] char:', charBeforeCursor, 'prev:', charBeforeSlash, 'pos:', cursorPosition);

      if (charBeforeCursor === '/' && (cursorPosition === 1 || charBeforeSlash === ' ' || charBeforeSlash === '\n')) {
        console.log('[SlashMenu Debug] TRIGGER! Showing slash menu');
        setShowSlashMenu(true);
        setSlashPosition(cursorPosition - 1);
        setSlashQuery('');
      } else if (showSlashMenu) {
        // Update query if slash menu is open
        const textAfterSlash = newValue.slice(slashPosition + 1, cursorPosition);

        // Close menu if user moved cursor away or deleted the slash
        if (cursorPosition <= slashPosition || newValue[slashPosition] !== '/') {
          setShowSlashMenu(false);
        } else if (textAfterSlash.includes(' ') || textAfterSlash.includes('\n')) {
          // Close menu if user typed space or newline
          setShowSlashMenu(false);
        } else {
          setSlashQuery(textAfterSlash);
        }
      }
    }
  };

  const handleSend = () => {
    const trimmedInput = input.trim();
    if (trimmedInput) {
      // Expand shortcut chips before sending
      const expandedInput = expandShortcutChips(trimmedInput);

      if (isStreaming) {
        // Queue the message if currently streaming
        queueMessage(expandedInput);
        setInput('');

        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      } else if (!disabled) {
        // Send immediately if not streaming
        onSend(expandedInput);
        setInput('');

        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    }
  };

  // Expand shortcut chips in the message
  const expandShortcutChips = (message: string): string => {
    // Replace [[shortcut:id:name]] with the actual prompt
    return message.replace(/\[\[shortcut:([^:]+):([^\]]+)\]\]/g, (match, id, name) => {
      const shortcut = getById(id);
      if (shortcut) {
        // Record usage
        recordUsage(id);
        return shortcut.prompt;
      }
      return match;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Don't handle Enter if slash menu is open (let the menu handle it)
    if (showSlashMenu && (e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Escape')) {
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle slash menu item selection
  const handleSlashMenuSelect = (item: SlashMenuItem) => {
    if (item.action === 'chip') {
      // Insert chip at slash position
      const before = input.slice(0, slashPosition);
      const after = input.slice(textareaRef.current?.selectionStart || slashPosition);

      // For system commands, use the item id; for shortcuts, use the shortcut id
      const shortcut = item.groupId === 'shortcuts' ? getById(item.id) : null;
      const chipId = shortcut?.id || item.id;
      const chipName = shortcut?.command || item.name.toLowerCase();

      const chip = `[[shortcut:${chipId}:${chipName}]]`;
      const newInput = before + chip + ' ' + after;

      setInput(newInput);
      setShowSlashMenu(false);

      // Focus textarea and move cursor after the chip
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = before.length + chip.length + 1;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    } else if (item.action === 'open-modal') {
      // Handle modal actions
      setShowSlashMenu(false);

      if (item.id === 'create-shortcut') {
        setEditorMode('create');
        setShowShortcutEditor(true);
      } else if (item.id === 'manage-shortcuts') {
        // TODO: Open shortcuts management (could be a settings tab)
        console.log('Manage shortcuts - TODO');
      } else if (item.id === 'record-workflow') {
        // TODO: Open workflow recorder
        console.log('Record workflow - TODO');
      }
    }
  };

  // Handle slash menu close
  const handleSlashMenuClose = () => {
    setShowSlashMenu(false);
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
        {/* Slash Menu - positioned above input */}
        {console.log('[SlashMenu Render] showSlashMenu:', showSlashMenu, 'query:', slashQuery)}
        {showSlashMenu && (
          <div
            ref={menuRef}
            className="absolute bottom-full left-0 mb-2 w-full max-w-md z-50 bg-popover border rounded-lg shadow-lg"
          >
            <SlashMenu
              query={slashQuery}
              onSelect={handleSlashMenuSelect}
              onClose={handleSlashMenuClose}
            />
          </div>
        )}

        <div className="flex gap-2 items-end">
          {/* Textarea */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
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

      {/* Shortcut Editor Modal */}
      <ShortcutEditor
        open={showShortcutEditor}
        onOpenChange={setShowShortcutEditor}
        mode={editorMode}
        onSuccess={() => {
          // Optionally refresh shortcuts or show success message
          console.log('Shortcut saved successfully');
        }}
      />
    </div>
  );
}