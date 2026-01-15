/**
 * Shortcut Parsing Tests
 * 
 * Tests for the core shortcut chip parsing functionality without UI rendering.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parseShortcutChips, SHORTCUT_CHIP_REGEX } from '../ShortcutChip';
import { useShortcutsStore } from '@/stores/shortcuts';

// Mock chrome.storage.local
const mockStorage: Record<string, any> = {};

describe('Shortcut Parsing', () => {
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

  describe('SHORTCUT_CHIP_REGEX', () => {
    it('should match shortcut chip syntax', () => {
      const content = 'Use [[shortcut:123:screenshot]] to capture';
      const matches = content.match(SHORTCUT_CHIP_REGEX);
      
      expect(matches).toHaveLength(1);
      expect(matches![0]).toBe('[[shortcut:123:screenshot]]');
    });

    it('should match multiple shortcut chips', () => {
      const content = 'First [[shortcut:1:test1]] then [[shortcut:2:test2]]';
      const matches = content.match(SHORTCUT_CHIP_REGEX);
      
      expect(matches).toHaveLength(2);
      expect(matches![0]).toBe('[[shortcut:1:test1]]');
      expect(matches![1]).toBe('[[shortcut:2:test2]]');
    });

    it('should not match completely invalid syntax', () => {
      const content = 'Invalid [shortcut:123:test] or [[shortcut]] or [[invalid:syntax]]';
      const matches = content.match(SHORTCUT_CHIP_REGEX);
      
      expect(matches).toBeNull();
    });
  });

  describe('parseShortcutChips', () => {
    it('should parse single shortcut chip', () => {
      const content = 'Use [[shortcut:123:screenshot]] to capture';
      const parsed = parseShortcutChips(content);
      
      expect(parsed).toHaveLength(3);
      expect(parsed[0]).toBe('Use ');
      expect(parsed[2]).toBe(' to capture');
      
      // The middle element should be a React element
      expect(typeof parsed[1]).toBe('object');
      expect(parsed[1]).toHaveProperty('type');
      expect(parsed[1]).toHaveProperty('props');
    });

    it('should parse multiple shortcut chips', () => {
      const content = 'First [[shortcut:1:test1]] then [[shortcut:2:test2]] done';
      const parsed = parseShortcutChips(content);
      
      expect(parsed).toHaveLength(5);
      expect(parsed[0]).toBe('First ');
      expect(parsed[2]).toBe(' then ');
      expect(parsed[4]).toBe(' done');
      
      // Check that we have React elements for the chips
      expect(typeof parsed[1]).toBe('object');
      expect(typeof parsed[3]).toBe('object');
    });

    it('should return original content when no chips found', () => {
      const content = 'This is a normal message without chips';
      const parsed = parseShortcutChips(content);
      
      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toBe(content);
    });

    it('should handle empty content', () => {
      const content = '';
      const parsed = parseShortcutChips(content);
      
      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toBe('');
    });

    it('should handle content with only shortcut chips', () => {
      const content = '[[shortcut:123:test]]';
      const parsed = parseShortcutChips(content);
      
      expect(parsed).toHaveLength(1);
      expect(typeof parsed[0]).toBe('object');
    });

    it('should handle adjacent shortcut chips', () => {
      const content = '[[shortcut:1:test1]][[shortcut:2:test2]]';
      const parsed = parseShortcutChips(content);
      
      expect(parsed).toHaveLength(2);
      expect(typeof parsed[0]).toBe('object');
      expect(typeof parsed[1]).toBe('object');
    });

    it('should preserve special characters in text parts', () => {
      const content = 'Special chars: !@#$%^&*() [[shortcut:123:test]] more: <>?';
      const parsed = parseShortcutChips(content);
      
      expect(parsed).toHaveLength(3);
      expect(parsed[0]).toBe('Special chars: !@#$%^&*() ');
      expect(parsed[2]).toBe(' more: <>?');
    });
  });

  describe('Integration with Shortcuts Store', () => {
    it('should work with shortcuts from store', async () => {
      const store = useShortcutsStore.getState();
      
      // Create a test shortcut
      const shortcut = await store.createShortcut({
        command: 'test',
        name: 'Test Shortcut',
        prompt: 'This is a test prompt',
      });

      // Parse content with the shortcut
      const content = `Use [[shortcut:${shortcut.id}:test]] to help`;
      const parsed = parseShortcutChips(content);
      
      expect(parsed).toHaveLength(3);
      expect(parsed[0]).toBe('Use ');
      expect(parsed[2]).toBe(' to help');
      
      // Check that the chip has the correct props
      const chip = parsed[1] as any;
      expect(chip.props.id).toBe(shortcut.id);
      expect(chip.props.name).toBe('test');
    });

    it('should handle non-existent shortcut IDs gracefully', () => {
      const content = 'Use [[shortcut:non-existent:test]] to help';
      const parsed = parseShortcutChips(content);
      
      expect(parsed).toHaveLength(3);
      expect(parsed[0]).toBe('Use ');
      expect(parsed[2]).toBe(' to help');
      
      // Should still create a chip component even if shortcut doesn't exist
      const chip = parsed[1] as any;
      expect(chip.props.id).toBe('non-existent');
      expect(chip.props.name).toBe('test');
    });
  });
});