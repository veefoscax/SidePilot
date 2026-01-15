/**
 * Tests for Workflow Store
 * 
 * Tests the workflow recording store functionality including recording lifecycle,
 * step capture and modification, and persistence.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { WorkflowRecording, WorkflowAction } from '@/lib/workflow';

// Mock CDP Wrapper - must be before imports
vi.mock('@/lib/cdp-wrapper', () => {
  // Create mock functions inside the factory
  const attachDebugger = vi.fn();
  const screenshot = vi.fn();
  
  class MockCDPWrapper {
    attachDebugger = attachDebugger;
    screenshot = screenshot;
  }
  
  return {
    CDPWrapper: MockCDPWrapper,
    // Export the mocks so we can access them in tests
    __mockAttachDebugger: attachDebugger,
    __mockScreenshot: screenshot,
  };
});

// Import after mocking
import { useWorkflowStore } from '../workflow';
import * as cdpModule from '@/lib/cdp-wrapper';

// Get mock functions from the module
const mockAttachDebugger = (cdpModule as any).__mockAttachDebugger;
const mockScreenshot = (cdpModule as any).__mockScreenshot;

// Mock Chrome APIs
const mockChrome = {
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    },
  },
  tabs: {
    get: vi.fn(),
  },
  debugger: {
    attach: vi.fn(),
  },
};

// Setup global chrome mock
global.chrome = mockChrome as any;

describe('Workflow Store', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Reset store state
    useWorkflowStore.setState({
      currentRecording: null,
      status: 'idle',
      savedWorkflows: [],
      isLoaded: false,
    });
    
    // Setup default mock responses
    mockChrome.storage.local.get.mockResolvedValue({});
    mockChrome.storage.local.set.mockResolvedValue(undefined);
    mockChrome.tabs.get.mockResolvedValue({
      id: 123,
      url: 'https://example.com',
    });
    mockAttachDebugger.mockResolvedValue(undefined);
    mockScreenshot.mockResolvedValue({
      data: 'base64-screenshot-data',
      width: 1920,
      height: 1080,
      devicePixelRatio: 1,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Recording Lifecycle', () => {
    it('should start recording successfully', async () => {
      const store = useWorkflowStore.getState();
      
      await store.startRecording(123);
      
      const state = useWorkflowStore.getState();
      expect(state.status).toBe('recording');
      expect(state.currentRecording).toBeTruthy();
      expect(state.currentRecording?.tabId).toBe(123);
      expect(state.currentRecording?.status).toBe('recording');
      expect(mockAttachDebugger).toHaveBeenCalledWith(123);
    });

    it('should handle start recording errors', async () => {
      mockAttachDebugger.mockRejectedValue(new Error('CDP attach failed'));
      
      const store = useWorkflowStore.getState();
      
      await expect(store.startRecording(123)).rejects.toThrow('Failed to start recording');
      
      const state = useWorkflowStore.getState();
      expect(state.status).toBe('idle');
      expect(state.currentRecording).toBeNull();
    });

    it('should stop recording and return completed workflow', async () => {
      const store = useWorkflowStore.getState();
      
      // Start recording first
      await store.startRecording(123);
      
      // Add a step
      const action: WorkflowAction = { type: 'click', x: 100, y: 200 };
      await store.captureStep(action);
      
      // Stop recording
      const result = await store.stopRecording();
      
      expect(result).toBeTruthy();
      expect(result?.status).toBe('completed');
      expect(result?.endTime).toBeTruthy();
      expect(result?.steps).toHaveLength(1);
      
      const state = useWorkflowStore.getState();
      expect(state.status).toBe('idle');
      expect(state.currentRecording).toBeNull();
    });

    it('should return null when stopping with no active recording', async () => {
      const store = useWorkflowStore.getState();
      
      const result = await store.stopRecording();
      
      expect(result).toBeNull();
    });

    it('should cancel recording', () => {
      const store = useWorkflowStore.getState();
      
      // Set up a mock recording
      useWorkflowStore.setState({
        currentRecording: {
          id: 'test-id',
          steps: [],
          startTime: Date.now(),
          status: 'recording',
          tabId: 123,
        },
        status: 'recording',
      });
      
      store.cancelRecording();
      
      const state = useWorkflowStore.getState();
      expect(state.status).toBe('idle');
      expect(state.currentRecording).toBeNull();
    });
  });

  describe('Step Capture and Modification', () => {
    beforeEach(async () => {
      const store = useWorkflowStore.getState();
      await store.startRecording(123);
    });

    it('should capture a step with screenshot', async () => {
      const store = useWorkflowStore.getState();
      const action: WorkflowAction = { type: 'click', x: 100, y: 200 };
      
      await store.captureStep(action);
      
      const state = useWorkflowStore.getState();
      expect(state.currentRecording?.steps).toHaveLength(1);
      
      const step = state.currentRecording?.steps[0];
      expect(step?.action).toEqual(action);
      expect(step?.screenshot).toContain('data:image/png;base64,');
      expect(step?.stepNumber).toBe(1);
      expect(step?.url).toBe('https://example.com');
      expect(mockScreenshot).toHaveBeenCalledWith(123, {
        format: 'png',
        quality: 0.8,
      });
    });

    it('should handle screenshot errors gracefully', async () => {
      mockScreenshot.mockRejectedValue(new Error('Screenshot failed'));
      
      const store = useWorkflowStore.getState();
      const action: WorkflowAction = { type: 'type', text: 'hello' };
      
      // Should not throw
      await expect(store.captureStep(action)).resolves.toBeUndefined();
      
      // Step should not be added if screenshot fails
      const state = useWorkflowStore.getState();
      expect(state.currentRecording?.steps).toHaveLength(0);
    });

    it('should not capture step when not recording', async () => {
      // Stop recording first
      const store = useWorkflowStore.getState();
      await store.stopRecording();
      
      const action: WorkflowAction = { type: 'click', x: 100, y: 200 };
      await store.captureStep(action);
      
      // Should not have captured anything
      expect(mockScreenshot).not.toHaveBeenCalled();
    });

    it('should delete a step and renumber remaining steps', async () => {
      const store = useWorkflowStore.getState();
      
      // Add multiple steps
      await store.captureStep({ type: 'click', x: 100, y: 200 });
      await store.captureStep({ type: 'type', text: 'hello' });
      await store.captureStep({ type: 'click', x: 300, y: 400 });
      
      const state = useWorkflowStore.getState();
      const stepToDelete = state.currentRecording?.steps[1]; // Middle step
      
      store.deleteStep(stepToDelete!.id);
      
      const updatedState = useWorkflowStore.getState();
      expect(updatedState.currentRecording?.steps).toHaveLength(2);
      expect(updatedState.currentRecording?.steps[0].stepNumber).toBe(1);
      expect(updatedState.currentRecording?.steps[1].stepNumber).toBe(2);
      expect(updatedState.currentRecording?.steps[1].action.type).toBe('click');
      expect(updatedState.currentRecording?.steps[1].action.x).toBe(300);
    });

    it('should update step description', async () => {
      const store = useWorkflowStore.getState();
      
      await store.captureStep({ type: 'click', x: 100, y: 200 });
      
      const state = useWorkflowStore.getState();
      const stepId = state.currentRecording?.steps[0].id!;
      
      store.updateStepDescription(stepId, 'Click the submit button');
      
      const updatedState = useWorkflowStore.getState();
      expect(updatedState.currentRecording?.steps[0].description).toBe('Click the submit button');
    });

    it('should remove description when empty string provided', async () => {
      const store = useWorkflowStore.getState();
      
      await store.captureStep({ type: 'click', x: 100, y: 200 });
      
      const state = useWorkflowStore.getState();
      const stepId = state.currentRecording?.steps[0].id!;
      
      // Set description first
      store.updateStepDescription(stepId, 'Initial description');
      
      // Then clear it
      store.updateStepDescription(stepId, '   '); // Whitespace should be trimmed
      
      const updatedState = useWorkflowStore.getState();
      expect(updatedState.currentRecording?.steps[0].description).toBeUndefined();
    });
  });

  describe('Persistence', () => {
    it('should save workflow to storage', async () => {
      const store = useWorkflowStore.getState();
      
      const workflow: WorkflowRecording = {
        id: 'test-workflow',
        steps: [
          {
            id: 'step-1',
            stepNumber: 1,
            timestamp: Date.now(),
            screenshot: 'data:image/png;base64,test',
            action: { type: 'click', x: 100, y: 200 },
            url: 'https://example.com',
          },
        ],
        startTime: Date.now(),
        endTime: Date.now(),
        status: 'completed',
        tabId: 123,
      };
      
      await store.saveWorkflow(workflow, 'Test Workflow');
      
      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
        'sidepilot-workflows': [{ ...workflow, name: 'Test Workflow' }],
      });
      
      const state = useWorkflowStore.getState();
      expect(state.savedWorkflows).toHaveLength(1);
      expect(state.savedWorkflows[0].name).toBe('Test Workflow');
    });

    it('should load workflows from storage', async () => {
      const mockWorkflows = [
        {
          id: 'workflow-1',
          name: 'Test Workflow 1',
          steps: [],
          startTime: Date.now(),
          status: 'completed',
          tabId: 123,
        },
      ];
      
      mockChrome.storage.local.get.mockResolvedValue({
        'sidepilot-workflows': mockWorkflows,
      });
      
      const store = useWorkflowStore.getState();
      await store.loadWorkflows();
      
      const state = useWorkflowStore.getState();
      expect(state.savedWorkflows).toEqual(mockWorkflows);
      expect(state.isLoaded).toBe(true);
    });

    it('should delete workflow from storage', async () => {
      const store = useWorkflowStore.getState();
      
      // Set up initial workflows
      useWorkflowStore.setState({
        savedWorkflows: [
          {
            id: 'workflow-1',
            name: 'Workflow 1',
            steps: [],
            startTime: Date.now(),
            status: 'completed',
            tabId: 123,
          },
          {
            id: 'workflow-2',
            name: 'Workflow 2',
            steps: [],
            startTime: Date.now(),
            status: 'completed',
            tabId: 124,
          },
        ],
      });
      
      await store.deleteWorkflow('workflow-1');
      
      const state = useWorkflowStore.getState();
      expect(state.savedWorkflows).toHaveLength(1);
      expect(state.savedWorkflows[0].id).toBe('workflow-2');
      
      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
        'sidepilot-workflows': [state.savedWorkflows[0]],
      });
    });
  });

  describe('Utility Functions', () => {
    it('should get workflow by ID from saved workflows', () => {
      const store = useWorkflowStore.getState();
      
      const workflow = {
        id: 'test-workflow',
        name: 'Test Workflow',
        steps: [],
        startTime: Date.now(),
        status: 'completed' as const,
        tabId: 123,
      };
      
      useWorkflowStore.setState({
        savedWorkflows: [workflow],
      });
      
      const result = store.getWorkflowById('test-workflow');
      expect(result).toEqual(workflow);
    });

    it('should get workflow by ID from current recording', () => {
      const store = useWorkflowStore.getState();
      
      const currentRecording = {
        id: 'current-workflow',
        steps: [],
        startTime: Date.now(),
        status: 'recording' as const,
        tabId: 123,
      };
      
      useWorkflowStore.setState({
        currentRecording,
      });
      
      const result = store.getWorkflowById('current-workflow');
      expect(result).toEqual(currentRecording);
    });

    it('should generate prompt from current recording', () => {
      const store = useWorkflowStore.getState();
      
      const currentRecording = {
        id: 'test-workflow',
        name: 'Test Workflow',
        steps: [
          {
            id: 'step-1',
            stepNumber: 1,
            timestamp: Date.now(),
            screenshot: 'data:image/png;base64,test',
            action: { type: 'click' as const, x: 100, y: 200 },
            url: 'https://example.com',
            description: 'Click submit button',
          },
        ],
        startTime: Date.now(),
        status: 'recording' as const,
        tabId: 123,
      };
      
      useWorkflowStore.setState({
        currentRecording,
      });
      
      const prompt = store.generatePrompt();
      expect(prompt).toContain('Test Workflow');
      expect(prompt).toContain('Step 1');
      expect(prompt).toContain('Click at (100, 200)');
      expect(prompt).toContain('Click submit button');
    });

    it('should validate current recording', async () => {
      const store = useWorkflowStore.getState();
      
      // Start recording and add a step
      await store.startRecording(123);
      await store.captureStep({ type: 'click', x: 100, y: 200 });
      
      const validation = store.validateCurrentRecording();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should return invalid when no current recording', () => {
      const store = useWorkflowStore.getState();
      
      const validation = store.validateCurrentRecording();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('No current recording to validate');
    });
  });

  describe('State Access', () => {
    it('should provide recording status through getState', async () => {
      const store = useWorkflowStore.getState();
      
      // Initially idle
      let state = useWorkflowStore.getState();
      expect(state.status).toBe('idle');
      expect(state.currentRecording).toBeNull();
      
      // Start recording
      await store.startRecording(123);
      
      state = useWorkflowStore.getState();
      expect(state.status).toBe('recording');
      expect(state.currentRecording).toBeTruthy();
      expect(state.currentRecording?.steps.length).toBe(0);
      
      // Add step
      await store.captureStep({ type: 'click', x: 100, y: 200 });
      
      state = useWorkflowStore.getState();
      expect(state.currentRecording?.steps.length).toBe(1);
    });
  });
});