/**
 * Unit tests for network tool
 * 
 * Tests filtering by URL pattern, HTTP method, and status code
 * Requirements: AC2
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { networkTool, handleNetworkEvent } from '../network';
import type { ToolContext } from '../types';

// Mock CDP wrapper
vi.mock('@/lib/cdp-wrapper', () => ({
  cdpWrapper: {
    ensureAttached: vi.fn().mockResolvedValue(undefined),
    executeCDPCommand: vi.fn().mockResolvedValue(undefined)
  }
}));

describe('Network Tool', () => {
  let mockContext: ToolContext;
  const testTabId = 1;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup mock context
    mockContext = {
      tabId: testTabId,
      url: 'https://example.com',
      permissionManager: {
        checkPermission: vi.fn().mockResolvedValue({ allowed: true, needsPrompt: false })
      } as any
    };

    // Clear network requests before each test by calling clear_requests
    // We'll populate with test data in each test
  });

  afterEach(async () => {
    // Clear requests after each test
    await networkTool.execute({ action: 'clear_requests' }, mockContext);
  });

  describe('Tool Definition', () => {
    it('should have correct name', () => {
      expect(networkTool.name).toBe('network_requests');
    });

    it('should have description', () => {
      expect(networkTool.description).toBeTruthy();
      expect(networkTool.description).toContain('network');
    });

    it('should have parameters defined', () => {
      expect(networkTool.parameters).toBeDefined();
      expect(networkTool.parameters.action).toBeDefined();
      expect(networkTool.parameters.action.enum).toContain('get_requests');
      expect(networkTool.parameters.action.enum).toContain('clear_requests');
      expect(networkTool.parameters.url_filter).toBeDefined();
      expect(networkTool.parameters.method_filter).toBeDefined();
      expect(networkTool.parameters.status_filter).toBeDefined();
    });
  });

  describe('Schema Generation', () => {
    it('should generate Anthropic schema', () => {
      const schema = networkTool.toAnthropicSchema();
      
      expect(schema.name).toBe('network_requests');
      expect(schema.description).toBeTruthy();
      expect(schema.input_schema.type).toBe('object');
      expect(schema.input_schema.properties.action).toBeDefined();
      expect(schema.input_schema.properties.url_filter).toBeDefined();
      expect(schema.input_schema.properties.method_filter).toBeDefined();
      expect(schema.input_schema.properties.status_filter).toBeDefined();
      expect(schema.input_schema.required).toContain('action');
    });

    it('should generate OpenAI schema', () => {
      const schema = networkTool.toOpenAISchema();
      
      expect(schema.type).toBe('function');
      expect(schema.function.name).toBe('network_requests');
      expect(schema.function.description).toBeTruthy();
      expect(schema.function.parameters.type).toBe('object');
      expect(schema.function.parameters.properties.action).toBeDefined();
      expect(schema.function.parameters.properties.url_filter).toBeDefined();
      expect(schema.function.parameters.properties.method_filter).toBeDefined();
      expect(schema.function.parameters.properties.status_filter).toBeDefined();
      expect(schema.function.parameters.required).toContain('action');
    });
  });

  describe('Filtering by URL Pattern (AC2)', () => {
    beforeEach(async () => {
      // Clear and populate with test data
      await networkTool.execute({ action: 'clear_requests' }, mockContext);
      
      // Add test network requests using handleNetworkEvent
      handleNetworkEvent(testTabId, 'Network.requestWillBeSent', {
        requestId: '1',
        request: { url: 'https://api.example.com/users', method: 'GET', headers: {} },
        type: 'xhr',
        timestamp: Date.now()
      });
      handleNetworkEvent(testTabId, 'Network.responseReceived', {
        requestId: '1',
        response: { status: 200, statusText: 'OK', headers: {} }
      });

      handleNetworkEvent(testTabId, 'Network.requestWillBeSent', {
        requestId: '2',
        request: { url: 'https://api.example.com/posts', method: 'POST', headers: {} },
        type: 'xhr',
        timestamp: Date.now()
      });
      handleNetworkEvent(testTabId, 'Network.responseReceived', {
        requestId: '2',
        response: { status: 201, statusText: 'Created', headers: {} }
      });

      handleNetworkEvent(testTabId, 'Network.requestWillBeSent', {
        requestId: '3',
        request: { url: 'https://cdn.example.com/image.png', method: 'GET', headers: {} },
        type: 'image',
        timestamp: Date.now()
      });
      handleNetworkEvent(testTabId, 'Network.responseReceived', {
        requestId: '3',
        response: { status: 200, statusText: 'OK', headers: {} }
      });
    });

    it('should filter requests by URL pattern (substring match)', async () => {
      const result = await networkTool.execute(
        { action: 'get_requests', url_filter: 'api' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toBeTruthy();
      
      const parsed = JSON.parse(result.output!);
      expect(parsed.count).toBe(2);
      expect(parsed.requests.every((r: any) => r.url.includes('api'))).toBe(true);
    });

    it('should filter requests by URL pattern (case insensitive)', async () => {
      const result = await networkTool.execute(
        { action: 'get_requests', url_filter: 'API' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      
      const parsed = JSON.parse(result.output!);
      expect(parsed.count).toBe(2);
    });

    it('should return empty array when no URLs match filter', async () => {
      const result = await networkTool.execute(
        { action: 'get_requests', url_filter: 'nonexistent' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      
      const parsed = JSON.parse(result.output!);
      expect(parsed.count).toBe(0);
      expect(parsed.requests).toEqual([]);
    });

    it('should return all requests when no URL filter is provided', async () => {
      const result = await networkTool.execute(
        { action: 'get_requests' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      
      const parsed = JSON.parse(result.output!);
      expect(parsed.count).toBe(3);
    });

    it('should include filter info in response', async () => {
      const result = await networkTool.execute(
        { action: 'get_requests', url_filter: 'users' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      
      const parsed = JSON.parse(result.output!);
      expect(parsed.filters_applied.url).toBe('users');
    });
  });

  describe('Filtering by HTTP Method (AC2)', () => {
    beforeEach(async () => {
      // Clear and populate with test data
      await networkTool.execute({ action: 'clear_requests' }, mockContext);
      
      // Add GET request
      handleNetworkEvent(testTabId, 'Network.requestWillBeSent', {
        requestId: '1',
        request: { url: 'https://api.example.com/users', method: 'GET', headers: {} },
        type: 'xhr',
        timestamp: Date.now()
      });
      handleNetworkEvent(testTabId, 'Network.responseReceived', {
        requestId: '1',
        response: { status: 200, statusText: 'OK', headers: {} }
      });

      // Add POST request
      handleNetworkEvent(testTabId, 'Network.requestWillBeSent', {
        requestId: '2',
        request: { url: 'https://api.example.com/users', method: 'POST', headers: {} },
        type: 'xhr',
        timestamp: Date.now()
      });
      handleNetworkEvent(testTabId, 'Network.responseReceived', {
        requestId: '2',
        response: { status: 201, statusText: 'Created', headers: {} }
      });

      // Add PUT request
      handleNetworkEvent(testTabId, 'Network.requestWillBeSent', {
        requestId: '3',
        request: { url: 'https://api.example.com/users/1', method: 'PUT', headers: {} },
        type: 'xhr',
        timestamp: Date.now()
      });
      handleNetworkEvent(testTabId, 'Network.responseReceived', {
        requestId: '3',
        response: { status: 200, statusText: 'OK', headers: {} }
      });

      // Add DELETE request
      handleNetworkEvent(testTabId, 'Network.requestWillBeSent', {
        requestId: '4',
        request: { url: 'https://api.example.com/users/1', method: 'DELETE', headers: {} },
        type: 'xhr',
        timestamp: Date.now()
      });
      handleNetworkEvent(testTabId, 'Network.responseReceived', {
        requestId: '4',
        response: { status: 204, statusText: 'No Content', headers: {} }
      });
    });

    it('should filter requests by GET method', async () => {
      const result = await networkTool.execute(
        { action: 'get_requests', method_filter: 'GET' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      
      const parsed = JSON.parse(result.output!);
      expect(parsed.count).toBe(1);
      expect(parsed.requests[0].method).toBe('GET');
    });

    it('should filter requests by POST method', async () => {
      const result = await networkTool.execute(
        { action: 'get_requests', method_filter: 'POST' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      
      const parsed = JSON.parse(result.output!);
      expect(parsed.count).toBe(1);
      expect(parsed.requests[0].method).toBe('POST');
    });

    it('should filter requests by PUT method', async () => {
      const result = await networkTool.execute(
        { action: 'get_requests', method_filter: 'PUT' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      
      const parsed = JSON.parse(result.output!);
      expect(parsed.count).toBe(1);
      expect(parsed.requests[0].method).toBe('PUT');
    });

    it('should filter requests by DELETE method', async () => {
      const result = await networkTool.execute(
        { action: 'get_requests', method_filter: 'DELETE' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      
      const parsed = JSON.parse(result.output!);
      expect(parsed.count).toBe(1);
      expect(parsed.requests[0].method).toBe('DELETE');
    });

    it('should filter by method (case insensitive)', async () => {
      const result = await networkTool.execute(
        { action: 'get_requests', method_filter: 'get' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      
      const parsed = JSON.parse(result.output!);
      expect(parsed.count).toBe(1);
      expect(parsed.requests[0].method).toBe('GET');
    });

    it('should return empty array when no methods match filter', async () => {
      const result = await networkTool.execute(
        { action: 'get_requests', method_filter: 'PATCH' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      
      const parsed = JSON.parse(result.output!);
      expect(parsed.count).toBe(0);
    });

    it('should include method filter info in response', async () => {
      const result = await networkTool.execute(
        { action: 'get_requests', method_filter: 'POST' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      
      const parsed = JSON.parse(result.output!);
      expect(parsed.filters_applied.method).toBe('POST');
    });
  });

  describe('Filtering by Status Code (AC2)', () => {
    beforeEach(async () => {
      // Clear and populate with test data
      await networkTool.execute({ action: 'clear_requests' }, mockContext);
      
      // Add 200 OK request
      handleNetworkEvent(testTabId, 'Network.requestWillBeSent', {
        requestId: '1',
        request: { url: 'https://api.example.com/success', method: 'GET', headers: {} },
        type: 'xhr',
        timestamp: Date.now()
      });
      handleNetworkEvent(testTabId, 'Network.responseReceived', {
        requestId: '1',
        response: { status: 200, statusText: 'OK', headers: {} }
      });

      // Add 201 Created request
      handleNetworkEvent(testTabId, 'Network.requestWillBeSent', {
        requestId: '2',
        request: { url: 'https://api.example.com/create', method: 'POST', headers: {} },
        type: 'xhr',
        timestamp: Date.now()
      });
      handleNetworkEvent(testTabId, 'Network.responseReceived', {
        requestId: '2',
        response: { status: 201, statusText: 'Created', headers: {} }
      });

      // Add 404 Not Found request
      handleNetworkEvent(testTabId, 'Network.requestWillBeSent', {
        requestId: '3',
        request: { url: 'https://api.example.com/notfound', method: 'GET', headers: {} },
        type: 'xhr',
        timestamp: Date.now()
      });
      handleNetworkEvent(testTabId, 'Network.responseReceived', {
        requestId: '3',
        response: { status: 404, statusText: 'Not Found', headers: {} }
      });

      // Add 500 Server Error request
      handleNetworkEvent(testTabId, 'Network.requestWillBeSent', {
        requestId: '4',
        request: { url: 'https://api.example.com/error', method: 'GET', headers: {} },
        type: 'xhr',
        timestamp: Date.now()
      });
      handleNetworkEvent(testTabId, 'Network.responseReceived', {
        requestId: '4',
        response: { status: 500, statusText: 'Internal Server Error', headers: {} }
      });
    });

    it('should filter requests by status code 200', async () => {
      const result = await networkTool.execute(
        { action: 'get_requests', status_filter: 200 },
        mockContext
      );

      expect(result.error).toBeUndefined();
      
      const parsed = JSON.parse(result.output!);
      expect(parsed.count).toBe(1);
      expect(parsed.requests[0].status).toBe(200);
    });

    it('should filter requests by status code 201', async () => {
      const result = await networkTool.execute(
        { action: 'get_requests', status_filter: 201 },
        mockContext
      );

      expect(result.error).toBeUndefined();
      
      const parsed = JSON.parse(result.output!);
      expect(parsed.count).toBe(1);
      expect(parsed.requests[0].status).toBe(201);
    });

    it('should filter requests by status code 404', async () => {
      const result = await networkTool.execute(
        { action: 'get_requests', status_filter: 404 },
        mockContext
      );

      expect(result.error).toBeUndefined();
      
      const parsed = JSON.parse(result.output!);
      expect(parsed.count).toBe(1);
      expect(parsed.requests[0].status).toBe(404);
      expect(parsed.requests[0].url).toContain('notfound');
    });

    it('should filter requests by status code 500', async () => {
      const result = await networkTool.execute(
        { action: 'get_requests', status_filter: 500 },
        mockContext
      );

      expect(result.error).toBeUndefined();
      
      const parsed = JSON.parse(result.output!);
      expect(parsed.count).toBe(1);
      expect(parsed.requests[0].status).toBe(500);
    });

    it('should return empty array when no status codes match filter', async () => {
      const result = await networkTool.execute(
        { action: 'get_requests', status_filter: 302 },
        mockContext
      );

      expect(result.error).toBeUndefined();
      
      const parsed = JSON.parse(result.output!);
      expect(parsed.count).toBe(0);
    });

    it('should include status filter info in response', async () => {
      const result = await networkTool.execute(
        { action: 'get_requests', status_filter: 404 },
        mockContext
      );

      expect(result.error).toBeUndefined();
      
      const parsed = JSON.parse(result.output!);
      expect(parsed.filters_applied.status).toBe(404);
    });
  });

  describe('Combined Filters', () => {
    beforeEach(async () => {
      // Clear and populate with test data
      await networkTool.execute({ action: 'clear_requests' }, mockContext);
      
      // Add various requests for combined filter testing
      handleNetworkEvent(testTabId, 'Network.requestWillBeSent', {
        requestId: '1',
        request: { url: 'https://api.example.com/users', method: 'GET', headers: {} },
        type: 'xhr',
        timestamp: Date.now()
      });
      handleNetworkEvent(testTabId, 'Network.responseReceived', {
        requestId: '1',
        response: { status: 200, statusText: 'OK', headers: {} }
      });

      handleNetworkEvent(testTabId, 'Network.requestWillBeSent', {
        requestId: '2',
        request: { url: 'https://api.example.com/users', method: 'POST', headers: {} },
        type: 'xhr',
        timestamp: Date.now()
      });
      handleNetworkEvent(testTabId, 'Network.responseReceived', {
        requestId: '2',
        response: { status: 201, statusText: 'Created', headers: {} }
      });

      handleNetworkEvent(testTabId, 'Network.requestWillBeSent', {
        requestId: '3',
        request: { url: 'https://api.example.com/posts', method: 'GET', headers: {} },
        type: 'xhr',
        timestamp: Date.now()
      });
      handleNetworkEvent(testTabId, 'Network.responseReceived', {
        requestId: '3',
        response: { status: 200, statusText: 'OK', headers: {} }
      });

      handleNetworkEvent(testTabId, 'Network.requestWillBeSent', {
        requestId: '4',
        request: { url: 'https://cdn.example.com/image.png', method: 'GET', headers: {} },
        type: 'image',
        timestamp: Date.now()
      });
      handleNetworkEvent(testTabId, 'Network.responseReceived', {
        requestId: '4',
        response: { status: 200, statusText: 'OK', headers: {} }
      });
    });

    it('should combine URL and method filters', async () => {
      const result = await networkTool.execute(
        { action: 'get_requests', url_filter: 'users', method_filter: 'GET' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      
      const parsed = JSON.parse(result.output!);
      expect(parsed.count).toBe(1);
      expect(parsed.requests[0].url).toContain('users');
      expect(parsed.requests[0].method).toBe('GET');
    });

    it('should combine URL and status filters', async () => {
      const result = await networkTool.execute(
        { action: 'get_requests', url_filter: 'api', status_filter: 200 },
        mockContext
      );

      expect(result.error).toBeUndefined();
      
      const parsed = JSON.parse(result.output!);
      expect(parsed.count).toBe(2); // GET /users and GET /posts
      expect(parsed.requests.every((r: any) => r.status === 200)).toBe(true);
    });

    it('should combine method and status filters', async () => {
      const result = await networkTool.execute(
        { action: 'get_requests', method_filter: 'POST', status_filter: 201 },
        mockContext
      );

      expect(result.error).toBeUndefined();
      
      const parsed = JSON.parse(result.output!);
      expect(parsed.count).toBe(1);
      expect(parsed.requests[0].method).toBe('POST');
      expect(parsed.requests[0].status).toBe(201);
    });

    it('should combine all three filters', async () => {
      const result = await networkTool.execute(
        { action: 'get_requests', url_filter: 'users', method_filter: 'POST', status_filter: 201 },
        mockContext
      );

      expect(result.error).toBeUndefined();
      
      const parsed = JSON.parse(result.output!);
      expect(parsed.count).toBe(1);
      expect(parsed.requests[0].url).toContain('users');
      expect(parsed.requests[0].method).toBe('POST');
      expect(parsed.requests[0].status).toBe(201);
    });

    it('should return empty when combined filters match nothing', async () => {
      const result = await networkTool.execute(
        { action: 'get_requests', url_filter: 'users', method_filter: 'DELETE', status_filter: 404 },
        mockContext
      );

      expect(result.error).toBeUndefined();
      
      const parsed = JSON.parse(result.output!);
      expect(parsed.count).toBe(0);
    });
  });

  describe('clear_requests action', () => {
    beforeEach(async () => {
      // Add some requests first
      handleNetworkEvent(testTabId, 'Network.requestWillBeSent', {
        requestId: '1',
        request: { url: 'https://api.example.com/test', method: 'GET', headers: {} },
        type: 'xhr',
        timestamp: Date.now()
      });
    });

    it('should clear all network requests', async () => {
      // Verify we have requests
      let result = await networkTool.execute(
        { action: 'get_requests' },
        mockContext
      );
      let parsed = JSON.parse(result.output!);
      expect(parsed.count).toBeGreaterThan(0);

      // Clear requests
      result = await networkTool.execute(
        { action: 'clear_requests' },
        mockContext
      );
      expect(result.error).toBeUndefined();
      expect(result.output).toContain('cleared');

      // Verify requests are cleared
      result = await networkTool.execute(
        { action: 'get_requests' },
        mockContext
      );
      parsed = JSON.parse(result.output!);
      expect(parsed.count).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown action', async () => {
      const result = await networkTool.execute(
        { action: 'invalid_action' as any },
        mockContext
      );

      expect(result.error).toBeTruthy();
      expect(result.error).toContain('Unknown action');
    });
  });

  describe('Limit Parameter', () => {
    beforeEach(async () => {
      // Clear and populate with many requests
      await networkTool.execute({ action: 'clear_requests' }, mockContext);
      
      // Add 10 requests
      for (let i = 1; i <= 10; i++) {
        handleNetworkEvent(testTabId, 'Network.requestWillBeSent', {
          requestId: String(i),
          request: { url: `https://api.example.com/item/${i}`, method: 'GET', headers: {} },
          type: 'xhr',
          timestamp: Date.now() + i
        });
        handleNetworkEvent(testTabId, 'Network.responseReceived', {
          requestId: String(i),
          response: { status: 200, statusText: 'OK', headers: {} }
        });
      }
    });

    it('should respect limit parameter', async () => {
      const result = await networkTool.execute(
        { action: 'get_requests', limit: 5 },
        mockContext
      );

      expect(result.error).toBeUndefined();
      
      const parsed = JSON.parse(result.output!);
      expect(parsed.count).toBe(5);
    });

    it('should use default limit of 20', async () => {
      const result = await networkTool.execute(
        { action: 'get_requests' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      
      const parsed = JSON.parse(result.output!);
      // We only added 10, so should get all 10
      expect(parsed.count).toBe(10);
    });
  });
});
