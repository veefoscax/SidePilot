/**
 * ToolPalette Component
 * 
 * Floating toolbar for screen annotation tools.
 * Provides tool selection, color picker, and action buttons.
 * 
 * Requirements: AC2.1, AC2.2, AC2.4
 */

import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowRight01Icon,
  CircleIcon,
  SquareIcon,
  PencilEdit02Icon,
  HighlighterIcon,
  UndoIcon,
  RedoIcon,
  Delete01Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { AnnotationType } from '@/lib/screen-capture/types';

/**
 * Props for ToolPalette component
 */
interface ToolPaletteProps {
  /** Currently selected annotation tool */
  selectedTool: AnnotationType;
  /** Callback when tool selection changes */
  onToolChange: (tool: AnnotationType) => void;
  /** Currently selected color */
  selectedColor: string;
  /** Callback when color changes */
  onColorChange: (color: string) => void;
  /** Callback for undo action */
  onUndo: () => void;
  /** Callback for redo action */
  onRedo: () => void;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Callback to clear all annotations */
  onClear: () => void;
  /** Callback when user is done annotating */
  onDone: () => void;
  /** Callback to cancel annotation */
  onCancel: () => void;
}

/**
 * Predefined color palette for annotations
 */
const COLOR_PALETTE = [
  { name: 'Red', value: '#ff0000' },
  { name: 'Blue', value: '#0066ff' },
  { name: 'Green', value: '#00cc00' },
  { name: 'Yellow', value: '#ffcc00' },
  { name: 'Purple', value: '#9933ff' },
  { name: 'Orange', value: '#ff6600' },
  { name: 'Pink', value: '#ff66cc' },
  { name: 'Black', value: '#000000' },
];

/**
 * Tool configuration with icons and labels
 */
const TOOLS: Array<{
  type: AnnotationType;
  icon: any;
  label: string;
  description: string;
}> = [
  {
    type: 'arrow',
    icon: ArrowRight01Icon,
    label: 'Arrow',
    description: 'Draw an arrow to point at something',
  },
  {
    type: 'circle',
    icon: CircleIcon,
    label: 'Circle',
    description: 'Draw a circle around an area',
  },
  {
    type: 'rectangle',
    icon: SquareIcon,
    label: 'Rectangle',
    description: 'Draw a rectangle box',
  },
  {
    type: 'freehand',
    icon: PencilEdit02Icon,
    label: 'Freehand',
    description: 'Draw freely with a pen',
  },
  {
    type: 'highlight',
    icon: HighlighterIcon,
    label: 'Highlight',
    description: 'Highlight an area with transparency',
  },
];

/**
 * ToolPalette Component
 * 
 * Floating toolbar that provides:
 * - Tool selection (arrow, circle, rectangle, freehand, highlight)
 * - Color picker with predefined palette
 * - Undo/redo buttons
 * - Clear all button
 * - Done and Cancel buttons
 * 
 * Styled as a compact, floating toolbar with touch-friendly buttons.
 */
export function ToolPalette({
  selectedTool,
  onToolChange,
  selectedColor,
  onColorChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onClear,
  onDone,
  onCancel,
}: ToolPaletteProps) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-2">
        <div className="flex items-center gap-2">
          {/* Tool Selection */}
          <div className="flex items-center gap-1 pr-2 border-r">
            {TOOLS.map((tool) => (
              <Button
                key={tool.type}
                variant={selectedTool === tool.type ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onToolChange(tool.type)}
                title={tool.description}
                className={cn(
                  'h-9 w-9 p-0',
                  selectedTool === tool.type && 'bg-primary text-primary-foreground'
                )}
              >
                <HugeiconsIcon icon={tool.icon} className="h-4 w-4" />
              </Button>
            ))}
          </div>

          {/* Color Picker */}
          <div className="flex items-center gap-1 pr-2 border-r">
            {COLOR_PALETTE.map((color) => (
              <button
                key={color.value}
                onClick={() => onColorChange(color.value)}
                title={color.name}
                className={cn(
                  'h-7 w-7 rounded-full border-2 transition-all hover:scale-110',
                  selectedColor === color.value
                    ? 'border-primary ring-2 ring-primary ring-offset-2'
                    : 'border-border hover:border-primary'
                )}
                style={{ backgroundColor: color.value }}
                aria-label={`Select ${color.name} color`}
              />
            ))}
          </div>

          {/* Undo/Redo */}
          <div className="flex items-center gap-1 pr-2 border-r">
            <Button
              variant="ghost"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className="h-9 w-9 p-0"
            >
              <HugeiconsIcon icon={UndoIcon} className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
              className="h-9 w-9 p-0"
            >
              <HugeiconsIcon icon={RedoIcon} className="h-4 w-4" />
            </Button>
          </div>

          {/* Clear Button */}
          <div className="pr-2 border-r">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              title="Clear all annotations"
              className="h-9 w-9 p-0 text-destructive hover:text-destructive"
            >
              <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              title="Cancel"
              className="h-9 px-3"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onDone}
              title="Send to AI"
              className="h-9 px-3"
            >
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-4 w-4 mr-1" />
              Send to AI
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
