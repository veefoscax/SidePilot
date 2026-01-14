/**
 * Permission Dialog Component
 * 
 * Displays a permission request dialog for browser automation actions.
 * Shows tool name, domain, and action-specific details (screenshot, coordinates, text).
 * Allows user to approve/deny with option to remember choice.
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { usePermissionStore, type PermissionRequest } from '@/stores/permissions';

interface PermissionDialogProps {
  /** The permission request to display, or null to hide dialog */
  request: PermissionRequest | null;
  
  /** Callback when user approves the request */
  onApprove: (remember: boolean) => void;
  
  /** Callback when user denies the request */
  onDeny: (remember: boolean) => void;
}

/**
 * Permission Dialog Component
 * 
 * Displays a modal dialog requesting permission for a browser automation action.
 * Supports keyboard shortcuts: Enter to approve, Escape to deny.
 */
export function PermissionDialog({ request, onApprove, onDeny }: PermissionDialogProps) {
  const [remember, setRemember] = useState(false);
  
  // Reset remember checkbox when request changes
  useEffect(() => {
    setRemember(false);
  }, [request?.id]);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    if (!request) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter key to approve
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        onApprove(remember);
      }
      // Escape key to deny (handled by Dialog component, but we can add custom behavior)
      if (e.key === 'Escape') {
        e.preventDefault();
        onDeny(remember);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [request, remember, onApprove, onDeny]);
  
  if (!request) {
    return null;
  }
  
  return (
    <Dialog open={!!request} onOpenChange={(open) => {
      // If dialog is closed without explicit action, treat as deny
      if (!open) {
        onDeny(false);
      }
    }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Permission Required</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Permission request description */}
          <p className="text-sm">
            Allow <strong className="font-semibold text-foreground">{request.toolName}</strong> on{' '}
            <strong className="font-semibold text-foreground">{request.domain}</strong>?
          </p>
          
          {/* Screenshot with click indicator for mouse actions */}
          {request.actionData?.screenshot && (
            <div className="relative rounded-md border bg-muted overflow-hidden">
              <img 
                src={request.actionData.screenshot} 
                alt="Action context"
                className="w-full h-auto"
              />
              
              {/* Click indicator overlay */}
              {request.actionData.coordinate && (
                <div 
                  className="absolute w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg pointer-events-none"
                  style={{
                    left: `${request.actionData.coordinate[0]}px`,
                    top: `${request.actionData.coordinate[1]}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  aria-label={`Click target at coordinates ${request.actionData.coordinate[0]}, ${request.actionData.coordinate[1]}`}
                >
                  {/* Pulse animation for visibility */}
                  <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
                </div>
              )}
            </div>
          )}
          
          {/* Text preview for type actions */}
          {request.actionData?.text !== undefined && request.actionData.text !== '' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Text to type:</Label>
              <pre className="bg-muted p-3 rounded-md text-sm font-mono overflow-x-auto border">
                {request.actionData.text}
              </pre>
            </div>
          )}
          
          {/* Remember choice checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <Checkbox 
              id="remember-choice"
              checked={remember} 
              onCheckedChange={(checked) => setRemember(checked === true)}
            />
            <Label 
              htmlFor="remember-choice"
              className="text-sm font-normal cursor-pointer"
            >
              Remember my choice for this domain
            </Label>
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onDeny(remember)}
            className="min-w-24"
          >
            Deny
          </Button>
          <Button 
            onClick={() => onApprove(remember)}
            className="min-w-24"
            autoFocus
          >
            Allow
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Connected Permission Dialog Component
 * 
 * Automatically connects to the permission store and handles approve/deny actions.
 * Use this component in your app to display permission requests.
 */
export function ConnectedPermissionDialog() {
  const { pendingRequest, approveRequest, denyRequest } = usePermissionStore();
  
  return (
    <PermissionDialog
      request={pendingRequest}
      onApprove={approveRequest}
      onDeny={denyRequest}
    />
  );
}
