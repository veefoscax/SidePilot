# S07: Browser Tools - Design

## Tool Types

```typescript
// src/tools/types.ts

interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameters;
  execute: (input: object, context: ToolContext) => Promise<ToolResult>;
  toAnthropicSchema: () => AnthropicToolSchema;
}

interface ToolParameters {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description: string;
    required?: boolean;
    enum?: string[];
  };
}

interface ToolContext {
  tabId: number;
  tabGroupId?: number;
  url: string;
  permissionManager: PermissionManager;
  toolUseId?: string;
}

interface ToolResult {
  output?: string;
  error?: string;
  screenshot?: string;
}

interface AnthropicToolSchema {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: object;
    required: string[];
  };
}
```

## Tool Registry

```typescript
// src/tools/registry.ts
import { computerTool } from './computer';
import { navigationTool } from './navigation';
import { tabsTool } from './tabs';
// ... imports

const TOOLS: ToolDefinition[] = [
  computerTool,
  navigationTool,
  tabsTool,
  tabGroupsTool,
  pageContentTool,
  executeScriptTool,
  pageStylingTool,
  accessibilityTool,
  networkTool,
  consoleTool,
  elementSnapshotTool,
  webSearchTool,
  shortcutsListTool,
  shortcutsExecuteTool,
];

export function getAllTools(): ToolDefinition[] {
  return TOOLS;
}

export function getTool(name: string): ToolDefinition | undefined {
  return TOOLS.find(t => t.name === name);
}

export function getAnthropicSchemas(): AnthropicToolSchema[] {
  return TOOLS.map(t => t.toAnthropicSchema());
}

export async function executeTool(
  name: string,
  input: object,
  context: ToolContext
): Promise<ToolResult> {
  const tool = getTool(name);
  if (!tool) {
    return { error: `Unknown tool: ${name}` };
  }
  
  // Permission check
  const permission = await context.permissionManager.checkPermission(
    context.url,
    name
  );
  
  if (!permission.allowed && !permission.needsPrompt) {
    return { error: 'Permission denied for this action' };
  }
  
  if (permission.needsPrompt) {
    // Return permission request for UI to handle
    return {
      error: 'PERMISSION_REQUIRED',
      output: JSON.stringify({
        type: 'permission_required',
        tool: name,
        url: context.url,
        toolUseId: context.toolUseId
      })
    };
  }
  
  try {
    return await tool.execute(input, context);
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
```

## Computer Tool

