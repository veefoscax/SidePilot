/**
 * MCP Client Implementation
 * 
 * Provides client functionality for connecting to MCP (Model Context Protocol) servers,
 * discovering tools, and executing tool calls.
 * 
 * Supports both HTTP and WebSocket protocols with automatic reconnection logic.
 * 
 * Requirements: AC2 (Tool Naming), AC3 (Tool Execution)
 */

import { MCPTool, MCPServer, MCPServerStatus, isValidMcpServerUrl } from './mcp';

// =============================================================================
// Constants
// =============================================================================

/** Default timeout for HTTP requests in milliseconds */
const DEFAULT_TIMEOUT_MS = 30000;

/** Maximum number of reconnection attempts */
const MAX_RECONNECT_ATTEMPTS = 5;

/** Base delay for exponential backoff in milliseconds */
const BASE_RECONNECT_DELAY_MS = 1000;

/** Maximum delay between reconnection attempts in milliseconds */
const MAX_RECONNECT_DELAY_MS = 30000;

// =============================================================================
// Types
// =============================================================================

/**
 * Configuration options for the MCP client
 */
export interface MCPClientConfig {
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Maximum reconnection attempts */
  maxReconnectAttempts?: number;
  /** Base delay for exponential backoff */
  baseReconnectDelay?: number;
  /** Maximum delay between reconnection attempts */
  maxReconnectDelay?: number;
}

/**
 * Result of a connection attempt
 */
export interface MCPConnectionResult {
  /** Whether the connection was successful */
  success: boolean;
  /** Discovered tools if successful */
  tools?: MCPTool[];
  /** Error message if failed */
  error?: string;
  /** Server status after connection attempt */
  status: MCPServerStatus;
}

/**
 * Result of a tool execution
 */
export interface MCPToolResult {
  /** Whether the execution was successful */
  success: boolean;
  /** Result data if successful */
  result?: unknown;
  /** Error message if failed */
  error?: string;
}

/**
 * Internal state for WebSocket connections
 */
interface WebSocketState {
  socket: WebSocket;
  pendingRequests: Map<string, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
  }>;
  messageId: number;
}

// =============================================================================
// MCP Client Class
// =============================================================================

/**
 * Client for connecting to and interacting with MCP servers
 * 
 * Supports both HTTP and WebSocket protocols:
 * - HTTP: Uses REST-like endpoints (/tools/list, /tools/call)
 * - WebSocket: Uses JSON-RPC 2.0 over persistent connection
 * 
 * @example
 * ```typescript
 * const client = new MCPClient();
 * 
 * // Connect and discover tools
 * const result = await client.connect('http://localhost:3000');
 * if (result.success) {
 *   console.log('Available tools:', result.tools);
 * }
 * 
 * // Execute a tool
 * const toolResult = await client.callTool(
 *   'http://localhost:3000',
 *   'read_file',
 *   { path: '/tmp/test.txt' }
 * );
 * ```
 */
export class MCPClient {
  private config: Required<MCPClientConfig>;
  private wsConnections: Map<string, WebSocketState> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();

