/**
 * Tests for MCP Types and Utilities
 * 
 * Validates: Requirements AC1 (Register Server), AC2 (Tool Naming)
 */

import { describe, it, expect } from 'vitest';
import {
  MCP_TOOL_PATTERN,
  MCP_TOOL_PREFIX,
  formatMcpToolName,
  parseMcpToolName,
  isMcpTool,
  generateMcpServerUuid,
  isValidMcpServerUrl,
  createMcpServer,
  type MCPServer,
  type MCPTool,
  type ParsedMcpToolName
} from '../mcp';

describe('MCP Tool Naming Utilities', () => {
  const testUuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  const testToolName = 'read_file';
  const expectedFullName = `mcp__${testUuid}__${testToolName}`;

  describe('formatMcpToolName', () => {
    it('should format tool name with MCP prefix and UUID', () => {
      const result = formatMcpToolName(testUuid, testToolName);
      expect(result).toBe(expectedFullName);
    });

    it('should handle tool names with underscores', () => {
      const result = formatMcpToolName(testUuid, 'read_file_contents');
      expect(result).toBe(`mcp__${testUuid}__read_file_contents`);
    });

    it('should handle tool names with hyphens', () => {
      const result = formatMcpToolName(testUuid, 'read-file');
      expect(result).toBe(`mcp__${testUuid}__read-file`);
    });

    it('should handle empty tool name', () => {
      const result = formatMcpToolName(testUuid, '');
      expect(result).toBe(`mcp__${testUuid}__`);
    });
  });

  describe('parseMcpToolName', () => {
    it('should parse valid MCP tool name', () => {
      const result = parseMcpToolName(expectedFullName);
      expect(result).toEqual({
        uuid: testUuid,
        name: testToolName
      });
    });

    it('should return null for non-MCP tool names', () => {
      expect(parseMcpToolName('browser_click')).toBeNull();
      expect(parseMcpToolName('navigate')).toBeNull();
      expect(parseMcpToolName('')).toBeNull();
    });

    it('should return null for malformed MCP tool names', () => {
      expect(parseMcpToolName('mcp__invalid')).toBeNull();
      expect(parseMcpToolName('mcp____toolname')).toBeNull();
      expect(parseMcpToolName('mcp__not-a-uuid__tool')).toBeNull();
    });

    it('should handle tool names with multiple underscores', () => {
      const fullName = `mcp__${testUuid}__read_file_contents`;
      const result = parseMcpToolName(fullName);
      expect(result).toEqual({
        uuid: testUuid,
        name: 'read_file_contents'
      });
    });

    it('should handle tool names with special characters', () => {
      const fullName = `mcp__${testUuid}__tool-with-hyphens`;
      const result = parseMcpToolName(fullName);
      expect(result).toEqual({
        uuid: testUuid,
        name: 'tool-with-hyphens'
      });
    });
  });

  describe('isMcpTool', () => {
    it('should return true for valid MCP tool names', () => {
      expect(isMcpTool(expectedFullName)).toBe(true);
      expect(isMcpTool(`mcp__${testUuid}__another_tool`)).toBe(true);
    });

    it('should return false for non-MCP tool names', () => {
      expect(isMcpTool('browser_click')).toBe(false);
      expect(isMcpTool('navigate')).toBe(false);
      expect(isMcpTool('')).toBe(false);
      expect(isMcpTool('mcp_single_underscore')).toBe(false);
    });

    it('should return false for malformed MCP tool names', () => {
      expect(isMcpTool('mcp__invalid')).toBe(false);
      expect(isMcpTool('mcp____toolname')).toBe(false);
    });
  });

  describe('MCP_TOOL_PATTERN', () => {
    it('should match valid MCP tool names', () => {
      expect(MCP_TOOL_PATTERN.test(expectedFullName)).toBe(true);
    });

    it('should capture UUID and tool name groups', () => {
      const match = expectedFullName.match(MCP_TOOL_PATTERN);
      expect(match).not.toBeNull();
      expect(match![1]).toBe(testUuid);
      expect(match![2]).toBe(testToolName);
    });
  });

  describe('MCP_TOOL_PREFIX', () => {
    it('should be the correct prefix', () => {
      expect(MCP_TOOL_PREFIX).toBe('mcp__');
    });
  });
});

