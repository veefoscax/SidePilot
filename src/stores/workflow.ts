/**
 * SidePilot Workflow Store
 * 
 * Zustand store for managing workflow recording sessions with step capture,
 * screenshot automation, and persistence to Chrome storage.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  WorkflowRecording,
  WorkflowStep,
  WorkflowAction,
  WorkflowState,
  createWorkflowRecording,
  createWorkflowStep,
  generateWorkflowPrompt,
  validateWorkflowRecording
} from '@/lib/workflow';
import { CDPWrapper } from '@/lib/cdp-wrapper';

// Storage key for persisting workflows
const WORKFLOWS_STORAGE_KEY = 'sidepilot-workflows';

interface WorkflowStoreState {
  // Current recording state
  currentRecording: WorkflowRecording | null;
  status: WorkflowState;

  // Saved workflows
  savedWorkflows: WorkflowRecording[];
  isLoaded: boolean;

  // CDP wrapper instance
  cdpWrapper: CDPWrapper;

  // Actions
  startRecording: (tabId: number) => Promise<void>;
  captureStep: (action: WorkflowAction) => Promise<void>;
  stopRecording: () => Promise<WorkflowRecording | null>;
  cancelRecording: () => void;
  deleteStep: (stepId: string) => void;
  updateStepDescription: (stepId: string, description: string) => void;

  // Workflow management
  saveWorkflow: (workflow: WorkflowRecording, name?: string) => Promise<void>;
  loadWorkflows: () => Promise<void>;
  deleteWorkflow: (workflowId: string) => Promise<void>;
  getWorkflowById: (id: string) => WorkflowRecording | undefined;

  // Utilities
  generatePrompt: (workflowId?: string) => string;
  validateCurrentRecording: () => { isValid: boolean; errors: string[] };
}

/**
 * Chrome storage adapter for Zustand persistence
 */
