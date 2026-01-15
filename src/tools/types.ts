/**
 * Core types for browser automation tools
 * Supports both Anthropic and OpenAI tool schemas
 */

import type { PermissionManager } from '@/lib/permissions';

/**
 * Parameter definition for tool inputs
 */
export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required?: boolean;
  enum?: string[];
  items?: {
    type: string;
  };
}

/**
 * Collection of parameters for a tool
 */
export interface ToolParameters {
  [key: string]: ToolParameter;
}

/**
 * Context provided to tool execution
 */
export interface ToolContext {
  tabId: number;
  tabGroupId?: number;
  url: string;
  permissionManager: PermissionManager;
  toolUseId?: string;
}

/**
 * Result returned from tool execution
 */
export interface ToolResult {
  output?: string;
  error?: string;
  screenshot?: string;
}

/**
 * Anthropic (Claude) tool schema format
 */
export interface AnthropicToolSchema {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

/**
 * OpenAI (GPT) tool schema format
 */
export interface OpenAIToolSchema {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required: string[];
    };
  };
}

/**
 * Core tool definition interface
 */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameters;
  execute: (input: any, context: ToolContext) => Promise<ToolResult>;
  toAnthropicSchema: () => AnthropicToolSchema;
  toOpenAISchema: () => OpenAIToolSchema;
}
