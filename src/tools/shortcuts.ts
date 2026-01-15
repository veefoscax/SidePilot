/**
 * Shortcuts Tool
 * 
 * Manages saved keyboard shortcuts and automation workflows.
 * Allows listing and executing pre-defined shortcuts.
 */

import type { ToolDefinition, ToolContext, ToolResult } from './types';
import { storage } from '@/lib/storage';

/**
 * Shortcut definition stored in chrome.storage
 */
interface Shortcut {
  id: string;
  name: string;
  description: string;
  keys: string;
  action: string;
  created: number;
}

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
 * Lists all saved keyboard shortcuts and automation workflows.
 */
export const shortcutsListTool: ToolDefinition = {
  name: 'shortcuts_list',
  description: 'List all saved keyboard shortcuts and automation workflows.',
  
  parameters: {},

  /**
   * Execute shortcuts list
   */
  async execute(_input: ListShortcutsInput, _context: ToolContext): Promise<ToolResult> {
    try {
      // Retrieve shortcuts from storage
      const shortcuts = await storage.get<Shortcut[]>('shortcuts') || [];

      if (shortcuts.length === 0) {
        return {
          output: 'No shortcuts saved yet. Shortcuts can be created through the settings panel.'
        };
      }

      // Format shortcuts for display
      const shortcutList = shortcuts.map((shortcut, index) => {
        return `${index + 1}. ${shortcut.name} (ID: ${shortcut.id})
   Keys: ${shortcut.keys}
   Description: ${shortcut.description}
   Action: ${shortcut.action}`;
      }).join('\n\n');

      return {
        output: `Found ${shortcuts.length} saved shortcut(s):\n\n${shortcutList}`
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
      description: 'List all saved keyboard shortcuts and automation workflows.',
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
        description: 'List all saved keyboard shortcuts and automation workflows.',
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
 * Executes a saved shortcut by ID.
 */
export const shortcutsExecuteTool: ToolDefinition = {
  name: 'shortcuts_execute',
  description: 'Execute a saved shortcut by its ID. Use shortcuts_list to see available shortcuts.',
  
  parameters: {
    shortcut_id: {
      type: 'string',
      description: 'The ID of the shortcut to execute',
      required: true
    }
  },

  /**
   * Execute a shortcut
   */
  async execute(input: ExecuteShortcutInput, context: ToolContext): Promise<ToolResult> {
    const { shortcut_id } = input;

    if (!shortcut_id || shortcut_id.trim().length === 0) {
      return { error: 'Shortcut ID is required' };
    }

    try {
      // Retrieve shortcuts from storage
      const shortcuts = await storage.get<Shortcut[]>('shortcuts') || [];
      
      // Find the requested shortcut
      const shortcut = shortcuts.find(s => s.id === shortcut_id);

      if (!shortcut) {
        return {
          error: `Shortcut with ID "${shortcut_id}" not found. Use shortcuts_list to see available shortcuts.`
        };
      }

      // Execute the shortcut action
      // For now, we'll simulate execution by sending the key combination
      // In a full implementation, this would trigger the actual automation workflow
      
      // Send message to background script to execute shortcut
      await chrome.runtime.sendMessage({
        type: 'EXECUTE_SHORTCUT',
        shortcutId: shortcut_id,
        tabId: context.tabId
      });

      return {
        output: `Executed shortcut "${shortcut.name}" (${shortcut.keys})`
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
      description: 'Execute a saved shortcut by its ID. Use shortcuts_list to see available shortcuts.',
      input_schema: {
        type: 'object' as const,
        properties: {
          shortcut_id: {
            type: 'string',
            description: 'The ID of the shortcut to execute'
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
        description: 'Execute a saved shortcut by its ID. Use shortcuts_list to see available shortcuts.',
        parameters: {
          type: 'object' as const,
          properties: {
            shortcut_id: {
              type: 'string',
              description: 'The ID of the shortcut to execute'
            }
          },
          required: ['shortcut_id']
        }
      }
    };
  }
};
