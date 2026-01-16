/**
 * RecordingBar Component
 * 
 * Displays a prominent recording indicator at the top of the side panel
 * when a workflow recording is in progress. Shows step count and provides
 * controls to stop or cancel the recording.
 * 
 * Validates: AC4 - Recording indicator and controls
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Cancel01Icon,
  CheckmarkCircle02Icon
} from '@hugeicons/core-free-icons';
import { useWorkflowStore } from '@/stores/workflow';
import { WorkflowEditor } from '@/components/WorkflowEditor';
import { WorkflowRecording } from '@/lib/workflow';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function RecordingBar() {
  const { status, currentRecording, stopRecording, cancelRecording } = useWorkflowStore();

  // Workflow editor state
  const [showWorkflowEditor, setShowWorkflowEditor] = useState(false);
  const [completedWorkflow, setCompletedWorkflow] = useState<WorkflowRecording | null>(null);

  // Only show recording bar when actively recording
  const isRecording = status === 'recording' && currentRecording;

  const stepCount = currentRecording?.steps.length || 0;

  const handleStop = async () => {
    try {
      const workflow = await stopRecording();
      if (workflow) {
        setCompletedWorkflow(workflow);
        setShowWorkflowEditor(true);
        toast.success(`Recording stopped! ${workflow.steps.length} steps captured.`);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      toast.error('Failed to stop recording');
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel this recording? All captured steps will be lost.')) {
      cancelRecording();
      toast.info('Recording cancelled');
    }
  };

  return (
    <>
      {/* Recording Bar - only visible when recording */}
      {isRecording && (
        <div className="fixed top-0 left-0 right-0 bg-destructive text-destructive-foreground py-3 px-4 flex items-center justify-between z-50 shadow-lg">
          {/* Left side: Recording indicator and step count */}
          <div className="flex items-center gap-3">
            {/* Pulsing recording indicator */}
            <div className="relative flex items-center">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              <div className="absolute inset-0 w-3 h-3 bg-white rounded-full animate-ping opacity-75" />
            </div>

            <span className="font-medium">Recording Workflow</span>

            {/* Step count badge */}
            <Badge
              variant="outline"
              className={cn(
                "bg-destructive-foreground/10 text-destructive-foreground border-destructive-foreground/20",
                "font-mono"
              )}
            >
              {stepCount} {stepCount === 1 ? 'step' : 'steps'}
            </Badge>
          </div>

          {/* Right side: Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              className="bg-destructive-foreground/10 text-destructive-foreground border-destructive-foreground/20 hover:bg-destructive-foreground/20"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4 mr-1" />
              Cancel
            </Button>

            <Button
              size="sm"
              onClick={handleStop}
              className="bg-destructive-foreground text-destructive hover:bg-destructive-foreground/90"
            >
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-4 w-4 mr-1" />
              Stop Recording
            </Button>
          </div>
        </div>
      )}

      {/* Workflow Editor Modal */}
      <WorkflowEditor
        open={showWorkflowEditor}
        onOpenChange={setShowWorkflowEditor}
        workflow={completedWorkflow}
        onSuccess={(workflowId) => {
          toast.success('Workflow saved as shortcut!');
          setCompletedWorkflow(null);
        }}
        onDiscard={() => {
          setCompletedWorkflow(null);
        }}
      />
    </>
  );
}
