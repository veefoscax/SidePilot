/**
 * Core types and definitions for workflow recording system
 * 
 * This module defines the fundamental interfaces and types used throughout
 * the workflow recording feature, enabling users to capture, edit, and replay
 * browser automation sequences.
 */

/**
 * Represents a single step in a workflow recording
 */
export interface WorkflowStep {
  /** Unique identifier for this step */
  id: string;
  
  /** Sequential step number (1-based) */
  stepNumber: number;
  
  /** Timestamp when this step was captured */
  timestamp: number;
  
  /** Base64-encoded screenshot taken at this step */
  screenshot: string;
  
  /** The action performed in this step */
  action: WorkflowAction;
  
  /** URL of the page when this step was captured */
  url: string;
  
  /** Optional user-added description/note for this step */
  description?: string;
}

/**
 * Defines the different types of actions that can be recorded
 */
export interface WorkflowAction {
  /** Type of action performed */
  type: 'click' | 'type' | 'navigate' | 'scroll' | 'key';
  
  /** X coordinate for click actions */
  x?: number;
  
  /** Y coordinate for click actions */
  y?: number;
  
  /** Text content for type actions */
  text?: string;
  
  /** URL for navigate actions */
  url?: string;
  
  /** Direction for scroll actions (up, down, left, right) */
  direction?: string;
  
  /** Key name for key actions */
  key?: string;
  
  /** Additional metadata for the action */
  metadata?: Record<string, any>;
}

/**
 * Represents a complete workflow recording session
 */
export interface WorkflowRecording {
  /** Unique identifier for this recording */
  id: string;
  
  /** User-assigned name for the workflow */
  name?: string;
  
  /** Array of recorded steps in chronological order */
  steps: WorkflowStep[];
  
  /** Timestamp when recording started */
  startTime: number;
  
  /** Timestamp when recording ended (if completed) */
  endTime?: number;
  
  /** Current status of the recording */
  status: WorkflowRecordingStatus;
  
  /** ID of the browser tab where recording took place */
  tabId: number;
  
  /** Optional metadata about the recording */
  metadata?: {
    /** Browser/OS information */
    userAgent?: string;
    /** Screen resolution during recording */
    screenSize?: { width: number; height: number };
    /** Any additional context */
    [key: string]: any;
  };
}

/**
 * Status of a workflow recording
 */
export type WorkflowRecordingStatus = 'recording' | 'completed' | 'cancelled';

/**
 * Current state of the workflow recorder
 */
export type WorkflowState = 'idle' | 'recording' | 'editing';

/**
 * Configuration options for workflow recording
 */
export interface WorkflowRecordingConfig {
  /** Whether to automatically capture screenshots */
  captureScreenshots: boolean;
  
  /** Maximum number of steps to record */
  maxSteps: number;
  
  /** Screenshot quality (0-1) */
  screenshotQuality: number;
  
  /** Whether to capture network requests */
  captureNetwork: boolean;
  
  /** Delay between actions (ms) */
  actionDelay: number;
}

/**
 * Default configuration for workflow recording
 */
export const DEFAULT_WORKFLOW_CONFIG: WorkflowRecordingConfig = {
  captureScreenshots: true,
  maxSteps: 50,
  screenshotQuality: 0.8,
  captureNetwork: false,
  actionDelay: 500,
};

/**
 * Utility function to create a new workflow step
 */
export function createWorkflowStep(
  action: WorkflowAction,
  screenshot: string,
  url: string,
  stepNumber: number
): WorkflowStep {
  return {
    id: crypto.randomUUID(),
    stepNumber,
    timestamp: Date.now(),
    screenshot,
    action,
    url,
  };
}

/**
 * Utility function to create a new workflow recording
 */
export function createWorkflowRecording(tabId: number): WorkflowRecording {
  return {
    id: crypto.randomUUID(),
    steps: [],
    startTime: Date.now(),
    status: 'recording',
    tabId,
  };
}

/**
 * Generate a human-readable description for a workflow action
 */
export function getActionDescription(action: WorkflowAction): string {
  switch (action.type) {
    case 'click':
      return `Click at (${action.x}, ${action.y})`;
    case 'type':
      return `Type "${action.text}"`;
    case 'navigate':
      return `Navigate to ${action.url}`;
    case 'scroll':
      return `Scroll ${action.direction}`;
    case 'key':
      return `Press ${action.key}`;
    default:
      return 'Unknown action';
  }
}

/**
 * Generate a workflow prompt suitable for AI execution
 */
export function generateWorkflowPrompt(recording: WorkflowRecording): string {
  if (recording.steps.length === 0) {
    return 'No steps recorded in this workflow.';
  }

  const header = `# Workflow: ${recording.name || 'Untitled'}\n\n`;
  const summary = `Recorded ${recording.steps.length} steps on ${new Date(recording.startTime).toLocaleString()}\n\n`;
  
  const steps = recording.steps
    .map((step, index) => {
      let description = `**Step ${index + 1}:** ${getActionDescription(step.action)}`;
      
      if (step.url !== recording.steps[index - 1]?.url) {
        description += `\n  - Page: ${step.url}`;
      }
      
      if (step.description) {
        description += `\n  - Note: ${step.description}`;
      }
      
      return description;
    })
    .join('\n\n');

  const footer = '\n\nPlease execute this workflow step by step, taking screenshots to verify each action.';

  return header + summary + steps + footer;
}

/**
 * Validate a workflow recording for completeness and consistency
 */
export function validateWorkflowRecording(recording: WorkflowRecording): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!recording.id) {
    errors.push('Recording must have an ID');
  }

  if (!recording.tabId) {
    errors.push('Recording must have a tab ID');
  }

  if (recording.steps.length === 0) {
    errors.push('Recording must have at least one step');
  }

  // Check step sequence
  recording.steps.forEach((step, index) => {
    if (step.stepNumber !== index + 1) {
      errors.push(`Step ${index + 1} has incorrect step number: ${step.stepNumber}`);
    }

    if (!step.id) {
      errors.push(`Step ${index + 1} is missing an ID`);
    }

    if (!step.screenshot) {
      errors.push(`Step ${index + 1} is missing a screenshot`);
    }

    if (!step.action.type) {
      errors.push(`Step ${index + 1} is missing action type`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate the estimated duration of a workflow based on action delays
 */
export function estimateWorkflowDuration(
  recording: WorkflowRecording,
  config: WorkflowRecordingConfig = DEFAULT_WORKFLOW_CONFIG
): number {
  const baseActionTime = 1000; // 1 second per action
  const totalActions = recording.steps.length;
  const totalDelay = totalActions * config.actionDelay;
  
  return (totalActions * baseActionTime) + totalDelay;
}

// All types are already exported above, no need for re-export