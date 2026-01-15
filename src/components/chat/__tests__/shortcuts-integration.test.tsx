/**
 * Shortcuts Integration Tests
 * 
 * End-to-end integration tests for the shortcuts system:
 * - Shortcut creation workflow
 * - Slash menu integration in chat
 * - Chip rendering in messages
 * - Usage count tracking
 * - Tools integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { parseShortcutChips, ShortcutChip } from '../ShortcutChip';
import { useShortcutsStore } from '@/stores/shortcuts';
import { shortcutsListTool, shortcutsExecuteTool } from '@/tools/shortcuts';
import type { ToolContext } from '@/tools/types';

// Mock chrome.storage.local
const mockStorage: Record<string, any> = {};

// Mock tool context
const mockToolContext: ToolContext = {
  tabId: 1,
  url: 'https://example.com',
  permissionManager: {} as any,
};

describe('Shortcuts Integration Tests', () => {
  beforeEach(() => {
    // Clear mock storage before each test
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    vi.clearAllMocks();
    
    // Reset store state
    useShortcutsStore.setState({ shortcuts: [], isLoaded: false });
    
    // Override chrome storage for this test
    (globalThis as any).chrome = {
      ...(globalThis as any).chrome,
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
        },
      },
    } as any;
  });

  describe('End-to-End Shortcut Creation', () => {
    it('should create shortcut and make it available', async () => {
      const store = useShortcutsStore.getState();
      
      // Create a shortcut
      const shortcut = await store.createShortcut({
        command: 'test',
        name: 'Test Shortcut',
        prompt: 'This is a test prompt for integration testing',
      });
      
      expect(shortcut.id).toBeDefined();
      expect(shortcut.command).toBe('test');
      expect(shortcut.usageCount).toBe(0);
      
      // Verify it's in the store
      const shortcuts = useShortcutsStore.getState().shortcuts;
      expect(shortcuts).toHaveLength(1);
      expect(shortcuts[0].command).toBe('test');
      
      // Verify it's persisted to storage
      expect(mockStorage['savedPrompts']).toBeDefined();
      expect(mockStorage['savedPrompts']).toHaveLength(1);
    });
  });

  describe('Chip Rendering', () => {
    it('should parse shortcut chips from message content', () => {
      const content = 'Use [[shortcut:123:screenshot]] to capture the page';
      const parsed = parseShortcutChips(content);
      
      expect(parsed).toHaveLength(3);
      expect(parsed[0]).toBe('Use ');
      expect(parsed[2]).toBe(' to capture the page');
      
      // The middle element should be a ShortcutChip component
      expect(parsed[1]).toEqual(
        expect.objectContaining({
          type: ShortcutChip,
          props: {
            id: '123',
            name: 'screenshot',
          },
        })
      );
    });
  });

  describe('Usage Count Tracking', () => {
    it('should increment usage count when shortcut is executed via tools', async () => {
      const store = useShortcutsStore.getState();
      
      const shortcut = await store.createShortcut({
        command: 'test',
        prompt: 'Test prompt',
      });
      
      expect(shortcut.usageCount).toBe(0);
      
      // Execute via tools
      const result = await shortcutsExecuteTool.execute(
        { shortcut_id: shortcut.id },
        mockToolContext
      );
      
      expect(result.error).toBeUndefined();
      expect(result.output).toContain('Usage Count: 1 times');
      
      // Reload store from storage to get updated data
      await useShortcutsStore.getState().loadShortcuts();
      
      // Verify usage count was incremented in store
      const updatedShortcut = useShortcutsStore.getState().shortcuts[0];
      expect(updatedShortcut.usageCount).toBe(1);
    });
  });

  describe('Tools Integration', () => {
    it('should list shortcuts via shortcuts_list tool', async () => {
      const store = useShortcutsStore.getState();
      
      await store.createShortcut({
        command: 'test1',
        name: 'Test 1',
        prompt: 'First test prompt',
      });
      
      const result = await shortcutsListTool.execute({}, mockToolContext);
      
      expect(result.error).toBeUndefined();
      expect(result.output).toContain('Found 1 saved shortcut(s)');
      expect(result.output).toContain('/test1');
      expect(result.output).toContain('Usage: 0 times');
    });

    it('should execute shortcuts via shortcuts_execute tool', async () => {
      const store = useShortcutsStore.getState();
      
      const shortcut = await store.createShortcut({
        command: 'test',
        name: 'Test Shortcut',
        prompt: 'This is a test prompt for execution',
      });
      
      const result = await shortcutsExecuteTool.execute(
        { shortcut_id: shortcut.id },
        mockToolContext
      );
      
      expect(result.error).toBeUndefined();
      expect(result.output).toContain('Executed shortcut: /test');
      expect(result.output).toContain('Test Shortcut');
      expect(result.output).toContain('This is a test prompt for execution');
      expect(result.output).toContain('Usage Count: 1 times');
    });
  });
});