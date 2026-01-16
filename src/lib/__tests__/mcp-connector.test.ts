/**
 * Tests for MCP Connector Implementation
 * Validates: Requirements AC1 (Enable Connector), AC2 (Tool List)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock modules first - these are hoisted
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
    createMockTool('tabs'),
  ];

  return {
    toolRegistry: {
      getAllTools: () => mockTools,
      getTool: (name) => mockTools.find(t => t.name === name),
      executeTool: vi.fn((name) => {
        const tool = mockTools.find(t => t.name === name);
        if (!tool) return Promise.resolve({ error: 'Unknown tool: ' + name });
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

import { MCPConnector, DEFAULT_MCP_CONNECTOR_CONFIG } from '../mcp-connector';
import { toolRegistry } from '@/tools/registry';

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
  
  vi.mocked(toolRegistry.executeTool).mockClear();
  vi.mocked(toolRegistry.executeTool).mockImplementation((name) => {
    return Promise.resolve({ output: name + ' executed' });
  });
};

describe('MCPConnector', () => {
  beforeEach(() => {
    MCPConnector.resetInstance();
    setupMocks();
  });

  afterEach(() => {
    MCPConnector.resetInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = MCPConnector.getInstance();
      const instance2 = MCPConnector.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = MCPConnector.getInstance();
      MCPConnector.resetInstance();
      const instance2 = MCPConnector.getInstance();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Initialization', () => {
    it('should initialize with default config', async () => {
      const connector = MCPConnector.getInstance();
      await connector.initialize();
      
      const config = connector.getConfig();
      expect(config.enabled).toBe(false);
      expect(config.port).toBe(54321);
    });

    it('should generate auth token', async () => {
      const connector = MCPConnector.getInstance();
      await connector.initialize();
      
      const config = connector.getConfig();
      expect(config.authToken).toBeTruthy();
      expect(config.authToken.length).toBe(64);
    });

    it('should load config from storage', async () => {
      mockStorage['mcp_connector_config'] = {
        enabled: true,
        port: 12345,
        authToken: 'saved-token-123',
        exposedTools: ['navigation'],
      };
      
      const connector = MCPConnector.getInstance();
      await connector.initialize();
      
      const config = connector.getConfig();
      expect(config.enabled).toBe(true);
      expect(config.port).toBe(12345);
      expect(config.authToken).toBe('saved-token-123');
    });
  });

  describe('Configuration Management', () => {
    it('should update config', async () => {
      const connector = MCPConnector.getInstance();
      await connector.initialize();
      
      await connector.updateConfig({ enabled: true, port: 9999 });
      
      const config = connector.getConfig();
      expect(config.enabled).toBe(true);
      expect(config.port).toBe(9999);
    });

    it('should set exposed tools', async () => {
      const connector = MCPConnector.getInstance();
      await connector.initialize();
      
      await connector.setExposedTools(['navigation', 'tabs']);
      
      expect(connector.getExposedTools()).toEqual(['navigation', 'tabs']);
    });
  });

  describe('Authentication', () => {
    it('should validate correct token', async () => {
      const connector = MCPConnector.getInstance();
      await connector.initialize();
      
      const config = connector.getConfig();
      expect(connector.validateAuthToken(config.authToken)).toBe(true);
    });

    it('should reject incorrect token', async () => {
      const connector = MCPConnector.getInstance();
      await connector.initialize();
      
      expect(connector.validateAuthToken('wrong')).toBe(false);
    });

    it('should regenerate token', async () => {
      const connector = MCPConnector.getInstance();
      await connector.initialize();
      
      const oldToken = connector.getConfig().authToken;
      const newToken = await connector.regenerateAuthToken();
      
      expect(newToken).not.toBe(oldToken);
      expect(newToken.length).toBe(64);
    });
  });

  describe('handleToolsList (AC2)', () => {
    it('should return empty array when no tools exposed', async () => {
      const connector = MCPConnector.getInstance();
      await connector.initialize();
      
      const result = connector.handleToolsList();
      expect(result.tools).toEqual([]);
    });

    it('should return only exposed tools', async () => {
      const connector = MCPConnector.getInstance();
      await connector.initialize();
      await connector.setExposedTools(['navigation', 'computer']);
      
      const result = connector.handleToolsList();
      
      expect(result.tools).toHaveLength(2);
      expect(result.tools.map(t => t.name)).toContain('navigation');
      expect(result.tools.map(t => t.name)).toContain('computer');
    });

    it('should return Anthropic schema format', async () => {
      const connector = MCPConnector.getInstance();
      await connector.initialize();
      await connector.setExposedTools(['navigation']);
      
      const result = connector.handleToolsList();
      
      expect(result.tools[0]).toHaveProperty('name');
      expect(result.tools[0]).toHaveProperty('description');
      expect(result.tools[0]).toHaveProperty('input_schema');
    });
  });

  describe('handleToolCall (AC3)', () => {
    it('should reject when disabled', async () => {
      const connector = MCPConnector.getInstance();
      await connector.initialize();
      await connector.setExposedTools(['navigation']);
      
      const result = await connector.handleToolCall('navigation', { action: 'goto' });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not enabled');
    });

    it('should reject unexposed tool', async () => {
      const connector = MCPConnector.getInstance();
      await connector.initialize();
      await connector.setEnabled(true);
      await connector.setExposedTools(['navigation']);
      
      const result = await connector.handleToolCall('computer', { action: 'click' });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not exposed');
    });

    it('should execute when enabled and exposed', async () => {
      const connector = MCPConnector.getInstance();
      await connector.initialize();
      await connector.setEnabled(true);
      await connector.setExposedTools(['navigation']);
      
      const result = await connector.handleToolCall('navigation', { action: 'goto' });
      
      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
    });

    it('should return error when no active tab', async () => {
      (chrome.tabs.query).mockResolvedValueOnce([]);
      
      const connector = MCPConnector.getInstance();
      await connector.initialize();
      await connector.setEnabled(true);
      await connector.setExposedTools(['navigation']);
      
      const result = await connector.handleToolCall('navigation', { action: 'goto' });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('No active tab');
    });
  });

  describe('handleAuthenticatedToolCall (AC4)', () => {
    it('should reject missing token', async () => {
      const connector = MCPConnector.getInstance();
      await connector.initialize();
      await connector.setEnabled(true);
      await connector.setExposedTools(['navigation']);
      
      const result = await connector.handleAuthenticatedToolCall({
        name: 'navigation',
        input: { action: 'goto' },
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('authentication');
    });

    it('should reject invalid token', async () => {
      const connector = MCPConnector.getInstance();
      await connector.initialize();
      await connector.setEnabled(true);
      await connector.setExposedTools(['navigation']);
      
      const result = await connector.handleAuthenticatedToolCall({
        name: 'navigation',
        input: { action: 'goto' },
        authToken: 'invalid',
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('authentication');
    });

    it('should accept valid token', async () => {
      const connector = MCPConnector.getInstance();
      await connector.initialize();
      await connector.setEnabled(true);
      await connector.setExposedTools(['navigation']);
      
      const config = connector.getConfig();
      const result = await connector.handleAuthenticatedToolCall({
        name: 'navigation',
        input: { action: 'goto' },
        authToken: config.authToken,
      });
      
      expect(result.success).toBe(true);
    });
  });

  describe('getActiveTabContext', () => {
    it('should return context for active tab', async () => {
      const connector = MCPConnector.getInstance();
      await connector.initialize();
      
      const context = await connector.getActiveTabContext();
      
      expect(context).not.toBeNull();
      expect(context?.tabId).toBe(123);
      expect(context?.url).toBe('https://example.com');
    });

    it('should return null when no active tab', async () => {
      (chrome.tabs.query).mockResolvedValueOnce([]);
      
      const connector = MCPConnector.getInstance();
      await connector.initialize();
      
      const context = await connector.getActiveTabContext();
      
      expect(context).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors', async () => {
      (chrome.storage.local.get).mockRejectedValueOnce(new Error('Storage error'));
      
      const connector = MCPConnector.getInstance();
      await connector.initialize();
      
      const config = connector.getConfig();
      expect(config.authToken).toBeTruthy();
    });
  });
});
