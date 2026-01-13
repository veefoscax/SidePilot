/**
 * Tool Registry
 * 
 * Central registry for all available tools with schema conversion utilities
 */

import { Tool, AnthropicTool, OpenAITool, ToolParameter } from './types';
import { browserTools } from './browser-tools';

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
   * Execute a tool by name
   */
  async execute(name: string, params: Record<string, any>): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    return await tool.execute(params);
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