/**
 * WorkflowStepCard Component - Enhanced UI
 * 
 * Beautiful step card with action type icons, smooth animations,
 * and improved visual hierarchy. Inspired by modern workflow tools.
 */

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Delete01Icon,
  DragDropVerticalIcon,
  Edit02Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  // Action type icons
  Mouse01Icon,
  KeyboardIcon,
  ArrowDown01Icon,
  Globe02Icon,
  TextIcon,
  SquareIcon,
} from '@hugeicons/core-free-icons';
import { WorkflowStep, getActionDescription } from '@/lib/workflow';
import { useWorkflowStore } from '@/stores/workflow';
import { cn } from '@/lib/utils';

export interface WorkflowStepCardProps {
  step: WorkflowStep;
  className?: string;
  showDragHandle?: boolean;
  onDelete?: (stepId: string) => void;
  onDescriptionUpdate?: (stepId: string, description: string) => void;
}

/**
 * Get icon and color for action type
 */
function getActionTypeInfo(actionType: string, originalType?: string) {
  const type = originalType || actionType;

  switch (type) {
    case 'click':
      return { icon: Mouse01Icon, color: 'bg-blue-500', label: 'Click' };
    case 'double_click':
      return { icon: Mouse01Icon, color: 'bg-blue-600', label: 'Double Click' };
    case 'right_click':
      return { icon: Mouse01Icon, color: 'bg-purple-500', label: 'Right Click' };
    case 'type':
    case 'input':
      return { icon: TextIcon, color: 'bg-green-500', label: 'Type' };
    case 'scroll':
      return { icon: ArrowDown01Icon, color: 'bg-orange-500', label: 'Scroll' };
    case 'key':
    case 'keypress':
      return { icon: KeyboardIcon, color: 'bg-pink-500', label: 'Key' };
    case 'navigate':
      return { icon: Globe02Icon, color: 'bg-cyan-500', label: 'Navigate' };
    case 'select':
      return { icon: SquareIcon, color: 'bg-indigo-500', label: 'Select' };
    case 'submit':
      return { icon: CheckmarkCircle02Icon, color: 'bg-emerald-500', label: 'Submit' };
    case 'focus':
      return { icon: SquareIcon, color: 'bg-yellow-500', label: 'Focus' };
    default:
      return { icon: Mouse01Icon, color: 'bg-gray-500', label: 'Action' };
  }
}

export function WorkflowStepCard({
  step,
  className,
  showDragHandle = true,
  onDelete,
  onDescriptionUpdate,
}: WorkflowStepCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(step.description || '');
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { deleteStep, updateStepDescription } = useWorkflowStore();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const actionDesc = getActionDescription(step.action);
  const originalType = step.action.metadata?.originalType as string | undefined;
  const actionInfo = getActionTypeInfo(step.action.type, originalType);

  const handleSaveDescription = () => {
    const trimmedDescription = editedDescription.trim();
    updateStepDescription(step.id, trimmedDescription);
    onDescriptionUpdate?.(step.id, trimmedDescription);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedDescription(step.description || '');
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteStep(step.id);
    onDelete?.(step.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSaveDescription();
    else if (e.key === 'Escape') handleCancelEdit();
  };

  // Extract selector for display
  const selector = step.action.metadata?.selector as string | undefined;
  const shortSelector = selector
    ? selector.length > 40 ? selector.slice(0, 40) + '...' : selector
    : null;

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-200 border-l-4',
        isHovered ? 'shadow-md scale-[1.01]' : 'shadow-sm',
        className
      )}
      style={{ borderLeftColor: actionInfo.color.replace('bg-', 'var(--') !== actionInfo.color ? undefined : undefined }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-0">
        <div className="flex">
          {/* Left: Step number + type indicator */}
          <div className={cn(
            'flex flex-col items-center justify-start py-3 px-2 min-w-[48px]',
            actionInfo.color
          )}>
            <span className="text-white text-sm font-bold">
              {step.stepNumber}
            </span>
            <HugeiconsIcon
              icon={actionInfo.icon}
              className="h-4 w-4 text-white/80 mt-1"
            />
          </div>

          {/* Center: Content */}
          <div className="flex-1 p-3 min-w-0">
            <div className="flex items-start gap-3">
              {/* Drag handle */}
              {showDragHandle && (
                <div className="flex-shrink-0 pt-0.5 cursor-move opacity-40 hover:opacity-100 transition-opacity">
                  <HugeiconsIcon
                    icon={DragDropVerticalIcon}
                    className="h-4 w-4 text-muted-foreground"
                  />
                </div>
              )}

              {/* Screenshot thumbnail */}
              {step.screenshot && (
                <div className="flex-shrink-0">
                  <div className="relative w-20 h-14 rounded-md overflow-hidden bg-muted border shadow-sm">
                    <img
                      src={step.screenshot}
                      alt={`Step ${step.stepNumber}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
              )}

              {/* Main content */}
              <div className="flex-1 min-w-0 space-y-1.5">
                {/* Action badge + description */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-[10px] px-1.5 py-0 font-semibold uppercase tracking-wide',
                      actionInfo.color,
                      'text-white border-0'
                    )}
                  >
                    {actionInfo.label}
                  </Badge>
                  <span className="font-medium text-sm text-foreground">
                    {actionDesc}
                  </span>
                </div>

                {/* Selector (if available) */}
                {shortSelector && (
                  <div className="flex items-center gap-1">
                    <code className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                      {shortSelector}
                    </code>
                  </div>
                )}

                {/* URL */}
                <div className="text-[11px] text-muted-foreground truncate">
                  {step.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                </div>

                {/* User notes */}
                {isEditing ? (
                  <div className="flex items-center gap-1 mt-2">
                    <Input
                      ref={inputRef}
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Add a note..."
                      className="h-7 text-xs"
                    />
                    <Button size="sm" variant="ghost" onClick={handleSaveDescription} className="h-7 w-7 p-0">
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-4 w-4 text-green-500" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-7 w-7 p-0">
                      <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ) : step.description ? (
                  <p className="text-xs text-muted-foreground italic flex items-center gap-1 mt-1">
                    <span className="text-[10px]">💬</span>
                    {step.description}
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)} className="h-5 w-5 p-0 ml-1">
                      <HugeiconsIcon icon={Edit02Icon} className="h-3 w-3" />
                    </Button>
                  </p>
                ) : null}
              </div>

              {/* Right: Actions */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                {/* Add note button (if no description) */}
                {!step.description && !isEditing && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <HugeiconsIcon icon={Edit02Icon} className="h-3.5 w-3.5" />
                  </Button>
                )}

                {/* Delete button */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDelete}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <HugeiconsIcon icon={Delete01Icon} className="h-3.5 w-3.5" />
                </Button>

                {/* Timestamp */}
                <span className="text-[9px] text-muted-foreground/60 mt-1">
                  {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
