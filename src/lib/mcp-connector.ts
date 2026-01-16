/**
 * MCP Connector Implementation
 * 
 * Exposes SidePilot's browser tools to external AI tools like Cline, Aider,
 * and other MCP clients. This is the "server" side that allows external
 * LLMs to use our browser automation capabilities.
 * 
 * Requirements:
 * - AC1: Enable Connector - Start listening for external connections and expose tools
 * - AC2: Tool List - Return exposed tools with Anthropic-compatible schema
 * - AC3: Tool Execution - Execute tools using current active tab
 * - AC4: Authentication - Require valid token before allowing tool access
 */

import { toolRegistry } from '@/tools/registry';
import { PermissionManager } from '@/lib/permissions';
import type { AnthropicToolSchema, ToolContext, ToolResult } from '@/tools/types';

// =============================================================================
// Types
// =============================================================================

/**
 * Configuration for the MCP Connector
 */
export interface MCPConnectorConfig {
  /** Whether the connector is enabled */
  enabled: boolean;
  /** Port for the connector (used by native messaging proxy) */
  port: number;
  /** Authentication token for security */
  authToken: string;
  /** List of tool names that are exposed to external clients */
  exposedTools: string[];
}

/**
 * Default configuration values
 */
export const DEFAULT_MCP_CONNECTOR_CONFIG: MCPConnectorConfig = {
  enabled: false,
  port: 54321,
  authToken: '',
  exposedTools: [],
};

/**
 * Result of a tools list request
 */
export interface ToolsListResult {
  tools: AnthropicToolSchema[];
}

/**
 * Request format for tool calls from external clients
 */
export interface MCPToolCallRequest {
  /** Name of the tool to execute */
  name: string;
  /** Input parameters for the tool */
  input: Record<string, unknown>;
  /** Authentication token */
  authToken?: string;
}

/**
 * Response format for tool calls
 */
export interface MCPToolCallResponse {
  /** Whether the call was successful */
  success: boolean;
  /** Result data if successful */
  result?: ToolResult;
  /** Error message if failed */
  error?: string;
}

/**
 * Context for tool execution
 */
export interface MCPToolContext {
  tabId: number;
  url: string;
}

// =============================================================================
// Storage Key
// =============================================================================

const STORAGE_KEY = 'mcp_connector_config';

// =============================================================================
// MCP Connector Class
// =============================================================================

/**
 * MCP Connector - Exposes browser tools to external AI tools
 * 
 * This class handles:
 * - Tool discovery (handleToolsList)
 * - Tool execution (handleToolCall)
 * - Authentication token management
 * - Active tab context retrieval
 * 
 * @example
 * ```typescript
 * const connector = MCPConnector.getInstance();
 * await connector.initialize();
 * 
 * // Get available tools
 * const { tools } = connector.handleToolsList();
 * 
 * // Execute a tool
 * const result = await connector.handleToolCall('navigation', { 
 *   action: 'goto', 
 *   url: 'https://example.com' 
 * });
 * ```
 */
