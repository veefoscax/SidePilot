/**
 * ShortcutEditor Usage Example
 * 
 * This file demonstrates how to use the ShortcutEditor component
 * in different scenarios.
 */

import * as React from 'react';
import { ShortcutEditor } from './ShortcutEditor';
import { Button } from '@/components/ui/button';
import type { SavedPrompt } from '@/lib/shortcuts';

/**
 * Example: Create new shortcut
 */
export function CreateShortcutExample() {
  const [open, setOpen] = React.useState(false);

  const handleSuccess = (shortcut: SavedPrompt) => {
    console.log('Shortcut created:', shortcut);
    // You can add additional logic here, like showing a toast notification
  };

  return (
    <div>
      <Button onClick={() => setOpen(true)}>
        Create New Shortcut
      </Button>

      <ShortcutEditor
        open={open}
        onOpenChange={setOpen}
        mode="create"
        onSuccess={handleSuccess}
      />
    </div>
  );
}

/**
 * Example: Edit existing shortcut
 */
export function EditShortcutExample() {
  const [open, setOpen] = React.useState(false);

  // Example shortcut to edit
  const existingShortcut: SavedPrompt = {
    id: 'example-123',
    command: 'screenshot',
    name: 'Take Screenshot',
    prompt: 'Take a screenshot of the current page and describe what you see.',
    usageCount: 10,
    createdAt: Date.now() - 86400000, // 1 day ago
    updatedAt: Date.now() - 3600000,  // 1 hour ago
  };

  const handleSuccess = (shortcut: SavedPrompt) => {
    console.log('Shortcut updated:', shortcut);
    // You can add additional logic here, like showing a toast notification
  };

  return (
    <div>
      <Button onClick={() => setOpen(true)}>
        Edit Shortcut
      </Button>

      <ShortcutEditor
        open={open}
        onOpenChange={setOpen}
        mode="edit"
        shortcut={existingShortcut}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

/**
 * Example: Integration with SlashMenu
 * 
 * This shows how the ShortcutEditor can be triggered from the SlashMenu
 * when the user selects "Create shortcut" action.
 */
export function SlashMenuIntegrationExample() {
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editorMode, setEditorMode] = React.useState<'create' | 'edit'>('create');
  const [selectedShortcut, setSelectedShortcut] = React.useState<SavedPrompt | undefined>();

  const handleSlashMenuSelect = (itemId: string) => {
    if (itemId === 'create-shortcut') {
      setEditorMode('create');
      setSelectedShortcut(undefined);
      setEditorOpen(true);
    } else if (itemId === 'manage-shortcuts') {
      // Open shortcuts management UI
      console.log('Open shortcuts management');
    }
  };

  const handleEditShortcut = (shortcut: SavedPrompt) => {
    setEditorMode('edit');
    setSelectedShortcut(shortcut);
    setEditorOpen(true);
  };

  return (
    <div>
      {/* Your SlashMenu component would call handleSlashMenuSelect */}
      <Button onClick={() => handleSlashMenuSelect('create-shortcut')}>
        Trigger Create from Menu
      </Button>

      <ShortcutEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        mode={editorMode}
        shortcut={selectedShortcut}
        onSuccess={(shortcut) => {
          console.log('Shortcut saved:', shortcut);
          // Optionally refresh shortcuts list or show notification
        }}
      />
    </div>
  );
}

/**
 * Example: With URL navigation
 * 
 * This shows how to create a shortcut that includes URL navigation.
 */
export function NavigationShortcutExample() {
  const [open, setOpen] = React.useState(false);

  return (
    <div>
      <Button onClick={() => setOpen(true)}>
        Create Navigation Shortcut
      </Button>

      <ShortcutEditor
        open={open}
        onOpenChange={setOpen}
        mode="create"
        onSuccess={(shortcut) => {
          console.log('Navigation shortcut created:', shortcut);
          // The shortcut will include a URL that can be used to navigate
          // before executing the prompt
          if (shortcut.url) {
            console.log('Will navigate to:', shortcut.url);
          }
        }}
      />
    </div>
  );
}
