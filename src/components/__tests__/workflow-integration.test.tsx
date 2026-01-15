/**
 * Workflow Recording Integration Tests
 * 
 * Tests the complete workflow recording flow including:
 * - Starting recording from slash menu
 * - Capturing steps during tool execution
 * - Stopping recording and opening editor
 * - Saving workflow as shortcut
 * - Step editing and deletion
 * - Prompt generation quality
 * 
 * Validates: All ACs for S09-workflow-recording
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { RecordingBar } from '../RecordingBar';
import { WorkflowEditor } from '../WorkflowEditor';
import { WorkflowStepCard } from '../WorkflowStepCard';
import { useWorkflowStore } from '@/stores/workflow';
import { useShortcutsStore } from '@/stores/shortcuts';
import { generateWorkflowPrompt, WorkflowRecording, WorkflowStep } from '@/lib/workflow';
import { toolRegistry } from '@/tools/registry';

// Mock chrome API
const mockChrome = {
  tabs: {
    get: vi.fn().mockResolvedValue({
      id: 1,
      url: 'https://example.com',
      title: 'Example Page'
    }),
    query: vi.fn().mockResolvedValue([{
      id: 1,
      url: 'https://example.com',
      title: 'Example Page'
    }]),
    executeScript: vi.fn().mockResolvedValue([{ result: [] }])
  },
  debugger: {
    attach: vi.fn().mockResolvedValue(undefined),
    detach: vi.fn().mockResolvedValue(undefined),
    sendCommand: vi.fn().mockResolvedValue({
      data: 'base64screenshotdata'
    })
  },
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined)
    }
  },
  scripting: {
    executeScript: vi.fn().mockResolvedValue([{ result: [] }])
  }
};

(globalThis as any).chrome = mockChrome;


// Mock window.confirm
const mockConfirm = vi.fn();
(globalThis as any).confirm = mockConfirm;

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}));

// Mock CDP Wrapper
vi.mock('@/lib/cdp-wrapper', () => {
  const attachDebugger = vi.fn().mockResolvedValue(undefined);
  const screenshot = vi.fn().mockResolvedValue({
    data: 'base64screenshotdata',
    width: 1920,
    height: 1080,
    devicePixelRatio: 1,
  });

  class MockCDPWrapper {
    attachDebugger = attachDebugger;
    screenshot = screenshot;
  }

  return {
    CDPWrapper: MockCDPWrapper,
    __mockAttachDebugger: attachDebugger,
    __mockScreenshot: screenshot,
  };
});

// Import mocks
import * as cdpModule from '@/lib/cdp-wrapper';
const mockScreenshot = (cdpModule as any).__mockScreenshot;

// Helper to create mock workflow steps
function createMockStep(overrides: Partial<WorkflowStep> = {}): WorkflowStep {
  return {
    id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    stepNumber: 1,
    timestamp: Date.now(),
    screenshot: 'data:image/png;base64,mockscreenshot',
    action: { type: 'click', x: 100, y: 200 },
    url: 'https://example.com',
    ...overrides,
  };
}

// Helper to create mock workflow recording
function createMockWorkflow(overrides: Partial<WorkflowRecording> = {}): WorkflowRecording {
  return {
    id: `workflow-${Date.now()}`,
    name: 'Test Workflow',
    steps: [
      createMockStep({ stepNumber: 1 }),
      createMockStep({ stepNumber: 2, action: { type: 'type', text: 'Hello' } }),
    ],
    startTime: Date.now() - 5000,
    endTime: Date.now(),
    status: 'completed',
    tabId: 1,
    ...overrides,
  };
}

describe('Workflow Recording Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true);

    // Reset workflow store
    useWorkflowStore.setState({
      currentRecording: null,
      status: 'idle',
      savedWorkflows: [],
      isLoaded: false,
    });

    // Reset shortcuts store
    useShortcutsStore.setState({
      shortcuts: [],
      isLoaded: true,
    });
  });

  afterEach(() => {
    // Clean up any active recordings
    const { status, cancelRecording } = useWorkflowStore.getState();
    if (status === 'recording') {
      cancelRecording();
    }
  });


  describe('AC1: Recording Controls - Complete Recording Flow', () => {
    it('should start recording, capture steps, and stop recording', async () => {
      render(<RecordingBar />);

      // Initially not visible
      expect(screen.queryByText('Recording Workflow')).not.toBeInTheDocument();

      // Start recording
      await act(async () => {
        await useWorkflowStore.getState().startRecording(1);
      });

      // Recording bar should be visible
      expect(screen.getByText('Recording Workflow')).toBeInTheDocument();
      expect(screen.getByText('0 steps')).toBeInTheDocument();

      // Capture steps
      await act(async () => {
        await useWorkflowStore.getState().captureStep({ type: 'click', x: 100, y: 200 });
      });
      expect(screen.getByText('1 step')).toBeInTheDocument();

      await act(async () => {
        await useWorkflowStore.getState().captureStep({ type: 'type', text: 'Hello World' });
      });
      expect(screen.getByText('2 steps')).toBeInTheDocument();

      // Stop recording
      let completedWorkflow: WorkflowRecording | null = null;
      await act(async () => {
        completedWorkflow = await useWorkflowStore.getState().stopRecording();
      });

      // Recording bar should be hidden
      await waitFor(() => {
        expect(screen.queryByText('Recording Workflow')).not.toBeInTheDocument();
      });

      // Verify completed workflow
      expect(completedWorkflow).not.toBeNull();
      expect(completedWorkflow?.status).toBe('completed');
      expect(completedWorkflow?.steps).toHaveLength(2);
      expect(completedWorkflow?.steps[0].action.type).toBe('click');
      expect(completedWorkflow?.steps[1].action.type).toBe('type');
    });

    it('should cancel recording and discard all steps', async () => {
      const user = userEvent.setup();
      render(<RecordingBar />);

      // Start recording and capture steps
      await act(async () => {
        await useWorkflowStore.getState().startRecording(1);
        await useWorkflowStore.getState().captureStep({ type: 'click', x: 100, y: 200 });
        await useWorkflowStore.getState().captureStep({ type: 'navigate', url: 'https://test.com' });
      });

      expect(screen.getByText('2 steps')).toBeInTheDocument();

      // Click cancel button
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Confirm cancellation
      expect(mockConfirm).toHaveBeenCalled();

      // Recording should be cancelled
      await waitFor(() => {
        expect(screen.queryByText('Recording Workflow')).not.toBeInTheDocument();
      });

      // Store should be reset
      expect(useWorkflowStore.getState().status).toBe('idle');
      expect(useWorkflowStore.getState().currentRecording).toBeNull();
    });

    it('should not cancel recording when user declines confirmation', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(false);

      render(<RecordingBar />);

      await act(async () => {
        await useWorkflowStore.getState().startRecording(1);
        await useWorkflowStore.getState().captureStep({ type: 'click', x: 100, y: 200 });
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Recording should still be active
      expect(screen.getByText('Recording Workflow')).toBeInTheDocument();
      expect(useWorkflowStore.getState().status).toBe('recording');
    });
  });


  describe('AC2: Step Capture - Tool Execution Integration', () => {
    it('should capture screenshot and action details on step capture', async () => {
      await act(async () => {
        await useWorkflowStore.getState().startRecording(1);
      });

      // Capture a click action
      await act(async () => {
        await useWorkflowStore.getState().captureStep({
          type: 'click',
          x: 150,
          y: 250,
        });
      });

      const state = useWorkflowStore.getState();
      const step = state.currentRecording?.steps[0];

      expect(step).toBeDefined();
      expect(step?.action.type).toBe('click');
      expect(step?.action.x).toBe(150);
      expect(step?.action.y).toBe(250);
      expect(step?.screenshot).toContain('data:image/png;base64,');
      expect(step?.url).toBe('https://example.com');
      expect(step?.stepNumber).toBe(1);
      expect(mockScreenshot).toHaveBeenCalled();
    });

    it('should capture different action types correctly', async () => {
      await act(async () => {
        await useWorkflowStore.getState().startRecording(1);
      });

      // Capture various action types
      const actions = [
        { type: 'click' as const, x: 100, y: 200 },
        { type: 'type' as const, text: 'Hello World' },
        { type: 'navigate' as const, url: 'https://test.com' },
        { type: 'scroll' as const, direction: 'down' },
        { type: 'key' as const, key: 'Enter' },
      ];

      for (const action of actions) {
        await act(async () => {
          await useWorkflowStore.getState().captureStep(action);
        });
      }

      const state = useWorkflowStore.getState();
      expect(state.currentRecording?.steps).toHaveLength(5);

      // Verify each action type
      expect(state.currentRecording?.steps[0].action.type).toBe('click');
      expect(state.currentRecording?.steps[1].action.type).toBe('type');
      expect(state.currentRecording?.steps[1].action.text).toBe('Hello World');
      expect(state.currentRecording?.steps[2].action.type).toBe('navigate');
      expect(state.currentRecording?.steps[2].action.url).toBe('https://test.com');
      expect(state.currentRecording?.steps[3].action.type).toBe('scroll');
      expect(state.currentRecording?.steps[3].action.direction).toBe('down');
      expect(state.currentRecording?.steps[4].action.type).toBe('key');
      expect(state.currentRecording?.steps[4].action.key).toBe('Enter');
    });

    it('should not capture steps when not recording', async () => {
      // Ensure not recording
      expect(useWorkflowStore.getState().status).toBe('idle');

      await act(async () => {
        await useWorkflowStore.getState().captureStep({ type: 'click', x: 100, y: 200 });
      });

      // No screenshot should be taken
      expect(mockScreenshot).not.toHaveBeenCalled();
    });
  });


  describe('AC3: Step Management - Editing and Deletion', () => {
    it('should delete a step and renumber remaining steps', async () => {
      await act(async () => {
        await useWorkflowStore.getState().startRecording(1);
        await useWorkflowStore.getState().captureStep({ type: 'click', x: 100, y: 200 });
        await useWorkflowStore.getState().captureStep({ type: 'type', text: 'Hello' });
        await useWorkflowStore.getState().captureStep({ type: 'click', x: 300, y: 400 });
      });

      const state = useWorkflowStore.getState();
      expect(state.currentRecording?.steps).toHaveLength(3);

      // Delete the middle step
      const middleStepId = state.currentRecording?.steps[1].id!;
      act(() => {
        useWorkflowStore.getState().deleteStep(middleStepId);
      });

      const updatedState = useWorkflowStore.getState();
      expect(updatedState.currentRecording?.steps).toHaveLength(2);

      // Verify renumbering
      expect(updatedState.currentRecording?.steps[0].stepNumber).toBe(1);
      expect(updatedState.currentRecording?.steps[1].stepNumber).toBe(2);

      // Verify correct steps remain
      expect(updatedState.currentRecording?.steps[0].action.type).toBe('click');
      expect(updatedState.currentRecording?.steps[1].action.x).toBe(300);
    });

    it('should update step description', async () => {
      await act(async () => {
        await useWorkflowStore.getState().startRecording(1);
        await useWorkflowStore.getState().captureStep({ type: 'click', x: 100, y: 200 });
      });

      const state = useWorkflowStore.getState();
      const stepId = state.currentRecording?.steps[0].id!;

      // Update description
      act(() => {
        useWorkflowStore.getState().updateStepDescription(stepId, 'Click the submit button');
      });

      const updatedState = useWorkflowStore.getState();
      expect(updatedState.currentRecording?.steps[0].description).toBe('Click the submit button');
    });

    it('should clear description when empty string provided', async () => {
      await act(async () => {
        await useWorkflowStore.getState().startRecording(1);
        await useWorkflowStore.getState().captureStep({ type: 'click', x: 100, y: 200 });
      });

      const state = useWorkflowStore.getState();
      const stepId = state.currentRecording?.steps[0].id!;

      // Set description first
      act(() => {
        useWorkflowStore.getState().updateStepDescription(stepId, 'Initial description');
      });

      // Clear it with whitespace
      act(() => {
        useWorkflowStore.getState().updateStepDescription(stepId, '   ');
      });

      const updatedState = useWorkflowStore.getState();
      expect(updatedState.currentRecording?.steps[0].description).toBeUndefined();
    });
  });


  describe('AC4: Save as Shortcut - WorkflowEditor Integration', () => {
    const mockOnOpenChange = vi.fn();
    const mockOnSuccess = vi.fn();
    const mockOnDiscard = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should save workflow as shortcut with generated prompt', async () => {
      const user = userEvent.setup();
      const workflow = createMockWorkflow({ name: '' });

      render(
        <WorkflowEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          workflow={workflow}
          onSuccess={mockOnSuccess}
          onDiscard={mockOnDiscard}
        />
      );

      // Enter workflow name
      const nameInput = screen.getByLabelText(/Workflow Name/);
      await user.clear(nameInput);
      await user.type(nameInput, 'Login Flow');

      // Click save button
      const saveButton = screen.getByRole('button', { name: /Save as Shortcut/ });
      await user.click(saveButton);

      // Wait for save to complete
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(workflow.id);
      });

      // Verify shortcut was created
      const shortcuts = useShortcutsStore.getState().shortcuts;
      expect(shortcuts).toHaveLength(1);
      expect(shortcuts[0].name).toBe('Login Flow');
      expect(shortcuts[0].command).toBe('login-flow');
      expect(shortcuts[0].prompt).toContain('Login Flow');
    });

    it('should generate unique command when duplicate exists', async () => {
      const user = userEvent.setup();

      // Pre-populate with existing shortcut
      useShortcutsStore.setState({
        shortcuts: [{
          id: 'existing',
          command: 'test-workflow',
          name: 'Existing Workflow',
          prompt: 'Test prompt',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          usageCount: 0,
        }],
        isLoaded: true,
      });

      const workflow = createMockWorkflow();

      render(
        <WorkflowEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          workflow={workflow}
          onSuccess={mockOnSuccess}
        />
      );

      const nameInput = screen.getByLabelText(/Workflow Name/);
      await user.clear(nameInput);
      await user.type(nameInput, 'Test Workflow');

      const saveButton = screen.getByRole('button', { name: /Save as Shortcut/ });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });

      // Verify unique command was generated
      const shortcuts = useShortcutsStore.getState().shortcuts;
      const newShortcut = shortcuts.find(s => s.id !== 'existing');
      expect(newShortcut?.command).toBe('test-workflow-1');
    });

    it('should disable save button when workflow name is empty', () => {
      const workflow = createMockWorkflow({ name: '' });

      render(
        <WorkflowEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          workflow={workflow}
        />
      );

      const saveButton = screen.getByRole('button', { name: /Save as Shortcut/ });
      expect(saveButton).toBeDisabled();
    });

    it('should disable save button when workflow has no steps', () => {
      const workflow = createMockWorkflow({ steps: [] });

      render(
        <WorkflowEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          workflow={workflow}
        />
      );

      const saveButton = screen.getByRole('button', { name: /Save as Shortcut/ });
      expect(saveButton).toBeDisabled();
    });

    it('should call onDiscard and close dialog when discarding', async () => {
      const user = userEvent.setup();
      const workflow = createMockWorkflow();

      render(
        <WorkflowEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          workflow={workflow}
          onDiscard={mockOnDiscard}
        />
      );

      const discardButton = screen.getByRole('button', { name: /Discard/ });
      await user.click(discardButton);

      expect(mockOnDiscard).toHaveBeenCalled();
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });


  describe('AC5: Prompt Generation Quality', () => {
    it('should generate AI-friendly prompt with all step details', () => {
      const workflow: WorkflowRecording = {
        id: 'test-workflow',
        name: 'Login to Dashboard',
        steps: [
          createMockStep({
            stepNumber: 1,
            action: { type: 'navigate', url: 'https://app.example.com/login' },
            url: 'https://app.example.com/login',
            description: 'Go to login page',
          }),
          createMockStep({
            stepNumber: 2,
            action: { type: 'type', text: 'user@example.com' },
            url: 'https://app.example.com/login',
            description: 'Enter email address',
          }),
          createMockStep({
            stepNumber: 3,
            action: { type: 'type', text: 'password123' },
            url: 'https://app.example.com/login',
          }),
          createMockStep({
            stepNumber: 4,
            action: { type: 'click', x: 200, y: 300 },
            url: 'https://app.example.com/login',
            description: 'Click login button',
          }),
        ],
        startTime: Date.now() - 10000,
        endTime: Date.now(),
        status: 'completed',
        tabId: 1,
      };

      const prompt = generateWorkflowPrompt(workflow);

      // Verify header
      expect(prompt).toContain('# Workflow: Login to Dashboard');

      // Verify step count
      expect(prompt).toContain('Recorded 4 steps');

      // Verify step descriptions
      expect(prompt).toContain('Step 1');
      expect(prompt).toContain('Navigate to https://app.example.com/login');
      expect(prompt).toContain('Go to login page');

      expect(prompt).toContain('Step 2');
      expect(prompt).toContain('Type "user@example.com"');
      expect(prompt).toContain('Enter email address');

      expect(prompt).toContain('Step 3');
      expect(prompt).toContain('Type "password123"');

      expect(prompt).toContain('Step 4');
      expect(prompt).toContain('Click at (200, 300)');
      expect(prompt).toContain('Click login button');

      // Verify footer instruction
      expect(prompt).toContain('Please execute this workflow step by step');
    });

    it('should handle workflow with no steps gracefully', () => {
      const workflow: WorkflowRecording = {
        id: 'empty-workflow',
        name: 'Empty Workflow',
        steps: [],
        startTime: Date.now(),
        status: 'completed',
        tabId: 1,
      };

      const prompt = generateWorkflowPrompt(workflow);
      expect(prompt).toContain('No steps recorded');
    });

    it('should include URL changes between steps', () => {
      const workflow: WorkflowRecording = {
        id: 'multi-page-workflow',
        name: 'Multi-Page Flow',
        steps: [
          createMockStep({
            stepNumber: 1,
            action: { type: 'click', x: 100, y: 200 },
            url: 'https://page1.com',
          }),
          createMockStep({
            stepNumber: 2,
            action: { type: 'click', x: 150, y: 250 },
            url: 'https://page2.com', // URL changed
          }),
        ],
        startTime: Date.now(),
        status: 'completed',
        tabId: 1,
      };

      const prompt = generateWorkflowPrompt(workflow);

      // Should include page URL for step 2 since it changed
      expect(prompt).toContain('Page: https://page2.com');
    });

    it('should generate prompt from store', async () => {
      await act(async () => {
        await useWorkflowStore.getState().startRecording(1);
        await useWorkflowStore.getState().captureStep({ type: 'click', x: 100, y: 200 });
      });

      // Set a name on the current recording
      useWorkflowStore.setState(state => ({
        currentRecording: state.currentRecording ? {
          ...state.currentRecording,
          name: 'Store Test Workflow',
        } : null,
      }));

      const prompt = useWorkflowStore.getState().generatePrompt();

      expect(prompt).toContain('Store Test Workflow');
      expect(prompt).toContain('Click at (100, 200)');
    });
  });


  describe('AC6: WorkflowStepCard Component Integration', () => {
    it('should render step with screenshot and action description', () => {
      const step = createMockStep({
        stepNumber: 1,
        action: { type: 'click', x: 150, y: 250 },
        description: 'Click the submit button',
      });

      render(<WorkflowStepCard step={step} />);

      // Verify step number
      expect(screen.getByText('1')).toBeInTheDocument();

      // Verify action description
      expect(screen.getByText('Click at (150, 250)')).toBeInTheDocument();

      // Verify user description
      expect(screen.getByText('Click the submit button')).toBeInTheDocument();

      // Verify screenshot
      const img = screen.getByAltText('Step 1 screenshot');
      expect(img).toBeInTheDocument();
    });

    it('should allow inline editing of step description', async () => {
      const user = userEvent.setup();
      const step = createMockStep({ stepNumber: 1 });

      // Set up the recording in the store
      useWorkflowStore.setState({
        currentRecording: {
          id: 'test',
          steps: [step],
          startTime: Date.now(),
          status: 'recording',
          tabId: 1,
        },
        status: 'recording',
      });

      render(<WorkflowStepCard step={step} />);

      // Find the edit button (the smaller one with h-6 w-6 class)
      const buttons = screen.getAllByRole('button');
      const editButton = buttons.find(btn => 
        btn.className.includes('h-6') && btn.className.includes('w-6')
      );
      
      expect(editButton).toBeDefined();
      await user.click(editButton!);

      // Type new description
      const input = screen.getByPlaceholderText(/Add a note/);
      await user.type(input, 'New description');

      // Save by pressing Enter
      await user.keyboard('{Enter}');

      // Verify description was updated in store
      const updatedState = useWorkflowStore.getState();
      expect(updatedState.currentRecording?.steps[0].description).toBe('New description');
    });

    it('should delete step when delete button clicked', async () => {
      const user = userEvent.setup();
      const step = createMockStep({ stepNumber: 1 });

      // Set up the recording in the store
      useWorkflowStore.setState({
        currentRecording: {
          id: 'test',
          steps: [step],
          startTime: Date.now(),
          status: 'recording',
          tabId: 1,
        },
        status: 'recording',
      });

      render(<WorkflowStepCard step={step} />);

      // Find and click delete button
      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find(btn => 
        btn.className.includes('destructive')
      );
      
      if (deleteButton) {
        await user.click(deleteButton);
      }

      // Verify step was deleted from store
      const updatedState = useWorkflowStore.getState();
      expect(updatedState.currentRecording?.steps).toHaveLength(0);
    });
  });


  describe('AC7: Workflow Persistence', () => {
    it('should save workflow to storage', async () => {
      const workflow = createMockWorkflow();

      await act(async () => {
        await useWorkflowStore.getState().saveWorkflow(workflow, 'Saved Workflow');
      });

      // Verify storage was called
      expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'sidepilot-workflows': expect.arrayContaining([
            expect.objectContaining({
              id: workflow.id,
              name: 'Saved Workflow',
            }),
          ]),
        })
      );

      // Verify state was updated
      const state = useWorkflowStore.getState();
      expect(state.savedWorkflows).toHaveLength(1);
      expect(state.savedWorkflows[0].name).toBe('Saved Workflow');
    });

    it('should load workflows from storage', async () => {
      const mockWorkflows = [
        createMockWorkflow({ id: 'workflow-1', name: 'Workflow 1' }),
        createMockWorkflow({ id: 'workflow-2', name: 'Workflow 2' }),
      ];

      mockChrome.storage.local.get.mockResolvedValueOnce({
        'sidepilot-workflows': mockWorkflows,
      });

      await act(async () => {
        await useWorkflowStore.getState().loadWorkflows();
      });

      const state = useWorkflowStore.getState();
      expect(state.savedWorkflows).toHaveLength(2);
      expect(state.isLoaded).toBe(true);
    });

    it('should delete workflow from storage', async () => {
      // Set up initial workflows
      useWorkflowStore.setState({
        savedWorkflows: [
          createMockWorkflow({ id: 'workflow-1', name: 'Workflow 1' }),
          createMockWorkflow({ id: 'workflow-2', name: 'Workflow 2' }),
        ],
      });

      await act(async () => {
        await useWorkflowStore.getState().deleteWorkflow('workflow-1');
      });

      const state = useWorkflowStore.getState();
      expect(state.savedWorkflows).toHaveLength(1);
      expect(state.savedWorkflows[0].id).toBe('workflow-2');
    });

    it('should get workflow by ID', () => {
      const workflow = createMockWorkflow({ id: 'test-id' });

      useWorkflowStore.setState({
        savedWorkflows: [workflow],
      });

      const result = useWorkflowStore.getState().getWorkflowById('test-id');
      expect(result).toEqual(workflow);
    });
  });


  describe('AC8: End-to-End Recording Flow', () => {
    it('should complete full recording flow: start -> capture -> stop -> save', async () => {
      const user = userEvent.setup();

      // Render both RecordingBar and WorkflowEditor
      const { rerender } = render(
        <>
          <RecordingBar />
        </>
      );

      // 1. Start recording
      await act(async () => {
        await useWorkflowStore.getState().startRecording(1);
      });

      expect(screen.getByText('Recording Workflow')).toBeInTheDocument();

      // 2. Capture multiple steps
      await act(async () => {
        await useWorkflowStore.getState().captureStep({ type: 'navigate', url: 'https://example.com' });
        await useWorkflowStore.getState().captureStep({ type: 'click', x: 100, y: 200 });
        await useWorkflowStore.getState().captureStep({ type: 'type', text: 'test@example.com' });
      });

      expect(screen.getByText('3 steps')).toBeInTheDocument();

      // 3. Stop recording
      let completedWorkflow: WorkflowRecording | null = null;
      await act(async () => {
        completedWorkflow = await useWorkflowStore.getState().stopRecording();
      });

      expect(completedWorkflow).not.toBeNull();
      expect(completedWorkflow?.steps).toHaveLength(3);

      // 4. Open WorkflowEditor with completed workflow
      const mockOnOpenChange = vi.fn();
      const mockOnSuccess = vi.fn();

      rerender(
        <WorkflowEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          workflow={completedWorkflow}
          onSuccess={mockOnSuccess}
        />
      );

      // 5. Enter name and save
      const nameInput = screen.getByLabelText(/Workflow Name/);
      await user.type(nameInput, 'Complete Test Flow');

      const saveButton = screen.getByRole('button', { name: /Save as Shortcut/ });
      await user.click(saveButton);

      // 6. Verify shortcut was created
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });

      const shortcuts = useShortcutsStore.getState().shortcuts;
      expect(shortcuts).toHaveLength(1);
      expect(shortcuts[0].name).toBe('Complete Test Flow');
      expect(shortcuts[0].prompt).toContain('Step 1');
      expect(shortcuts[0].prompt).toContain('Step 2');
      expect(shortcuts[0].prompt).toContain('Step 3');
    });

    it('should handle multiple recording sessions', async () => {
      render(<RecordingBar />);

      // First session
      await act(async () => {
        await useWorkflowStore.getState().startRecording(1);
        await useWorkflowStore.getState().captureStep({ type: 'click', x: 100, y: 200 });
      });

      expect(screen.getByText('1 step')).toBeInTheDocument();

      await act(async () => {
        await useWorkflowStore.getState().stopRecording();
      });

      // Second session
      await act(async () => {
        await useWorkflowStore.getState().startRecording(2);
      });

      // Should start fresh with 0 steps
      expect(screen.getByText('0 steps')).toBeInTheDocument();

      await act(async () => {
        await useWorkflowStore.getState().captureStep({ type: 'type', text: 'Hello' });
        await useWorkflowStore.getState().captureStep({ type: 'type', text: 'World' });
      });

      expect(screen.getByText('2 steps')).toBeInTheDocument();
    });
  });


  describe('AC9: Error Handling', () => {
    it('should handle CDP errors during step capture gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock CDP to fail
      mockScreenshot.mockRejectedValueOnce(new Error('CDP error'));

      await act(async () => {
        await useWorkflowStore.getState().startRecording(1);
      });

      // Try to capture a step (should fail but not crash)
      await act(async () => {
        await useWorkflowStore.getState().captureStep({ type: 'click', x: 100, y: 200 });
      });

      // Recording should still be active
      expect(useWorkflowStore.getState().status).toBe('recording');

      // Step should not be added
      expect(useWorkflowStore.getState().currentRecording?.steps).toHaveLength(0);

      consoleErrorSpy.mockRestore();
    });

    it('should validate workflow before saving', async () => {
      const invalidWorkflow: WorkflowRecording = {
        id: '',  // Invalid: empty ID
        steps: [],  // Invalid: no steps
        startTime: Date.now(),
        status: 'completed',
        tabId: 0,  // Invalid: no tab ID
      };

      await expect(
        useWorkflowStore.getState().saveWorkflow(invalidWorkflow, 'Test')
      ).rejects.toThrow();
    });

    it('should handle storage errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockChrome.storage.local.get.mockRejectedValueOnce(new Error('Storage error'));

      await act(async () => {
        await useWorkflowStore.getState().loadWorkflows();
      });

      // Should set empty array and mark as loaded
      const state = useWorkflowStore.getState();
      expect(state.savedWorkflows).toEqual([]);
      expect(state.isLoaded).toBe(true);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Workflow Validation', () => {
    it('should validate current recording', async () => {
      // No recording - should be invalid
      let validation = useWorkflowStore.getState().validateCurrentRecording();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('No current recording to validate');

      // Start recording and add a step
      await act(async () => {
        await useWorkflowStore.getState().startRecording(1);
        await useWorkflowStore.getState().captureStep({ type: 'click', x: 100, y: 200 });
      });

      validation = useWorkflowStore.getState().validateCurrentRecording();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });
});