```typescript
// src/tools/computer.ts
import { cdpWrapper } from '@/lib/cdp-wrapper';

type ComputerAction = 
  | 'screenshot' | 'left_click' | 'right_click' 
  | 'double_click' | 'triple_click' | 'type' 
  | 'key' | 'scroll' | 'wait' | 'left_click_drag' | 'zoom';

export const computerTool: ToolDefinition = {
  name: 'computer',
  description: 'Interact with the browser: take screenshots, click, type, scroll, etc.',
  parameters: {
    action: {
      type: 'string',
      description: 'The action to perform',
      required: true,
      enum: ['screenshot', 'left_click', 'right_click', 'double_click', 
             'triple_click', 'type', 'key', 'scroll', 'wait', 
             'left_click_drag', 'zoom']
    },
    coordinate: {
      type: 'array',
      description: '[x, y] coordinates for click/scroll actions'
    },
    text: {
      type: 'string',
      description: 'Text for type/key actions'
    },
    direction: {
      type: 'string',
      description: 'Scroll direction',
      enum: ['up', 'down', 'left', 'right']
    },
    duration: {
      type: 'number',
      description: 'Wait duration in seconds (max 30)'
    },
    start_coordinate: {
      type: 'array',
      description: 'Start [x, y] for drag actions'
    },
    region: {
      type: 'array',
      description: '[x0, y0, x1, y1] for zoom screenshot'
    }
  },
  
  execute: async (input: any, context) => {
    const { action, coordinate, text, direction, duration, start_coordinate, region } = input;
    const tabId = context.tabId;
    
    switch (action) {
      case 'screenshot':
        const ss = await cdpWrapper.screenshot(tabId);
        return { 
          output: `Screenshot captured (${ss.width}x${ss.height})`,
          screenshot: `data:image/png;base64,${ss.base64}`
        };
        
      case 'left_click':
        await cdpWrapper.click(tabId, coordinate[0], coordinate[1], 'left', 1);
        return { output: `Clicked at (${coordinate[0]}, ${coordinate[1]})` };
        
      case 'right_click':
        await cdpWrapper.click(tabId, coordinate[0], coordinate[1], 'right', 1);
        return { output: `Right-clicked at (${coordinate[0]}, ${coordinate[1]})` };
        
      case 'double_click':
        await cdpWrapper.click(tabId, coordinate[0], coordinate[1], 'left', 2);
        return { output: `Double-clicked at (${coordinate[0]}, ${coordinate[1]})` };
        
      case 'triple_click':
        await cdpWrapper.click(tabId, coordinate[0], coordinate[1], 'left', 3);
        return { output: `Triple-clicked at (${coordinate[0]}, ${coordinate[1]})` };
        
      case 'type':
        await cdpWrapper.type(tabId, text);
        return { output: `Typed "${text}"` };
        
      case 'key':
        await cdpWrapper.pressKeyChord(tabId, text);
        return { output: `Pressed ${text}` };
        
      case 'scroll':
        await cdpWrapper.scroll(tabId, coordinate[0], coordinate[1], direction);
        return { output: `Scrolled ${direction}` };
        
      case 'wait':
        await new Promise(r => setTimeout(r, Math.min(duration, 30) * 1000));
        return { output: `Waited ${duration} seconds` };
        
      case 'left_click_drag':
        await cdpWrapper.leftClickDrag(tabId, start_coordinate[0], start_coordinate[1], coordinate[0], coordinate[1]);
        return { output: `Dragged from (${start_coordinate[0]}, ${start_coordinate[1]}) to (${coordinate[0]}, ${coordinate[1]})` };
        
      case 'zoom':
        // Implement region screenshot
        return { output: 'Zoom screenshot captured' };
        
      default:
        return { error: `Unknown action: ${action}` };
    }
  },
  
  toAnthropicSchema: () => ({
    name: 'computer',
    description: 'Interact with the browser: take screenshots, click, type, scroll, etc.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['screenshot', 'left_click', 'right_click', 'double_click', 'triple_click', 'type', 'key', 'scroll', 'wait', 'left_click_drag', 'zoom'] },
        coordinate: { type: 'array', items: { type: 'number' } },
        text: { type: 'string' },
        direction: { type: 'string', enum: ['up', 'down', 'left', 'right'] },
        duration: { type: 'number' },
        start_coordinate: { type: 'array', items: { type: 'number' } },
        region: { type: 'array', items: { type: 'number' } }
      },
      required: ['action']
    }
  })
};
```

## Other Tool Stubs

```typescript
// src/tools/navigation.ts
export const navigationTool: ToolDefinition = {
  name: 'web_navigation',
  description: 'Navigate to URLs, go back/forward, reload',
  parameters: {
    action: { type: 'string', enum: ['navigate', 'go_back', 'go_forward', 'reload'], required: true },
    url: { type: 'string', description: 'URL for navigate action' }
  },
  execute: async (input, context) => {
    const { action, url } = input;
    switch (action) {
      case 'navigate':
        await chrome.tabs.update(context.tabId, { url });
        return { output: `Navigated to ${url}` };
      case 'go_back':
        await chrome.tabs.goBack(context.tabId);
        return { output: 'Went back' };
      case 'go_forward':
        await chrome.tabs.goForward(context.tabId);
        return { output: 'Went forward' };
      case 'reload':
        await chrome.tabs.reload(context.tabId);
        return { output: 'Reloaded page' };
    }
  },
  // ...
};
```

## Files to Create
- src/tools/types.ts
- src/tools/registry.ts
- src/tools/computer.ts
- src/tools/navigation.ts
- src/tools/tabs.ts
- src/tools/tab-groups.ts
- src/tools/page-content.ts
- src/tools/execute-script.ts
- src/tools/page-styling.ts
- src/tools/accessibility.ts
- src/tools/network.ts
- src/tools/console.ts
- src/tools/element-snapshot.ts
- src/tools/web-search.ts
- src/tools/shortcuts.ts
