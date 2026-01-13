/**
 * Tool System Types
 * 
 * Defines the structure for browser automation tools that can be called by LLMs
 */

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  properties?: Record<string, ToolParameter>; // For nested objects
  items?: ToolParameter; // For arrays
}

export interface Tool {
  name: string;
  description: string;
  parameters: ToolParameter[];
  execute: (params: Record<string, any>) => Promise<any>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  screenshot?: string; // Base64 encoded screenshot
}

// Anthropic-compatible tool schema
export interface AnthropicTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

// OpenAI-compatible tool schema
export interface OpenAITool {
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
