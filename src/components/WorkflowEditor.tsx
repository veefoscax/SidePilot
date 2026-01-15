/**
 * WorkflowEditor Component
 * 
 * Modal dialog for editing and saving workflow recordings.
 * Displays workflow steps, allows naming, and provides options to save as shortcut or discard.
 * 
 * Validates: AC6 - Workflow editor with name input, steps list, and save/discard actions
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
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  Alert02Icon,
  Cancel01Icon,
  Save,
} from '@hugeicons/core-free-icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WorkflowRecording, generateWorkflowPrompt, estimateWorkflowDuration } from '@/lib/workflow';
import { WorkflowStepCard } from '@/components/WorkflowStepCard';
import { useWorkflowStore } from '@/stores/workflow';
import { useShortcutsStore } from '@/stores/shortcuts';

interface WorkflowEditorProps {
  /** Whether the dialog is open */
  open: boolean;
  
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  
  /** The workflow recording to edit */
  workflow: WorkflowRecording | null;
  
  /** Callback when workflow is successfully saved */
  onSuccess?: (workflowId: string) => void;
  
  /** Callback when workflow is discarded */
  onDiscard?: () => void;
}

/**
 * Format duration in milliseconds to human-readable string
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes === 0) {
    return `${seconds}s`;
  }
  
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * WorkflowEditor modal component for editing and saving workflow recordings
 */
export function WorkflowEditor({
  open,
  onOpenChange,
  workflow,
  onSuccess,
  onDiscard,
}: WorkflowEditorProps) {
  const { saveWorkflow } = useWorkflowStore();
  const { createShortcut } = useShortcutsStore();
  
  // Form state
  const [workflowName, setWorkflowName] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Initialize form when workflow changes or dialog opens
  React.useEffect(() => {
    if (open && workflow) {
      setWorkflowName(workflow.name || '');
      setError(null);
      setIsSubmitting(false);
    }
  }, [open, workflow]);
  
  // Handle save as shortcut
  const handleSaveAsShortcut = async () => {
    if (!workflow) return;
    
    setError(null);
    setIsSubmitting(true);
    
    try {
      // Validate workflow name
      const trimmedName = workflowName.trim();
      if (!trimmedName) {
        setError('Please enter a workflow name');
        setIsSubmitting(false);
        return;
      }
      
      // Validate workflow has steps
      if (workflow.steps.length === 0) {
        setError('Cannot save workflow with no steps');
        setIsSubmitting(false);
        return;
      }
      
      // Save the workflow first
      await saveWorkflow(workflow, trimmedName);
      
      // Generate workflow prompt
      const workflowPrompt = generateWorkflowPrompt({
        ...workflow,
        name: trimmedName,
      });
      
      // Create a shortcut with the workflow prompt
      // Generate a command from the workflow name (lowercase, replace spaces with hyphens)
      const command = trimmedName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
      
      // Ensure command is unique by appending a number if needed
      let finalCommand = command;
      let counter = 1;
      const { shortcuts } = useShortcutsStore.getState();
      while (shortcuts.some(s => s.command === finalCommand)) {
        finalCommand = `${command}-${counter}`;
        counter++;
      }
      
      await createShortcut({
        command: finalCommand,
        name: trimmedName,
        prompt: workflowPrompt,
      });
      
      // Call success callback
      onSuccess?.(workflow.id);
      
      // Close dialog
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to save workflow:', err);
      setError(err instanceof Error ? err.message : 'Failed to save workflow. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle discard
  const handleDiscard = () => {
    onDiscard?.();
    onOpenChange(false);
  };
  
  // Calculate estimated duration
  const estimatedDuration = workflow ? estimateWorkflowDuration(workflow) : 0;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Save Workflow</DialogTitle>
          <DialogDescription>
            Review your workflow and save it as a shortcut for easy replay.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
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
              onChange={(e) => {
                setWorkflowName(e.target.value);
                setError(null);
              }}
              placeholder="e.g., Login to Dashboard"
              disabled={isSubmitting}
              autoComplete="off"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Give your workflow a descriptive name.
            </p>
          </div>
          
          {/* Workflow stats */}
          {workflow && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground border-y py-3">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{workflow.steps.length}</span>
                <span>step{workflow.steps.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{formatDuration(estimatedDuration)}</span>
                <span>estimated duration</span>
              </div>
            </div>
          )}
          
          {/* Steps list */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <Label className="mb-2">Workflow Steps</Label>
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-3">
                {workflow?.steps.map((step) => (
                  <WorkflowStepCard
                    key={step.id}
                    step={step}
                    showDragHandle={false}
                  />
                ))}
                {(!workflow || workflow.steps.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    No steps recorded in this workflow.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
        
        <DialogFooter className="flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleDiscard}
            disabled={isSubmitting}
          >
            <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4 mr-2" />
            Discard
          </Button>
          <Button
            type="button"
            onClick={handleSaveAsShortcut}
            disabled={isSubmitting || !workflowName.trim() || !workflow || workflow.steps.length === 0}
          >
            <HugeiconsIcon icon={Save} className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Saving...' : 'Save as Shortcut'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
