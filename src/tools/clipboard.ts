/**
 * Clipboard Tool
 * 
 * Provides clipboard operations for copy and paste functionality.
 * Uses the Clipboard API for secure clipboard access.
 */

import type { ToolDefinition, ToolContext, ToolResult } from './types';

/**
 * Clipboard action types
 */
type ClipboardAction = 'copy' | 'paste' | 'read';

/**
 * Input parameters for clipboard operations
 */
interface ClipboardInput {
  action: ClipboardAction;
  text?: string;
}

/**
 * Clipboard Tool Definition
 * 
 * Provides copy, paste, and read operations for the system clipboard.
 */
export const clipboardTool: ToolDefinition = {
  name: 'clipboard',
  description: 'Interact with the system clipboard: copy text, paste text, or read clipboard contents.',
  
  parameters: {
    action: {
      type: 'string',
      description: 'The clipboard action to perform',
      required: true,
      enum: ['copy', 'paste', 'read']
    },
    text: {
      type: 'string',
      description: 'Text to copy to clipboard (required for copy action)'
    }
  },

  /**
   * Execute clipboard operation
   */
  async execute(input: ClipboardInput, context: ToolContext): Promise<ToolResult> {
    const { action, text } = input;

    try {
      switch (action) {
        case 'copy':
          return await handleCopy(text, context);

        case 'paste':
          return await handlePaste(context);

        case 'read':
          return await handleRead(context);

        default:
          return { error: `Unknown clipboard action: ${action}` };
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Clipboard operation failed'
      };
    }
  },

  /**
   * Convert to Anthropic (Claude) tool schema
   */
  toAnthropicSchema() {
    return {
      name: 'clipboard',
      description: 'Interact with the system clipboard: copy text, paste text, or read clipboard contents.',
      input_schema: {
        type: 'object' as const,
        properties: {
          action: {
            type: 'string',
            enum: ['copy', 'paste', 'read'],
            description: 'The clipboard action to perform'
          },
          text: {
            type: 'string',
            description: 'Text to copy to clipboard (required for copy action)'
          }
        },
        required: ['action']
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
        name: 'clipboard',
        description: 'Interact with the system clipboard: copy text, paste text, or read clipboard contents.',
        parameters: {
          type: 'object' as const,
          properties: {
            action: {
              type: 'string',
              enum: ['copy', 'paste', 'read'],
              description: 'The clipboard action to perform'
            },
            text: {
              type: 'string',
              description: 'Text to copy to clipboard (required for copy action)'
            }
          },
          required: ['action']
        }
      }
    };
  }
};

// ===== Action Handlers =====

/**
 * Handle copy action - write text to clipboard
 */
async function handleCopy(text: string | undefined, context: ToolContext): Promise<ToolResult> {
  if (!text) {
    return { error: 'Text parameter is required for copy action' };
  }

  try {
    // Execute clipboard write in the page context
    const result = await chrome.scripting.executeScript({
      target: { tabId: context.tabId },
      func: (textToCopy: string) => {
        return navigator.clipboard.writeText(textToCopy)
          .then(() => ({ success: true, text: textToCopy }))
          .catch((error) => ({ success: false, error: error.message }));
      },
      args: [text]
    });

    if (result && result[0]?.result) {
      const { success, error } = result[0].result as { success: boolean; error?: string };
      
      if (success) {
        return {
          output: `Copied to clipboard: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`
        };
      } else {
        return { error: `Failed to copy to clipboard: ${error}` };
      }
    }

    return { error: 'Failed to execute clipboard copy' };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to copy to clipboard'
    };
  }
}

/**
 * Handle paste action - read from clipboard and type it
 */
async function handlePaste(context: ToolContext): Promise<ToolResult> {
  try {
    // Read clipboard contents
    const result = await chrome.scripting.executeScript({
      target: { tabId: context.tabId },
      func: () => {
        return navigator.clipboard.readText()
          .then((text) => ({ success: true, text }))
          .catch((error) => ({ success: false, error: error.message }));
      }
    });

    if (result && result[0]?.result) {
      const { success, text, error } = result[0].result as { 
        success: boolean; 
        text?: string; 
        error?: string 
      };
      
      if (success && text) {
        // Use computer tool to type the clipboard contents
        // For now, just return the text - actual typing would require CDP wrapper
        return {
          output: `Clipboard contents: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`
        };
      } else {
        return { error: `Failed to read clipboard: ${error}` };
      }
    }

    return { error: 'Failed to execute clipboard read' };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to paste from clipboard'
    };
  }
}

/**
 * Handle read action - read clipboard contents without pasting
 */
async function handleRead(context: ToolContext): Promise<ToolResult> {
  try {
    // Read clipboard contents
    const result = await chrome.scripting.executeScript({
      target: { tabId: context.tabId },
      func: () => {
        return navigator.clipboard.readText()
          .then((text) => ({ success: true, text }))
          .catch((error) => ({ success: false, error: error.message }));
      }
    });

    if (result && result[0]?.result) {
      const { success, text, error } = result[0].result as { 
        success: boolean; 
        text?: string; 
        error?: string 
      };
      
      if (success && text !== undefined) {
        if (text.length === 0) {
          return { output: 'Clipboard is empty' };
        }
        
        return {
          output: `Clipboard contents (${text.length} characters):\n${text}`
        };
      } else {
        return { error: `Failed to read clipboard: ${error}` };
      }
    }

    return { error: 'Failed to execute clipboard read' };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to read clipboard'
    };
  }
}
