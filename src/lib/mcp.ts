/**
 * MCP (Model Context Protocol) Types and Utilities
 * 
 * Provides core types and utility functions for MCP server integration.
 * Tool names follow the pattern: mcp__<uuid>__<toolname>
 * Example: mcp__a1b2c3d4-e5f6-7890-abcd-ef1234567890__read_file
 * 
 * Requirements: AC1 (Register Server), AC2 (Tool Naming)
 */

// =============================================================================
// Constants
// =============================================================================

/**
 * Regex pattern for parsing MCP tool names
 * Matches: mcp__<uuid>__<toolname>
 * Groups: [1] = uuid, [2] = toolname
 */
export const MCP_TOOL_PATTERN = /^mcp__([0-9a-f-]+)__(.+)$/;

/**
 * Prefix used for MCP tool names
 */
export const MCP_TOOL_PREFIX = 'mcp__';

// =============================================================================
// Types
// =============================================================================

/**
 * Connection status for an MCP server
 */
export type MCPServerStatus = 'connected' | 'disconnected' | 'error';

/**
 * Represents an MCP server configuration and state
 */
export interface MCPServer {
  /** Unique identifier for this server instance */
  uuid: string;
  /** Human-readable name for the server */
  name: string;
  /** Server URL (WebSocket or HTTP endpoint) */
  url: string;
  /** Current connection status */
  status: MCPServerStatus;
  /** Timestamp of last successful connection (ms since epoch) */
  lastConnected?: number;
  /** Error message if status is 'error' */
  errorMessage?: string;
}

/**
 * Represents a tool exposed by an MCP server
 */
export interface MCPTool {
  /** Tool name as provided by the MCP server */
  name: string;
  /** Optional display name for UI */
  displayName?: string;
  /** Description of what the tool does */
  description: string;
  /** JSON Schema for tool input parameters */
  inputSchema: Record<string, unknown>;
  /** Key for "always approved" permission setting */
  alwaysApprovedKey?: string;
}

/**
 * Result of parsing an MCP tool name
 */
export interface ParsedMcpToolName {
  /** UUID of the server that owns this tool */
  uuid: string;
  /** Original tool name from the server */
  name: string;
}

/**
 * MCP tool with server context for registry integration
 */
export interface MCPToolWithServer extends MCPTool {
  /** Full prefixed tool name (mcp__<uuid>__<name>) */
  fullName: string;
  /** UUID of the server this tool belongs to */
  serverUuid: string;
  /** Name of the server for display purposes */
  serverName: string;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Formats a tool name with MCP prefix for unique identification
 * 
 * @param uuid - Server UUID
 * @param toolName - Original tool name from the server
 * @returns Formatted tool name: mcp__<uuid>__<toolname>
 * 
 * @example
 * formatMcpToolName('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'read_file')
 * // Returns: 'mcp__a1b2c3d4-e5f6-7890-abcd-ef1234567890__read_file'
 */
export function formatMcpToolName(uuid: string, toolName: string): string {
  return `${MCP_TOOL_PREFIX}${uuid}__${toolName}`;
}

/**
 * Parses an MCP tool name to extract the server UUID and original tool name
 * 
 * @param fullName - Full MCP tool name (mcp__<uuid>__<toolname>)
 * @returns Parsed components or null if not a valid MCP tool name
 * 
 * @example
 * parseMcpToolName('mcp__a1b2c3d4-e5f6-7890-abcd-ef1234567890__read_file')
 * // Returns: { uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', name: 'read_file' }
 * 
 * parseMcpToolName('browser_click')
 * // Returns: null
 */
export function parseMcpToolName(fullName: string): ParsedMcpToolName | null {
  const match = fullName.match(MCP_TOOL_PATTERN);
  if (!match) {
    return null;
  }
  return {
    uuid: match[1],
    name: match[2]
  };
}

/**
 * Checks if a tool name is an MCP tool (has the mcp__ prefix pattern)
 * 
 * @param toolName - Tool name to check
 * @returns true if the tool name matches the MCP pattern
 * 
 * @example
 * isMcpTool('mcp__a1b2c3d4-e5f6-7890-abcd-ef1234567890__read_file')
 * // Returns: true
 * 
 * isMcpTool('browser_click')
 * // Returns: false
 */
export function isMcpTool(toolName: string): boolean {
  return MCP_TOOL_PATTERN.test(toolName);
}

/**
 * Generates a UUID v4 for new MCP server instances
 * Uses crypto.randomUUID if available, falls back to manual generation
 * 
 * @returns A new UUID string
 */
export function generateMcpServerUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Validates an MCP server URL
 * 
 * @param url - URL to validate
 * @returns true if the URL is valid for MCP connection
 */
export function isValidMcpServerUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Accept http, https, ws, and wss protocols
    return ['http:', 'https:', 'ws:', 'wss:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Creates a default MCPServer object with initial state
 * 
 * @param url - Server URL
 * @param name - Server name
 * @returns New MCPServer object with disconnected status
 */
export function createMcpServer(url: string, name: string): MCPServer {
  return {
    uuid: generateMcpServerUuid(),
    name,
    url,
    status: 'disconnected'
  };
}
