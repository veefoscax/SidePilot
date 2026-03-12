/**
 * Tool Registry
 * 
 * Central registry for all browser automation tools with schema conversion
 * for both Anthropic (Claude) and OpenAI (GPT) formats.
 */

import type {
  ToolDefinition,
  ToolContext,
  ToolResult,
  AnthropicToolSchema,
  OpenAIToolSchema
} from './types';
import { computerTool } from './computer';
import { navigationTool } from './navigation';
import { tabsTool } from './tabs';
import { tabGroupsTool } from './tab-groups';
import { pageContentTool } from './page-content';
import { executeScriptTool } from './execute-script';
import { networkTool } from './network';
import { consoleTool } from './console';
import { accessibilityTool } from './accessibility';
import { elementSnapshotTool } from './element-snapshot';
import { webSearchTool } from './web-search';
import { shortcutsListTool, shortcutsExecuteTool } from './shortcuts';
import { clipboardTool } from './clipboard';
import { useWorkflowStore } from '@/stores/workflow';
import type { WorkflowAction } from '@/lib/workflow';
import { isMcpTool, parseMcpToolName } from '@/lib/mcp';
import { mcpClient } from '@/lib/mcp-client';

// Lazy import to avoid circular dependency
const getMCPStore = async () => {
  const { useMCPStore } = await import('@/stores/mcp');
  return useMCPStore;
};

/**
 * Map tool names to workflow action types
 */
function toolInputToWorkflowAction(toolName: string, input: any): WorkflowAction | null {
  switch (toolName) {
    case 'computer':
      if (input.action === 'click' || input.action === 'left_click' || input.action === 'right_click' || input.action === 'double_click') {
        return {
          type: 'click',
          x: input.coordinate?.[0] || input.x,
          y: input.coordinate?.[1] || input.y,
          metadata: { action: input.action }
        };
      } else if (input.action === 'type') {
        return {
          type: 'type',
          text: input.text,
          metadata: { action: input.action }
        };
      } else if (input.action === 'key') {
        return {
          type: 'key',
          key: input.text,
          metadata: { action: input.action }
        };
      } else if (input.action === 'scroll') {
        return {
          type: 'scroll',
          direction: input.direction || 'down',
          metadata: { action: input.action }
        };
      }
      return null;
    case 'navigation':
      return {
        type: 'navigate',
        url: input.url,
        metadata: { action: input.action }
      };
    default:
      return null;
  }
}

/**
 * Tool Registry - Singleton for managing all available tools
 */
