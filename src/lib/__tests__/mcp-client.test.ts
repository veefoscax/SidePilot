/**
 * Tests for MCP Client Implementation
 * 
 * Validates: Requirements AC2 (Tool Naming), AC3 (Tool Execution)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MCPClient } from '../mcp-client';

// =============================================================================
// Mock Setup
// =============================================================================

// Mock fetch globally
const mockFetch = vi.fn();
(globalThis as unknown as { fetch: typeof fetch }).fetch = mockFetch;

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;

  private messageQueue: string[] = [];

  constructor(public url: string) {
    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.();
    }, 10);
  }

  send(data: string): void {
    this.messageQueue.push(data);
  }

  close(_code?: number, _reason?: string): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }

  // Test helper to simulate receiving a message
  simulateMessage(data: string): void {
    this.onmessage?.({ data });
  }

  // Test helper to get sent messages
  getSentMessages(): string[] {
    return this.messageQueue;
  }

  // Test helper to simulate error
  simulateError(): void {
    this.onerror?.();
  }
}

// Store WebSocket instances for testing
let mockWebSocketInstances: MockWebSocket[] = [];

// @ts-expect-error - Mocking WebSocket
global.WebSocket = class extends MockWebSocket {
  constructor(url: string) {
    super(url);
    mockWebSocketInstances.push(this);
  }
};

// =============================================================================
// Test Helpers
// =============================================================================

function createMockResponse(data: unknown, status = 200, statusText = 'OK'): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers(),
    redirected: false,
    type: 'basic',
    url: '',
    clone: () => createMockResponse(data, status, statusText),
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
  } as Response;
}

function createMockTools() {
  return [
    {
      name: 'read_file',
      description: 'Reads a file from the filesystem',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path' }
        },
        required: ['path']
      }
    },
    {
      name: 'write_file',
      description: 'Writes content to a file',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          content: { type: 'string' }
        },
        required: ['path', 'content']
      }
    }
  ];
}

// =============================================================================
// Tests
// =============================================================================

describe('MCPClient', () => {
  let client: MCPClient;

  beforeEach(() => {
    client = new MCPClient();
    mockFetch.mockReset();
    mockWebSocketInstances = [];
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should create client with default config', () => {
      const client = new MCPClient();
      expect(client).toBeDefined();
    });

    it('should accept custom config', () => {
      const client = new MCPClient({
        timeout: 5000,
        maxReconnectAttempts: 3,
        baseReconnectDelay: 500,
        maxReconnectDelay: 10000
      });
      expect(client).toBeDefined();
    });
  });

  describe('connect - HTTP', () => {
    it('should connect to HTTP server and discover tools', async () => {
      const tools = createMockTools();
      mockFetch.mockResolvedValueOnce(createMockResponse({ tools }));

      const result = await client.connect('http://localhost:3000');

      expect(result.success).toBe(true);
      expect(result.status).toBe('connected');
      expect(result.tools).toHaveLength(2);
      expect(result.tools?.[0].name).toBe('read_file');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/tools/list',
        expect.objectContaining({
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        })
      );
    });

    it('should connect to HTTPS server', async () => {
      const tools = createMockTools();
      mockFetch.mockResolvedValueOnce(createMockResponse({ tools }));

      const result = await client.connect('https://api.example.com/mcp');

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/mcp/tools/list',
        expect.any(Object)
      );
    });

    it('should handle tools array directly in response', async () => {
      const tools = createMockTools();
      mockFetch.mockResolvedValueOnce(createMockResponse(tools));

      const result = await client.connect('http://localhost:3000');

      expect(result.success).toBe(true);
      expect(result.tools).toHaveLength(2);
    });

    it('should handle tools in result field', async () => {
      const tools = createMockTools();
      mockFetch.mockResolvedValueOnce(createMockResponse({ result: tools }));

      const result = await client.connect('http://localhost:3000');

      expect(result.success).toBe(true);
      expect(result.tools).toHaveLength(2);
    });

    it('should handle HTTP error response', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}, 500, 'Internal Server Error'));

      const result = await client.connect('http://localhost:3000');

      expect(result.success).toBe(false);
      expect(result.status).toBe('error');
      expect(result.error).toContain('500');
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await client.connect('http://localhost:3000');

      expect(result.success).toBe(false);
      expect(result.status).toBe('error');
      expect(result.error).toBe('Network error');
    });

    it('should reject invalid URLs', async () => {
      const result = await client.connect('not-a-valid-url');

      expect(result.success).toBe(false);
      expect(result.status).toBe('error');
      expect(result.error).toContain('Invalid MCP server URL');
    });

    it('should reject unsupported protocols', async () => {
      const result = await client.connect('ftp://example.com');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid MCP server URL');
    });

    it('should filter out tools without names', async () => {
      const tools = [
        { name: 'valid_tool', description: 'A valid tool', inputSchema: {} },
        { name: '', description: 'Invalid tool', inputSchema: {} },
        { description: 'No name tool', inputSchema: {} }
      ];
      mockFetch.mockResolvedValueOnce(createMockResponse({ tools }));

      const result = await client.connect('http://localhost:3000');

      expect(result.success).toBe(true);
      expect(result.tools).toHaveLength(1);
      expect(result.tools?.[0].name).toBe('valid_tool');
    });
  });

  describe('callTool - HTTP', () => {
    it('should execute tool via HTTP POST', async () => {
      const toolResult = { result: { data: 'File contents here' } };
      mockFetch.mockResolvedValueOnce(createMockResponse(toolResult));

      const result = await client.callTool(
        'http://localhost:3000',
        'read_file',
        { path: '/tmp/test.txt' }
      );

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ data: 'File contents here' });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/tools/call',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name: 'read_file',
            arguments: { path: '/tmp/test.txt' }
          })
        })
      );
    });

    it('should handle tool result in result field', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ result: { data: 'test' } }));

      const result = await client.callTool('http://localhost:3000', 'test_tool', {});

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ data: 'test' });
    });

    it('should handle tool result in content field', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ content: 'test content' }));

      const result = await client.callTool('http://localhost:3000', 'test_tool', {});

      expect(result.success).toBe(true);
      expect(result.result).toBe('test content');
    });

    it('should handle tool execution error in response', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ 
        error: { message: 'File not found' } 
      }));

      const result = await client.callTool('http://localhost:3000', 'read_file', { path: '/nonexistent' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('File not found');
    });

    it('should handle string error in response', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ error: 'Permission denied' }));

      const result = await client.callTool('http://localhost:3000', 'read_file', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');
    });

    it('should handle HTTP error status', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}, 404, 'Not Found'));

      const result = await client.callTool('http://localhost:3000', 'unknown_tool', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('404');
    });

    it('should handle network error during tool call', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await client.callTool('http://localhost:3000', 'test_tool', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection refused');
    });

    it('should reject invalid URL for tool call', async () => {
      const result = await client.callTool('invalid-url', 'test_tool', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid MCP server URL');
    });

    it('should handle empty input', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ result: 'ok' }));

      const result = await client.callTool('http://localhost:3000', 'no_args_tool', {});

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ name: 'no_args_tool', arguments: {} })
        })
      );
    });
  });

  describe('disconnect', () => {
    it('should handle disconnect when not connected', () => {
      // Should not throw
      expect(() => client.disconnect('http://localhost:3000')).not.toThrow();
    });
  });

  describe('isConnected', () => {
    it('should return false for HTTP connections', () => {
      // HTTP connections are stateless, so isConnected always returns false
      expect(client.isConnected('http://localhost:3000')).toBe(false);
    });
  });

  describe('reconnect', () => {
    it('should attempt reconnection with exponential backoff', async () => {
      const tools = createMockTools();
      
      // First attempt fails
      mockFetch.mockResolvedValueOnce(createMockResponse({}, 500, 'Server Error'));
      
      const result1 = await client.reconnect('http://localhost:3000');
      expect(result1.success).toBe(false);

      // Second attempt succeeds after delay
      mockFetch.mockResolvedValueOnce(createMockResponse({ tools }));
      
      const reconnectPromise = client.reconnect('http://localhost:3000');
      
      // Advance timers to trigger the reconnect delay
      await vi.advanceTimersByTimeAsync(2000);
      
      const result2 = await reconnectPromise;
      expect(result2.success).toBe(true);
    });

    it('should fail after max reconnection attempts', async () => {
      const clientWithLowMax = new MCPClient({ maxReconnectAttempts: 2 });
      
      // All attempts fail
      mockFetch.mockResolvedValue(createMockResponse({}, 500, 'Server Error'));

      // First attempt
      await clientWithLowMax.reconnect('http://localhost:3000');
      await vi.advanceTimersByTimeAsync(1000);
      
      // Second attempt
      await clientWithLowMax.reconnect('http://localhost:3000');
      await vi.advanceTimersByTimeAsync(2000);

      // Third attempt should fail immediately
      const result = await clientWithLowMax.reconnect('http://localhost:3000');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Max reconnection attempts');
    });

    it('should reset attempts on successful connection', async () => {
      const tools = createMockTools();
      
      // First attempt fails
      mockFetch.mockResolvedValueOnce(createMockResponse({}, 500, 'Server Error'));
      await client.reconnect('http://localhost:3000');
      await vi.advanceTimersByTimeAsync(1000);

      // Second attempt succeeds
      mockFetch.mockResolvedValueOnce(createMockResponse({ tools }));
      const reconnectPromise = client.reconnect('http://localhost:3000');
      await vi.advanceTimersByTimeAsync(2000);
      const result = await reconnectPromise;
      
      expect(result.success).toBe(true);

      // Next reconnect should start fresh (no delay for first attempt)
      mockFetch.mockResolvedValueOnce(createMockResponse({}, 500, 'Server Error'));
      const result2Promise = client.reconnect('http://localhost:3000');
      await vi.advanceTimersByTimeAsync(1000);
      const result2 = await result2Promise;
      
      // Should have attempted (not immediately failed due to max attempts)
      expect(result2.success).toBe(false);
      expect(result2.error).not.toContain('Max reconnection attempts');
    });
  });

  describe('resetReconnectAttempts', () => {
    it('should reset the reconnection counter', async () => {
      const clientWithLowMax = new MCPClient({ maxReconnectAttempts: 1 });
      
      mockFetch.mockResolvedValue(createMockResponse({}, 500, 'Server Error'));

      // First attempt
      await clientWithLowMax.reconnect('http://localhost:3000');
      await vi.advanceTimersByTimeAsync(1000);

      // Second attempt should fail due to max attempts
      const result1 = await clientWithLowMax.reconnect('http://localhost:3000');
      expect(result1.error).toContain('Max reconnection attempts');

      // Reset attempts
      clientWithLowMax.resetReconnectAttempts('http://localhost:3000');

      // Should be able to attempt again
      const result2Promise = clientWithLowMax.reconnect('http://localhost:3000');
      await vi.advanceTimersByTimeAsync(1000);
      const result2 = await result2Promise;
      
      expect(result2.error).not.toContain('Max reconnection attempts');
    });
  });

  describe('URL building', () => {
    it('should correctly append path to base URL', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ tools: [] }));

      await client.connect('http://localhost:3000/api/v1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/tools/list',
        expect.any(Object)
      );
    });

    it('should handle trailing slash in base URL', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ tools: [] }));

      await client.connect('http://localhost:3000/api/');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/tools/list',
        expect.any(Object)
      );
    });
  });
});

describe('MCPClient - WebSocket', () => {
  let client: MCPClient;

  beforeEach(() => {
    client = new MCPClient({ timeout: 5000 });
    mockWebSocketInstances = [];
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('connect - WebSocket', () => {
    it('should connect to WebSocket server', async () => {
      const connectPromise = client.connect('ws://localhost:3000');
      
      // Wait for WebSocket to "connect"
      await vi.advanceTimersByTimeAsync(20);
      
      // Simulate tools/list response
      const ws = mockWebSocketInstances[0];
      const sentMessages = ws.getSentMessages();
      
      if (sentMessages.length > 0) {
        const request = JSON.parse(sentMessages[0]);
        ws.simulateMessage(JSON.stringify({
          jsonrpc: '2.0',
          id: request.id,
          result: createMockTools()
        }));
      }

      const result = await connectPromise;
      
      expect(result.success).toBe(true);
      expect(result.status).toBe('connected');
    });

    it('should handle WebSocket connection error', async () => {
      const connectPromise = client.connect('ws://localhost:3000');
      
      // Simulate connection error
      await vi.advanceTimersByTimeAsync(5);
      const ws = mockWebSocketInstances[0];
      ws.simulateError();

      const result = await connectPromise;
      
      expect(result.success).toBe(false);
      expect(result.status).toBe('error');
      expect(result.error).toContain('WebSocket connection error');
    });

    it('should accept wss:// protocol', async () => {
      const connectPromise = client.connect('wss://secure.example.com');
      
      await vi.advanceTimersByTimeAsync(20);
      
      const ws = mockWebSocketInstances[0];
      expect(ws.url).toBe('wss://secure.example.com');
      
      // Complete the connection
      const sentMessages = ws.getSentMessages();
      if (sentMessages.length > 0) {
        const request = JSON.parse(sentMessages[0]);
        ws.simulateMessage(JSON.stringify({
          jsonrpc: '2.0',
          id: request.id,
          result: []
        }));
      }

      const result = await connectPromise;
      expect(result.success).toBe(true);
    });
  });

  describe('isConnected - WebSocket', () => {
    it('should return true when WebSocket is connected', async () => {
      const connectPromise = client.connect('ws://localhost:3000');
      
      await vi.advanceTimersByTimeAsync(20);
      
      const ws = mockWebSocketInstances[0];
      const sentMessages = ws.getSentMessages();
      if (sentMessages.length > 0) {
        const request = JSON.parse(sentMessages[0]);
        ws.simulateMessage(JSON.stringify({
          jsonrpc: '2.0',
          id: request.id,
          result: []
        }));
      }

      await connectPromise;
      
      expect(client.isConnected('ws://localhost:3000')).toBe(true);
    });
  });

  describe('disconnect - WebSocket', () => {
    it('should close WebSocket connection', async () => {
      const connectPromise = client.connect('ws://localhost:3000');
      
      await vi.advanceTimersByTimeAsync(20);
      
      const ws = mockWebSocketInstances[0];
      const sentMessages = ws.getSentMessages();
      if (sentMessages.length > 0) {
        const request = JSON.parse(sentMessages[0]);
        ws.simulateMessage(JSON.stringify({
          jsonrpc: '2.0',
          id: request.id,
          result: []
        }));
      }

      await connectPromise;
      
      client.disconnect('ws://localhost:3000');
      
      expect(ws.readyState).toBe(MockWebSocket.CLOSED);
      expect(client.isConnected('ws://localhost:3000')).toBe(false);
    });
  });
});

describe('mcpClient singleton', () => {
  it('should export a default client instance', async () => {
    const { mcpClient } = await import('../mcp-client');
    expect(mcpClient).toBeInstanceOf(MCPClient);
  });
});
