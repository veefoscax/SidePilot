/**
 * WorkflowEditor Component Tests
 * 
 * Tests for the workflow editor modal component including:
 * - Rendering workflow details
 * - Workflow name input and validation
 * - Save as shortcut functionality
 * - Discard functionality
 * - Step display and management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkflowEditor } from '../WorkflowEditor';
import { useWorkflowStore } from '@/stores/workflow';
import { useShortcutsStore } from '@/stores/shortcuts';
import { WorkflowRecording, WorkflowStep } from '@/lib/workflow';

// Mock the stores
vi.mock('@/stores/workflow');
vi.mock('@/stores/shortcuts');

// Mock the WorkflowStepCard component
vi.mock('../WorkflowStepCard', () => ({
  WorkflowStepCard: ({ step }: { step: WorkflowStep }) => (
    <div data-testid={`step-card-${step.id}`}>
      Step {step.stepNumber}: {step.action.type}
    </div>
  ),
}));

describe('WorkflowEditor', () => {
  const mockSaveWorkflow = vi.fn();
  const mockCreateShortcut = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockOnDiscard = vi.fn();
  const mockOnOpenChange = vi.fn();
  
  const mockWorkflow: WorkflowRecording = {
    id: 'workflow-1',
    name: 'Test Workflow',
    steps: [
      {
        id: 'step-1',
        stepNumber: 1,
        timestamp: Date.now(),
        screenshot: 'data:image/png;base64,abc123',
        action: { type: 'navigate', url: 'https://example.com' },
        url: 'https://example.com',
      },
      {
        id: 'step-2',
        stepNumber: 2,
        timestamp: Date.now() + 1000,
        screenshot: 'data:image/png;base64,def456',
        action: { type: 'click', x: 100, y: 200 },
        url: 'https://example.com',
      },
    ],
    startTime: Date.now() - 5000,
    endTime: Date.now(),
    status: 'completed',
    tabId: 1,
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup workflow store mock
    vi.mocked(useWorkflowStore).mockReturnValue({
      saveWorkflow: mockSaveWorkflow,
      currentRecording: null,
      status: 'idle',
      savedWorkflows: [],
      isLoaded: true,
      cdpWrapper: {} as any,
      startRecording: vi.fn(),
      captureStep: vi.fn(),
      stopRecording: vi.fn(),
      cancelRecording: vi.fn(),
      deleteStep: vi.fn(),
      updateStepDescription: vi.fn(),
      loadWorkflows: vi.fn(),
      deleteWorkflow: vi.fn(),
      getWorkflowById: vi.fn(),
      generatePrompt: vi.fn(),
      validateCurrentRecording: vi.fn(),
    });
    
    // Setup shortcuts store mock
    vi.mocked(useShortcutsStore).mockReturnValue({
      shortcuts: [],
      isLoaded: true,
      loadShortcuts: vi.fn(),
      createShortcut: mockCreateShortcut,
      updateShortcut: vi.fn(),
      deleteShortcut: vi.fn(),
      recordUsage: vi.fn(),
      getByCommand: vi.fn(),
      getById: vi.fn(),
      initializeDefaults: vi.fn(),
    });
    
    // Mock getState for shortcuts store
    vi.mocked(useShortcutsStore).getState = vi.fn().mockReturnValue({
      shortcuts: [],
    });
  });
  
  describe('Rendering', () => {
    it('should render the dialog when open', () => {
      render(
        <WorkflowEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          workflow={mockWorkflow}
        />
      );
      
      expect(screen.getByText('Save Workflow')).toBeInTheDocument();
      expect(screen.getByText(/Review your workflow and save it as a shortcut/)).toBeInTheDocument();
    });
    
    it('should not render when closed', () => {
      render(
        <WorkflowEditor
          open={false}
          onOpenChange={mockOnOpenChange}
          workflow={mockWorkflow}
        />
      );
      
      expect(screen.queryByText('Save Workflow')).not.toBeInTheDocument();
    });
    
    it('should display workflow name input', () => {
      render(
        <WorkflowEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          workflow={mockWorkflow}
        />
      );
      
      const input = screen.getByLabelText(/Workflow Name/);
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('Test Workflow');
    });
    
    it('should display workflow stats', () => {
      render(
        <WorkflowEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          workflow={mockWorkflow}
        />
      );
      
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('steps')).toBeInTheDocument();
      expect(screen.getByText(/estimated duration/)).toBeInTheDocument();
    });
    
    it('should display all workflow steps', () => {
      render(
        <WorkflowEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          workflow={mockWorkflow}
        />
      );
      
      expect(screen.getByTestId('step-card-step-1')).toBeInTheDocument();
      expect(screen.getByTestId('step-card-step-2')).toBeInTheDocument();
    });
    
    it('should show message when workflow has no steps', () => {
      const emptyWorkflow: WorkflowRecording = {
        ...mockWorkflow,
        steps: [],
      };
      
      render(
        <WorkflowEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          workflow={emptyWorkflow}
        />
      );
      
      expect(screen.getByText('No steps recorded in this workflow.')).toBeInTheDocument();
    });
    
    it('should display Save as Shortcut and Discard buttons', () => {
      render(
        <WorkflowEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          workflow={mockWorkflow}
        />
      );
      
      expect(screen.getByRole('button', { name: /Save as Shortcut/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Discard/ })).toBeInTheDocument();
    });
  });
  
  describe('Workflow Name Input', () => {
    it('should allow editing workflow name', async () => {
      const user = userEvent.setup();
      
      render(
        <WorkflowEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          workflow={mockWorkflow}
        />
      );
      
      const input = screen.getByLabelText(/Workflow Name/);
      await user.clear(input);
      await user.type(input, 'New Workflow Name');
      
      expect(input).toHaveValue('New Workflow Name');
    });
    
    it('should clear error when typing in name input', async () => {
      const user = userEvent.setup();
      mockSaveWorkflow.mockRejectedValue(new Error('Please enter a workflow name'));
      
      render(
        <WorkflowEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          workflow={mockWorkflow}
        />
      );
      
      // Click save to trigger an error
      const saveButton = screen.getByRole('button', { name: /Save as Shortcut/ });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a workflow name')).toBeInTheDocument();
      });
      
      // Type in input should clear error
      const input = screen.getByLabelText(/Workflow Name/);
      await user.type(input, 'X');
      
      await waitFor(() => {
        expect(screen.queryByText('Please enter a workflow name')).not.toBeInTheDocument();
      });
    });
  });
  
  describe('Save as Shortcut', () => {
    it('should save workflow and create shortcut on success', async () => {
      const user = userEvent.setup();
      mockSaveWorkflow.mockResolvedValue(undefined);
      mockCreateShortcut.mockResolvedValue({ id: 'shortcut-1' });
      
      render(
        <WorkflowEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          workflow={mockWorkflow}
          onSuccess={mockOnSuccess}
        />
      );
      
      const input = screen.getByLabelText(/Workflow Name/);
      await user.clear(input);
      await user.type(input, 'Login Workflow');
      
      const saveButton = screen.getByRole('button', { name: /Save as Shortcut/ });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(mockSaveWorkflow).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'workflow-1',
          }),
          'Login Workflow'
        );
      });
      
      await waitFor(() => {
        expect(mockCreateShortcut).toHaveBeenCalledWith(
          expect.objectContaining({
            command: 'login-workflow',
            name: 'Login Workflow',
            prompt: expect.stringContaining('Login Workflow'),
          })
        );
      });
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith('workflow-1');
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });
    
    it('should show error when workflow name is empty after clearing', async () => {
      const user = userEvent.setup();
      
      render(
        <WorkflowEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          workflow={mockWorkflow}
        />
      );
      
      const input = screen.getByLabelText(/Workflow Name/);
      await user.clear(input);
      
      // Button should be disabled when name is empty
      const saveButton = screen.getByRole('button', { name: /Save as Shortcut/ });
      expect(saveButton).toBeDisabled();
      
      expect(mockSaveWorkflow).not.toHaveBeenCalled();
      expect(mockCreateShortcut).not.toHaveBeenCalled();
    });
    
    it('should show error when workflow has no steps after clicking enabled button', async () => {
      const user = userEvent.setup();
      const emptyWorkflow: WorkflowRecording = {
        ...mockWorkflow,
        steps: [],
      };
      
      render(
        <WorkflowEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          workflow={emptyWorkflow}
        />
      );
      
      // Button should be disabled when workflow has no steps
      const saveButton = screen.getByRole('button', { name: /Save as Shortcut/ });
      expect(saveButton).toBeDisabled();
      
      expect(mockSaveWorkflow).not.toHaveBeenCalled();
      expect(mockCreateShortcut).not.toHaveBeenCalled();
    });
    
    it('should handle save errors gracefully', async () => {
      const user = userEvent.setup();
      mockSaveWorkflow.mockRejectedValue(new Error('Save failed'));
      
      render(
        <WorkflowEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          workflow={mockWorkflow}
        />
      );
      
      const saveButton = screen.getByRole('button', { name: /Save as Shortcut/ });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Save failed')).toBeInTheDocument();
      });
      
      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnOpenChange).not.toHaveBeenCalled();
    });
    
    it('should generate unique command when duplicate exists', async () => {
      const user = userEvent.setup();
      mockSaveWorkflow.mockResolvedValue(undefined);
      mockCreateShortcut.mockResolvedValue({ id: 'shortcut-1' });
      
      // Mock existing shortcut with same command
      vi.mocked(useShortcutsStore).getState = vi.fn().mockReturnValue({
        shortcuts: [
          { id: 'existing', command: 'test-workflow', name: 'Existing' },
        ],
      });
      
      render(
        <WorkflowEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          workflow={mockWorkflow}
          onSuccess={mockOnSuccess}
        />
      );
      
      const input = screen.getByLabelText(/Workflow Name/);
      await user.clear(input);
      await user.type(input, 'Test Workflow');
      
      const saveButton = screen.getByRole('button', { name: /Save as Shortcut/ });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(mockCreateShortcut).toHaveBeenCalledWith(
          expect.objectContaining({
            command: 'test-workflow-1', // Should append -1 for uniqueness
          })
        );
      });
    });
    
    it('should disable save button when submitting', async () => {
      const user = userEvent.setup();
      mockSaveWorkflow.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(
        <WorkflowEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          workflow={mockWorkflow}
        />
      );
      
      const saveButton = screen.getByRole('button', { name: /Save as Shortcut/ });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Saving.../ })).toBeDisabled();
      });
    });
  });
  
  describe('Discard', () => {
    it('should call onDiscard and close dialog', async () => {
      const user = userEvent.setup();
      
      render(
        <WorkflowEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          workflow={mockWorkflow}
          onDiscard={mockOnDiscard}
        />
      );
      
      const discardButton = screen.getByRole('button', { name: /Discard/ });
      await user.click(discardButton);
      
      expect(mockOnDiscard).toHaveBeenCalled();
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
    
    it('should not save workflow when discarding', async () => {
      const user = userEvent.setup();
      
      render(
        <WorkflowEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          workflow={mockWorkflow}
          onDiscard={mockOnDiscard}
        />
      );
      
      const discardButton = screen.getByRole('button', { name: /Discard/ });
      await user.click(discardButton);
      
      expect(mockSaveWorkflow).not.toHaveBeenCalled();
      expect(mockCreateShortcut).not.toHaveBeenCalled();
    });
  });
  
  describe('Button States', () => {
    it('should disable save button when workflow name is empty', () => {
      const emptyNameWorkflow: WorkflowRecording = {
        ...mockWorkflow,
        name: '',
      };
      
      render(
        <WorkflowEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          workflow={emptyNameWorkflow}
        />
      );
      
      const saveButton = screen.getByRole('button', { name: /Save as Shortcut/ });
      expect(saveButton).toBeDisabled();
    });
    
    it('should disable save button when workflow has no steps', () => {
      const emptyWorkflow: WorkflowRecording = {
        ...mockWorkflow,
        steps: [],
      };
      
      render(
        <WorkflowEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          workflow={emptyWorkflow}
        />
      );
      
      const saveButton = screen.getByRole('button', { name: /Save as Shortcut/ });
      expect(saveButton).toBeDisabled();
    });
    
    it('should disable save button when workflow is null', () => {
      render(
        <WorkflowEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          workflow={null}
        />
      );
      
      const saveButton = screen.getByRole('button', { name: /Save as Shortcut/ });
      expect(saveButton).toBeDisabled();
    });
  });
  
  describe('Duration Formatting', () => {
    it('should format duration in seconds when less than 1 minute', () => {
      const shortWorkflow: WorkflowRecording = {
        ...mockWorkflow,
        steps: [mockWorkflow.steps[0]], // Only 1 step
      };
      
      render(
        <WorkflowEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          workflow={shortWorkflow}
        />
      );
      
      // Should show seconds only
      expect(screen.getByText(/\d+s/)).toBeInTheDocument();
    });
    
    it('should format duration in minutes and seconds when over 1 minute', () => {
      const longWorkflow: WorkflowRecording = {
        ...mockWorkflow,
        steps: Array(100).fill(null).map((_, i) => ({
          id: `step-${i}`,
          stepNumber: i + 1,
          timestamp: Date.now() + i * 1000,
          screenshot: 'data:image/png;base64,abc',
          action: { type: 'click' as const, x: 0, y: 0 },
          url: 'https://example.com',
        })),
      };
      
      render(
        <WorkflowEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          workflow={longWorkflow}
        />
      );
      
      // Should show minutes and seconds
      expect(screen.getByText(/\d+m \d+s/)).toBeInTheDocument();
    });
  });
  
  describe('Form Reset', () => {
    it('should reset form when dialog opens', () => {
      const { rerender } = render(
        <WorkflowEditor
          open={false}
          onOpenChange={mockOnOpenChange}
          workflow={mockWorkflow}
        />
      );
      
      // Open dialog
      rerender(
        <WorkflowEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          workflow={mockWorkflow}
        />
      );
      
      const input = screen.getByLabelText(/Workflow Name/);
      expect(input).toHaveValue('Test Workflow');
    });
    
    it('should reset error when dialog opens', async () => {
      const user = userEvent.setup();
      mockSaveWorkflow.mockRejectedValue(new Error('Test error'));
      
      const { rerender } = render(
        <WorkflowEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          workflow={mockWorkflow}
        />
      );
      
      // Trigger error by clicking save with a mock error
      const saveButton = screen.getByRole('button', { name: /Save as Shortcut/ });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });
      
      // Close and reopen
      rerender(
        <WorkflowEditor
          open={false}
          onOpenChange={mockOnOpenChange}
          workflow={mockWorkflow}
        />
      );
      
      rerender(
        <WorkflowEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          workflow={mockWorkflow}
        />
      );
      
      // Error should be cleared
      expect(screen.queryByText('Test error')).not.toBeInTheDocument();
    });
  });
});