class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  constructor() {
    // Register all tools on initialization
    this.registerTool(computerTool);
    this.registerTool(navigationTool);
    this.registerTool(tabsTool);
    this.registerTool(tabGroupsTool);
    this.registerTool(pageContentTool);
    this.registerTool(executeScriptTool);
    this.registerTool(networkTool);
    this.registerTool(consoleTool);
    this.registerTool(accessibilityTool);
    this.registerTool(elementSnapshotTool);
    this.registerTool(webSearchTool);
    this.registerTool(shortcutsListTool);
    this.registerTool(shortcutsExecuteTool);
    this.registerTool(clipboardTool);
  }

  /**
   * Register a new tool dynamically
   */
  registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Get all registered tools
   */
  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get a specific tool by name
   */
  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all tools in Anthropic (Claude) schema format
   */
  getAnthropicSchemas(): AnthropicToolSchema[] {
    return this.getAllTools().map(tool => tool.toAnthropicSchema());
  }

  /**
   * Get all tools in OpenAI (GPT) schema format
   */
  getOpenAISchemas(): OpenAIToolSchema[] {
    return this.getAllTools().map(tool => tool.toOpenAISchema());
  }

  /**
   * Get enabled MCP tools in Anthropic schema format
   */
  async getMcpAnthropicSchemas(): Promise<AnthropicToolSchema[]> {
    try {
      const useMCPStore = await getMCPStore();
      const mcpStore = useMCPStore.getState();
      const enabledTools = mcpStore.getEnabledMcpTools();
      
      return enabledTools.map(tool => ({
        name: tool.fullName,
        description: `[MCP: ${tool.serverName}] ${tool.description}`,
        input_schema: tool.inputSchema as AnthropicToolSchema['input_schema']
      }));
    } catch {
      return [];
    }
  }

  /**
   * Get enabled MCP tools in OpenAI schema format
   */
  async getMcpOpenAISchemas(): Promise<OpenAIToolSchema[]> {
    try {
      const useMCPStore = await getMCPStore();
      const mcpStore = useMCPStore.getState();
      const enabledTools = mcpStore.getEnabledMcpTools();
      
      return enabledTools.map(tool => ({
        type: 'function' as const,
        function: {
          name: tool.fullName,
          description: `[MCP: ${tool.serverName}] ${tool.description}`,
          parameters: tool.inputSchema as OpenAIToolSchema['function']['parameters']
        }
      }));
    } catch {
      return [];
    }
  }

  /**
   * Get all tools (browser + MCP) in Anthropic schema format
   */
  async getAllAnthropicSchemas(): Promise<AnthropicToolSchema[]> {
    const mcpSchemas = await this.getMcpAnthropicSchemas();
    return [...this.getAnthropicSchemas(), ...mcpSchemas];
  }

  /**
   * Get all tools (browser + MCP) in OpenAI schema format
   */
  async getAllOpenAISchemas(): Promise<OpenAIToolSchema[]> {
    const mcpSchemas = await this.getMcpOpenAISchemas();
    return [...this.getOpenAISchemas(), ...mcpSchemas];
  }

  /**
   * Convenience method: Get Anthropic tools (alias for getAnthropicSchemas)
   */
  getAnthropicTools(): AnthropicToolSchema[] {
    return this.getAnthropicSchemas();
  }

  /**
   * Convenience method: Get OpenAI tools (alias for getOpenAISchemas)
   */
  getOpenAITools(): OpenAIToolSchema[] {
    return this.getOpenAISchemas();
  }

  /**
   * Convenience method: Execute a tool (alias for executeTool)
   * 
   * @param name - Tool name to execute
   * @param input - Tool input parameters
   * @param context - Optional execution context (if not provided, will use current tab)
   * @returns Tool execution result
   */
  async execute(
    name: string,
    input: any,
    context?: Partial<ToolContext>
  ): Promise<ToolResult> {
    // If context is not provided, get current tab info
    if (!context || !context.tabId || !context.url || !context.permissionManager) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.id || !tab.url) {
          return { error: 'No active tab found' };
        }

        const { PermissionManager } = await import('@/lib/permissions');
        const permissionManager = PermissionManager.getInstance();

        const fullContext: ToolContext = {
          tabId: tab.id,
          url: tab.url,
          permissionManager,
          ...context
        };

        return this.executeTool(name, input, fullContext);
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Failed to get tab context'
        };
      }
    }

    // Context provided, use it
    return this.executeTool(name, input, context as ToolContext);
  }

  /**
   * Execute a tool with permission checking
   * 
   * @param name - Tool name to execute
   * @param input - Tool input parameters
   * @param context - Execution context with tab info and permission manager
   * @returns Tool execution result
   */
  async executeTool(
    name: string,
    input: any,
    context: ToolContext
  ): Promise<ToolResult> {
    // Check if this is an MCP tool
    if (isMcpTool(name)) {
      return this.executeMcpTool(name, input, context);
    }

    const tool = this.getTool(name);

    if (!tool) {
      return { error: `Unknown tool: ${name}` };
    }

    // Check permission before execution
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

    // Permission granted, execute the tool
    try {
      const result = await tool.execute(input, context);

      // Smart Retry Mechanism (S28): Enhance error messages with diagnostic context
      if (result.error && name !== 'console_logs' && name !== 'network_requests') {
        try {
          const consoleTool = this.getTool('console_logs');
          const networkTool = this.getTool('network_requests');
          
          let diagnosticContext = '';
          
          if (consoleTool) {
            const consoleResult = await consoleTool.execute({ action: 'get_errors', limit: 5 }, context);
            if (!consoleResult.error && consoleResult.output && !consoleResult.output.includes('No console errors')) {
              diagnosticContext += `\n\n--- Auto-Diagnostic: Recent Console Errors ---\n${consoleResult.output}`;
            }
          }
          
          if (networkTool) {
            const networkResult = await networkTool.execute({ action: 'get_errors', limit: 3 }, context);
            if (!networkResult.error && networkResult.output && !networkResult.output.includes('No failing network requests')) {
              diagnosticContext += `\n\n--- Auto-Diagnostic: Recent Failing Network Requests ---\n${networkResult.output}`;
            }
          }

          if (diagnosticContext) {
            result.error += `\n\nNote: The action failed. Here is some diagnostic context from the page that might explain why:${diagnosticContext}`;
          }
        } catch (diagError) {
          console.warn('Failed to fetch diagnostic context:', diagError);
        }
      }

      // If workflow recording is active, capture this step
      try {
        const workflowStore = useWorkflowStore.getState();
        console.log('[Workflow Debug] Tool executed:', name, 'Recording status:', workflowStore.status);
        if (workflowStore.status === 'recording' && workflowStore.currentRecording) {
          const action = toolInputToWorkflowAction(name, input);
          console.log('[Workflow Debug] Action mapped:', action);
          if (action) {
            // Capture step asynchronously (don't block tool execution)
            console.log('[Workflow Debug] Capturing step...');
            workflowStore.captureStep(action).then(() => {
              console.log('[Workflow Debug] Step captured successfully!');
            }).catch(err => {
              console.warn('[Workflow Debug] Failed to capture workflow step:', err);
            });
          }
        }
      } catch (workflowError) {
        // Don't fail tool execution if workflow capture fails
        console.warn('Workflow capture error:', workflowError);
      }

      return result;
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Execute an MCP tool by routing to the appropriate server
   * 
   * @param fullName - Full MCP tool name (mcp__uuid__toolname)
   * @param input - Tool input parameters
   * @param context - Execution context
   * @returns Tool execution result
   */
  private async executeMcpTool(
    fullName: string,
    input: any,
    context: ToolContext
  ): Promise<ToolResult> {
    const parsed = parseMcpToolName(fullName);
    if (!parsed) {
      return { error: `Invalid MCP tool name: ${fullName}` };
    }

    try {
      const useMCPStore = await getMCPStore();
      const mcpStore = useMCPStore.getState();
      const server = mcpStore.getServer(parsed.uuid);
      
      if (!server) {
        return { error: `MCP server not found for tool: ${fullName}` };
      }

      if (server.status !== 'connected') {
        return { error: `MCP server "${server.name}" is not connected` };
      }

      // Check if tool is enabled
      if (!mcpStore.isToolEnabled(fullName)) {
        return { error: `MCP tool "${parsed.name}" is disabled` };
      }

      // Check permission for MCP tools (use the full name for permission key)
      const permission = await context.permissionManager.checkPermission(
        context.url,
        fullName
      );

      if (!permission.allowed && !permission.needsPrompt) {
        return { error: 'Permission denied for this MCP tool' };
      }

      if (permission.needsPrompt) {
        return {
          error: 'PERMISSION_REQUIRED',
          output: JSON.stringify({
            type: 'permission_required',
            tool: fullName,
            url: context.url,
            toolUseId: context.toolUseId
          })
        };
      }

      // Execute the MCP tool
      const result = await mcpClient.callTool(server.url, parsed.name, input);
      
      if (!result.success) {
        return { error: result.error || 'MCP tool execution failed' };
      }

      return {
        output: typeof result.result === 'string' 
          ? result.result 
          : JSON.stringify(result.result, null, 2)
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'MCP tool execution failed'
      };
    }
  }
}

// Export singleton instance
export const toolRegistry = new ToolRegistry();