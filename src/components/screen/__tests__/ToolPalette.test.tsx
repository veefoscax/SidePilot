/**
 * ToolPalette Component Tests
 * 
 * Tests for the annotation tool palette component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToolPalette } from '../ToolPalette';
import type { AnnotationType } from '@/lib/screen-capture/types';

describe('ToolPalette', () => {
  const defaultProps = {
    selectedTool: 'arrow' as AnnotationType,
    onToolChange: vi.fn(),
    selectedColor: '#ff0000',
    onColorChange: vi.fn(),
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    canUndo: true,
    canRedo: true,
    onClear: vi.fn(),
    onDone: vi.fn(),
    onCancel: vi.fn(),
  };

  it('renders all tool buttons', () => {
    render(<ToolPalette {...defaultProps} />);
    
    // Check that tool buttons are present by checking for their titles
    expect(screen.getByTitle('Draw an arrow to point at something')).toBeInTheDocument();
    expect(screen.getByTitle('Draw a circle around an area')).toBeInTheDocument();
    expect(screen.getByTitle('Draw a rectangle box')).toBeInTheDocument();
    expect(screen.getByTitle('Draw freely with a pen')).toBeInTheDocument();
    expect(screen.getByTitle('Highlight an area with transparency')).toBeInTheDocument();
  });

  it('highlights the selected tool', () => {
    const { rerender } = render(<ToolPalette {...defaultProps} selectedTool="circle" />);
    
    const circleButton = screen.getByTitle('Draw a circle around an area');
    expect(circleButton).toHaveClass('bg-primary');
    
    // Change selected tool
    rerender(<ToolPalette {...defaultProps} selectedTool="rectangle" />);
    
    const rectangleButton = screen.getByTitle('Draw a rectangle box');
    expect(rectangleButton).toHaveClass('bg-primary');
  });

  it('calls onToolChange when a tool is clicked', () => {
    const onToolChange = vi.fn();
    render(<ToolPalette {...defaultProps} onToolChange={onToolChange} />);
    
    const circleButton = screen.getByTitle('Draw a circle around an area');
    fireEvent.click(circleButton);
    
    expect(onToolChange).toHaveBeenCalledWith('circle');
  });

  it('renders color palette with 8 colors', () => {
    render(<ToolPalette {...defaultProps} />);
    
    // Check for color buttons by their aria-labels
    expect(screen.getByLabelText('Select Red color')).toBeInTheDocument();
    expect(screen.getByLabelText('Select Blue color')).toBeInTheDocument();
    expect(screen.getByLabelText('Select Green color')).toBeInTheDocument();
    expect(screen.getByLabelText('Select Yellow color')).toBeInTheDocument();
    expect(screen.getByLabelText('Select Purple color')).toBeInTheDocument();
    expect(screen.getByLabelText('Select Orange color')).toBeInTheDocument();
    expect(screen.getByLabelText('Select Pink color')).toBeInTheDocument();
    expect(screen.getByLabelText('Select Black color')).toBeInTheDocument();
  });

  it('highlights the selected color', () => {
    render(<ToolPalette {...defaultProps} selectedColor="#0066ff" />);
    
    const blueButton = screen.getByLabelText('Select Blue color');
    expect(blueButton).toHaveClass('border-primary');
  });

  it('calls onColorChange when a color is clicked', () => {
    const onColorChange = vi.fn();
    render(<ToolPalette {...defaultProps} onColorChange={onColorChange} />);
    
    const blueButton = screen.getByLabelText('Select Blue color');
    fireEvent.click(blueButton);
    
    expect(onColorChange).toHaveBeenCalledWith('#0066ff');
  });

  it('renders undo/redo buttons', () => {
    render(<ToolPalette {...defaultProps} />);
    
    expect(screen.getByTitle('Undo (Ctrl+Z)')).toBeInTheDocument();
    expect(screen.getByTitle('Redo (Ctrl+Y)')).toBeInTheDocument();
  });

  it('disables undo button when canUndo is false', () => {
    render(<ToolPalette {...defaultProps} canUndo={false} />);
    
    const undoButton = screen.getByTitle('Undo (Ctrl+Z)');
    expect(undoButton).toBeDisabled();
  });

  it('disables redo button when canRedo is false', () => {
    render(<ToolPalette {...defaultProps} canRedo={false} />);
    
    const redoButton = screen.getByTitle('Redo (Ctrl+Y)');
    expect(redoButton).toBeDisabled();
  });

  it('calls onUndo when undo button is clicked', () => {
    const onUndo = vi.fn();
    render(<ToolPalette {...defaultProps} onUndo={onUndo} />);
    
    const undoButton = screen.getByTitle('Undo (Ctrl+Z)');
    fireEvent.click(undoButton);
    
    expect(onUndo).toHaveBeenCalled();
  });

  it('calls onRedo when redo button is clicked', () => {
    const onRedo = vi.fn();
    render(<ToolPalette {...defaultProps} onRedo={onRedo} />);
    
    const redoButton = screen.getByTitle('Redo (Ctrl+Y)');
    fireEvent.click(redoButton);
    
    expect(onRedo).toHaveBeenCalled();
  });

  it('renders clear button', () => {
    render(<ToolPalette {...defaultProps} />);
    
    expect(screen.getByTitle('Clear all annotations')).toBeInTheDocument();
  });

  it('calls onClear when clear button is clicked', () => {
    const onClear = vi.fn();
    render(<ToolPalette {...defaultProps} onClear={onClear} />);
    
    const clearButton = screen.getByTitle('Clear all annotations');
    fireEvent.click(clearButton);
    
    expect(onClear).toHaveBeenCalled();
  });

  it('renders action buttons (Cancel and Send to AI)', () => {
    render(<ToolPalette {...defaultProps} />);
    
    expect(screen.getByTitle('Cancel')).toBeInTheDocument();
    expect(screen.getByTitle('Send to AI')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<ToolPalette {...defaultProps} onCancel={onCancel} />);
    
    const cancelButton = screen.getByTitle('Cancel');
    fireEvent.click(cancelButton);
    
    expect(onCancel).toHaveBeenCalled();
  });

  it('calls onDone when Send to AI button is clicked', () => {
    const onDone = vi.fn();
    render(<ToolPalette {...defaultProps} onDone={onDone} />);
    
    const doneButton = screen.getByTitle('Send to AI');
    fireEvent.click(doneButton);
    
    expect(onDone).toHaveBeenCalled();
  });

  it('applies correct styling for floating toolbar', () => {
    const { container } = render(<ToolPalette {...defaultProps} />);
    
    // Check for fixed positioning and centering
    const toolbar = container.querySelector('.fixed');
    expect(toolbar).toHaveClass('top-4', 'left-1/2', '-translate-x-1/2', 'z-50');
  });

  it('applies backdrop blur effect', () => {
    const { container } = render(<ToolPalette {...defaultProps} />);
    
    const toolbarContent = container.querySelector('.backdrop-blur-sm');
    expect(toolbarContent).toBeInTheDocument();
  });
});