describe('MCP Server Utilities', () => {
  describe('generateMcpServerUuid', () => {
    it('should generate a valid UUID format', () => {
      const uuid = generateMcpServerUuid();
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidPattern);
    });

    it('should generate unique UUIDs', () => {
      const uuids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        uuids.add(generateMcpServerUuid());
      }
      expect(uuids.size).toBe(100);
    });
  });

  describe('isValidMcpServerUrl', () => {
    it('should accept http URLs', () => {
      expect(isValidMcpServerUrl('http://localhost:3000')).toBe(true);
      expect(isValidMcpServerUrl('http://example.com/mcp')).toBe(true);
    });

    it('should accept https URLs', () => {
      expect(isValidMcpServerUrl('https://api.example.com')).toBe(true);
      expect(isValidMcpServerUrl('https://localhost:8443/mcp')).toBe(true);
    });

    it('should accept ws URLs', () => {
      expect(isValidMcpServerUrl('ws://localhost:3000')).toBe(true);
      expect(isValidMcpServerUrl('ws://example.com/ws')).toBe(true);
    });

    it('should accept wss URLs', () => {
      expect(isValidMcpServerUrl('wss://api.example.com')).toBe(true);
      expect(isValidMcpServerUrl('wss://localhost:8443/ws')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidMcpServerUrl('')).toBe(false);
      expect(isValidMcpServerUrl('not-a-url')).toBe(false);
      expect(isValidMcpServerUrl('ftp://example.com')).toBe(false);
      expect(isValidMcpServerUrl('file:///path/to/file')).toBe(false);
    });
  });

  describe('createMcpServer', () => {
    it('should create a server with correct properties', () => {
      const server = createMcpServer('http://localhost:3000', 'Test Server');
      
      expect(server.url).toBe('http://localhost:3000');
      expect(server.name).toBe('Test Server');
      expect(server.status).toBe('disconnected');
      expect(server.uuid).toBeDefined();
      expect(server.lastConnected).toBeUndefined();
      expect(server.errorMessage).toBeUndefined();
    });

    it('should generate unique UUIDs for each server', () => {
      const server1 = createMcpServer('http://localhost:3000', 'Server 1');
      const server2 = createMcpServer('http://localhost:3001', 'Server 2');
      
      expect(server1.uuid).not.toBe(server2.uuid);
    });
  });
});

describe('MCP Types', () => {
  describe('MCPServer interface', () => {
    it('should allow creating a valid MCPServer object', () => {
      const server: MCPServer = {
        uuid: 'test-uuid-1234',
        name: 'Test Server',
        url: 'http://localhost:3000',
        status: 'connected',
        lastConnected: Date.now()
      };
      
      expect(server.uuid).toBe('test-uuid-1234');
      expect(server.status).toBe('connected');
    });

    it('should allow all status values', () => {
      const statuses: MCPServer['status'][] = ['connected', 'disconnected', 'error'];
      
      statuses.forEach(status => {
        const server: MCPServer = {
          uuid: 'test',
          name: 'Test',
          url: 'http://localhost',
          status
        };
        expect(server.status).toBe(status);
      });
    });

    it('should allow optional errorMessage', () => {
      const server: MCPServer = {
        uuid: 'test',
        name: 'Test',
        url: 'http://localhost',
        status: 'error',
        errorMessage: 'Connection refused'
      };
      
      expect(server.errorMessage).toBe('Connection refused');
    });
  });

  describe('MCPTool interface', () => {
    it('should allow creating a valid MCPTool object', () => {
      const tool: MCPTool = {
        name: 'read_file',
        description: 'Reads a file from the filesystem',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path' }
          },
          required: ['path']
        }
      };
      
      expect(tool.name).toBe('read_file');
      expect(tool.inputSchema).toBeDefined();
    });

    it('should allow optional displayName', () => {
      const tool: MCPTool = {
        name: 'read_file',
        displayName: 'Read File',
        description: 'Reads a file',
        inputSchema: {}
      };
      
      expect(tool.displayName).toBe('Read File');
    });

    it('should allow optional alwaysApprovedKey', () => {
      const tool: MCPTool = {
        name: 'read_file',
        description: 'Reads a file',
        inputSchema: {},
        alwaysApprovedKey: 'mcp_read_file_approved'
      };
      
      expect(tool.alwaysApprovedKey).toBe('mcp_read_file_approved');
    });
  });

  describe('ParsedMcpToolName interface', () => {
    it('should have uuid and name properties', () => {
      const parsed: ParsedMcpToolName = {
        uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: 'read_file'
      };
      
      expect(parsed.uuid).toBeDefined();
      expect(parsed.name).toBeDefined();
    });
  });
});
