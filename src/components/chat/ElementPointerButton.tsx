/**
 * ElementPointerButton Component
 * 
 * Button to activate element pointer mode in the active tab.
 * Allows users to point at elements on a web page for AI agent interaction.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ElementPointerMessageType } from '@/lib/element-pointer';

interface ElementPointerButtonProps {
  disabled?: boolean;
  onElementPointed?: (elementContext: string) => void;
}

export function ElementPointerButton({
  disabled = false,
  onElementPointed
}: ElementPointerButtonProps) {
  const [isActive, setIsActive] = useState(false);

  const handleActivate = async () => {
    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab || !tab.id) {
        toast.error('No active tab found');
        return;
      }

      // Check if tab URL is accessible
      if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://')) {
        toast.error('Element pointer cannot be used on browser internal pages');
        return;
      }

      // Send message to content script to activate pointer
      await chrome.tabs.sendMessage(tab.id, {
        type: ElementPointerMessageType.ACTIVATE
      });

      setIsActive(true);
      toast.success('🎯 Element pointer activated. Click an element on the page.');
    } catch (error) {
      console.error('Failed to activate element pointer:', error);
      
      // Provide specific error messages
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Receiving end does not exist')) {
        toast.error('Content script not loaded. Please refresh the page and try again.');
      } else if (errorMessage.includes('Cannot access')) {
        toast.error('Cannot access this page. Try a regular website.');
      } else {
        toast.error('Failed to activate element pointer. Make sure the page is fully loaded.');
      }
    }
  };

  return (
    <Button
      size="icon"
      variant={isActive ? 'default' : 'ghost'}
      onClick={handleActivate}
      disabled={disabled}
      title="Point at element"
      className="h-9 w-9 shrink-0"
    >
      🎯
    </Button>
  );
}