const chromeStorage = createJSONStorage(() => ({
  getItem: async (name: string) => {
    try {
      const result = await chrome.storage.local.get(name);
      return result[name] ?? null;
    } catch (error) {
      console.error('Failed to get from Chrome storage:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string) => {
    try {
      await chrome.storage.local.set({ [name]: value });
    } catch (error) {
      console.error('Failed to set Chrome storage:', error);
    }
  },
  removeItem: async (name: string) => {
    try {
      await chrome.storage.local.remove(name);
    } catch (error) {
      console.error('Failed to remove from Chrome storage:', error);
    }
  },
}));

export const useWorkflowStore = create<WorkflowStoreState>()(
  persist(
    (set, get) => ({
      currentRecording: null,
      status: 'idle',
      savedWorkflows: [],
      isLoaded: false,
      cdpWrapper: new CDPWrapper(),

      /**
       * Start recording a new workflow
       */
      startRecording: async (tabId: number) => {
        try {
          const { cdpWrapper } = get();

          // Ensure CDP is attached to the tab
          await cdpWrapper.attachDebugger(tabId);

          // Create new recording
          const recording = createWorkflowRecording(tabId);

          set({
            currentRecording: recording,
            status: 'recording'
          });

          // Tell content script to start capturing user actions
          try {
            await chrome.tabs.sendMessage(tabId, { type: 'START_WORKFLOW_CAPTURE' });
            console.log('Content script notified to start capturing');
          } catch (err) {
            console.warn('Content script not loaded, injecting programmatically...');

            // Content script not loaded, inject it programmatically
            try {
              await chrome.scripting.executeScript({
                target: { tabId },
                files: ['content.js']
              });
              console.log('Content script injected');

              // Wait a bit for the script to initialize
              await new Promise(resolve => setTimeout(resolve, 200));

              // Retry sending the start message
              try {
                await chrome.tabs.sendMessage(tabId, { type: 'START_WORKFLOW_CAPTURE' });
                console.log('Content script started capturing after injection');
              } catch (retryErr) {
                console.warn('Still could not reach content script after injection:', retryErr);
              }
            } catch (injectErr) {
              console.error('Failed to inject content script:', injectErr);
            }
          }

          console.log(`Started workflow recording for tab ${tabId}`);
        } catch (error) {
          console.error('Failed to start workflow recording:', error);
          throw new Error(`Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      },

      /**
       * Capture a step in the current recording
       */
      captureStep: async (action: WorkflowAction) => {
        const { currentRecording, cdpWrapper } = get();

        if (!currentRecording || currentRecording.status !== 'recording') {
          console.warn('Cannot capture step: no active recording');
          return;
        }

        try {
          // Take screenshot
          const screenshotResult = await cdpWrapper.screenshot(currentRecording.tabId, {
            format: 'png',
            quality: 0.8
          });

          // Get current tab info
          const tab = await chrome.tabs.get(currentRecording.tabId);

          // Create the step
          const step = createWorkflowStep(
            action,
            `data:image/png;base64,${screenshotResult.data}`,
            tab.url || '',
            currentRecording.steps.length + 1
          );

          // Update the recording
          set(state => ({
            currentRecording: state.currentRecording ? {
              ...state.currentRecording,
              steps: [...state.currentRecording.steps, step]
            } : null
          }));

          console.log(`Captured step ${step.stepNumber}: ${action.type}`);
        } catch (error) {
          console.error('Failed to capture workflow step:', error);
          // Don't throw here - we don't want to break the user's workflow
          // Just log the error and continue
        }
      },

      /**
       * Stop the current recording and return it
       */
      stopRecording: async () => {
        const { currentRecording } = get();

        if (!currentRecording) {
          return null;
        }

        try {
          // Tell content script to stop capturing
          try {
            await chrome.tabs.sendMessage(currentRecording.tabId, { type: 'STOP_WORKFLOW_CAPTURE' });
            console.log('Content script notified to stop capturing');
          } catch (err) {
            console.warn('Could not notify content script (may not be loaded):', err);
          }

          // Finalize the recording
          const completedRecording: WorkflowRecording = {
            ...currentRecording,
            endTime: Date.now(),
            status: 'completed'
          };

          // Validate the recording
          const validation = validateWorkflowRecording(completedRecording);
          if (!validation.isValid) {
            console.warn('Recording validation warnings:', validation.errors);
          }

          // Clear current recording
          set({
            currentRecording: null,
            status: 'idle'
          });

          console.log(`Stopped workflow recording with ${completedRecording.steps.length} steps`);
          return completedRecording;
        } catch (error) {
          console.error('Failed to stop workflow recording:', error);
          throw new Error(`Failed to stop recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      },

      /**
       * Cancel the current recording without saving
       */
      cancelRecording: () => {
        const { currentRecording } = get();

        if (currentRecording) {
          set({
            currentRecording: null,
            status: 'idle'
          });

          console.log('Cancelled workflow recording');
        }
      },

      /**
       * Delete a step from the current recording
       */
      deleteStep: (stepId: string) => {
        set(state => {
          if (!state.currentRecording) return state;

          const updatedSteps = state.currentRecording.steps
            .filter(step => step.id !== stepId)
            .map((step, index) => ({
              ...step,
              stepNumber: index + 1 // Renumber steps
            }));

          return {
            currentRecording: {
              ...state.currentRecording,
              steps: updatedSteps
            }
          };
        });
      },

      /**
       * Update the description of a step
       */
      updateStepDescription: (stepId: string, description: string) => {
        set(state => {
          if (!state.currentRecording) return state;

          const updatedSteps = state.currentRecording.steps.map(step =>
            step.id === stepId
              ? { ...step, description: description.trim() || undefined }
              : step
          );

          return {
            currentRecording: {
              ...state.currentRecording,
              steps: updatedSteps
            }
          };
        });
      },

      /**
       * Save a workflow to storage
       */
      saveWorkflow: async (workflow: WorkflowRecording, name?: string) => {
        try {
          const { savedWorkflows } = get();

          // Prepare the workflow for saving
          const workflowToSave: WorkflowRecording = {
            ...workflow,
            name: name || workflow.name || `Workflow ${new Date().toLocaleDateString()}`,
            status: 'completed'
          };

          // Validate before saving
          const validation = validateWorkflowRecording(workflowToSave);
          if (!validation.isValid) {
            throw new Error(`Invalid workflow: ${validation.errors.join(', ')}`);
          }

          // Add to saved workflows (or update if it exists)
          const existingIndex = savedWorkflows.findIndex(w => w.id === workflowToSave.id);
          let updatedWorkflows: WorkflowRecording[];

          if (existingIndex >= 0) {
            updatedWorkflows = savedWorkflows.map((w, i) =>
              i === existingIndex ? workflowToSave : w
            );
          } else {
            updatedWorkflows = [...savedWorkflows, workflowToSave];
          }

          // Persist to Chrome storage
          await chrome.storage.local.set({ [WORKFLOWS_STORAGE_KEY]: updatedWorkflows });

          set({ savedWorkflows: updatedWorkflows });

          console.log(`Saved workflow: ${workflowToSave.name}`);
        } catch (error) {
          console.error('Failed to save workflow:', error);
          throw new Error(`Failed to save workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      },

      /**
       * Load workflows from Chrome storage
       */
      loadWorkflows: async () => {
        try {
          const result = await chrome.storage.local.get(WORKFLOWS_STORAGE_KEY);
          const stored = result[WORKFLOWS_STORAGE_KEY] || [];
          set({ savedWorkflows: stored, isLoaded: true });
          console.log(`Loaded ${stored.length} workflows from storage`);
        } catch (error) {
          console.error('Failed to load workflows:', error);
          set({ savedWorkflows: [], isLoaded: true });
        }
      },

      /**
       * Delete a saved workflow
       */
      deleteWorkflow: async (workflowId: string) => {
        try {
          const { savedWorkflows } = get();
          const updatedWorkflows = savedWorkflows.filter(w => w.id !== workflowId);

          // Persist to Chrome storage
          await chrome.storage.local.set({ [WORKFLOWS_STORAGE_KEY]: updatedWorkflows });

          set({ savedWorkflows: updatedWorkflows });

          console.log(`Deleted workflow: ${workflowId}`);
        } catch (error) {
          console.error('Failed to delete workflow:', error);
          throw new Error(`Failed to delete workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      },

      /**
       * Get a workflow by ID
       */
      getWorkflowById: (id: string) => {
        const { savedWorkflows, currentRecording } = get();

        // Check current recording first
        if (currentRecording && currentRecording.id === id) {
          return currentRecording;
        }

        // Check saved workflows
        return savedWorkflows.find(w => w.id === id);
      },

      /**
       * Generate a prompt from a workflow
       */
      generatePrompt: (workflowId?: string) => {
        const { currentRecording } = get();

        let workflow: WorkflowRecording | undefined;

        if (workflowId) {
          workflow = get().getWorkflowById(workflowId);
        } else {
          workflow = currentRecording;
        }

        if (!workflow) {
          return 'No workflow found to generate prompt from.';
        }

        return generateWorkflowPrompt(workflow);
      },

      /**
       * Validate the current recording
       */
      validateCurrentRecording: () => {
        const { currentRecording } = get();

        if (!currentRecording) {
          return {
            isValid: false,
            errors: ['No current recording to validate']
          };
        }

        return validateWorkflowRecording(currentRecording);
      },
    }),
    {
      name: 'sidepilot-workflow-storage',
      storage: chromeStorage,
      partialize: (state) => ({
        savedWorkflows: state.savedWorkflows,
        isLoaded: state.isLoaded,
      }),
    }
  )
);

// Export types
export type { WorkflowStoreState };

/**
 * Hook to get current recording status
 */
export const useRecordingStatus = () => {
  return useWorkflowStore(state => ({
    isRecording: state.status === 'recording',
    currentRecording: state.currentRecording,
    stepCount: state.currentRecording?.steps.length || 0
  }));
};

/**
 * Hook to get workflow management functions
 */
export const useWorkflowActions = () => {
  return useWorkflowStore(state => ({
    startRecording: state.startRecording,
    captureStep: state.captureStep,
    stopRecording: state.stopRecording,
    cancelRecording: state.cancelRecording,
    saveWorkflow: state.saveWorkflow,
    deleteWorkflow: state.deleteWorkflow,
    generatePrompt: state.generatePrompt
  }));
};

/**
 * Listen for captured actions from content script
 */
if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'WORKFLOW_ACTION_CAPTURED') {
      console.log('[Workflow Store] Received captured action:', message.action);

      const state = useWorkflowStore.getState();
      if (state.status === 'recording' && state.currentRecording) {
        // Convert captured action to workflow action
        const capturedAction = message.action;

        // Map captured types to WorkflowAction types
        let actionType: 'click' | 'type' | 'navigate' | 'scroll' | 'key';
        switch (capturedAction.type) {
          case 'click':
          case 'double_click':
          case 'right_click':
            actionType = 'click';
            break;
          case 'input':
            actionType = 'type';
            break;
          case 'submit':
            actionType = 'click';
            break;
          case 'select':
            actionType = 'type';
            break;
          case 'scroll':
            actionType = 'scroll';
            break;
          case 'keypress':
            actionType = 'key';
            break;
          case 'navigate':
            actionType = 'navigate';
            break;
          case 'focus':
            actionType = 'click'; // Focus is similar to click for workflow purposes
            break;
          default:
            actionType = 'click';
        }

        // Build key string for keyboard shortcuts
        let keyString = capturedAction.key;
        if (capturedAction.modifiers) {
          const mods = [];
          if (capturedAction.modifiers.ctrl) mods.push('Ctrl');
          if (capturedAction.modifiers.alt) mods.push('Alt');
          if (capturedAction.modifiers.shift) mods.push('Shift');
          if (capturedAction.modifiers.meta) mods.push('Cmd');
          if (mods.length > 0 && keyString) {
            keyString = mods.join('+') + '+' + keyString;
          }
        }

        const workflowAction: WorkflowAction = {
          type: actionType,
          text: capturedAction.value,
          url: capturedAction.type === 'navigate' ? capturedAction.toUrl : undefined,
          key: keyString,
          direction: capturedAction.direction,
          x: capturedAction.x,
          y: capturedAction.y,
          metadata: {
            originalType: capturedAction.type,
            selector: capturedAction.element?.selector,
            element: capturedAction.element,
            timestamp: capturedAction.timestamp,
            url: capturedAction.url,
            fromUrl: capturedAction.fromUrl,
            deltaX: capturedAction.deltaX,
            deltaY: capturedAction.deltaY,
            modifiers: capturedAction.modifiers
          }
        };

        state.captureStep(workflowAction).then(() => {
          console.log('[Workflow Store] Step captured from content script');
        }).catch(err => {
          console.warn('[Workflow Store] Failed to capture step:', err);
        });
      }

      sendResponse({ received: true });
    }
    return true;
  });

  console.log('[Workflow Store] Message listener registered');
}