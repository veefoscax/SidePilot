/**
 * Unit tests for tab management tool
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tabsTool } from '../tabs';
import type { ToolContext } from '../types';

// Mock Chrome API
const mockChrome = {
  tabs: {
    create: vi.fn(),
    get: vi.fn(),
    remove: vi.fn(),
    update: vi.fn(),
    query: vi.fn(),
    goBack: vi.fn(),
    goForward: vi.fn(),
    reload: vi.fn()
  },
  windows: {
    update: vi.fn()
  },
  tabGroups: {
    TAB_GROUP_ID_NONE: -1
  }
};

// @ts-ignore - Mock global chrome
global.chrome = mockChrome as any;

describe('Tab Management Tool', () => {
  let mockContext: ToolContext;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup mock context
    mockContext = {
      tabId: 1,
      url: 'https://example.com',
      permissionManager: {
        checkPermission: vi.fn().mockResolvedValue({ allowed: true, needsPrompt: false })
      } as any
    };
  });

  describe('Tool Definition', () => {
    it('should have correct name', () => {
      expect(tabsTool.name).toBe('tab_management');
    });

    it('should have description', () => {
      expect(tabsTool.description).toBeTruthy();
      expect(tabsTool.description).toContain('tab');
    });

    it('should have parameters defined', () => {
      expect(tabsTool.parameters).toBeDefined();
      expect(tabsTool.parameters.action).toBeDefined();
      expect(tabsTool.parameters.action.enum).toContain('create_tab');
      expect(tabsTool.parameters.action.enum).toContain('close_tab');
      expect(tabsTool.parameters.action.enum).toContain('switch_tab');
      expect(tabsTool.parameters.action.enum).toContain('list_tabs');
    });
  });

  describe('Schema Generation', () => {
    it('should generate Anthropic schema', () => {
      const schema = tabsTool.toAnthropicSchema();
      
      expect(schema.name).toBe('tab_management');
      expect(schema.description).toBeTruthy();
      expect(schema.input_schema.type).toBe('object');
      expect(schema.input_schema.properties.action).toBeDefined();
      expect(schema.input_schema.required).toContain('action');
    });

    it('should generate OpenAI schema', () => {
      const schema = tabsTool.toOpenAISchema();
      
      expect(schema.type).toBe('function');
      expect(schema.function.name).toBe('tab_management');
      expect(schema.function.description).toBeTruthy();
      expect(schema.function.parameters.type).toBe('object');
      expect(schema.function.parameters.properties.action).toBeDefined();
      expect(schema.function.parameters.required).toContain('action');
    });
  });

  describe('create_tab action', () => {
    it('should create tab without URL', async () => {
      mockChrome.tabs.create.mockResolvedValue({ id: 123 });

      const result = await tabsTool.execute(
        { action: 'create_tab' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toContain('Created new tab');
      expect(result.output).toContain('123');
      expect(mockChrome.tabs.create).toHaveBeenCalledWith({
        url: undefined,
        active: true
      });
    });

    it('should create tab with valid URL', async () => {
      mockChrome.tabs.create.mockResolvedValue({ id: 456 });

      const result = await tabsTool.execute(
        { action: 'create_tab', url: 'https://example.com' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toContain('Created new tab');
      expect(result.output).toContain('456');
      expect(result.output).toContain('https://example.com');
      expect(mockChrome.tabs.create).toHaveBeenCalledWith({
        url: 'https://example.com',
        active: true
      });
    });

    it('should reject invalid URL', async () => {
      const result = await tabsTool.execute(
        { action: 'create_tab', url: 'not-a-valid-url' },
        mockContext
      );

      expect(result.error).toBeTruthy();
      expect(result.error).toContain('Invalid URL');
      expect(mockChrome.tabs.create).not.toHaveBeenCalled();
    });

    it('should handle creation failure', async () => {
      mockChrome.tabs.create.mockResolvedValue({});

      const result = await tabsTool.execute(
        { action: 'create_tab' },
        mockContext
      );

      expect(result.error).toBeTruthy();
      expect(result.error).toContain('no tab ID');
    });
  });

  describe('close_tab action', () => {
    it('should close tab by ID', async () => {
      mockChrome.tabs.get.mockResolvedValue({ 
        id: 123, 
        title: 'Test Tab' 
      });
      mockChrome.tabs.remove.mockResolvedValue(undefined);

      const result = await tabsTool.execute(
        { action: 'close_tab', tab_id: 123 },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toContain('Closed tab 123');
      expect(result.output).toContain('Test Tab');
      expect(mockChrome.tabs.get).toHaveBeenCalledWith(123);
      expect(mockChrome.tabs.remove).toHaveBeenCalledWith(123);
    });

    it('should require tab_id parameter', async () => {
      const result = await tabsTool.execute(
        { action: 'close_tab' },
        mockContext
      );

      expect(result.error).toBeTruthy();
      expect(result.error).toContain('tab_id parameter is required');
      expect(mockChrome.tabs.remove).not.toHaveBeenCalled();
    });

    it('should handle non-existent tab', async () => {
      mockChrome.tabs.get.mockRejectedValue(new Error('No tab with id: 999'));

      const result = await tabsTool.execute(
        { action: 'close_tab', tab_id: 999 },
        mockContext
      );

      expect(result.error).toBeTruthy();
      expect(result.error).toContain('not found');
    });
  });

  describe('switch_tab action', () => {
    it('should switch to tab by ID', async () => {
      mockChrome.tabs.get.mockResolvedValue({ 
        id: 123, 
        title: 'Test Tab',
        windowId: 1
      });
      mockChrome.tabs.update.mockResolvedValue(undefined);
      mockChrome.windows.update.mockResolvedValue(undefined);

      const result = await tabsTool.execute(
        { action: 'switch_tab', tab_id: 123 },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toContain('Switched to tab 123');
      expect(result.output).toContain('Test Tab');
      expect(mockChrome.tabs.update).toHaveBeenCalledWith(123, { active: true });
      expect(mockChrome.windows.update).toHaveBeenCalledWith(1, { focused: true });
    });

    it('should require tab_id parameter', async () => {
      const result = await tabsTool.execute(
        { action: 'switch_tab' },
        mockContext
      );

      expect(result.error).toBeTruthy();
      expect(result.error).toContain('tab_id parameter is required');
      expect(mockChrome.tabs.update).not.toHaveBeenCalled();
    });

    it('should handle non-existent tab', async () => {
      mockChrome.tabs.get.mockRejectedValue(new Error('No tab with id: 999'));

      const result = await tabsTool.execute(
        { action: 'switch_tab', tab_id: 999 },
        mockContext
      );

      expect(result.error).toBeTruthy();
      expect(result.error).toContain('not found');
    });
  });

  describe('list_tabs action', () => {
    it('should list all tabs with metadata', async () => {
      mockChrome.tabs.query.mockResolvedValue([
        {
          id: 1,
          title: 'Tab 1',
          url: 'https://example.com',
          active: true,
          index: 0,
          windowId: 1,
          groupId: -1
        },
        {
          id: 2,
          title: 'Tab 2',
          url: 'https://example.org',
          active: false,
          index: 1,
          windowId: 1,
          groupId: 5
        }
      ]);

      const result = await tabsTool.execute(
        { action: 'list_tabs' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toBeTruthy();
      expect(result.output).toContain('Found 2 tab(s)');
      expect(result.output).toContain('Tab 1');
      expect(result.output).toContain('Tab 2');
      expect(result.output).toContain('https://example.com');
      expect(result.output).toContain('https://example.org');
      expect(result.output).toContain('Window 1');
      expect(result.output).toContain('[Group 5]');
      expect(mockChrome.tabs.query).toHaveBeenCalledWith({});
    });

    it('should handle empty tab list', async () => {
      mockChrome.tabs.query.mockResolvedValue([]);

      const result = await tabsTool.execute(
        { action: 'list_tabs' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toBe('No tabs open');
    });

    it('should group tabs by window', async () => {
      mockChrome.tabs.query.mockResolvedValue([
        {
          id: 1,
          title: 'Window 1 Tab',
          url: 'https://example.com',
          active: true,
          index: 0,
          windowId: 1,
          groupId: -1
        },
        {
          id: 2,
          title: 'Window 2 Tab',
          url: 'https://example.org',
          active: true,
          index: 0,
          windowId: 2,
          groupId: -1
        }
      ]);

      const result = await tabsTool.execute(
        { action: 'list_tabs' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toContain('Window 1');
      expect(result.output).toContain('Window 2');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown action', async () => {
      const result = await tabsTool.execute(
        { action: 'invalid_action' as any },
        mockContext
      );

      expect(result.error).toBeTruthy();
      expect(result.error).toContain('Unknown action');
    });

    it('should handle Chrome API errors', async () => {
      mockChrome.tabs.create.mockRejectedValue(new Error('Chrome API error'));

      const result = await tabsTool.execute(
        { action: 'create_tab' },
        mockContext
      );

      expect(result.error).toBeTruthy();
      expect(result.error).toContain('Chrome API error');
    });
  });
});
