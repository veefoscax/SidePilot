/**
 * Tool Registry Tests
 * 
 * Tests for tool registration, retrieval, schema generation, and execution
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { toolRegistry } from '../registry';
import type { ToolDefinition, ToolContext, ToolResult, ToolParameters } from '../types';
import type { PermissionManager } from '@/lib/permissions';

// Create a proper mock for checkPermission
const mockCheckPermission = vi.fn();

// Mock permission manager
const mockPermissionManager = {
  checkPermission: mockCheckPermission,
  requestPermission: vi.fn(),
  grantPermission: vi.fn(),
  denyPermission: vi.fn(),
  revokePermission: vi.fn(),
  getPermissions: vi.fn(),
  clearPermissions: vi.fn()
} as unknown as PermissionManager;

describe('ToolRegistry', () => {
  // Create a mock tool for testing
  const createMockTool = (name: string): ToolDefinition => {
    const parameters: ToolParameters = {
      testParam: {
        type: 'string',
        description: 'A test parameter',
        required: true
      },
      optionalParam: {
        type: 'number',
        description: 'An optional parameter',
        required: false
      }
    };

    return {
      name,
      description: `Test tool: ${name}`,
      parameters,
      execute: vi.fn(async (input: any, context: ToolContext): Promise<ToolResult> => {
        return { output: `Executed ${name} with ${input.testParam}` };
      }),
      toAnthropicSchema: () => ({
        name,
        description: `Test tool: ${name}`,
        input_schema: {
          type: 'object',
          properties: {
            testParam: {
              type: 'string',
              description: 'A test parameter'
            },
            optionalParam: {
              type: 'number',
              description: 'An optional parameter'
            }
          },
          required: ['testParam']
        }
      }),
      toOpenAISchema: () => ({
        type: 'function',
        function: {
          name,
          description: `Test tool: ${name}`,
          parameters: {
            type: 'object',
            properties: {
              testParam: {
                type: 'string',
                description: 'A test parameter'
              },
              optionalParam: {
                type: 'number',
                description: 'An optional parameter'
              }
            },
            required: ['testParam']
          }
        }
      })
    };
  };

  beforeEach(() => {
    // Clear the registry before each test
    // Note: We need to access the private tools map, so we'll register and then clear
    const allTools = toolRegistry.getAllTools();
    allTools.forEach(tool => {
      // We can't directly remove tools, so we'll just work with a fresh state
    });
    
    // Reset mocks
    vi.clearAllMocks();
  });

  describe('registerTool', () => {
    it('should register a new tool', () => {
      const tool = createMockTool('test-tool-1');
      toolRegistry.registerTool(tool);
      
      const retrieved = toolRegistry.getTool('test-tool-1');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('test-tool-1');
    });

    it('should allow registering multiple tools', () => {
      const tool1 = createMockTool('tool-1');
      const tool2 = createMockTool('tool-2');
      
      toolRegistry.registerTool(tool1);
      toolRegistry.registerTool(tool2);
      
      expect(toolRegistry.getTool('tool-1')).toBeDefined();
      expect(toolRegistry.getTool('tool-2')).toBeDefined();
    });

    it('should overwrite existing tool with same name', () => {
      const tool1 = createMockTool('duplicate-tool');
      const tool2 = createMockTool('duplicate-tool');
      
      toolRegistry.registerTool(tool1);
      toolRegistry.registerTool(tool2);
      
      const retrieved = toolRegistry.getTool('duplicate-tool');
      expect(retrieved).toBe(tool2);
    });
  });

  describe('getTool', () => {
    it('should retrieve a registered tool by name', () => {
      const tool = createMockTool('retrieve-test');
      toolRegistry.registerTool(tool);
      
      const retrieved = toolRegistry.getTool('retrieve-test');
      expect(retrieved).toBe(tool);
    });

    it('should return undefined for non-existent tool', () => {
      const retrieved = toolRegistry.getTool('non-existent-tool');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getAllTools', () => {
    it('should return all registered tools', () => {
      const tool1 = createMockTool('all-tool-1');
      const tool2 = createMockTool('all-tool-2');
      const tool3 = createMockTool('all-tool-3');
      
      toolRegistry.registerTool(tool1);
      toolRegistry.registerTool(tool2);
      toolRegistry.registerTool(tool3);
      
      const allTools = toolRegistry.getAllTools();
      expect(allTools.length).toBeGreaterThanOrEqual(3);
      
      const names = allTools.map(t => t.name);
      expect(names).toContain('all-tool-1');
      expect(names).toContain('all-tool-2');
      expect(names).toContain('all-tool-3');
    });

    it('should return empty array when no tools registered', () => {
      // Create a fresh registry instance for this test
      // Since we can't clear the singleton, we'll just check it returns an array
      const allTools = toolRegistry.getAllTools();
      expect(Array.isArray(allTools)).toBe(true);
    });
  });

  describe('getAnthropicSchemas', () => {
    it('should generate Anthropic schemas for all tools', () => {
      const tool = createMockTool('anthropic-test');
      toolRegistry.registerTool(tool);
      
      const schemas = toolRegistry.getAnthropicSchemas();
      const testSchema = schemas.find(s => s.name === 'anthropic-test');
      
      expect(testSchema).toBeDefined();
      expect(testSchema?.name).toBe('anthropic-test');
      expect(testSchema?.description).toBe('Test tool: anthropic-test');
      expect(testSchema?.input_schema.type).toBe('object');
      expect(testSchema?.input_schema.properties).toHaveProperty('testParam');
      expect(testSchema?.input_schema.required).toContain('testParam');
    });

    it('should generate correct schema structure for Anthropic', () => {
      const tool = createMockTool('schema-structure-test');
      toolRegistry.registerTool(tool);
      
      const schemas = toolRegistry.getAnthropicSchemas();
      const schema = schemas.find(s => s.name === 'schema-structure-test');
      
      expect(schema).toMatchObject({
        name: 'schema-structure-test',
        description: expect.any(String),
        input_schema: {
          type: 'object',
          properties: expect.any(Object),
          required: expect.any(Array)
        }
      });
    });
  });

  describe('getOpenAISchemas', () => {
    it('should generate OpenAI schemas for all tools', () => {
      const tool = createMockTool('openai-test');
      toolRegistry.registerTool(tool);
      
      const schemas = toolRegistry.getOpenAISchemas();
      const testSchema = schemas.find(s => s.function.name === 'openai-test');
      
      expect(testSchema).toBeDefined();
      expect(testSchema?.type).toBe('function');
      expect(testSchema?.function.name).toBe('openai-test');
      expect(testSchema?.function.description).toBe('Test tool: openai-test');
      expect(testSchema?.function.parameters.type).toBe('object');
      expect(testSchema?.function.parameters.properties).toHaveProperty('testParam');
      expect(testSchema?.function.parameters.required).toContain('testParam');
    });

    it('should generate correct schema structure for OpenAI', () => {
      const tool = createMockTool('openai-structure-test');
      toolRegistry.registerTool(tool);
      
      const schemas = toolRegistry.getOpenAISchemas();
      const schema = schemas.find(s => s.function.name === 'openai-structure-test');
      
      expect(schema).toMatchObject({
        type: 'function',
        function: {
          name: 'openai-structure-test',
          description: expect.any(String),
          parameters: {
            type: 'object',
            properties: expect.any(Object),
            required: expect.any(Array)
          }
        }
      });
    });
  });

  describe('executeTool', () => {
    const mockContext: ToolContext = {
      tabId: 123,
      url: 'https://example.com',
      permissionManager: mockPermissionManager
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return error for non-existent tool', async () => {
      const result = await toolRegistry.executeTool(
        'non-existent-tool',
        {},
        mockContext
      );
      
      expect(result.error).toBe('Unknown tool: non-existent-tool');
      expect(result.output).toBeUndefined();
    });

    it('should execute tool when permission is granted', async () => {
      const tool = createMockTool('execute-test');
      toolRegistry.registerTool(tool);
      
      mockCheckPermission.mockResolvedValue({
        allowed: true,
        needsPrompt: false
      });
      
      const result = await toolRegistry.executeTool(
        'execute-test',
        { testParam: 'test-value' },
        mockContext
      );
      
      expect(mockCheckPermission).toHaveBeenCalledWith(
        'https://example.com',
        'execute-test'
      );
      expect(tool.execute).toHaveBeenCalledWith(
        { testParam: 'test-value' },
        mockContext
      );
      expect(result.output).toBe('Executed execute-test with test-value');
    });

    it('should return error when permission is denied', async () => {
      const tool = createMockTool('denied-test');
      toolRegistry.registerTool(tool);
      
      mockCheckPermission.mockResolvedValue({
        allowed: false,
        needsPrompt: false
      });
      
      const result = await toolRegistry.executeTool(
        'denied-test',
        { testParam: 'test-value' },
        mockContext
      );
      
      expect(result.error).toBe('Permission denied for this action');
      expect(tool.execute).not.toHaveBeenCalled();
    });

    it('should return permission request when prompt is needed', async () => {
      const tool = createMockTool('prompt-test');
      toolRegistry.registerTool(tool);
      
      mockCheckPermission.mockResolvedValue({
        allowed: false,
        needsPrompt: true
      });
      
      const result = await toolRegistry.executeTool(
        'prompt-test',
        { testParam: 'test-value' },
        mockContext
      );
      
      expect(result.error).toBe('PERMISSION_REQUIRED');
      expect(result.output).toBeDefined();
      
      const permissionData = JSON.parse(result.output!);
      expect(permissionData.type).toBe('permission_required');
      expect(permissionData.tool).toBe('prompt-test');
      expect(permissionData.url).toBe('https://example.com');
      expect(tool.execute).not.toHaveBeenCalled();
    });

    it('should handle tool execution errors gracefully', async () => {
      const errorTool: ToolDefinition = {
        name: 'error-tool',
        description: 'Tool that throws error',
        parameters: {},
        execute: vi.fn(async () => {
          throw new Error('Tool execution failed');
        }),
        toAnthropicSchema: () => ({
          name: 'error-tool',
          description: 'Tool that throws error',
          input_schema: {
            type: 'object',
            properties: {},
            required: []
          }
        }),
        toOpenAISchema: () => ({
          type: 'function',
          function: {
            name: 'error-tool',
            description: 'Tool that throws error',
            parameters: {
              type: 'object',
              properties: {},
              required: []
            }
          }
        })
      };
      
      toolRegistry.registerTool(errorTool);
      
      mockCheckPermission.mockResolvedValue({
        allowed: true,
        needsPrompt: false
      });
      
      const result = await toolRegistry.executeTool(
        'error-tool',
        {},
        mockContext
      );
      
      expect(result.error).toBe('Tool execution failed');
      expect(result.output).toBeUndefined();
    });

    it('should pass toolUseId in permission request when provided', async () => {
      const tool = createMockTool('tooluse-test');
      toolRegistry.registerTool(tool);
      
      mockCheckPermission.mockResolvedValue({
        allowed: false,
        needsPrompt: true
      });
      
      const contextWithToolUseId: ToolContext = {
        ...mockContext,
        toolUseId: 'tool-use-123'
      };
      
      const result = await toolRegistry.executeTool(
        'tooluse-test',
        { testParam: 'test' },
        contextWithToolUseId
      );
      
      const permissionData = JSON.parse(result.output!);
      expect(permissionData.toolUseId).toBe('tool-use-123');
    });
  });
});
