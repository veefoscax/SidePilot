/**
 * Tests for WorkflowStepCard Component
 * 
 * Validates AC5: Step preview with screenshot, description editing, and controls
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkflowStepCard } from '../WorkflowStepCard';
import { WorkflowStep } from '@/lib/workflow';
import { useWorkflowStore } from '@/stores/workflow';

// Mock the workflow store
vi.mock('@/stores/workflow', () => ({
  useWorkflowStore: vi.fn(),
}));

describe('WorkflowStepCard', () => {
  const mockDeleteStep = vi.fn();
  const mockUpdateStepDescription = vi.fn();
  
  const mockStep: WorkflowStep = {
    id: 'step-1',
    stepNumber: 1,
    timestamp: Date.now(),
    screenshot: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    action: {
      type: 'click',
      x: 100,
      y: 200,
    },
    url: 'https://example.com',
    description: 'Click the submit button',
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup store mock
    (useWorkflowStore as any).mockReturnValue({
      deleteStep: mockDeleteStep,
      updateStepDescription: mockUpdateStepDescription,
    });
  });
  
  describe('Rendering', () => {
    it('should render step with screenshot thumbnail', () => {
      render(<WorkflowStepCard step={mockStep} />);
      
      const img = screen.getByAltText('Step 1 screenshot');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', mockStep.screenshot);
    });
    
    it('should display step number badge', () => {
      render(<WorkflowStepCard step={mockStep} />);
      
      expect(screen.getByText('1')).toBeInTheDocument();
    });
    
    it('should display action description', () => {
      render(<WorkflowStepCard step={mockStep} />);
      
      expect(screen.getByText('Click at (100, 200)')).toBeInTheDocument();
    });
    
    it('should display URL', () => {
      render(<WorkflowStepCard step={mockStep} />);
      
      expect(screen.getByText('https://example.com')).toBeInTheDocument();
    });
    
    it('should display user description when present', () => {
      render(<WorkflowStepCard step={mockStep} />);
      
      expect(screen.getByText('Click the submit button')).toBeInTheDocument();
    });
    
    it('should display placeholder when no description', () => {
      const stepWithoutDesc = { ...mockStep, description: undefined };
      render(<WorkflowStepCard step={stepWithoutDesc} />);
      
      expect(screen.getByText('No notes added')).toBeInTheDocument();
    });
    
    it('should display timestamp', () => {
      render(<WorkflowStepCard step={mockStep} />);
      
      const timeString = new Date(mockStep.timestamp).toLocaleTimeString();
      expect(screen.getByText(timeString)).toBeInTheDocument();
    });
    
    it('should show drag handle by default', () => {
      const { container } = render(<WorkflowStepCard step={mockStep} />);
      
      // Check for drag handle icon (cursor-move class)
      const dragHandle = container.querySelector('.cursor-move');
      expect(dragHandle).toBeInTheDocument();
    });
    
    it('should hide drag handle when showDragHandle is false', () => {
      const { container } = render(
        <WorkflowStepCard step={mockStep} showDragHandle={false} />
      );
      
      const dragHandle = container.querySelector('.cursor-move');
      expect(dragHandle).not.toBeInTheDocument();
    });
  });
  
  describe('Action Descriptions', () => {
    it('should format click action correctly', () => {
      const clickStep: WorkflowStep = {
        ...mockStep,
        action: { type: 'click', x: 150, y: 250 },
      };
      
      render(<WorkflowStepCard step={clickStep} />);
      expect(screen.getByText('Click at (150, 250)')).toBeInTheDocument();
    });
    
    it('should format type action correctly', () => {
      const typeStep: WorkflowStep = {
        ...mockStep,
        action: { type: 'type', text: 'Hello World' },
      };
      
      render(<WorkflowStepCard step={typeStep} />);
      expect(screen.getByText('Type "Hello World"')).toBeInTheDocument();
    });
    
    it('should format navigate action correctly', () => {
      const navStep: WorkflowStep = {
        ...mockStep,
        action: { type: 'navigate', url: 'https://google.com' },
      };
      
      render(<WorkflowStepCard step={navStep} />);
      expect(screen.getByText('Navigate to https://google.com')).toBeInTheDocument();
    });
    
    it('should format scroll action correctly', () => {
      const scrollStep: WorkflowStep = {
        ...mockStep,
        action: { type: 'scroll', direction: 'down' },
      };
      
      render(<WorkflowStepCard step={scrollStep} />);
      expect(screen.getByText('Scroll down')).toBeInTheDocument();
    });
    
    it('should format key action correctly', () => {
      const keyStep: WorkflowStep = {
        ...mockStep,
        action: { type: 'key', key: 'Enter' },
      };
      
      render(<WorkflowStepCard step={keyStep} />);
      expect(screen.getByText('Press Enter')).toBeInTheDocument();
    });
  });
  
  describe('Description Editing', () => {
    it('should enter edit mode when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<WorkflowStepCard step={mockStep} />);
      
      // Find and click edit button
      const editButtons = screen.getAllByRole('button');
      const editButton = editButtons.find(btn => 
        btn.querySelector('svg') && btn.className.includes('h-6')
      );
      
      await user.click(editButton!);
      
      // Should show input field
      const input = screen.getByPlaceholderText('Add a note for this step...');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('Click the submit button');
    });
    
    it('should focus and select input text when entering edit mode', async () => {
      const user = userEvent.setup();
      render(<WorkflowStepCard step={mockStep} />);
      
      const editButtons = screen.getAllByRole('button');
      const editButton = editButtons.find(btn => 
        btn.querySelector('svg') && btn.className.includes('h-6')
      );
      
      await user.click(editButton!);
      
      const input = screen.getByPlaceholderText('Add a note for this step...');
      expect(input).toHaveFocus();
    });
    
    it('should save description when save button is clicked', async () => {
      const user = userEvent.setup();
      render(<WorkflowStepCard step={mockStep} />);
      
      // Enter edit mode
      const editButtons = screen.getAllByRole('button');
      const editButton = editButtons.find(btn => 
        btn.querySelector('svg') && btn.className.includes('h-6')
      );
      await user.click(editButton!);
      
      // Change description
      const input = screen.getByPlaceholderText('Add a note for this step...');
      await user.clear(input);
      await user.type(input, 'Updated description');
      
      // Click save button (find by green checkmark class)
      const buttons = screen.getAllByRole('button');
      const saveButton = buttons.find(btn => 
        btn.querySelector('svg.text-green-500')
      );
      await user.click(saveButton!);
      
      // Should call updateStepDescription
      expect(mockUpdateStepDescription).toHaveBeenCalledWith('step-1', 'Updated description');
    });
    
    it('should save description when Enter key is pressed', async () => {
      const user = userEvent.setup();
      render(<WorkflowStepCard step={mockStep} />);
      
      // Enter edit mode
      const editButtons = screen.getAllByRole('button');
      const editButton = editButtons.find(btn => 
        btn.querySelector('svg') && btn.className.includes('h-6')
      );
      await user.click(editButton!);
      
      // Change description and press Enter
      const input = screen.getByPlaceholderText('Add a note for this step...');
      await user.clear(input);
      await user.type(input, 'New description{Enter}');
      
      // Should call updateStepDescription
      expect(mockUpdateStepDescription).toHaveBeenCalledWith('step-1', 'New description');
    });
    
    it('should cancel editing when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<WorkflowStepCard step={mockStep} />);
      
      // Enter edit mode
      const editButtons = screen.getAllByRole('button');
      const editButton = editButtons.find(btn => 
        btn.querySelector('svg') && btn.className.includes('h-6')
      );
      await user.click(editButton!);
      
      // Change description
      const input = screen.getByPlaceholderText('Add a note for this step...');
      await user.clear(input);
      await user.type(input, 'Changed text');
      
      // Click cancel button (find by muted foreground class)
      const buttons = screen.getAllByRole('button');
      const cancelButton = buttons.find(btn => 
        btn.querySelector('svg.text-muted-foreground') && !btn.className.includes('cursor-move')
      );
      await user.click(cancelButton!);
      
      // Should not call updateStepDescription
      expect(mockUpdateStepDescription).not.toHaveBeenCalled();
      
      // Should exit edit mode and show original description
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Add a note for this step...')).not.toBeInTheDocument();
      });
      expect(screen.getByText('Click the submit button')).toBeInTheDocument();
    });
    
    it('should cancel editing when Escape key is pressed', async () => {
      const user = userEvent.setup();
      render(<WorkflowStepCard step={mockStep} />);
      
      // Enter edit mode
      const editButtons = screen.getAllByRole('button');
      const editButton = editButtons.find(btn => 
        btn.querySelector('svg') && btn.className.includes('h-6')
      );
      await user.click(editButton!);
      
      // Change description and press Escape
      const input = screen.getByPlaceholderText('Add a note for this step...');
      await user.clear(input);
      await user.type(input, 'Changed text{Escape}');
      
      // Should not call updateStepDescription
      expect(mockUpdateStepDescription).not.toHaveBeenCalled();
    });
    
    it('should trim whitespace when saving description', async () => {
      const user = userEvent.setup();
      render(<WorkflowStepCard step={mockStep} />);
      
      // Enter edit mode
      const editButtons = screen.getAllByRole('button');
      const editButton = editButtons.find(btn => 
        btn.querySelector('svg') && btn.className.includes('h-6')
      );
      await user.click(editButton!);
      
      // Add description with whitespace
      const input = screen.getByPlaceholderText('Add a note for this step...');
      await user.clear(input);
      await user.type(input, '  Trimmed text  {Enter}');
      
      // Should call with trimmed text
      expect(mockUpdateStepDescription).toHaveBeenCalledWith('step-1', 'Trimmed text');
    });
  });
  
  describe('Step Deletion', () => {
    it('should delete step when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<WorkflowStepCard step={mockStep} />);
      
      // Find delete button (destructive colored button)
      const buttons = screen.getAllByRole('button');
      const deleteButton = buttons.find(btn => 
        btn.className.includes('text-destructive')
      );
      
      await user.click(deleteButton!);
      
      // Should call deleteStep
      expect(mockDeleteStep).toHaveBeenCalledWith('step-1');
    });
    
    it('should call onDelete callback when provided', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      render(<WorkflowStepCard step={mockStep} onDelete={onDelete} />);
      
      // Find and click delete button
      const buttons = screen.getAllByRole('button');
      const deleteButton = buttons.find(btn => 
        btn.className.includes('text-destructive')
      );
      
      await user.click(deleteButton!);
      
      // Should call both store method and callback
      expect(mockDeleteStep).toHaveBeenCalledWith('step-1');
      expect(onDelete).toHaveBeenCalledWith('step-1');
    });
  });
  
  describe('Callbacks', () => {
    it('should call onDescriptionUpdate callback when provided', async () => {
      const user = userEvent.setup();
      const onDescriptionUpdate = vi.fn();
      render(
        <WorkflowStepCard 
          step={mockStep} 
          onDescriptionUpdate={onDescriptionUpdate} 
        />
      );
      
      // Enter edit mode and save
      const editButtons = screen.getAllByRole('button');
      const editButton = editButtons.find(btn => 
        btn.querySelector('svg') && btn.className.includes('h-6')
      );
      await user.click(editButton!);
      
      const input = screen.getByPlaceholderText('Add a note for this step...');
      await user.clear(input);
      await user.type(input, 'New note{Enter}');
      
      // Should call both store method and callback
      expect(mockUpdateStepDescription).toHaveBeenCalledWith('step-1', 'New note');
      expect(onDescriptionUpdate).toHaveBeenCalledWith('step-1', 'New note');
    });
  });
  
  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <WorkflowStepCard step={mockStep} className="custom-class" />
      );
      
      const card = container.firstChild;
      expect(card).toHaveClass('custom-class');
    });
  });
  
  describe('Screenshot Handling', () => {
    it('should use lazy loading for screenshot', () => {
      render(<WorkflowStepCard step={mockStep} />);
      
      const img = screen.getByAltText('Step 1 screenshot');
      expect(img).toHaveAttribute('loading', 'lazy');
    });
    
    it('should maintain aspect ratio with object-cover', () => {
      render(<WorkflowStepCard step={mockStep} />);
      
      const img = screen.getByAltText('Step 1 screenshot');
      expect(img).toHaveClass('object-cover');
    });
  });
});
