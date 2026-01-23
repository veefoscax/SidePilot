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

      // Send message to content script to activate pointer
      await chrome.tabs.sendMessage(tab.id, {
        type: ElementPointerMessageType.ACTIVATE
      });

      setIsActive(true);
      toast.success('🎯 Element pointer activated. Click an element on the page.');
    } catch (error) {
      console.error('Failed to activate element pointer:', error);
      toast.error('Failed to activate element pointer. Make sure the page is loaded.');
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
