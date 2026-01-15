/**
 * Console Tool - Console Log Monitoring
 * 
 * Provides console monitoring capabilities including:
 * - View recent console messages
 * - Filter by log level (log, warn, error, info)
 * - Clear console history
 */

import { cdpWrapper } from '@/lib/cdp-wrapper';
import type { ToolDefinition, ToolContext, ToolResult } from './types';

/**
 * All supported console actions
 */
type ConsoleAction = 
  | 'get_logs' 
  | 'clear_logs';

/**
 * Input parameters for console tool actions
 */
interface ConsoleInput {
  action: ConsoleAction;
  level?: 'all' | 'log' | 'warn' | 'error' | 'info' | 'debug';
  limit?: number;
}

/**
 * Console message information
 */
interface ConsoleMessage {
  level: string;
  text: string;
  timestamp: number;
  url?: string;
  lineNumber?: number;
}

/**
 * Store console messages per tab
 */
const consoleMessages = new Map<number, ConsoleMessage[]>();

/**
 * Maximum number of messages to store per tab
 */
const MAX_MESSAGES = 200;

/**
 * Start monitoring console messages for a tab
 */
async function startMonitoring(tabId: number): Promise<void> {
  try {
    await cdpWrapper.ensureAttached(tabId);
    
    // Enable console tracking
    await cdpWrapper.executeCDPCommand(tabId, 'Runtime.enable');
    await cdpWrapper.executeCDPCommand(tabId, 'Log.enable');
    
    // Initialize message storage
    if (!consoleMessages.has(tabId)) {
      consoleMessages.set(tabId, []);
    }
  } catch (error) {
    console.error('Failed to start console monitoring:', error);
  }
}

/**
 * Add console message to storage
 */
function addMessage(tabId: number, message: ConsoleMessage): void {
  const messages = consoleMessages.get(tabId) || [];
  
  // Add new message
  messages.push(message);
  
  // Keep only the most recent messages
  if (messages.length > MAX_MESSAGES) {
    messages.shift();
  }
  
  consoleMessages.set(tabId, messages);
}

/**
 * Console Tool Definition
 * 
 * Provides console message monitoring through CDP.
 * Tracks all console output for debugging.
 */
export const consoleTool: ToolDefinition = {
  name: 'console_logs',
  description: 'View recent console messages from the page. Use this to inspect console.log, warnings, errors, and debug output.',
  
  parameters: {
    action: {
      type: 'string',
      description: 'The console action to perform',
      required: true,
      enum: ['get_logs', 'clear_logs']
    },
    level: {
      type: 'string',
      description: 'Filter messages by log level (optional)',
      enum: ['all', 'log', 'warn', 'error', 'info', 'debug']
    },
    limit: {
      type: 'number',
      description: 'Maximum number of messages to return (default: 50)'
    }
  },

  /**
   * Execute console tool action
   */
  async execute(input: ConsoleInput, context: ToolContext): Promise<ToolResult> {
    const { action, level = 'all', limit = 50 } = input;
    const tabId = context.tabId;

    try {
      // Ensure monitoring is started
      await startMonitoring(tabId);

      switch (action) {
        case 'get_logs':
          return await handleGetLogs(tabId, level, limit);

        case 'clear_logs':
          return await handleClearLogs(tabId);

        default:
          return { error: `Unknown action: ${action}` };
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  /**
   * Convert to Anthropic (Claude) tool schema
   */
  toAnthropicSchema() {
    return {
      name: 'console_logs',
      description: 'View recent console messages from the page. Use this to inspect console.log, warnings, errors, and debug output.',
      input_schema: {
        type: 'object' as const,
        properties: {
          action: {
            type: 'string',
            enum: ['get_logs', 'clear_logs'],
            description: 'The console action to perform'
          },
          level: {
            type: 'string',
            enum: ['all', 'log', 'warn', 'error', 'info', 'debug'],
            description: 'Filter messages by log level'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of messages to return (default: 50)'
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
        name: 'console_logs',
        description: 'View recent console messages from the page. Use this to inspect console.log, warnings, errors, and debug output.',
        parameters: {
          type: 'object' as const,
          properties: {
            action: {
              type: 'string',
              enum: ['get_logs', 'clear_logs'],
              description: 'The console action to perform'
            },
            level: {
              type: 'string',
              enum: ['all', 'log', 'warn', 'error', 'info', 'debug'],
              description: 'Filter messages by log level'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of messages to return (default: 50)'
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
 * Handle get logs action
 */
async function handleGetLogs(
  tabId: number, 
  level: string, 
  limit: number
): Promise<ToolResult> {
  const messages = consoleMessages.get(tabId) || [];
  
  // Filter messages if needed
  let filteredMessages = messages;
  if (level !== 'all') {
    filteredMessages = messages.filter(msg => 
      msg.level.toLowerCase() === level.toLowerCase()
    );
  }
  
  // Limit results
  const limitedMessages = filteredMessages.slice(-limit);
  
  // Format output
  if (limitedMessages.length === 0) {
    return {
      output: 'No console messages found. The page may not have logged anything yet, or monitoring was not active.'
    };
  }
  
  const output = limitedMessages.map(msg => {
    const location = msg.url && msg.lineNumber 
      ? ` (${msg.url}:${msg.lineNumber})` 
      : '';
    return `[${msg.level.toUpperCase()}] ${msg.text}${location}`;
  }).join('\n');
  
  return {
    output: `Recent console messages (${limitedMessages.length}):\n${output}`
  };
}

/**
 * Handle clear logs action
 */
async function handleClearLogs(tabId: number): Promise<ToolResult> {
  consoleMessages.set(tabId, []);
  
  return {
    output: 'Console message history cleared'
  };
}

/**
 * Export function to handle CDP console events
 * This should be called from the CDP wrapper when console events occur
 */
export function handleConsoleEvent(
  tabId: number, 
  method: string, 
  params: any
): void {
  if (method === 'Runtime.consoleAPICalled') {
    // Extract message text from args
    const text = params.args
      .map((arg: any) => {
        if (arg.value !== undefined) {
          return String(arg.value);
        }
        if (arg.description) {
          return arg.description;
        }
        return arg.type;
      })
      .join(' ');

    addMessage(tabId, {
      level: params.type,
      text,
      timestamp: params.timestamp,
      url: params.stackTrace?.callFrames?.[0]?.url,
      lineNumber: params.stackTrace?.callFrames?.[0]?.lineNumber
    });
  } else if (method === 'Log.entryAdded') {
    addMessage(tabId, {
      level: params.entry.level,
      text: params.entry.text,
      timestamp: params.entry.timestamp,
      url: params.entry.url,
      lineNumber: params.entry.lineNumber
    });
  }
}
