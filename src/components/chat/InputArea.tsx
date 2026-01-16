/**
 * InputArea Component
 * 
 * Chat input interface with multiline textarea and send functionality.
 * Handles Enter/Shift+Enter key combinations and streaming state.
 * Integrates slash menu for shortcuts and commands.
 */

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VoiceControls } from './VoiceControls';
import { SlashMenu } from './SlashMenu';
import { ShortcutEditor } from './ShortcutEditor';
import { WorkflowEditor } from '@/components/WorkflowEditor';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon, Clock01Icon } from '@hugeicons/core-free-icons';
import { useChatStore } from '@/stores/chat';
import { useShortcutsStore } from '@/stores/shortcuts';
import { useWorkflowStore } from '@/stores/workflow';
import { SlashMenuItem } from '@/lib/shortcuts';
import { WorkflowRecording } from '@/lib/workflow';
import { toast } from 'sonner';

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
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { messageQueue, queueMessage, isStreaming } = useChatStore();
  const { recordUsage, getById, getByCommand } = useShortcutsStore();
  const { startRecording, stopRecording, status: workflowStatus, currentRecording } = useWorkflowStore();

  // Slash menu state
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashPosition, setSlashPosition] = useState(0);

  // Shortcut editor state
  const [showShortcutEditor, setShowShortcutEditor] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');

  // Workflow editor state
  const [showWorkflowEditor, setShowWorkflowEditor] = useState(false);
  const [completedWorkflow, setCompletedWorkflow] = useState<WorkflowRecording | null>(null);

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

      if (charBeforeCursor === '/' && (cursorPosition === 1 || charBeforeSlash === ' ' || charBeforeSlash === '\n')) {
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
      const expandedInput = expandShortcutCommands(trimmedInput);

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

  // Expand shortcut commands in the message
  const expandShortcutCommands = (message: string): string => {
    // Replace /command with the actual prompt
    // Matches /word at start of string or after whitespace
    return message.replace(/(?:^|\s)(\/[a-z0-9_-]+)/gi, (match, command) => {
      const cmdWithoutSlash = command.slice(1).toLowerCase();
      const shortcut = getByCommand(cmdWithoutSlash);
      if (shortcut) {
        // Record usage
        recordUsage(shortcut.id);
        // Preserve leading whitespace from match, replace command with prompt
        return match.replace(command, shortcut.prompt);
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
      // Insert readable command at slash position
      const before = input.slice(0, slashPosition);
      const after = input.slice(textareaRef.current?.selectionStart || slashPosition);

      // For system commands, use the item id; for shortcuts, use the shortcut command
      const shortcut = item.groupId === 'shortcuts' ? getById(item.id) : null;
      const command = shortcut?.command || item.name.toLowerCase();

      // Insert /{command} (readable) instead of chip syntax
      // The command will be expanded to the full prompt when sent
      const commandText = `/${command}`;
      const newInput = before + commandText + ' ' + after;

      setInput(newInput);
      setShowSlashMenu(false);

      // Focus textarea and move cursor after the command
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = before.length + commandText.length + 1;
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
        // Start workflow recording
        handleStartRecording();
      }
    }
  };

  // Handle starting workflow recording
  const handleStartRecording = async () => {
    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        toast.error(t('workflow.error.noActiveTab'));
        return;
      }

      // Start recording
      await startRecording(tab.id);
      toast.success(t('workflow.recordingStarted'));
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error(error instanceof Error ? error.message : t('workflow.error.startFailed'));
    }
  };

  // Handle stopping workflow recording and opening editor
  const handleStopRecording = async () => {
    try {
      const workflow = await stopRecording();
      if (workflow) {
        setCompletedWorkflow(workflow);
        setShowWorkflowEditor(true);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      toast.error(error instanceof Error ? error.message : t('workflow.error.stopFailed'));
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
            {t('chat.messagesQueued', { count: messageQueue.length })}
          </Badge>
        </div>
      )}

      <div className="relative max-w-4xl mx-auto">
        {/* Slash Menu - positioned above input */}
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
                  ? t('chat.placeholder.queueNext')
                  : disabled
                    ? t('chat.placeholder.responding')
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
            {t('chat.keyboardHint.enter', { action: isStreaming ? t('chat.keyboardHint.queue') : t('chat.keyboardHint.send') })}
            {' '}
            {t('chat.keyboardHint.shiftEnter')}
          </span>

          {isStreaming && (
            <span className="text-primary">{t('chat.aiTyping')}</span>
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

      {/* Workflow Editor Modal */}
      <WorkflowEditor
        open={showWorkflowEditor}
        onOpenChange={setShowWorkflowEditor}
        workflow={completedWorkflow}
        onSuccess={(workflowId) => {
          toast.success(t('workflow.savedAsShortcut'));
          setCompletedWorkflow(null);
        }}
        onDiscard={() => {
          setCompletedWorkflow(null);
        }}
      />
    </div>
  );
}