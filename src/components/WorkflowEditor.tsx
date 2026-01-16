/**
 * WorkflowEditor Component - Enhanced UI
 * 
 * Beautiful modal for editing and saving workflow recordings.
 * Features action type stats, visual progress, and improved styling.
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
import { Badge } from '@/components/ui/badge';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Alert02Icon,
  Cancel01Icon,
  Save,
  Mouse01Icon,
  KeyboardIcon,
  ArrowDown01Icon,
  Globe02Icon,
  TextIcon,
  Clock01Icon,
} from '@hugeicons/core-free-icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WorkflowRecording, generateWorkflowPrompt, estimateWorkflowDuration } from '@/lib/workflow';
import { WorkflowStepCard } from '@/components/WorkflowStepCard';
import { useWorkflowStore } from '@/stores/workflow';
import { useShortcutsStore } from '@/stores/shortcuts';
import { cn } from '@/lib/utils';

interface WorkflowEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflow: WorkflowRecording | null;
  onSuccess?: (workflowId: string) => void;
  onDiscard?: () => void;
}

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
 * Count action types in workflow
 */
function countActionTypes(workflow: WorkflowRecording) {
  const counts: Record<string, number> = {};
  workflow.steps.forEach(step => {
    const type = (step.action.metadata?.originalType as string) || step.action.type;
    counts[type] = (counts[type] || 0) + 1;
  });
  return counts;
}

export function WorkflowEditor({
  open,
  onOpenChange,
  workflow,
  onSuccess,
  onDiscard,
}: WorkflowEditorProps) {
  const { saveWorkflow } = useWorkflowStore();
  const { createShortcut } = useShortcutsStore();

  const [workflowName, setWorkflowName] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open && workflow) {
      setWorkflowName(workflow.name || '');
      setError(null);
      setIsSubmitting(false);
    }
  }, [open, workflow]);

  const handleSaveAsShortcut = async () => {
    if (!workflow) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const trimmedName = workflowName.trim();
      if (!trimmedName) {
        setError('Please enter a workflow name');
        setIsSubmitting(false);
        return;
      }

      if (workflow.steps.length === 0) {
        setError('Cannot save workflow with no steps');
        setIsSubmitting(false);
        return;
      }

      await saveWorkflow(workflow, trimmedName);

      const workflowPrompt = generateWorkflowPrompt({
        ...workflow,
        name: trimmedName,
      });

      const command = trimmedName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

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

      onSuccess?.(workflow.id);
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to save workflow:', err);
      setError(err instanceof Error ? err.message : 'Failed to save workflow. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscard = () => {
    onDiscard?.();
    onOpenChange(false);
  };

  const estimatedDuration = workflow ? estimateWorkflowDuration(workflow) : 0;
  const actionCounts = workflow ? countActionTypes(workflow) : {};

  // Stats for display
  const statsItems = [
    {
      icon: Mouse01Icon,
      count: (actionCounts['click'] || 0) + (actionCounts['double_click'] || 0) + (actionCounts['right_click'] || 0),
      label: 'Clicks',
      color: 'text-blue-500'
    },
    {
      icon: TextIcon,
      count: (actionCounts['input'] || 0) + (actionCounts['type'] || 0),
      label: 'Inputs',
      color: 'text-green-500'
    },
    {
      icon: ArrowDown01Icon,
      count: actionCounts['scroll'] || 0,
      label: 'Scrolls',
      color: 'text-orange-500'
    },
    {
      icon: KeyboardIcon,
      count: actionCounts['keypress'] || 0,
      label: 'Keys',
      color: 'text-pink-500'
    },
    {
      icon: Globe02Icon,
      count: actionCounts['navigate'] || 0,
      label: 'Navigations',
      color: 'text-cyan-500'
    },
  ].filter(item => item.count > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-5 border-b">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Save Workflow
            </DialogTitle>
            <DialogDescription className="text-sm">
              Review your recorded actions and save as a reusable shortcut.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col px-6 py-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <HugeiconsIcon icon={Alert02Icon} className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Workflow name input */}
          <div className="space-y-2 mb-4">
            <Label htmlFor="workflow-name" className="text-sm font-medium">
              Workflow Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="workflow-name"
              value={workflowName}
              onChange={(e) => {
                setWorkflowName(e.target.value);
                setError(null);
              }}
              placeholder="e.g., Login to Dashboard, Submit Report..."
              disabled={isSubmitting}
              autoComplete="off"
              autoFocus
              className="h-10"
            />
          </div>

          {/* Enhanced stats section */}
          {workflow && (
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                {/* Total steps */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    <span className="text-lg font-bold text-primary">{workflow.steps.length}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Steps Recorded</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <HugeiconsIcon icon={Clock01Icon} className="h-3 w-3" />
                      ~{formatDuration(estimatedDuration)}
                    </div>
                  </div>
                </div>

                {/* Action type badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  {statsItems.map((item, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className={cn("gap-1 text-xs", item.color)}
                    >
                      <HugeiconsIcon icon={item.icon} className="h-3 w-3" />
                      {item.count} {item.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Steps list */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <Label className="mb-2 text-sm font-medium">Workflow Steps</Label>
            <ScrollArea className="flex-1 -mx-2 px-2">
              <div className="space-y-2 pb-4">
                {workflow?.steps.map((step) => (
                  <WorkflowStepCard
                    key={step.id}
                    step={step}
                    showDragHandle={false}
                  />
                ))}
                {(!workflow || workflow.steps.length === 0) && (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="text-4xl mb-3">📝</div>
                    <div className="font-medium">No steps recorded</div>
                    <div className="text-sm">Record some actions and they'll appear here.</div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="flex-shrink-0 px-6 py-4 border-t bg-muted/30">
          <div className="flex items-center justify-between w-full gap-3">
            <div className="text-xs text-muted-foreground">
              Saved workflows can be run with <code className="bg-muted px-1 rounded">/command</code>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleDiscard}
                disabled={isSubmitting}
                className="gap-2"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
                Discard
              </Button>
              <Button
                type="button"
                onClick={handleSaveAsShortcut}
                disabled={isSubmitting || !workflowName.trim() || !workflow || workflow.steps.length === 0}
                className="gap-2"
              >
                <HugeiconsIcon icon={Save} className="h-4 w-4" />
                {isSubmitting ? 'Saving...' : 'Save as Shortcut'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
