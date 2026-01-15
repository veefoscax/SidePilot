/**
 * WorkflowEditor Component
 * 
 * Modal dialog for editing and saving workflow recordings.
 * Displays workflow steps, allows naming, and provides options to save as shortcut or discard.
 * 
 * Validates: AC6 - Workflow editor with save/discard functionality
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { WorkflowStepCard } from '@/components/WorkflowStepCard';
import { useWorkflowStore } from '@/stores/workflow';
import { useShortcutsStore } from '@/stores/shortcuts';
import { WorkflowRecording, estimateWorkflowDuration } from '@/lib/workflow';
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, Save01Icon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WorkflowEditorProps {
  /** Whether the dialog is open */
  open: boolean;
  
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  
  /** The workflow recording to edit */
  workflow: WorkflowRecording | null;
  
  /** Callback when workflow is successfully saved */
  onSuccess?: (workflowId: string) => void;
}

/**
 * Format duration in milliseconds to human-readable string
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
}

/**
 * WorkflowEditor modal component for editing and saving workflows
 */
export function WorkflowEditor({
  open,
  onOpenChange,
  workflow,
  onSuccess,
}: WorkflowEditorProps) {
  const { saveWorkflow, generatePrompt } = useWorkflowStore();
  const { createShortcut } = useShortcutsStore();
  
  // Form state
  const [workflowName, setWorkflowName] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  
  // Initialize form when workflow changes or dialog opens
  React.useEffect(() => {
    if (open && workflow) {
      setWorkflowName(workflow.name || '');
      setError(null);
      setIsSaving(false);
    }
  }, [open, workflow]);
  
  // Calculate workflow stats
  const stepCount = workflow?.steps.length || 0;
  const estimatedDuration = workflow ? estimateWorkflowDuration(workflow) : 0;
  
  /**
   * Handle saving workflow as a shortcut
   */
  const handleSaveAsShortcut = async () => {
    if (!workflow) return;
    
    setError(null);
    setIsSaving(true);
    
    try {
      // Validate workflow name
      const finalName = workflowName.trim() || `Workflow ${new Date().toLocaleDateString()}`;
      
      // Save the workflow first
      await saveWorkflow(workflow, finalName);
      
      // Generate prompt from workflow
      const prompt = generatePrompt(workflow.id);
      
      // Create a shortcut command from the workflow name
      // Convert to lowercase, replace spaces with hyphens, remove special chars
      const command = finalName
        .toLowerCase()
        .replace(/[^a-z0-9\s-_]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50); // Limit length
      
      // Create shortcut with the workflow prompt
      await createShortcut({
        command,
        name: finalName,
        prompt,
      });
      
      // Call success callback
      onSuccess?.(workflow.id);
      
      // Close dialog
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save workflow');
      console.error('Failed to save workflow as shortcut:', err);
    } finally {
      setIsSaving(false);
    }
  };
  
  /**
   * Handle discarding the workflow
   */
  const handleDiscard = () => {
    onOpenChange(false);
  };
  
  // Don't render if no workflow
  if (!workflow) {
    return null;
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Workflow</DialogTitle>
          <DialogDescription>
            Review and save your recorded workflow as a reusable shortcut.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 space-y-4 overflow-hidden flex flex-col">
          {error && (
            <Alert variant="destructive">
              <HugeiconsIcon icon={Alert02Icon} className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Workflow name input */}
          <div className="space-y-2">
            <Label htmlFor="workflow-name">
              Workflow Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="workflow-name"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="Enter a name for this workflow"
              disabled={isSaving}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              This name will be used for the shortcut command.
            </p>
          </div>
          
          {/* Workflow stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">{stepCount}</span> step{stepCount !== 1 ? 's' : ''}
            </div>
            <div className="h-4 w-px bg-border" />
            <div>
              Estimated duration: <span className="font-medium">{formatDuration(estimatedDuration)}</span>
            </div>
          </div>
          
          {/* Steps list */}
          <div className="flex-1 min-h-0">
            <Label className="mb-2 block">Workflow Steps</Label>
            {stepCount === 0 ? (
              <div className="flex items-center justify-center h-32 border rounded-md bg-muted/50">
                <p className="text-sm text-muted-foreground">No steps recorded</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {workflow.steps.map((step) => (
                    <WorkflowStepCard
                      key={step.id}
                      step={step}
                      showDragHandle={false}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
        
        <DialogFooter className="flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleDiscard}
            disabled={isSaving}
          >
            <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4 mr-2" />
            Discard
          </Button>
          <Button
            type="button"
            onClick={handleSaveAsShortcut}
            disabled={isSaving || stepCount === 0}
          >
            <HugeiconsIcon icon={Save01Icon} className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save as Shortcut'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
