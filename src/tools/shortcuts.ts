/**
 * Shortcuts Tool
 * 
 * Manages saved prompts/shortcuts that users can create and reuse.
 * Allows AI to list available shortcuts and execute them by inserting their prompts.
 */

import type { ToolDefinition, ToolContext, ToolResult } from './types';
import type { SavedPrompt } from '@/lib/shortcuts';
import { SAVED_PROMPTS_STORAGE_KEY } from '@/lib/shortcuts';

/**
 * Input for listing shortcuts
 */
interface ListShortcutsInput {
  // No parameters needed for listing
}

/**
 * Input for executing a shortcut
 */
interface ExecuteShortcutInput {
  shortcut_id: string;
}

/**
 * Shortcuts List Tool Definition
 * 
 * Lists all saved prompts/shortcuts that the user has created.
 * These are reusable prompts accessible via slash commands in the chat.
 */
export const shortcutsListTool: ToolDefinition = {
  name: 'shortcuts_list',
  description: 'List all saved prompts/shortcuts. These are reusable prompts that users have saved with slash commands (e.g., /screenshot, /summarize). Shows the command, prompt content, usage count, and optional URL context.',

  parameters: {},

  /**
   * Execute shortcuts list
   */
  async execute(_input: ListShortcutsInput, _context: ToolContext): Promise<ToolResult> {
    try {
      // Retrieve shortcuts from Chrome storage
      const result = await chrome.storage.local.get(SAVED_PROMPTS_STORAGE_KEY);
      const shortcuts: SavedPrompt[] = result[SAVED_PROMPTS_STORAGE_KEY] || [];

      if (shortcuts.length === 0) {
        return {
          output: 'No shortcuts saved yet. Users can create shortcuts by typing "/" in the chat and selecting "Create shortcut".'
        };
      }

      // Sort by usage count (most used first)
      const sortedShortcuts = [...shortcuts].sort((a, b) => b.usageCount - a.usageCount);

      // Format shortcuts for display
      const shortcutList = sortedShortcuts.map((shortcut, index) => {
        const parts = [
          `${index + 1}. /${shortcut.command}${shortcut.name ? ` (${shortcut.name})` : ''}`,
          `   ID: ${shortcut.id}`,
          `   Prompt: ${shortcut.prompt}`,
          `   Usage: ${shortcut.usageCount} times`
        ];

        if (shortcut.url) {
          parts.push(`   URL Context: ${shortcut.url}`);
        }

        if (shortcut.model) {
          parts.push(`   Preferred Model: ${shortcut.model}`);
        }

        return parts.join('\n');
      }).join('\n\n');

      return {
        output: `Found ${shortcuts.length} saved shortcut(s) (sorted by usage):\n\n${shortcutList}\n\nYou can execute any shortcut using shortcuts_execute with its ID.`
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to list shortcuts'
      };
    }
  },

  /**
   * Convert to Anthropic (Claude) tool schema
   */
  toAnthropicSchema() {
    return {
      name: 'shortcuts_list',
      description: 'List all saved prompts/shortcuts. These are reusable prompts that users have saved with slash commands (e.g., /screenshot, /summarize). Shows the command, prompt content, usage count, and optional URL context.',
      input_schema: {
        type: 'object' as const,
        properties: {},
        required: []
      }
    };
  },

  /**
   * Convert to OpenAI (GPT) tool schema
   */
  toOpenAISchema() {
    return {
      type: 'function' as const,
      function: {
        name: 'shortcuts_list',
        description: 'List all saved prompts/shortcuts. These are reusable prompts that users have saved with slash commands (e.g., /screenshot, /summarize). Shows the command, prompt content, usage count, and optional URL context.',
        parameters: {
          type: 'object' as const,
          properties: {},
          required: []
        }
      }
    };
  }
};

/**
 * Shortcuts Execute Tool Definition
 * 
 * Executes a saved shortcut by returning its prompt content.
 * The AI can then use this prompt to perform the intended action.
 */
export const shortcutsExecuteTool: ToolDefinition = {
  name: 'shortcuts_execute',
  description: 'Execute a saved shortcut by its ID. Returns the shortcut\'s prompt content so you can use it. Also records usage statistics. Use shortcuts_list first to see available shortcuts and their IDs.',

  parameters: {
    shortcut_id: {
      type: 'string',
      description: 'The ID of the shortcut to execute (get this from shortcuts_list)',
      required: true
    }
  },

  /**
   * Execute a shortcut
   */
  async execute(input: ExecuteShortcutInput, _context: ToolContext): Promise<ToolResult> {
    const { shortcut_id } = input;

    if (!shortcut_id || shortcut_id.trim().length === 0) {
      return { error: 'Shortcut ID is required' };
    }

    try {
      // Retrieve shortcuts from Chrome storage
      const result = await chrome.storage.local.get(SAVED_PROMPTS_STORAGE_KEY);
      const shortcuts: SavedPrompt[] = result[SAVED_PROMPTS_STORAGE_KEY] || [];

      // Find the requested shortcut
      const shortcut = shortcuts.find(s => s.id === shortcut_id);

      if (!shortcut) {
        return {
          error: `Shortcut with ID "${shortcut_id}" not found. Use shortcuts_list to see available shortcuts.`
        };
      }

      // Increment usage count
      const updatedShortcuts = shortcuts.map(s =>
        s.id === shortcut_id
          ? { ...s, usageCount: s.usageCount + 1, updatedAt: Date.now() }
          : s
      );

      // Save updated shortcuts back to storage
      await chrome.storage.local.set({ [SAVED_PROMPTS_STORAGE_KEY]: updatedShortcuts });

      // Build output with shortcut details
      const output = [
        `Executed shortcut: /${shortcut.command}${shortcut.name ? ` (${shortcut.name})` : ''}`,
        `\nPrompt: ${shortcut.prompt}`,
      ];

      if (shortcut.url) {
        output.push(`\nURL Context: ${shortcut.url}`);
        output.push(`\nNote: This shortcut is intended for use on ${shortcut.url}`);
      }

      if (shortcut.model) {
        output.push(`\nPreferred Model: ${shortcut.model}`);
      }

      output.push(`\nUsage Count: ${shortcut.usageCount + 1} times`);
      output.push(`\n\nYou should now follow the prompt instructions above.`);

      return {
        output: output.join('')
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to execute shortcut'
      };
    }
  },

  /**
   * Convert to Anthropic (Claude) tool schema
   */
  toAnthropicSchema() {
    return {
      name: 'shortcuts_execute',
      description: 'Execute a saved shortcut by its ID. Returns the shortcut\'s prompt content so you can use it. Also records usage statistics. Use shortcuts_list first to see available shortcuts and their IDs.',
      input_schema: {
        type: 'object' as const,
        properties: {
          shortcut_id: {
            type: 'string',
            description: 'The ID of the shortcut to execute (get this from shortcuts_list)'
          }
        },
        required: ['shortcut_id']
      }
    };
  },

  /**
   * Convert to OpenAI (GPT) tool schema
   */
  toOpenAISchema() {
    return {
      type: 'function' as const,
      function: {
        name: 'shortcuts_execute',
        description: 'Execute a saved shortcut by its ID. Returns the shortcut\'s prompt content so you can use it. Also records usage statistics. Use shortcuts_list first to see available shortcuts and their IDs.',
        parameters: {
          type: 'object' as const,
          properties: {
            shortcut_id: {
              type: 'string',
              description: 'The ID of the shortcut to execute (get this from shortcuts_list)'
            }
          },
          required: ['shortcut_id']
        }
      }
    };
  }
};
