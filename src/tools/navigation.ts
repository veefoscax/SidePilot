/**
 * Navigation Tool - Web Navigation Actions
 * 
 * Provides browser navigation capabilities including:
 * - Navigate to URLs with validation
 * - Go back in history
 * - Go forward in history
 * - Reload current page
 */

import type { ToolDefinition, ToolContext, ToolResult } from './types';

/**
 * All supported navigation actions
 */
type NavigationAction = 
  | 'navigate' 
  | 'go_back' 
  | 'go_forward' 
  | 'reload';

/**
 * Input parameters for navigation tool actions
 */
interface NavigationInput {
  action: NavigationAction;
  url?: string;
}

/**
 * Validate URL format
 */
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    // Only allow http and https protocols
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Wait for page to finish loading
 */
async function waitForLoad(tabId: number, timeout: number = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error('Page load timeout'));
    }, timeout);

    const listener = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        clearTimeout(timeoutId);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };

    chrome.tabs.onUpdated.addListener(listener);
  });
}

/**
 * Navigation Tool Definition
 * 
 * Provides web navigation through Chrome tabs API.
 * All navigation actions wait for page load completion.
 */
export const navigationTool: ToolDefinition = {
  name: 'web_navigation',
  description: 'Navigate to URLs, go back/forward in history, or reload the current page. Use this for all page navigation.',
  
  parameters: {
    action: {
      type: 'string',
      description: 'The navigation action to perform',
      required: true,
      enum: ['navigate', 'go_back', 'go_forward', 'reload']
    },
    url: {
      type: 'string',
      description: 'URL to navigate to (required for navigate action). Must be a valid http:// or https:// URL.'
    }
  },

  /**
   * Execute navigation tool action
   */
  async execute(input: NavigationInput, context: ToolContext): Promise<ToolResult> {
    const { action, url } = input;
    const tabId = context.tabId;

    try {
      switch (action) {
        case 'navigate':
          return await handleNavigate(tabId, url!);

        case 'go_back':
          return await handleGoBack(tabId);

        case 'go_forward':
          return await handleGoForward(tabId);

        case 'reload':
          return await handleReload(tabId);

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
      name: 'web_navigation',
      description: 'Navigate to URLs, go back/forward in history, or reload the current page. Use this for all page navigation.',
      input_schema: {
        type: 'object' as const,
        properties: {
          action: {
            type: 'string',
            enum: ['navigate', 'go_back', 'go_forward', 'reload'],
            description: 'The navigation action to perform'
          },
          url: {
            type: 'string',
            description: 'URL to navigate to (required for navigate action). Must be a valid http:// or https:// URL.'
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
        name: 'web_navigation',
        description: 'Navigate to URLs, go back/forward in history, or reload the current page. Use this for all page navigation.',
        parameters: {
          type: 'object' as const,
          properties: {
            action: {
              type: 'string',
              enum: ['navigate', 'go_back', 'go_forward', 'reload'],
              description: 'The navigation action to perform'
            },
            url: {
              type: 'string',
              description: 'URL to navigate to (required for navigate action). Must be a valid http:// or https:// URL.'
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
 * Handle navigate action with URL validation
 */
async function handleNavigate(tabId: number, url: string): Promise<ToolResult> {
  if (!url) {
    return { error: 'URL parameter is required for navigate action' };
  }

  // Validate URL format
  if (!isValidUrl(url)) {
    return { 
      error: 'Invalid URL format. URL must start with http:// or https://' 
    };
  }

  try {
    // Navigate to URL
    await chrome.tabs.update(tabId, { url });
    
    // Wait for page to load
    await waitForLoad(tabId);

    return {
      output: `Navigated to ${url}`
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to navigate'
    };
  }
}

/**
 * Handle go back action
 */
async function handleGoBack(tabId: number): Promise<ToolResult> {
  try {
    // Go back in history
    await chrome.tabs.goBack(tabId);
    
    // Wait for page to load
    await waitForLoad(tabId);

    return {
      output: 'Went back in history'
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to go back'
    };
  }
}

/**
 * Handle go forward action
 */
async function handleGoForward(tabId: number): Promise<ToolResult> {
  try {
    // Go forward in history
    await chrome.tabs.goForward(tabId);
    
    // Wait for page to load
    await waitForLoad(tabId);

    return {
      output: 'Went forward in history'
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to go forward'
    };
  }
}

/**
 * Handle reload action
 */
async function handleReload(tabId: number): Promise<ToolResult> {
  try {
    // Reload the page
    await chrome.tabs.reload(tabId);
    
    // Wait for page to load
    await waitForLoad(tabId);

    return {
      output: 'Page reloaded'
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to reload page'
    };
  }
}
