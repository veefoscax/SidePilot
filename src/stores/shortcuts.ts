/**
 * SidePilot Shortcuts Store
 * 
 * Zustand store for managing saved prompts/shortcuts with CRUD operations,
 * usage tracking, and persistence to Chrome storage.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  SavedPrompt, 
  DEFAULT_SHORTCUTS,
  SAVED_PROMPTS_STORAGE_KEY,
  MAX_SHORTCUTS,
  MAX_COMMAND_LENGTH,
  MAX_PROMPT_LENGTH,
  COMMAND_VALIDATION_REGEX,
  RESERVED_COMMANDS
} from '@/lib/shortcuts';

interface ShortcutsState {
  shortcuts: SavedPrompt[];
  isLoaded: boolean;
  
  // Actions
  loadShortcuts: () => Promise<void>;
  createShortcut: (prompt: Omit<SavedPrompt, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => Promise<SavedPrompt>;
  updateShortcut: (id: string, updates: Partial<SavedPrompt>) => Promise<void>;
  deleteShortcut: (id: string) => Promise<void>;
  recordUsage: (id: string) => Promise<void>;
  getByCommand: (command: string) => SavedPrompt | undefined;
  getById: (id: string) => SavedPrompt | undefined;
  initializeDefaults: () => Promise<void>;
}

/**
 * Validation error class
 */
export class ShortcutValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShortcutValidationError';
  }
}

/**
 * Validate shortcut data before creation/update
 */
function validateShortcut(
  shortcut: Partial<SavedPrompt>,
  existingShortcuts: SavedPrompt[],
  isUpdate: boolean = false,
  currentId?: string
): void {
  // Validate command
  if (shortcut.command !== undefined) {
    const command = shortcut.command.trim().toLowerCase();
    
    if (!command) {
      throw new ShortcutValidationError('Command cannot be empty');
    }
    
    if (command.length > MAX_COMMAND_LENGTH) {
      throw new ShortcutValidationError(`Command cannot exceed ${MAX_COMMAND_LENGTH} characters`);
    }
    
    if (!COMMAND_VALIDATION_REGEX.test(command)) {
      throw new ShortcutValidationError('Command must be lowercase alphanumeric with hyphens or underscores only');
    }
    
    if (RESERVED_COMMANDS.includes(command)) {
      throw new ShortcutValidationError(`Command "${command}" is reserved and cannot be used`);
    }
    
    // Check for duplicate commands (excluding current shortcut if updating)
    const duplicate = existingShortcuts.find(s => 
      s.command.toLowerCase() === command && s.id !== currentId
    );
    if (duplicate) {
      throw new ShortcutValidationError(`Command "${command}" already exists`);
    }
  }
  
  // Validate prompt
  if (shortcut.prompt !== undefined) {
    const prompt = shortcut.prompt.trim();
    
    if (!prompt) {
      throw new ShortcutValidationError('Prompt cannot be empty');
    }
    
    if (prompt.length > MAX_PROMPT_LENGTH) {
      throw new ShortcutValidationError(`Prompt cannot exceed ${MAX_PROMPT_LENGTH} characters`);
    }
  }
  
  // Validate URL if provided
  if (shortcut.url !== undefined && shortcut.url.trim()) {
    try {
      new URL(shortcut.url);
    } catch {
      throw new ShortcutValidationError('Invalid URL format');
    }
  }
  
  // Check max shortcuts limit (only for new shortcuts)
  if (!isUpdate && existingShortcuts.length >= MAX_SHORTCUTS) {
    throw new ShortcutValidationError(`Maximum of ${MAX_SHORTCUTS} shortcuts reached`);
  }
}

/**
 * Chrome storage adapter for Zustand persistence
 */
