/**
 * ShortcutEditor Component
 * 
 * Modal dialog for creating and editing shortcuts.
 * Provides form inputs for command, prompt, and optional URL with validation.
 */

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useShortcutsStore, ShortcutValidationError } from '@/stores/shortcuts';
import { SavedPrompt } from '@/lib/shortcuts';
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon } from '@hugeicons/core-free-icons';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ShortcutEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  shortcut?: SavedPrompt;
  onSuccess?: (shortcut: SavedPrompt) => void;
}

/**
 * ShortcutEditor modal component
 */
export function ShortcutEditor({
  open,
  onOpenChange,
  mode,
  shortcut,
  onSuccess,
}: ShortcutEditorProps) {
  const { createShortcut, updateShortcut } = useShortcutsStore();
  
  // Form state
  const [command, setCommand] = React.useState('');
  const [name, setName] = React.useState('');
  const [prompt, setPrompt] = React.useState('');
  const [url, setUrl] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Initialize form when shortcut changes or dialog opens
  React.useEffect(() => {
    if (open) {
      if (mode === 'edit' && shortcut) {
        setCommand(shortcut.command);
        setName(shortcut.name || '');
        setPrompt(shortcut.prompt);
        setUrl(shortcut.url || '');
      } else {
        // Reset form for create mode
        setCommand('');
        setName('');
        setPrompt('');
        setUrl('');
      }
      setError(null);
      setIsSubmitting(false);
    }
  }, [open, mode, shortcut]);
  
  // Handle command input - enforce lowercase and no spaces
  const handleCommandChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/\s+/g, '-');
    setCommand(value);
    setError(null);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      if (mode === 'create') {
        const newShortcut = await createShortcut({
          command,
          name: name.trim() || undefined,
          prompt,
          url: url.trim() || undefined,
        });
        onSuccess?.(newShortcut);
        onOpenChange(false);
      } else if (mode === 'edit' && shortcut) {
        await updateShortcut(shortcut.id, {
          command,
          name: name.trim() || undefined,
          prompt,
          url: url.trim() || undefined,
        });
        onSuccess?.({ ...shortcut, command, name, prompt, url });
        onOpenChange(false);
      }
    } catch (err) {
      if (err instanceof ShortcutValidationError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
        console.error('Shortcut save error:', err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle cancel
  const handleCancel = () => {
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Shortcut' : 'Edit Shortcut'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a new shortcut to quickly access common prompts.'
              : 'Update your shortcut details.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <HugeiconsIcon icon={Alert02Icon} className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="command">
              Command <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">/</span>
              <Input
                id="command"
                value={command}
                onChange={handleCommandChange}
                placeholder="my-shortcut"
                required
                disabled={isSubmitting}
                className="flex-1"
                autoComplete="off"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Lowercase letters, numbers, hyphens, and underscores only. No spaces.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Shortcut (optional)"
              disabled={isSubmitting}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Optional friendly name shown in the menu.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="prompt">
              Prompt <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter the prompt text that will be sent when this shortcut is used.&#10;&#10;Example: Analyze the current page for accessibility issues and provide recommendations."
              required
              disabled={isSubmitting}
              className="min-h-[120px] resize-y"
            />
            <p className="text-xs text-muted-foreground">
              The prompt that will be sent when you use this shortcut.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="url">URL (Optional)</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              disabled={isSubmitting}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Optional URL to navigate to before executing the prompt.
            </p>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !command.trim() || !prompt.trim()}>
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
