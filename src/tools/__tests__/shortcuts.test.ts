/**
 * Shortcuts Tool Tests
 * 
 * Tests for shortcuts_list and shortcuts_execute tools
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { shortcutsListTool, shortcutsExecuteTool } from '../shortcuts';
import type { ToolContext } from '../types';
import type { SavedPrompt } from '@/lib/shortcuts';
import { SAVED_PROMPTS_STORAGE_KEY } from '@/lib/shortcuts';

// Mock chrome.storage.local
const mockStorage: Record<string, any> = {};

global.chrome = {
  storage: {
    local: {
      get: vi.fn((keys: string | string[]) => {
        const result: Record<string, any> = {};
        if (typeof keys === 'string') {
          result[keys] = mockStorage[keys];
        } else {
          keys.forEach(key => {
            result[key] = mockStorage[key];
          });
        }
        return Promise.resolve(result);
      }),
      set: vi.fn((items: Record<string, any>) => {
        Object.assign(mockStorage, items);
        return Promise.resolve();
      }),
      remove: vi.fn((keys: string | string[]) => {
        if (typeof keys === 'string') {
          delete mockStorage[keys];
        } else {
          keys.forEach(key => delete mockStorage[key]);
        }
        return Promise.resolve();
      }),
    },
  },
} as any;

describe('Shortcuts Tools', () => {
  const mockContext: ToolContext = {
    tabId: 1,
    url: 'https://example.com',
    permissionManager: {} as any,
  };

  beforeEach(() => {
    // Clear mock storage before each test
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    vi.clearAllMocks();
  });

  describe('shortcuts_list', () => {
    it('should return empty message when no shortcuts exist', async () => {
      const result = await shortcutsListTool.execute({}, mockContext);
      
      expect(result.error).toBeUndefined();
      expect(result.output).toContain('No shortcuts saved yet');
      expect(result.output).toContain('Create shortcut');
    });

    it('should list all shortcuts sorted by usage', async () => {
      const shortcuts: SavedPrompt[] = [
        {
          id: '1',
          command: 'screenshot',
          name: 'Take Screenshot',
          prompt: 'Take a screenshot of the current page',
          usageCount: 5,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '2',
          command: 'summarize',
          prompt: 'Summarize the page content',
          usageCount: 10,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '3',
          command: 'navigate',
          prompt: 'Navigate to a URL',
          url: 'https://example.com',
          usageCount: 3,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      mockStorage[SAVED_PROMPTS_STORAGE_KEY] = shortcuts;

      const result = await shortcutsListTool.execute({}, mockContext);
      
      expect(result.error).toBeUndefined();
      expect(result.output).toContain('Found 3 saved shortcut(s)');
      expect(result.output).toContain('/summarize'); // Most used should be first
      expect(result.output).toContain('Usage: 10 times');
      expect(result.output).toContain('/screenshot');
      expect(result.output).toContain('Usage: 5 times');
      expect(result.output).toContain('/navigate');
      expect(result.output).toContain('URL Context: https://example.com');
    });

    it('should include optional fields when present', async () => {
      const shortcuts: SavedPrompt[] = [
        {
          id: '1',
          command: 'test',
          prompt: 'Test prompt',
          usageCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          url: 'https://test.com',
          model: 'gpt-4',
        },
      ];

      mockStorage[SAVED_PROMPTS_STORAGE_KEY] = shortcuts;

      const result = await shortcutsListTool.execute({}, mockContext);
      
      expect(result.output).toContain('URL Context: https://test.com');
      expect(result.output).toContain('Preferred Model: gpt-4');
    });

    it('should have correct Anthropic schema', () => {
      const schema = shortcutsListTool.toAnthropicSchema();
      
      expect(schema.name).toBe('shortcuts_list');
      expect(schema.description).toContain('saved prompts/shortcuts');
      expect(schema.input_schema.type).toBe('object');
      expect(schema.input_schema.required).toEqual([]);
    });

    it('should have correct OpenAI schema', () => {
      const schema = shortcutsListTool.toOpenAISchema();
      
      expect(schema.type).toBe('function');
      expect(schema.function.name).toBe('shortcuts_list');
      expect(schema.function.description).toContain('saved prompts/shortcuts');
      expect(schema.function.parameters.type).toBe('object');
      expect(schema.function.parameters.required).toEqual([]);
    });
  });

  describe('shortcuts_execute', () => {
    it('should return error when shortcut_id is missing', async () => {
      const result = await shortcutsExecuteTool.execute({ shortcut_id: '' }, mockContext);
      
      expect(result.error).toBe('Shortcut ID is required');
      expect(result.output).toBeUndefined();
    });

    it('should return error when shortcut not found', async () => {
      mockStorage[SAVED_PROMPTS_STORAGE_KEY] = [];

      const result = await shortcutsExecuteTool.execute({ shortcut_id: 'nonexistent' }, mockContext);
      
      expect(result.error).toContain('not found');
      expect(result.error).toContain('shortcuts_list');
    });

    it('should execute shortcut and return prompt content', async () => {
      const shortcuts: SavedPrompt[] = [
        {
          id: 'test-id',
          command: 'screenshot',
          name: 'Take Screenshot',
          prompt: 'Take a screenshot of the current page and describe it',
          usageCount: 5,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      mockStorage[SAVED_PROMPTS_STORAGE_KEY] = shortcuts;

      const result = await shortcutsExecuteTool.execute({ shortcut_id: 'test-id' }, mockContext);
      
      expect(result.error).toBeUndefined();
      expect(result.output).toContain('Executed shortcut: /screenshot');
      expect(result.output).toContain('Take Screenshot');
      expect(result.output).toContain('Prompt: Take a screenshot of the current page and describe it');
      expect(result.output).toContain('Usage Count: 6 times'); // Should increment
      expect(result.output).toContain('follow the prompt instructions');
    });

    it('should increment usage count', async () => {
      const initialTime = Date.now();
      const shortcuts: SavedPrompt[] = [
        {
          id: 'test-id',
          command: 'test',
          prompt: 'Test prompt',
          usageCount: 3,
          createdAt: initialTime,
          updatedAt: initialTime,
        },
      ];

      mockStorage[SAVED_PROMPTS_STORAGE_KEY] = shortcuts;

      await shortcutsExecuteTool.execute({ shortcut_id: 'test-id' }, mockContext);
      
      const updatedShortcuts = mockStorage[SAVED_PROMPTS_STORAGE_KEY];
      expect(updatedShortcuts[0].usageCount).toBe(4);
      expect(updatedShortcuts[0].updatedAt).toBeGreaterThanOrEqual(initialTime);
    });

    it('should include URL context when present', async () => {
      const shortcuts: SavedPrompt[] = [
        {
          id: 'test-id',
          command: 'navigate',
          prompt: 'Navigate to the URL',
          url: 'https://example.com',
          usageCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      mockStorage[SAVED_PROMPTS_STORAGE_KEY] = shortcuts;

      const result = await shortcutsExecuteTool.execute({ shortcut_id: 'test-id' }, mockContext);
      
      expect(result.output).toContain('URL Context: https://example.com');
      expect(result.output).toContain('intended for use on https://example.com');
    });

    it('should include preferred model when present', async () => {
      const shortcuts: SavedPrompt[] = [
        {
          id: 'test-id',
          command: 'test',
          prompt: 'Test prompt',
          model: 'claude-3-opus',
          usageCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      mockStorage[SAVED_PROMPTS_STORAGE_KEY] = shortcuts;

      const result = await shortcutsExecuteTool.execute({ shortcut_id: 'test-id' }, mockContext);
      
      expect(result.output).toContain('Preferred Model: claude-3-opus');
    });

    it('should have correct Anthropic schema', () => {
      const schema = shortcutsExecuteTool.toAnthropicSchema();
      
      expect(schema.name).toBe('shortcuts_execute');
      expect(schema.description).toContain('Execute a saved shortcut');
      expect(schema.input_schema.properties.shortcut_id).toBeDefined();
      expect(schema.input_schema.required).toContain('shortcut_id');
    });

    it('should have correct OpenAI schema', () => {
      const schema = shortcutsExecuteTool.toOpenAISchema();
      
      expect(schema.type).toBe('function');
      expect(schema.function.name).toBe('shortcuts_execute');
      expect(schema.function.description).toContain('Execute a saved shortcut');
      expect(schema.function.parameters.properties.shortcut_id).toBeDefined();
      expect(schema.function.parameters.required).toContain('shortcut_id');
    });
  });
});