export class MCPConnector {
  private static instance: MCPConnector | null = null;
  private config: MCPConnectorConfig;
  private initialized = false;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.config = { ...DEFAULT_MCP_CONNECTOR_CONFIG };
  }

  /**
   * Get the singleton instance of MCPConnector
   */
  static getInstance(): MCPConnector {
    if (!MCPConnector.instance) {
      MCPConnector.instance = new MCPConnector();
    }
    return MCPConnector.instance;
  }

  /**
   * Initialize the connector by loading configuration from storage
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      const stored = await chrome.storage.local.get(STORAGE_KEY);
      const data = stored[STORAGE_KEY];

      if (data && typeof data === 'object') {
        this.config = {
          ...DEFAULT_MCP_CONNECTOR_CONFIG,
          ...data,
        };
      }

      // Generate auth token if not present
      if (!this.config.authToken) {
        this.config.authToken = this.generateAuthToken();
        await this.saveConfig();
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize MCP Connector:', error);
      // Continue with default config
      this.config.authToken = this.generateAuthToken();
      this.initialized = true;
    }
  }

  /**
   * Get the current configuration
   */
  getConfig(): MCPConnectorConfig {
    return { ...this.config };
  }

  /**
   * Update the configuration
   * 
   * @param updates - Partial configuration updates
   */
  async updateConfig(updates: Partial<MCPConnectorConfig>): Promise<void> {
    this.config = {
      ...this.config,
      ...updates,
    };
    await this.saveConfig();
  }

  /**
   * Enable or disable the connector
   * 
   * @param enabled - Whether to enable the connector
   */
  async setEnabled(enabled: boolean): Promise<void> {
    await this.updateConfig({ enabled });
  }

  /**
   * Check if the connector is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Set the list of exposed tools
   * 
   * @param tools - Array of tool names to expose
   */
  async setExposedTools(tools: string[]): Promise<void> {
    await this.updateConfig({ exposedTools: tools });
  }

  /**
   * Get the list of exposed tool names
   */
  getExposedTools(): string[] {
    return [...this.config.exposedTools];
  }

  /**
   * Regenerate the authentication token
   * 
   * @returns The new authentication token
   */
  async regenerateAuthToken(): Promise<string> {
    const newToken = this.generateAuthToken();
    await this.updateConfig({ authToken: newToken });
    return newToken;
  }

  /**
   * Validate an authentication token
   * 
   * @param token - Token to validate
   * @returns True if the token is valid
   */
  validateAuthToken(token: string): boolean {
    if (!this.config.authToken) {
      return false;
    }
    return token === this.config.authToken;
  }

  // ===========================================================================
  // MCP Protocol Handlers (AC1, AC2)
  // ===========================================================================

  /**
   * Handle a tools/list request from an external client
   * Returns the list of exposed tools in Anthropic-compatible schema format
   * 
   * Implements AC2: Tool List
   * 
   * @returns Object containing array of tool schemas
   */
  handleToolsList(): ToolsListResult {
    const allTools = toolRegistry.getAllTools();
    
    // Filter to only exposed tools
    const exposedTools = allTools.filter(tool => 
      this.config.exposedTools.includes(tool.name)
    );

    // Convert to Anthropic schema format
    const tools = exposedTools.map(tool => tool.toAnthropicSchema());

    return { tools };
  }

  /**
   * Handle a tools/call request from an external client
   * Executes the specified tool using the current active tab context
   * 
   * Implements AC3: Tool Execution
   * 
   * @param name - Name of the tool to execute
   * @param input - Input parameters for the tool
   * @returns Tool execution result
   */
  async handleToolCall(
    name: string,
    input: Record<string, unknown>
  ): Promise<MCPToolCallResponse> {
    // Check if connector is enabled
    if (!this.config.enabled) {
      return {
        success: false,
        error: 'MCP Connector is not enabled',
      };
    }

    // Check if tool is exposed
    if (!this.config.exposedTools.includes(name)) {
      return {
        success: false,
        error: `Tool "${name}" is not exposed via MCP Connector`,
      };
    }

    // Get active tab context
    const context = await this.getActiveTabContext();
    if (!context) {
      return {
        success: false,
        error: 'No active tab found',
      };
    }

    try {
      // Execute the tool using the registry
      const result = await toolRegistry.executeTool(name, input, context);

      return {
        success: !result.error || result.error === 'PERMISSION_REQUIRED',
        result,
        error: result.error && result.error !== 'PERMISSION_REQUIRED' 
          ? result.error 
          : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Handle a tool call with authentication
   * 
   * Implements AC4: Authentication
   * 
   * @param request - Tool call request with auth token
   * @returns Tool execution result
   */
  async handleAuthenticatedToolCall(
    request: MCPToolCallRequest
  ): Promise<MCPToolCallResponse> {
    // Validate auth token
    if (!request.authToken || !this.validateAuthToken(request.authToken)) {
      return {
        success: false,
        error: 'Invalid or missing authentication token',
      };
    }

    return this.handleToolCall(request.name, request.input);
  }

  // ===========================================================================
  // Context Helpers
  // ===========================================================================

  /**
   * Get the context for the current active tab
   * 
   * @returns ToolContext for the active tab, or null if no tab is available
   */
  async getActiveTabContext(): Promise<ToolContext | null> {
    try {
      const [tab] = await chrome.tabs.query({ 
        active: true, 
        currentWindow: true 
      });

      if (!tab || !tab.id || !tab.url) {
        return null;
      }

      const permissionManager = PermissionManager.getInstance();

      return {
        tabId: tab.id,
        url: tab.url,
        permissionManager,
      };
    } catch (error) {
      console.error('Failed to get active tab context:', error);
      return null;
    }
  }

  // ===========================================================================
  // Private Helpers
  // ===========================================================================

  /**
   * Generate a unique authentication token
   * 
   * @returns A cryptographically random token
   */
  private generateAuthToken(): string {
    // Generate 32 random bytes and convert to hex
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Save the current configuration to storage
   */
  private async saveConfig(): Promise<void> {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEY]: this.config,
      });
    } catch (error) {
      console.error('Failed to save MCP Connector config:', error);
    }
  }

  /**
   * Reset the singleton instance (useful for testing)
   * @internal
   */
  static resetInstance(): void {
    MCPConnector.instance = null;
  }
}

// =============================================================================
// Singleton Instance Export
// =============================================================================

/**
 * Get the singleton instance of MCPConnector
 * Convenience function for accessing the connector
 */
export function getMCPConnector(): MCPConnector {
  return MCPConnector.getInstance();
}

/**
 * Default MCP Connector instance for convenience
 */
export const mcpConnector = MCPConnector.getInstance();
