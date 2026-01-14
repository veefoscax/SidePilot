/**
 * Tool Registry
 * 
 * Central registry for all available tools with schema conversion utilities
 */

import { Tool, AnthropicTool, OpenAITool, ToolParameter } from './types';
import { browserTools } from './browser-tools';
import { getPermissionManager, createPermissionRequest } from '@/lib/permissions';
import { usePermissionStore } from '@/stores/permissions';

/**
 * Convert internal tool parameter to JSON schema property
 */
function parameterToJsonSchema(param: ToolParameter): any {
  const schema: any = {
    type: param.type,
    description: param.description
  };

  if (param.type === 'object' && param.properties) {
    schema.properties = {};
    for (const [key, prop] of Object.entries(param.properties)) {
      schema.properties[key] = parameterToJsonSchema(prop);
    }
  }

  if (param.type === 'array' && param.items) {
    schema.items = parameterToJsonSchema(param.items);
  }

  return schema;
}

/**
 * Convert internal tool to Anthropic tool schema
 */
export function toAnthropicTool(tool: Tool): AnthropicTool {
  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const param of tool.parameters) {
    properties[param.name] = parameterToJsonSchema(param);
    if (param.required) {
      required.push(param.name);
    }
  }

  return {
    name: tool.name,
    description: tool.description,
    input_schema: {
      type: 'object',
      properties,
      required
    }
  };
}

/**
 * Convert internal tool to OpenAI tool schema
 */
export function toOpenAITool(tool: Tool): OpenAITool {
  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const param of tool.parameters) {
    properties[param.name] = parameterToJsonSchema(param);
    if (param.required) {
      required.push(param.name);
    }
  }

  return {
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties,
        required
      }
    }
  };
}

/**
 * Tool Registry Class
 */
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  constructor() {
    // Register browser tools
    for (const tool of browserTools) {
      this.register(tool);
    }
  }

  /**
   * Register a new tool
   */
  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Get a tool by name
   */
  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all registered tools
   */
  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Execute a tool by name with permission checking
   * 
   * @param name - Tool name to execute
   * @param params - Tool parameters
   * @returns Promise that resolves when tool execution completes (or permission is granted)
   * @throws Error if tool not found or permission denied
   */
  async execute(name: string, params: Record<string, any>): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    // Get current tab URL for permission checking
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    
    if (!currentTab?.url) {
      throw new Error('No active tab found for permission check');
    }

    // Check permission
    const permissionManager = getPermissionManager();
    const permissionResult = await permissionManager.checkPermission(currentTab.url, name);

    if (permissionResult.allowed) {
      // Permission granted, execute immediately
      return await tool.execute(params);
    }

    if (!permissionResult.needsPrompt) {
      // Permission explicitly denied
      throw new Error(`Permission denied for tool "${name}" on this domain`);
    }

    // Need to prompt user for permission
    // Create permission request with action data
    const actionData: any = {};
    
    // Add action-specific data for display in dialog
    if (name === 'computer' && params.action === 'mouse_move') {
      // For click actions, include the coordinate
      actionData.coordinate = [params.coordinate?.[0] || 0, params.coordinate?.[1] || 0];
    } else if (name === 'computer' && params.action === 'type') {
      // For type actions, include the text being typed
      actionData.text = params.text || '';
    }

    const request = createPermissionRequest(name, currentTab.url, actionData);

    // Show the permission dialog and wait for user response
    const store = usePermissionStore.getState();
    store.setPendingRequest(request);

    // Wait for the user to approve or deny
    return new Promise((resolve, reject) => {
      // Set up an interval to check if the request has been resolved
      const checkInterval = setInterval(() => {
        const currentState = usePermissionStore.getState();
        
        // Check if the pending request has been cleared (approved or denied)
        if (currentState.pendingRequest?.id !== request.id) {
          clearInterval(checkInterval);
          
          // Check if there's an error (denial)
          if (currentState.error) {
            reject(new Error(`Permission denied for tool "${name}"`));
            return;
          }
          
          // Permission was approved, execute the tool
          tool.execute(params).then(resolve).catch(reject);
        }
      }, 100);

      // Set a timeout to prevent infinite waiting
      setTimeout(() => {
        clearInterval(checkInterval);
        const currentState = usePermissionStore.getState();
        
        // If still pending after timeout, reject
        if (currentState.pendingRequest?.id === request.id) {
          currentState.setPendingRequest(null);
          reject(new Error('Permission request timed out'));
        }
      }, 60000); // 60 second timeout
    });
  }

  /**
   * Get tools in Anthropic format
   */
  getAnthropicTools(): AnthropicTool[] {
    return this.getAll().map(toAnthropicTool);
  }

  /**
   * Get tools in OpenAI format
   */
  getOpenAITools(): OpenAITool[] {
    return this.getAll().map(toOpenAITool);
  }

  /**
   * Get tool names
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }
}

// Global tool registry instance
export const toolRegistry = new ToolRegistry();