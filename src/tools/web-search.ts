/**
 * Web Search Tool
 * 
 * Provides Google search integration for AI-powered web searches.
 * Opens search results in a new tab.
 */

import type { ToolDefinition, ToolContext, ToolResult } from './types';

/**
 * Input parameters for web search
 */
interface WebSearchInput {
  query: string;
  open_in_new_tab?: boolean;
}

/**
 * Web Search Tool Definition
 * 
 * Performs Google searches and optionally opens results in a new tab.
 */
export const webSearchTool: ToolDefinition = {
  name: 'web_search',
  description: 'Perform a Google search. Opens search results in a new tab or current tab.',
  
  parameters: {
    query: {
      type: 'string',
      description: 'The search query to execute',
      required: true
    },
    open_in_new_tab: {
      type: 'boolean',
      description: 'Whether to open results in a new tab (default: true)'
    }
  },

  /**
   * Execute web search
   */
  async execute(input: WebSearchInput, context: ToolContext): Promise<ToolResult> {
    const { query, open_in_new_tab = true } = input;

    if (!query || query.trim().length === 0) {
      return { error: 'Search query cannot be empty' };
    }

    try {
      // Encode the search query for URL
      const encodedQuery = encodeURIComponent(query.trim());
      const searchUrl = `https://www.google.com/search?q=${encodedQuery}`;

      if (open_in_new_tab) {
        // Create new tab with search results
        const newTab = await chrome.tabs.create({
          url: searchUrl,
          active: true
        });

        return {
          output: `Opened Google search for "${query}" in new tab (ID: ${newTab.id})`
        };
      } else {
        // Navigate current tab to search results
        await chrome.tabs.update(context.tabId, {
          url: searchUrl
        });

        return {
          output: `Navigated to Google search for "${query}"`
        };
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to perform web search'
      };
    }
  },

  /**
   * Convert to Anthropic (Claude) tool schema
   */
  toAnthropicSchema() {
    return {
      name: 'web_search',
      description: 'Perform a Google search. Opens search results in a new tab or current tab.',
      input_schema: {
        type: 'object' as const,
        properties: {
          query: {
            type: 'string',
            description: 'The search query to execute'
          },
          open_in_new_tab: {
            type: 'boolean',
            description: 'Whether to open results in a new tab (default: true)'
          }
        },
        required: ['query']
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
        name: 'web_search',
        description: 'Perform a Google search. Opens search results in a new tab or current tab.',
        parameters: {
          type: 'object' as const,
          properties: {
            query: {
              type: 'string',
              description: 'The search query to execute'
            },
            open_in_new_tab: {
              type: 'boolean',
              description: 'Whether to open results in a new tab (default: true)'
            }
          },
          required: ['query']
        }
      }
    };
  }
};