const chromeStorage = createJSONStorage(() => ({
  getItem: async (name: string) => {
    try {
      const result = await chrome.storage.local.get(name);
      return result[name] ?? null;
    } catch (error) {
      console.error('Failed to get from Chrome storage:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string) => {
    try {
      await chrome.storage.local.set({ [name]: value });
    } catch (error) {
      console.error('Failed to set Chrome storage:', error);
    }
  },
  removeItem: async (name: string) => {
    try {
      await chrome.storage.local.remove(name);
    } catch (error) {
      console.error('Failed to remove from Chrome storage:', error);
    }
  },
}));

export const useShortcutsStore = create<ShortcutsState>()(
  persist(
    (set, get) => ({
      shortcuts: [],
      isLoaded: false,
      
      /**
       * Load shortcuts from Chrome storage
       */
      loadShortcuts: async () => {
        try {
          const result = await chrome.storage.local.get(SAVED_PROMPTS_STORAGE_KEY);
          const stored = result[SAVED_PROMPTS_STORAGE_KEY] || [];
          set({ shortcuts: stored, isLoaded: true });
        } catch (error) {
          console.error('Failed to load shortcuts:', error);
          set({ shortcuts: [], isLoaded: true });
        }
      },
      
      /**
       * Create a new shortcut with validation
       */
      createShortcut: async (prompt) => {
        const { shortcuts } = get();
        
        // Normalize command to lowercase
        const normalizedPrompt = {
          ...prompt,
          command: prompt.command.trim().toLowerCase(),
          prompt: prompt.prompt.trim(),
          url: prompt.url?.trim() || undefined,
        };
        
        // Validate before creating
        validateShortcut(normalizedPrompt, shortcuts, false);
        
        const newPrompt: SavedPrompt = {
          ...normalizedPrompt,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          usageCount: 0,
        };
        
        const updated = [...shortcuts, newPrompt];
        
        // Persist to Chrome storage
        await chrome.storage.local.set({ [SAVED_PROMPTS_STORAGE_KEY]: updated });
        
        set({ shortcuts: updated });
        
        return newPrompt;
      },
      
      /**
       * Update an existing shortcut
       */
      updateShortcut: async (id, updates) => {
        const { shortcuts } = get();
        const existing = shortcuts.find(s => s.id === id);
        
        if (!existing) {
          throw new Error(`Shortcut with id "${id}" not found`);
        }
        
        // Prepare updated shortcut
        const updatedShortcut = {
          ...existing,
          ...updates,
          id, // Ensure ID cannot be changed
          updatedAt: Date.now(),
        };
        
        // Normalize command if it's being updated
        if (updates.command !== undefined) {
          updatedShortcut.command = updates.command.trim().toLowerCase();
        }
        
        // Normalize prompt if it's being updated
        if (updates.prompt !== undefined) {
          updatedShortcut.prompt = updates.prompt.trim();
        }
        
        // Normalize URL if it's being updated
        if (updates.url !== undefined) {
          updatedShortcut.url = updates.url?.trim() || undefined;
        }
        
        // Validate the updated shortcut
        validateShortcut(updatedShortcut, shortcuts, true, id);
        
        const updated = shortcuts.map(s => s.id === id ? updatedShortcut : s);
        
        // Persist to Chrome storage
        await chrome.storage.local.set({ [SAVED_PROMPTS_STORAGE_KEY]: updated });
        
        set({ shortcuts: updated });
      },
      
      /**
       * Delete a shortcut
       */
      deleteShortcut: async (id) => {
        const { shortcuts } = get();
        const updated = shortcuts.filter(s => s.id !== id);
        
        // Persist to Chrome storage
        await chrome.storage.local.set({ [SAVED_PROMPTS_STORAGE_KEY]: updated });
        
        set({ shortcuts: updated });
      },
      
      /**
       * Record usage of a shortcut (increment usage count)
       */
      recordUsage: async (id) => {
        const { shortcuts } = get();
        const updated = shortcuts.map(s =>
          s.id === id 
            ? { ...s, usageCount: s.usageCount + 1, updatedAt: Date.now() }
            : s
        );
        
        // Persist to Chrome storage
        await chrome.storage.local.set({ [SAVED_PROMPTS_STORAGE_KEY]: updated });
        
        set({ shortcuts: updated });
      },
      
      /**
       * Get shortcut by command
       */
      getByCommand: (command: string) => {
        const { shortcuts } = get();
        return shortcuts.find(s => s.command.toLowerCase() === command.toLowerCase());
      },
      
      /**
       * Get shortcut by ID
       */
      getById: (id: string) => {
        const { shortcuts } = get();
        return shortcuts.find(s => s.id === id);
      },
      
      /**
       * Initialize default shortcuts if none exist
       */
      initializeDefaults: async () => {
        const { shortcuts } = get();
        
        if (shortcuts.length === 0) {
          const defaultShortcuts: SavedPrompt[] = DEFAULT_SHORTCUTS.map(shortcut => ({
            ...shortcut,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            usageCount: 0,
          }));
          
          // Persist to Chrome storage
          await chrome.storage.local.set({ [SAVED_PROMPTS_STORAGE_KEY]: defaultShortcuts });
          
          set({ shortcuts: defaultShortcuts });
        }
      },
    }),
    {
      name: 'sidepilot-shortcuts-storage',
      storage: chromeStorage,
      partialize: (state) => ({
        shortcuts: state.shortcuts,
        isLoaded: state.isLoaded,
      }),
    }
  )
);

// Export types
export type { ShortcutsState };
