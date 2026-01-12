# S09: Workflow Recording - Design

## Types

```typescript
// src/lib/workflow.ts

interface WorkflowStep {
  id: string;
  stepNumber: number;
  timestamp: number;
  screenshot: string;        // Base64
  action: {
    type: 'click' | 'type' | 'navigate' | 'scroll' | 'key';
    x?: number;
    y?: number;
    text?: string;
    url?: string;
    direction?: string;
  };
  url: string;
  description?: string;      // User-added note
}

interface WorkflowRecording {
  id: string;
  name?: string;
  steps: WorkflowStep[];
  startTime: number;
  endTime?: number;
  status: 'recording' | 'completed' | 'cancelled';
  tabId: number;
}

type WorkflowRecorderStatus = 'idle' | 'recording' | 'paused';
```

## Workflow Store

```typescript
// src/stores/workflow.ts
interface WorkflowState {
  currentRecording: WorkflowRecording | null;
  status: WorkflowRecorderStatus;
  
  startRecording(tabId: number): void;
  captureStep(action: WorkflowStep['action']): Promise<void>;
  stopRecording(): WorkflowRecording | null;
  cancelRecording(): void;
  deleteStep(stepId: string): void;
  updateStepDescription(stepId: string, description: string): void;
}

export const useWorkflowStore = create<WorkflowState>()((set, get) => ({
  currentRecording: null,
  status: 'idle',
  
  startRecording: (tabId) => {
    set({
      currentRecording: {
        id: crypto.randomUUID(),
        steps: [],
        startTime: Date.now(),
        status: 'recording',
        tabId,
      },
      status: 'recording'
    });
  },
  
  captureStep: async (action) => {
    const { currentRecording } = get();
    if (!currentRecording || currentRecording.status !== 'recording') return;
    
    // Take screenshot
    const screenshot = await cdpWrapper.screenshot(currentRecording.tabId);
    const tab = await chrome.tabs.get(currentRecording.tabId);
    
    const step: WorkflowStep = {
      id: crypto.randomUUID(),
      stepNumber: currentRecording.steps.length + 1,
      timestamp: Date.now(),
      screenshot: `data:image/png;base64,${screenshot.base64}`,
      action,
      url: tab.url || '',
    };
    
    set(state => ({
      currentRecording: state.currentRecording ? {
        ...state.currentRecording,
        steps: [...state.currentRecording.steps, step]
      } : null
    }));
  },
  
  stopRecording: () => {
    const { currentRecording } = get();
    if (!currentRecording) return null;
    
    const completed = {
      ...currentRecording,
      endTime: Date.now(),
      status: 'completed' as const
    };
    
    set({ currentRecording: null, status: 'idle' });
    return completed;
  },
  // ...
}));
```

## Recording Bar Component

```tsx
// src/components/RecordingBar.tsx
export function RecordingBar() {
  const { status, currentRecording, stopRecording, cancelRecording } = useWorkflowStore();
  
  if (status !== 'recording') return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 bg-red-500 text-white py-2 px-4 flex items-center justify-between z-50">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
        <span>Recording workflow...</span>
        <span className="text-sm opacity-80">
          {currentRecording?.steps.length || 0} steps
        </span>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={cancelRecording}>
          Cancel
        </Button>
        <Button size="sm" onClick={stopRecording}>
          Stop Recording
        </Button>
      </div>
    </div>
  );
}
```

## Generate Prompt Function

```typescript
// src/lib/workflow.ts
export function generateWorkflowPrompt(recording: WorkflowRecording): string {
  const steps = recording.steps.map((step, i) => {
    let desc = `Step ${i + 1}: `;
    switch (step.action.type) {
      case 'click':
        desc += `Click at (${step.action.x}, ${step.action.y})`;
        break;
      case 'type':
        desc += `Type "${step.action.text}"`;
        break;
      case 'navigate':
        desc += `Navigate to ${step.action.url}`;
        break;
      case 'scroll':
        desc += `Scroll ${step.action.direction}`;
        break;
    }
    if (step.description) {
      desc += ` - ${step.description}`;
    }
    return desc;
  }).join('\n');
  
  return `## Workflow Steps\n\n${steps}\n\nPlease repeat this workflow.`;
}
```