  constructor(config: MCPClientConfig = {}) {
    this.config = {
      timeout: config.timeout ?? DEFAULT_TIMEOUT_MS,
      maxReconnectAttempts: config.maxReconnectAttempts ?? MAX_RECONNECT_ATTEMPTS,
      baseReconnectDelay: config.baseReconnectDelay ?? BASE_RECONNECT_DELAY_MS,
      maxReconnectDelay: config.maxReconnectDelay ?? MAX_RECONNECT_DELAY_MS,
    };
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * Connects to an MCP server and discovers available tools
   * 
   * @param url - Server URL (http://, https://, ws://, or wss://)
   * @returns Connection result with discovered tools or error
   */
  async connect(url: string): Promise<MCPConnectionResult> {
    // Validate URL
    if (!isValidMcpServerUrl(url)) {
      return {
        success: false,
        error: `Invalid MCP server URL: ${url}`,
        status: 'error'
      };
    }

    try {
      const protocol = new URL(url).protocol;
      
      if (protocol === 'ws:' || protocol === 'wss:') {
        return await this.connectWebSocket(url);
      } else {
        return await this.connectHttp(url);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
      return {
        success: false,
        error: errorMessage,
        status: 'error'
      };
    }
  }

  /**
   * Executes a tool on an MCP server
   * 
   * @param url - Server URL
   * @param toolName - Name of the tool to execute (original name, not prefixed)
   * @param input - Tool input parameters
   * @returns Tool execution result
   */
  async callTool(url: string, toolName: string, input: Record<string, unknown> = {}): Promise<MCPToolResult> {
    // Validate URL
    if (!isValidMcpServerUrl(url)) {
      return {
        success: false,
        error: `Invalid MCP server URL: ${url}`
      };
    }

    try {
      const protocol = new URL(url).protocol;
      
      if (protocol === 'ws:' || protocol === 'wss:') {
        return await this.callToolWebSocket(url, toolName, input);
      } else {
        return await this.callToolHttp(url, toolName, input);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error executing tool';
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Disconnects from an MCP server
   * 
   * @param url - Server URL to disconnect from
   */
  disconnect(url: string): void {
    const wsState = this.wsConnections.get(url);
    if (wsState) {
      // Reject all pending requests
      for (const [, pending] of wsState.pendingRequests) {
        clearTimeout(pending.timeout);
        pending.reject(new Error('Connection closed'));
      }
      wsState.pendingRequests.clear();
      
      // Close the WebSocket
      if (wsState.socket.readyState === WebSocket.OPEN) {
        wsState.socket.close(1000, 'Client disconnect');
      }
      
      this.wsConnections.delete(url);
    }
    
    // Reset reconnect attempts
    this.reconnectAttempts.delete(url);
  }

  /**
   * Checks if there's an active WebSocket connection to a server
   * 
   * @param url - Server URL to check
   * @returns true if connected via WebSocket
   */
  isConnected(url: string): boolean {
    const wsState = this.wsConnections.get(url);
    return wsState?.socket.readyState === WebSocket.OPEN;
  }

  /**
   * Attempts to reconnect to a server with exponential backoff
   * 
   * @param url - Server URL to reconnect to
   * @returns Connection result
   */
  async reconnect(url: string): Promise<MCPConnectionResult> {
    const attempts = this.reconnectAttempts.get(url) ?? 0;
    
    if (attempts >= this.config.maxReconnectAttempts) {
      return {
        success: false,
        error: `Max reconnection attempts (${this.config.maxReconnectAttempts}) exceeded`,
        status: 'error'
      };
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.config.baseReconnectDelay * Math.pow(2, attempts),
      this.config.maxReconnectDelay
    );

    // Wait before reconnecting
    await this.sleep(delay);

    // Increment attempt counter
    this.reconnectAttempts.set(url, attempts + 1);

    // Attempt connection
    const result = await this.connect(url);

    // Reset attempts on success
    if (result.success) {
      this.reconnectAttempts.delete(url);
    }

    return result;
  }

  /**
   * Resets the reconnection attempt counter for a server
   * 
   * @param url - Server URL
   */
  resetReconnectAttempts(url: string): void {
    this.reconnectAttempts.delete(url);
  }

  // ===========================================================================
  // HTTP Protocol Implementation
  // ===========================================================================

  /**
   * Connects to an MCP server via HTTP and discovers tools
   */
  private async connectHttp(url: string): Promise<MCPConnectionResult> {
    const toolsUrl = this.buildUrl(url, '/tools/list');
    
    const response = await this.fetchWithTimeout(toolsUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        status: 'error'
      };
    }

    const data = await response.json();
    const tools = this.parseToolsResponse(data);

    return {
      success: true,
      tools,
      status: 'connected'
    };
  }

  /**
   * Executes a tool via HTTP
   */
  private async callToolHttp(
    url: string,
    toolName: string,
    input: Record<string, unknown>
  ): Promise<MCPToolResult> {
    const callUrl = this.buildUrl(url, '/tools/call');
    
    const response = await this.fetchWithTimeout(callUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name: toolName,
        arguments: input
      })
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const data = await response.json();
    
    // Handle MCP response format
    if (data.error) {
      return {
        success: false,
        error: typeof data.error === 'string' ? data.error : data.error.message || 'Tool execution failed'
      };
    }

    return {
      success: true,
      result: data.result ?? data.content ?? data
    };
  }

  // ===========================================================================
  // WebSocket Protocol Implementation
  // ===========================================================================

  /**
   * Connects to an MCP server via WebSocket and discovers tools
   */
  private async connectWebSocket(url: string): Promise<MCPConnectionResult> {
    return new Promise((resolve) => {
      // Close existing connection if any
      this.disconnect(url);

      const socket = new WebSocket(url);
      const state: WebSocketState = {
        socket,
        pendingRequests: new Map(),
        messageId: 0
      };

      const connectionTimeout = setTimeout(() => {
        socket.close();
        resolve({
          success: false,
          error: 'WebSocket connection timeout',
          status: 'error'
        });
      }, this.config.timeout);

      socket.onopen = async () => {
        clearTimeout(connectionTimeout);
        this.wsConnections.set(url, state);

        // Discover tools after connection
        try {
          const tools = await this.discoverToolsWebSocket(url);
          resolve({
            success: true,
            tools,
            status: 'connected'
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to discover tools';
          resolve({
            success: false,
            error: errorMessage,
            status: 'error'
          });
        }
      };

      socket.onerror = () => {
        clearTimeout(connectionTimeout);
        resolve({
          success: false,
          error: 'WebSocket connection error',
          status: 'error'
        });
      };

      socket.onclose = () => {
        this.wsConnections.delete(url);
      };

      socket.onmessage = (event) => {
        this.handleWebSocketMessage(url, event.data);
      };
    });
  }

  /**
   * Discovers tools via WebSocket using JSON-RPC
   */
  private async discoverToolsWebSocket(url: string): Promise<MCPTool[]> {
    const response = await this.sendWebSocketRequest(url, 'tools/list', {});
    return this.parseToolsResponse(response);
  }

  /**
   * Executes a tool via WebSocket
   */
  private async callToolWebSocket(
    url: string,
    toolName: string,
    input: Record<string, unknown>
  ): Promise<MCPToolResult> {
    // Ensure we're connected
    if (!this.isConnected(url)) {
      const connectResult = await this.connect(url);
      if (!connectResult.success) {
        return {
          success: false,
          error: connectResult.error || 'Failed to connect to server'
        };
      }
    }

    try {
      const response = await this.sendWebSocketRequest(url, 'tools/call', {
        name: toolName,
        arguments: input
      });

      // Handle MCP response format
      if (response && typeof response === 'object' && 'error' in response) {
        const error = response.error as { message?: string } | string;
        return {
          success: false,
          error: typeof error === 'string' ? error : error?.message || 'Tool execution failed'
        };
      }

      return {
        success: true,
        result: response?.result ?? response?.content ?? response
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Tool execution failed';
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Sends a JSON-RPC request over WebSocket
   */
  private sendWebSocketRequest(
    url: string,
    method: string,
    params: Record<string, unknown>
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const state = this.wsConnections.get(url);
      if (!state || state.socket.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const id = `${++state.messageId}`;
      const request = {
        jsonrpc: '2.0',
        id,
        method,
        params
      };

      const timeout = setTimeout(() => {
        state.pendingRequests.delete(id);
        reject(new Error('Request timeout'));
      }, this.config.timeout);

      state.pendingRequests.set(id, { resolve, reject, timeout });
      state.socket.send(JSON.stringify(request));
    });
  }

  /**
   * Handles incoming WebSocket messages
   */
  private handleWebSocketMessage(url: string, data: string): void {
    const state = this.wsConnections.get(url);
    if (!state) return;

    try {
      const message = JSON.parse(data);
      
      // Handle JSON-RPC response
      if (message.id && state.pendingRequests.has(message.id)) {
        const pending = state.pendingRequests.get(message.id)!;
        clearTimeout(pending.timeout);
        state.pendingRequests.delete(message.id);

        if (message.error) {
          pending.reject(new Error(message.error.message || 'RPC error'));
        } else {
          pending.resolve(message.result);
        }
      }
    } catch {
      // Ignore malformed messages
    }
  }

  // ===========================================================================
  // Helper Methods
  // ===========================================================================

  /**
   * Builds a URL by appending a path to a base URL
   */
  private buildUrl(baseUrl: string, path: string): string {
    const url = new URL(baseUrl);
    // Remove trailing slash from pathname and leading slash from path
    url.pathname = url.pathname.replace(/\/$/, '') + path;
    return url.toString();
  }

  /**
   * Performs a fetch request with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Parses the tools response from an MCP server
   */
  private parseToolsResponse(data: unknown): MCPTool[] {
    // Handle various response formats
    let toolsArray: unknown[];

    if (Array.isArray(data)) {
      toolsArray = data;
    } else if (data && typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      if (Array.isArray(obj.tools)) {
        toolsArray = obj.tools;
      } else if (Array.isArray(obj.result)) {
        toolsArray = obj.result;
      } else {
        return [];
      }
    } else {
      return [];
    }

    // Parse and validate each tool
    return toolsArray
      .filter((item): item is Record<string, unknown> => 
        item !== null && typeof item === 'object'
      )
      .map((item) => ({
        name: String(item.name || ''),
        displayName: item.displayName ? String(item.displayName) : undefined,
        description: String(item.description || ''),
        inputSchema: (item.inputSchema as Record<string, unknown>) || {},
        alwaysApprovedKey: item.alwaysApprovedKey ? String(item.alwaysApprovedKey) : undefined
      }))
      .filter((tool) => tool.name.length > 0);
  }

  /**
   * Sleep utility for reconnection delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

/**
 * Default MCP client instance for convenience
 */
export const mcpClient = new MCPClient();
