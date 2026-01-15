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
      return await tool.execute(input, context);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// Export singleton instance
export const toolRegistry = new ToolRegistry();