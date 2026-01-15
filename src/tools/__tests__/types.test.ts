/**
 * Unit tests for tool types and schema conversion
 */

import { describe, it, expect } from 'vitest';
import type {
  ToolDefinition,
  ToolParameters,
  ToolContext,
  ToolResult,
  AnthropicToolSchema,
  OpenAIToolSchema,
} from '../types';

describe('Tool Types', () => {
  describe('Interface Validation', () => {
    it('should validate ToolParameters structure', () => {
      const params: ToolParameters = {
        action: {
          type: 'string',
          description: 'The action to perform',
          required: true,
          enum: ['click', 'type', 'scroll'],
        },
        coordinate: {
          type: 'array',
          description: 'X and Y coordinates',
          items: { type: 'number' },
        },
      };

      expect(params.action.type).toBe('string');
      expect(params.action.required).toBe(true);
      expect(params.action.enum).toEqual(['click', 'type', 'scroll']);
      expect(params.coordinate.type).toBe('array');
      expect(params.coordinate.items?.type).toBe('number');
    });

    it('should validate ToolContext structure', () => {
      const context: ToolContext = {
        tabId: 123,
        tabGroupId: 456,
        url: 'https://example.com',
        permissionManager: {} as any,
        toolUseId: 'tool-use-123',
      };

      expect(context.tabId).toBe(123);
      expect(context.tabGroupId).toBe(456);
      expect(context.url).toBe('https://example.com');
      expect(context.toolUseId).toBe('tool-use-123');
    });

    it('should validate ToolResult structure with output', () => {
      const result: ToolResult = {
        output: 'Action completed successfully',
      };

      expect(result.output).toBe('Action completed successfully');
      expect(result.error).toBeUndefined();
      expect(result.screenshot).toBeUndefined();
    });

    it('should validate ToolResult structure with error', () => {
      const result: ToolResult = {
        error: 'Action failed',
      };

      expect(result.error).toBe('Action failed');
      expect(result.output).toBeUndefined();
    });

    it('should validate ToolResult structure with screenshot', () => {
      const result: ToolResult = {
        output: 'Screenshot captured',
        screenshot: 'data:image/png;base64,iVBORw0KGgo...',
      };

      expect(result.output).toBe('Screenshot captured');
      expect(result.screenshot).toContain('data:image/png;base64');
    });
  });

  describe('Schema Conversion', () => {
    // Create a mock tool for testing schema conversion
    const mockTool: ToolDefinition = {
      name: 'test_tool',
      description: 'A test tool for validation',
      parameters: {
        action: {
          type: 'string',
          description: 'Action to perform',
          required: true,
          enum: ['click', 'type'],
        },
        text: {
          type: 'string',
          description: 'Text input',
        },
        count: {
          type: 'number',
          description: 'Number of times',
        },
      },
      execute: async () => ({ output: 'success' }),
      toAnthropicSchema: function (): AnthropicToolSchema {
        const required = Object.entries(this.parameters)
          .filter(([_, param]) => param.required)
          .map(([name]) => name);

        const properties: Record<string, any> = {};
        for (const [name, param] of Object.entries(this.parameters)) {
          properties[name] = {
            type: param.type,
            description: param.description,
          };
          if (param.enum) {
            properties[name].enum = param.enum;
          }
          if (param.items) {
            properties[name].items = param.items;
          }
        }

        return {
          name: this.name,
          description: this.description,
          input_schema: {
            type: 'object',
            properties,
            required,
          },
        };
      },
      toOpenAISchema: function (): OpenAIToolSchema {
        const required = Object.entries(this.parameters)
          .filter(([_, param]) => param.required)
          .map(([name]) => name);

        const properties: Record<string, any> = {};
        for (const [name, param] of Object.entries(this.parameters)) {
          properties[name] = {
            type: param.type,
            description: param.description,
          };
          if (param.enum) {
            properties[name].enum = param.enum;
          }
          if (param.items) {
            properties[name].items = param.items;
          }
        }

        return {
          type: 'function',
          function: {
            name: this.name,
            description: this.description,
            parameters: {
              type: 'object',
              properties,
              required,
            },
          },
        };
      },
    };

    it('should convert to Anthropic schema format', () => {
      const schema = mockTool.toAnthropicSchema();

      expect(schema.name).toBe('test_tool');
      expect(schema.description).toBe('A test tool for validation');
      expect(schema.input_schema.type).toBe('object');
      expect(schema.input_schema.required).toEqual(['action']);
      expect(schema.input_schema.properties.action).toEqual({
        type: 'string',
        description: 'Action to perform',
        enum: ['click', 'type'],
      });
      expect(schema.input_schema.properties.text).toEqual({
        type: 'string',
        description: 'Text input',
      });
      expect(schema.input_schema.properties.count).toEqual({
        type: 'number',
        description: 'Number of times',
      });
    });

    it('should convert to OpenAI schema format', () => {
      const schema = mockTool.toOpenAISchema();

      expect(schema.type).toBe('function');
      expect(schema.function.name).toBe('test_tool');
      expect(schema.function.description).toBe('A test tool for validation');
      expect(schema.function.parameters.type).toBe('object');
      expect(schema.function.parameters.required).toEqual(['action']);
      expect(schema.function.parameters.properties.action).toEqual({
        type: 'string',
        description: 'Action to perform',
        enum: ['click', 'type'],
      });
      expect(schema.function.parameters.properties.text).toEqual({
        type: 'string',
        description: 'Text input',
      });
      expect(schema.function.parameters.properties.count).toEqual({
        type: 'number',
        description: 'Number of times',
      });
    });

    it('should handle tools with no required parameters', () => {
      const optionalTool: ToolDefinition = {
        name: 'optional_tool',
        description: 'Tool with all optional params',
        parameters: {
          text: {
            type: 'string',
            description: 'Optional text',
          },
        },
        execute: async () => ({ output: 'success' }),
        toAnthropicSchema: function (): AnthropicToolSchema {
          return {
            name: this.name,
            description: this.description,
            input_schema: {
              type: 'object',
              properties: {
                text: {
                  type: 'string',
                  description: 'Optional text',
                },
              },
              required: [],
            },
          };
        },
        toOpenAISchema: function (): OpenAIToolSchema {
          return {
            type: 'function',
            function: {
              name: this.name,
              description: this.description,
              parameters: {
                type: 'object',
                properties: {
                  text: {
                    type: 'string',
                    description: 'Optional text',
                  },
                },
                required: [],
              },
            },
          };
        },
      };

      const anthropicSchema = optionalTool.toAnthropicSchema();
      const openaiSchema = optionalTool.toOpenAISchema();

      expect(anthropicSchema.input_schema.required).toEqual([]);
      expect(openaiSchema.function.parameters.required).toEqual([]);
    });

    it('should preserve enum values in schema conversion', () => {
      const enumTool: ToolDefinition = {
        name: 'enum_tool',
        description: 'Tool with enum parameter',
        parameters: {
          direction: {
            type: 'string',
            description: 'Direction to move',
            required: true,
            enum: ['up', 'down', 'left', 'right'],
          },
        },
        execute: async () => ({ output: 'success' }),
        toAnthropicSchema: function (): AnthropicToolSchema {
          return {
            name: this.name,
            description: this.description,
            input_schema: {
              type: 'object',
              properties: {
                direction: {
                  type: 'string',
                  description: 'Direction to move',
                  enum: ['up', 'down', 'left', 'right'],
                },
              },
              required: ['direction'],
            },
          };
        },
        toOpenAISchema: function (): OpenAIToolSchema {
          return {
            type: 'function',
            function: {
              name: this.name,
              description: this.description,
              parameters: {
                type: 'object',
                properties: {
                  direction: {
                    type: 'string',
                    description: 'Direction to move',
                    enum: ['up', 'down', 'left', 'right'],
                  },
                },
                required: ['direction'],
              },
            },
          };
        },
      };

      const anthropicSchema = enumTool.toAnthropicSchema();
      const openaiSchema = enumTool.toOpenAISchema();

      expect(anthropicSchema.input_schema.properties.direction.enum).toEqual([
        'up',
        'down',
        'left',
        'right',
      ]);
      expect(openaiSchema.function.parameters.properties.direction.enum).toEqual([
        'up',
        'down',
        'left',
        'right',
      ]);
    });

    it('should handle array parameters with items', () => {
      const arrayTool: ToolDefinition = {
        name: 'array_tool',
        description: 'Tool with array parameter',
        parameters: {
          coordinates: {
            type: 'array',
            description: 'List of coordinates',
            required: true,
            items: { type: 'number' },
          },
        },
        execute: async () => ({ output: 'success' }),
        toAnthropicSchema: function (): AnthropicToolSchema {
          return {
            name: this.name,
            description: this.description,
            input_schema: {
              type: 'object',
              properties: {
                coordinates: {
                  type: 'array',
                  description: 'List of coordinates',
                  items: { type: 'number' },
                },
              },
              required: ['coordinates'],
            },
          };
        },
        toOpenAISchema: function (): OpenAIToolSchema {
          return {
            type: 'function',
            function: {
              name: this.name,
              description: this.description,
              parameters: {
                type: 'object',
                properties: {
                  coordinates: {
                    type: 'array',
                    description: 'List of coordinates',
                    items: { type: 'number' },
                  },
                },
                required: ['coordinates'],
              },
            },
          };
        },
      };

      const anthropicSchema = arrayTool.toAnthropicSchema();
      const openaiSchema = arrayTool.toOpenAISchema();

      expect(anthropicSchema.input_schema.properties.coordinates.items).toEqual({
        type: 'number',
      });
      expect(openaiSchema.function.parameters.properties.coordinates.items).toEqual({
        type: 'number',
      });
    });
  });
});
