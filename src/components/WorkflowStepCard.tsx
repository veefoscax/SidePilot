/**
 * WorkflowStepCard Component
 * 
 * Displays a single workflow step with screenshot thumbnail, action description,
 * inline editing capabilities, and controls for deletion and reordering.
 * 
 * Validates: AC5 - Step preview with editing and management
 */

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Delete01Icon,
  DragDropVerticalIcon,
  Edit02Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
} from '@hugeicons/core-free-icons';
import { WorkflowStep, getActionDescription } from '@/lib/workflow';
import { useWorkflowStore } from '@/stores/workflow';
import { cn } from '@/lib/utils';

export interface WorkflowStepCardProps {
  /** The workflow step to display */
  step: WorkflowStep;
  
  /** Optional CSS class name */
  className?: string;
  
  /** Whether to show the drag handle (for reordering) */
  showDragHandle?: boolean;
  
  /** Callback when step is deleted */
  onDelete?: (stepId: string) => void;
  
  /** Callback when description is updated */
  onDescriptionUpdate?: (stepId: string, description: string) => void;
}

/**
 * WorkflowStepCard displays a single step in a workflow recording
 * with thumbnail, description, and editing controls
 */
export function WorkflowStepCard({
  step,
  className,
  showDragHandle = true,
  onDelete,
  onDescriptionUpdate,
}: WorkflowStepCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(step.description || '');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { deleteStep, updateStepDescription } = useWorkflowStore();
  
  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  
  // Get action description
  const actionDesc = getActionDescription(step.action);
  
  // Handle save description
  const handleSaveDescription = () => {
    const trimmedDescription = editedDescription.trim();
    
    // Update in store
    updateStepDescription(step.id, trimmedDescription);
    
    // Call optional callback
    if (onDescriptionUpdate) {
      onDescriptionUpdate(step.id, trimmedDescription);
    }
    
    setIsEditing(false);
  };
  
  // Handle cancel editing
  const handleCancelEdit = () => {
    setEditedDescription(step.description || '');
    setIsEditing(false);
  };
  
  // Handle delete
  const handleDelete = () => {
    // Delete from store
    deleteStep(step.id);
    
    // Call optional callback
    if (onDelete) {
      onDelete(step.id);
    }
  };
  
  // Handle key press in input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveDescription();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };
  
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Drag handle */}
          {showDragHandle && (
            <div className="flex-shrink-0 pt-1 cursor-move">
              <HugeiconsIcon
                icon={DragDropVerticalIcon}
                className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors"
              />
            </div>
          )}
          
          {/* Screenshot thumbnail */}
          <div className="flex-shrink-0">
            <div className="relative w-32 h-24 rounded-md overflow-hidden bg-muted border">
              <img
                src={step.screenshot}
                alt={`Step ${step.stepNumber} screenshot`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Step number badge */}
              <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">
                {step.stepNumber}
              </div>
            </div>
          </div>
          
          {/* Content area */}
          <div className="flex-1 min-w-0">
            {/* Action description */}
            <div className="font-medium text-sm mb-2">
              {actionDesc}
            </div>
            
            {/* URL (if different from previous step) */}
            <div className="text-xs text-muted-foreground mb-2 truncate">
              {step.url}
            </div>
            
            {/* User description / notes */}
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add a note for this step..."
                  className="h-8 text-sm"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSaveDescription}
                  className="h-8 w-8 p-0"
                >
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-4 w-4 text-green-500" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  className="h-8 w-8 p-0"
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  {step.description ? (
                    <p className="text-sm text-muted-foreground italic">
                      {step.description}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground/50 italic">
                      No notes added
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                  className="h-6 w-6 p-0 flex-shrink-0"
                >
                  <HugeiconsIcon icon={Edit02Icon} className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            
            {/* Timestamp */}
            <div className="text-xs text-muted-foreground mt-2">
              {new Date(step.timestamp).toLocaleTimeString()}
            </div>
          </div>
          
          {/* Delete button */}
          <div className="flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
