/**
 * Tests for shortcuts store initialization
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useShortcutsStore } from '../shortcuts';
import { DEFAULT_SHORTCUTS } from '@/lib/shortcuts';

// Mock Chrome storage API
const mockChromeStorage = {
  local: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
};

// @ts-ignore
global.chrome = {
  storage: mockChromeStorage,
};

describe('Shortcuts Store Initialization', () => {
  beforeEach(() => {
    // Reset store state
    useShortcutsStore.setState({
      shortcuts: [],
      isLoaded: false,
    });
    
    // Reset mocks
    vi.clearAllMocks();
  });

  describe('loadShortcuts', () => {
    it('should load shortcuts from Chrome storage', async () => {
      const mockShortcuts = [
        {
          id: 'test-1',
          command: 'test',
          prompt: 'Test prompt',
          usageCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      mockChromeStorage.local.get.mockResolvedValue({
        savedPrompts: mockShortcuts,
      });

      const { loadShortcuts } = useShortcutsStore.getState();
      await loadShortcuts();

      const state = useShortcutsStore.getState();
      expect(state.shortcuts).toEqual(mockShortcuts);
      expect(state.isLoaded).toBe(true);
    });

    it('should handle empty storage gracefully', async () => {
      mockChromeStorage.local.get.mockResolvedValue({});

      const { loadShortcuts } = useShortcutsStore.getState();
      await loadShortcuts();

      const state = useShortcutsStore.getState();
      expect(state.shortcuts).toEqual([]);
      expect(state.isLoaded).toBe(true);
    });

    it('should handle storage errors gracefully', async () => {
      mockChromeStorage.local.get.mockRejectedValue(new Error('Storage error'));

      const { loadShortcuts } = useShortcutsStore.getState();
      await loadShortcuts();

      const state = useShortcutsStore.getState();
      expect(state.shortcuts).toEqual([]);
      expect(state.isLoaded).toBe(true);
    });
  });

  describe('initializeDefaults', () => {
    it('should initialize default shortcuts when none exist', async () => {
      mockChromeStorage.local.set.mockResolvedValue(undefined);

      // Start with empty shortcuts
      useShortcutsStore.setState({
        shortcuts: [],
        isLoaded: true,
      });

      const { initializeDefaults } = useShortcutsStore.getState();
      await initializeDefaults();

      const state = useShortcutsStore.getState();
      expect(state.shortcuts).toHaveLength(DEFAULT_SHORTCUTS.length);
      
      // Check that default shortcuts were created with proper structure
      state.shortcuts.forEach((shortcut, index) => {
        expect(shortcut.id).toBeDefined();
        expect(shortcut.command).toBe(DEFAULT_SHORTCUTS[index].command);
        expect(shortcut.prompt).toBe(DEFAULT_SHORTCUTS[index].prompt);
        expect(shortcut.usageCount).toBe(0);
        expect(shortcut.createdAt).toBeDefined();
        expect(shortcut.updatedAt).toBeDefined();
      });

      // Verify storage was called
      expect(mockChromeStorage.local.set).toHaveBeenCalledWith({
        savedPrompts: state.shortcuts,
      });
    });

    it('should not initialize defaults when shortcuts already exist', async () => {
      const existingShortcuts = [
        {
          id: 'existing-1',
          command: 'existing',
          prompt: 'Existing prompt',
          usageCount: 5,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      useShortcutsStore.setState({
        shortcuts: existingShortcuts,
        isLoaded: true,
      });

      const { initializeDefaults } = useShortcutsStore.getState();
      await initializeDefaults();

      const state = useShortcutsStore.getState();
      expect(state.shortcuts).toEqual(existingShortcuts);
      
      // The persist middleware may call set, but initializeDefaults should not add new shortcuts
      expect(state.shortcuts).toHaveLength(1);
      expect(state.shortcuts[0].command).toBe('existing');
    });
  });

  describe('App initialization flow', () => {
    it('should properly initialize store on app startup', async () => {
      // Simulate fresh install - no existing shortcuts
      mockChromeStorage.local.get.mockResolvedValue({});
      mockChromeStorage.local.set.mockResolvedValue(undefined);

      const { loadShortcuts, initializeDefaults } = useShortcutsStore.getState();
      
      // Simulate App.tsx initialization flow
      await loadShortcuts();
      await initializeDefaults();

      const state = useShortcutsStore.getState();
      
      // Should be loaded and have default shortcuts
      expect(state.isLoaded).toBe(true);
      expect(state.shortcuts).toHaveLength(DEFAULT_SHORTCUTS.length);
      
      // Verify all default shortcuts are present
      DEFAULT_SHORTCUTS.forEach((defaultShortcut) => {
        const found = state.shortcuts.find(s => s.command === defaultShortcut.command);
        expect(found).toBeDefined();
        expect(found?.prompt).toBe(defaultShortcut.prompt);
      });
    });

    it('should handle existing user shortcuts on app startup', async () => {
      const existingShortcuts = [
        {
          id: 'user-1',
          command: 'custom',
          prompt: 'Custom user prompt',
          usageCount: 10,
          createdAt: Date.now() - 86400000, // 1 day ago
          updatedAt: Date.now() - 3600000,  // 1 hour ago
        },
      ];

      mockChromeStorage.local.get.mockResolvedValue({
        savedPrompts: existingShortcuts,
      });

      const { loadShortcuts, initializeDefaults } = useShortcutsStore.getState();
      
      // Simulate App.tsx initialization flow
      await loadShortcuts();
      await initializeDefaults();

      const state = useShortcutsStore.getState();
      
      // Should be loaded and preserve existing shortcuts
      expect(state.isLoaded).toBe(true);
      expect(state.shortcuts).toEqual(existingShortcuts);
      
      // Should not have added defaults since shortcuts already exist
      expect(state.shortcuts).toHaveLength(1);
      expect(state.shortcuts[0].command).toBe('custom');
    });
  });
});