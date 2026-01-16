/**
 * Integration Tests for MCP Connector Communication Layer
 * 
 * Tests the MCP protocol message handling:
 * - initialize method
 * - tools/list method
 * - tools/call method
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the modules
vi.mock('@/tools/registry', () => {
  const createMockTool = (name) => ({
    name,
    description: 'Mock ' + name + ' tool',
    parameters: {
      action: { type: 'string', description: 'Action to perform', required: true },
    },
    execute: vi.fn(() => Promise.resolve({ output: name + ' executed' })),
    toAnthropicSchema: () => ({
      name,
      description: 'Mock ' + name + ' tool',
      input_schema: {
        type: 'object',
        properties: { action: { type: 'string', description: 'Action to perform' } },
        required: ['action'],
      },
    }),
    toOpenAISchema: () => ({
      type: 'function',
      function: {
        name,
        description: 'Mock ' + name + ' tool',
        parameters: {
          type: 'object',
          properties: { action: { type: 'string', description: 'Action to perform' } },
          required: ['action'],
        },
      },
    }),
  });

  const mockTools = [
    createMockTool('navigation'),
    createMockTool('computer'),
  ];

  return {
    toolRegistry: {
      getAllTools: () => mockTools,
      getTool: (name) => mockTools.find(t => t.name === name),
      executeTool: vi.fn((name) => {
        return Promise.resolve({ output: name + ' executed' });
      }),
    },
  };
});

vi.mock('@/lib/permissions', () => ({
  PermissionManager: {
    getInstance: () => ({
      checkPermission: vi.fn(() => Promise.resolve({ allowed: true, needsPrompt: false })),
    }),
  },
}));

import { MCPConnector } from '../mcp-connector';

const mockStorage = {};

const setupMocks = () => {
  Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
  
  (chrome.storage.local.get).mockImplementation((key) => {
    if (typeof key === 'string') {
      return Promise.resolve({ [key]: mockStorage[key] });
    }
    return Promise.resolve({});
  });
  
  (chrome.storage.local.set).mockImplementation((data) => {
    Object.assign(mockStorage, data);
    return Promise.resolve();
  });
  
  (chrome.tabs.query).mockResolvedValue([
    { id: 123, url: 'https://example.com' }
  ]);
};

describe('MCP Connector Communication Layer', () => {
  beforeEach(() => {
    MCPConnector.resetInstance();
    setupMocks();
  });

  afterEach(() => {
    MCPConnector.resetInstance();
  });

  describe('handleMessage - initialize', () => {
    it('should return server info on initialize', async () => {
      const connector = MCPConnector.getInstance();
      await connector.initialize();
      
      const response = await connector.handleMessage({
        id: 1,
        method: 'initialize',
        params: {}
      });
      
      expect(response.id).toBe(1);
      expect(response.result).toBeDefined();
      expect(response.result.serverInfo.name).toBe('sidepilot-mcp-connector');
      expect(response.result.capabilities.tools).toBeDefined();
    });
  });

  describe('handleMessage - tools/list', () => {
    it('should return tools list', async () => {
      const connector = MCPConnector.getInstance();
      await connector.initialize();
      await connector.setEnabled(true);
      await connector.setExposedTools(['navigation']);
      
      const response = await connector.handleMessage({
        id: 2,
        method: 'tools/list',
        params: {}
      });
      
      expect(response.id).toBe(2);
      expect(response.result).toBeDefined();
      expect(response.result.tools).toHaveLength(1);
      expect(response.result.tools[0].name).toBe('navigation');
    });

    it('should return empty list when no tools exposed', async () => {
      const connector = MCPConnector.getInstance();
      await connector.initialize();
      await connector.setEnabled(true);
      
      const response = await connector.handleMessage({
        id: 2,
        method: 'tools/list',
        params: {}
      });
      
      expect(response.result.tools).toEqual([]);
    });
  });

  describe('handleMessage - tools/call', () => {
    it('should execute tool with valid auth', async () => {
      const connector = MCPConnector.getInstance();
      await connector.initialize();
      await connector.setEnabled(true);
      await connector.setExposedTools(['navigation']);
      
      const config = connector.getConfig();
      const response = await connector.handleMessage({
        id: 3,
        method: 'tools/call',
        params: {
          name: 'navigation',
          arguments: { action: 'goto', url: 'https://test.com' },
          authToken: config.authToken
        }
      });
      
      expect(response.id).toBe(3);
      expect(response.result).toBeDefined();
      expect(response.result.content).toBeDefined();
      expect(response.result.isError).toBe(false);
    });

    it('should reject without auth token', async () => {
      const connector = MCPConnector.getInstance();
      await connector.initialize();
      await connector.setEnabled(true);
      await connector.setExposedTools(['navigation']);
      
      const response = await connector.handleMessage({
        id: 3,
        method: 'tools/call',
        params: {
          name: 'navigation',
          arguments: { action: 'goto' }
        }
      });
      
      expect(response.error).toBeDefined();
      expect(response.error.code).toBe(-32001);
      expect(response.error.message).toContain('authentication');
    });

    it('should reject with invalid auth token', async () => {
      const connector = MCPConnector.getInstance();
      await connector.initialize();
      await connector.setEnabled(true);
      await connector.setExposedTools(['navigation']);
      
      const response = await connector.handleMessage({
        id: 3,
        method: 'tools/call',
        params: {
          name: 'navigation',
          arguments: { action: 'goto' },
          authToken: 'invalid'
        }
      });
      
      expect(response.error).toBeDefined();
      expect(response.error.code).toBe(-32001);
    });

    it('should reject when connector disabled', async () => {
      const connector = MCPConnector.getInstance();
      await connector.initialize();
      // Not enabled
      
      const config = connector.getConfig();
      const response = await connector.handleMessage({
        id: 3,
        method: 'tools/call',
        params: {
          name: 'navigation',
          arguments: { action: 'goto' },
          authToken: config.authToken
        }
      });
      
      expect(response.error).toBeDefined();
      expect(response.error.code).toBe(-32002);
      expect(response.error.message).toContain('not enabled');
    });
  });

  describe('handleMessage - error handling', () => {
    it('should return error for unknown method', async () => {
      const connector = MCPConnector.getInstance();
      await connector.initialize();
      await connector.setEnabled(true);
      
      const response = await connector.handleMessage({
        id: 4,
        method: 'unknown/method',
        params: {}
      });
      
      expect(response.error).toBeDefined();
      expect(response.error.code).toBe(-32601);
      expect(response.error.message).toContain('Method not found');
    });

    it('should return error for invalid message', async () => {
      const connector = MCPConnector.getInstance();
      await connector.initialize();
      
      const response = await connector.handleMessage(null as any);
      
      expect(response.error).toBeDefined();
      expect(response.error.code).toBe(-32600);
    });

    it('should return error for missing tool name', async () => {
      const connector = MCPConnector.getInstance();
      await connector.initialize();
      await connector.setEnabled(true);
      
      const config = connector.getConfig();
      const response = await connector.handleMessage({
        id: 5,
        method: 'tools/call',
        params: {
          authToken: config.authToken
          // Missing name
        }
      });
      
      expect(response.error).toBeDefined();
      expect(response.error.code).toBe(-32602);
    });
  });
});
