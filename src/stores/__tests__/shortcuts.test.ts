/**
 * Tests for Shortcuts Store
 * 
 * Tests CRUD operations, persistence, usage tracking, and validation
 * for the shortcuts/saved prompts system.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useShortcutsStore, ShortcutValidationError } from '../shortcuts';
import { SavedPrompt, MAX_SHORTCUTS, RESERVED_COMMANDS } from '@/lib/shortcuts';

describe('Shortcuts Store', () => {
  // Mock chrome.storage.local
  const mockStorage: Record<string, any> = {};
  
  beforeEach(() => {
    // Clear mock storage
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    
    // Mock chrome.storage.local
    // @ts-ignore - Mock global chrome
    global.chrome = {
      storage: {
        local: {
          get: vi.fn((key: string | string[]) => {
            if (typeof key === 'string') {
              return Promise.resolve({ [key]: mockStorage[key] });
            }
            const result: Record<string, any> = {};
            key.forEach(k => {
              if (mockStorage[k] !== undefined) {
                result[k] = mockStorage[k];
              }
            });
            return Promise.resolve(result);
          }),
          set: vi.fn((items: Record<string, any>) => {
            Object.assign(mockStorage, items);
            return Promise.resolve();
          }),
          remove: vi.fn((key: string) => {
            delete mockStorage[key];
            return Promise.resolve();
          }),
        },
      },
    } as any;
    
    // Reset store state
    useShortcutsStore.setState({ shortcuts: [], isLoaded: false });
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('CRUD Operations', () => {
    describe('createShortcut', () => {
      it('should create a new shortcut with valid data', async () => {
        const store = useShortcutsStore.getState();
        
        const shortcut = await store.createShortcut({
          command: 'test',
          prompt: 'This is a test prompt',
        });
        
        expect(shortcut.id).toBeDefined();
        expect(shortcut.command).toBe('test');
        expect(shortcut.prompt).toBe('This is a test prompt');
        expect(shortcut.usageCount).toBe(0);
        expect(shortcut.createdAt).toBeGreaterThan(0);
        expect(shortcut.updatedAt).toBeGreaterThan(0);
      });
      
      it('should normalize command to lowercase', async () => {
        const store = useShortcutsStore.getState();
        
        const shortcut = await store.createShortcut({
          command: 'TestCommand',
          prompt: 'Test prompt',
        });
        
        expect(shortcut.command).toBe('testcommand');
      });
      
      it('should trim whitespace from command and prompt', async () => {
        const store = useShortcutsStore.getState();
        
        const shortcut = await store.createShortcut({
          command: '  test  ',
          prompt: '  Test prompt  ',
        });
        
        expect(shortcut.command).toBe('test');
        expect(shortcut.prompt).toBe('Test prompt');
      });
      
      it('should handle optional URL', async () => {
        const store = useShortcutsStore.getState();
        
        const shortcut = await store.createShortcut({
          command: 'test',
          prompt: 'Test prompt',
          url: 'https://example.com',
        });
        
        expect(shortcut.url).toBe('https://example.com');
      });
      
      it('should handle optional name', async () => {
        const store = useShortcutsStore.getState();
        
        const shortcut = await store.createShortcut({
          command: 'test',
          name: 'Test Shortcut',
          prompt: 'Test prompt',
        });
        
        expect(shortcut.name).toBe('Test Shortcut');
      });
      
      it('should add shortcut to store', async () => {
        const store = useShortcutsStore.getState();
        
        await store.createShortcut({
          command: 'test',
          prompt: 'Test prompt',
        });
        
        const shortcuts = useShortcutsStore.getState().shortcuts;
        expect(shortcuts).toHaveLength(1);
        expect(shortcuts[0].command).toBe('test');
      });
      
      it('should persist shortcut to Chrome storage', async () => {
        const store = useShortcutsStore.getState();
        
        await store.createShortcut({
          command: 'test',
          prompt: 'Test prompt',
        });
        
        expect(chrome.storage.local.set).toHaveBeenCalled();
        expect(mockStorage['savedPrompts']).toBeDefined();
        expect(mockStorage['savedPrompts']).toHaveLength(1);
      });
      
      it('should throw error for empty command', async () => {
        const store = useShortcutsStore.getState();
        
        await expect(
          store.createShortcut({
            command: '',
            prompt: 'Test prompt',
          })
        ).rejects.toThrow(ShortcutValidationError);
      });
      
      it('should throw error for empty prompt', async () => {
        const store = useShortcutsStore.getState();
        
        await expect(
          store.createShortcut({
            command: 'test',
            prompt: '',
          })
        ).rejects.toThrow(ShortcutValidationError);
      });
      
      it('should throw error for invalid command characters', async () => {
        const store = useShortcutsStore.getState();
        
        await expect(
          store.createShortcut({
            command: 'test command',
            prompt: 'Test prompt',
          })
        ).rejects.toThrow(ShortcutValidationError);
        
        await expect(
          store.createShortcut({
            command: 'test@command',
            prompt: 'Test prompt',
          })
        ).rejects.toThrow(ShortcutValidationError);
      });
      
      it('should throw error for reserved commands', async () => {
        const store = useShortcutsStore.getState();
        
        for (const reserved of RESERVED_COMMANDS) {
          await expect(
            store.createShortcut({
              command: reserved,
              prompt: 'Test prompt',
            })
          ).rejects.toThrow(ShortcutValidationError);
        }
      });
      
      it('should throw error for duplicate commands', async () => {
        const store = useShortcutsStore.getState();
        
        await store.createShortcut({
          command: 'test',
          prompt: 'Test prompt',
        });
        
        await expect(
          store.createShortcut({
            command: 'test',
            prompt: 'Another prompt',
          })
        ).rejects.toThrow(ShortcutValidationError);
      });
      
      it('should throw error for invalid URL', async () => {
        const store = useShortcutsStore.getState();
        
        await expect(
          store.createShortcut({
            command: 'test',
            prompt: 'Test prompt',
            url: 'not-a-valid-url',
          })
        ).rejects.toThrow(ShortcutValidationError);
      });
      
      it('should throw error when max shortcuts limit reached', async () => {
        const store = useShortcutsStore.getState();
        
        // Create MAX_SHORTCUTS shortcuts
        const shortcuts: SavedPrompt[] = [];
        for (let i = 0; i < MAX_SHORTCUTS; i++) {
          shortcuts.push({
            id: `id-${i}`,
            command: `cmd${i}`,
            prompt: `Prompt ${i}`,
            usageCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
        
        useShortcutsStore.setState({ shortcuts });
        
        await expect(
          store.createShortcut({
            command: 'overflow',
            prompt: 'This should fail',
          })
        ).rejects.toThrow(ShortcutValidationError);
      });
    });
    
    describe('updateShortcut', () => {
      it('should update shortcut command', async () => {
        const store = useShortcutsStore.getState();
        
        const shortcut = await store.createShortcut({
          command: 'test',
          prompt: 'Test prompt',
        });
        
        await store.updateShortcut(shortcut.id, {
          command: 'updated',
        });
        
        const updated = useShortcutsStore.getState().shortcuts[0];
        expect(updated.command).toBe('updated');
      });
      
      it('should update shortcut prompt', async () => {
        const store = useShortcutsStore.getState();
        
        const shortcut = await store.createShortcut({
          command: 'test',
          prompt: 'Test prompt',
        });
        
        await store.updateShortcut(shortcut.id, {
          prompt: 'Updated prompt',
        });
        
        const updated = useShortcutsStore.getState().shortcuts[0];
        expect(updated.prompt).toBe('Updated prompt');
      });
      
      it('should update shortcut URL', async () => {
        const store = useShortcutsStore.getState();
        
        const shortcut = await store.createShortcut({
          command: 'test',
          prompt: 'Test prompt',
        });
        
        await store.updateShortcut(shortcut.id, {
          url: 'https://example.com',
        });
        
        const updated = useShortcutsStore.getState().shortcuts[0];
        expect(updated.url).toBe('https://example.com');
      });
      
      it('should update updatedAt timestamp', async () => {
        const store = useShortcutsStore.getState();
        
        const shortcut = await store.createShortcut({
          command: 'test',
          prompt: 'Test prompt',
        });
        
        const originalUpdatedAt = shortcut.updatedAt;
        
        // Wait a bit to ensure timestamp changes
        await new Promise(resolve => setTimeout(resolve, 10));
        
        await store.updateShortcut(shortcut.id, {
          prompt: 'Updated prompt',
        });
        
        const updated = useShortcutsStore.getState().shortcuts[0];
        expect(updated.updatedAt).toBeGreaterThan(originalUpdatedAt);
      });
      
      it('should not change ID', async () => {
        const store = useShortcutsStore.getState();
        
        const shortcut = await store.createShortcut({
          command: 'test',
          prompt: 'Test prompt',
        });
        
        const originalId = shortcut.id;
        
        await store.updateShortcut(shortcut.id, {
          id: 'different-id',
        } as any);
        
        const updated = useShortcutsStore.getState().shortcuts[0];
        expect(updated.id).toBe(originalId);
      });
      
      it('should persist update to Chrome storage', async () => {
        const store = useShortcutsStore.getState();
        
        const shortcut = await store.createShortcut({
          command: 'test',
          prompt: 'Test prompt',
        });
        
        await store.updateShortcut(shortcut.id, {
          prompt: 'Updated prompt',
        });
        
        expect(mockStorage['savedPrompts'][0].prompt).toBe('Updated prompt');
      });
      
      it('should throw error for non-existent shortcut', async () => {
        const store = useShortcutsStore.getState();
        
        await expect(
          store.updateShortcut('non-existent-id', {
            prompt: 'Updated prompt',
          })
        ).rejects.toThrow('not found');
      });
      
      it('should validate updated command', async () => {
        const store = useShortcutsStore.getState();
        
        const shortcut = await store.createShortcut({
          command: 'test',
          prompt: 'Test prompt',
        });
        
        await expect(
          store.updateShortcut(shortcut.id, {
            command: 'invalid command',
          })
        ).rejects.toThrow(ShortcutValidationError);
      });
      
      it('should allow updating to same command', async () => {
        const store = useShortcutsStore.getState();
        
        const shortcut = await store.createShortcut({
          command: 'test',
          prompt: 'Test prompt',
        });
        
        await expect(
          store.updateShortcut(shortcut.id, {
            command: 'test',
            prompt: 'Updated prompt',
          })
        ).resolves.not.toThrow();
      });
      
      it('should not allow updating to duplicate command', async () => {
        const store = useShortcutsStore.getState();
        
        await store.createShortcut({
          command: 'test1',
          prompt: 'Test prompt 1',
        });
        
        const shortcut2 = await store.createShortcut({
          command: 'test2',
          prompt: 'Test prompt 2',
        });
        
        await expect(
          store.updateShortcut(shortcut2.id, {
            command: 'test1',
          })
        ).rejects.toThrow(ShortcutValidationError);
      });
    });
    
    describe('deleteShortcut', () => {
      it('should delete shortcut', async () => {
        const store = useShortcutsStore.getState();
        
        const shortcut = await store.createShortcut({
          command: 'test',
          prompt: 'Test prompt',
        });
        
        await store.deleteShortcut(shortcut.id);
        
        const shortcuts = useShortcutsStore.getState().shortcuts;
        expect(shortcuts).toHaveLength(0);
      });
      
      it('should persist deletion to Chrome storage', async () => {
        const store = useShortcutsStore.getState();
        
        const shortcut = await store.createShortcut({
          command: 'test',
          prompt: 'Test prompt',
        });
        
        await store.deleteShortcut(shortcut.id);
        
        expect(mockStorage['savedPrompts']).toHaveLength(0);
      });
      
      it('should not affect other shortcuts', async () => {
        const store = useShortcutsStore.getState();
        
        const shortcut1 = await store.createShortcut({
          command: 'test1',
          prompt: 'Test prompt 1',
        });
        
        await store.createShortcut({
          command: 'test2',
          prompt: 'Test prompt 2',
        });
        
        await store.deleteShortcut(shortcut1.id);
        
        const shortcuts = useShortcutsStore.getState().shortcuts;
        expect(shortcuts).toHaveLength(1);
        expect(shortcuts[0].command).toBe('test2');
      });
      
      it('should handle deleting non-existent shortcut gracefully', async () => {
        const store = useShortcutsStore.getState();
        
        await expect(
          store.deleteShortcut('non-existent-id')
        ).resolves.not.toThrow();
        
        const shortcuts = useShortcutsStore.getState().shortcuts;
        expect(shortcuts).toHaveLength(0);
      });
    });
  });
  
  describe('Persistence', () => {
    it('should load shortcuts from Chrome storage', async () => {
      const storedShortcuts: SavedPrompt[] = [
        {
          id: 'id-1',
          command: 'test1',
          prompt: 'Test prompt 1',
          usageCount: 5,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'id-2',
          command: 'test2',
          prompt: 'Test prompt 2',
          usageCount: 10,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];
      
      mockStorage['savedPrompts'] = storedShortcuts;
      
      const store = useShortcutsStore.getState();
      await store.loadShortcuts();
      
      const shortcuts = useShortcutsStore.getState().shortcuts;
      expect(shortcuts).toHaveLength(2);
      expect(shortcuts[0].command).toBe('test1');
      expect(shortcuts[1].command).toBe('test2');
    });
    
    it('should set isLoaded flag after loading', async () => {
      const store = useShortcutsStore.getState();
      
      expect(useShortcutsStore.getState().isLoaded).toBe(false);
      
      await store.loadShortcuts();
      
      expect(useShortcutsStore.getState().isLoaded).toBe(true);
    });
    
    it('should handle empty storage', async () => {
      const store = useShortcutsStore.getState();
      
      await store.loadShortcuts();
      
      const shortcuts = useShortcutsStore.getState().shortcuts;
      expect(shortcuts).toHaveLength(0);
      expect(useShortcutsStore.getState().isLoaded).toBe(true);
    });
    
    it('should handle storage errors gracefully', async () => {
      // @ts-ignore - Mock global chrome
      global.chrome.storage.local.get = vi.fn(() => 
        Promise.reject(new Error('Storage error'))
      );
      
      const store = useShortcutsStore.getState();
      
      await expect(store.loadShortcuts()).resolves.not.toThrow();
      
      const shortcuts = useShortcutsStore.getState().shortcuts;
      expect(shortcuts).toHaveLength(0);
      expect(useShortcutsStore.getState().isLoaded).toBe(true);
    });
  });
  
  describe('Usage Tracking', () => {
    it('should increment usage count', async () => {
      const store = useShortcutsStore.getState();
      
      const shortcut = await store.createShortcut({
        command: 'test',
        prompt: 'Test prompt',
      });
      
      expect(shortcut.usageCount).toBe(0);
      
      await store.recordUsage(shortcut.id);
      
      const updated = useShortcutsStore.getState().shortcuts[0];
      expect(updated.usageCount).toBe(1);
    });
    
    it('should increment usage count multiple times', async () => {
      const store = useShortcutsStore.getState();
      
      const shortcut = await store.createShortcut({
        command: 'test',
        prompt: 'Test prompt',
      });
      
      await store.recordUsage(shortcut.id);
      await store.recordUsage(shortcut.id);
      await store.recordUsage(shortcut.id);
      
      const updated = useShortcutsStore.getState().shortcuts[0];
      expect(updated.usageCount).toBe(3);
    });
    
    it('should update updatedAt timestamp when recording usage', async () => {
      const store = useShortcutsStore.getState();
      
      const shortcut = await store.createShortcut({
        command: 'test',
        prompt: 'Test prompt',
      });
      
      const originalUpdatedAt = shortcut.updatedAt;
      
      // Wait a bit to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await store.recordUsage(shortcut.id);
      
      const updated = useShortcutsStore.getState().shortcuts[0];
      expect(updated.updatedAt).toBeGreaterThan(originalUpdatedAt);
    });
    
    it('should persist usage count to Chrome storage', async () => {
      const store = useShortcutsStore.getState();
      
      const shortcut = await store.createShortcut({
        command: 'test',
        prompt: 'Test prompt',
      });
      
      await store.recordUsage(shortcut.id);
      
      expect(mockStorage['savedPrompts'][0].usageCount).toBe(1);
    });
    
    it('should handle recording usage for non-existent shortcut gracefully', async () => {
      const store = useShortcutsStore.getState();
      
      await expect(
        store.recordUsage('non-existent-id')
      ).resolves.not.toThrow();
    });
  });
  
  describe('Query Methods', () => {
    describe('getByCommand', () => {
      it('should find shortcut by command', async () => {
        const store = useShortcutsStore.getState();
        
        await store.createShortcut({
          command: 'test',
          prompt: 'Test prompt',
        });
        
        const found = store.getByCommand('test');
        expect(found).toBeDefined();
        expect(found?.command).toBe('test');
      });
      
      it('should be case-insensitive', async () => {
        const store = useShortcutsStore.getState();
        
        await store.createShortcut({
          command: 'test',
          prompt: 'Test prompt',
        });
        
        const found1 = store.getByCommand('TEST');
        const found2 = store.getByCommand('Test');
        const found3 = store.getByCommand('test');
        
        expect(found1).toBeDefined();
        expect(found2).toBeDefined();
        expect(found3).toBeDefined();
        expect(found1?.id).toBe(found2?.id);
        expect(found2?.id).toBe(found3?.id);
      });
      
      it('should return undefined for non-existent command', async () => {
        const store = useShortcutsStore.getState();
        
        const found = store.getByCommand('non-existent');
        expect(found).toBeUndefined();
      });
    });
    
    describe('getById', () => {
      it('should find shortcut by ID', async () => {
        const store = useShortcutsStore.getState();
        
        const shortcut = await store.createShortcut({
          command: 'test',
          prompt: 'Test prompt',
        });
        
        const found = store.getById(shortcut.id);
        expect(found).toBeDefined();
        expect(found?.id).toBe(shortcut.id);
      });
      
      it('should return undefined for non-existent ID', async () => {
        const store = useShortcutsStore.getState();
        
        const found = store.getById('non-existent-id');
        expect(found).toBeUndefined();
      });
    });
  });
  
  describe('Default Shortcuts', () => {
    it('should initialize default shortcuts when none exist', async () => {
      const store = useShortcutsStore.getState();
      
      await store.initializeDefaults();
      
      const shortcuts = useShortcutsStore.getState().shortcuts;
      expect(shortcuts.length).toBeGreaterThan(0);
    });
    
    it('should not initialize defaults if shortcuts already exist', async () => {
      const store = useShortcutsStore.getState();
      
      await store.createShortcut({
        command: 'test',
        prompt: 'Test prompt',
      });
      
      const countBefore = useShortcutsStore.getState().shortcuts.length;
      
      await store.initializeDefaults();
      
      const countAfter = useShortcutsStore.getState().shortcuts.length;
      expect(countAfter).toBe(countBefore);
    });
    
    it('should persist default shortcuts to Chrome storage', async () => {
      const store = useShortcutsStore.getState();
      
      await store.initializeDefaults();
      
      expect(mockStorage['savedPrompts']).toBeDefined();
      expect(mockStorage['savedPrompts'].length).toBeGreaterThan(0);
    });
  });
});
