/**
 * Page Content Tool - Text and HTML Extraction
 * 
 * Provides content extraction capabilities:
 * - get_text: Extract visible text from the page
 * - get_html: Extract DOM HTML
 * - screen_summary: Get accessibility tree with interactive elements
 */

import type { ToolDefinition, ToolContext, ToolResult } from './types';

/**
 * Supported page content actions
 */
type PageContentAction = 'get_text' | 'get_html' | 'screen_summary';

/**
 * Input parameters for page content tool
 */
interface PageContentInput {
  action: PageContentAction;
  selector?: string;
  interactiveOnly?: boolean;
  maxDepth?: number;
}

/**
 * Page Content Tool Definition
 * 
 * Extracts content from web pages in various formats.
 */
export const pageContentTool: ToolDefinition = {
  name: 'page_content',
  description: 'Extract content from web pages: get visible text, HTML structure, or accessibility tree with interactive elements.',
  
  parameters: {
    action: {
      type: 'string',
      description: 'The extraction action to perform',
      required: true,
      enum: ['get_text', 'get_html', 'screen_summary']
    },
    selector: {
      type: 'string',
      description: 'Optional CSS selector to limit extraction to specific element (for get_text and get_html)'
    },
    interactiveOnly: {
      type: 'boolean',
      description: 'For screen_summary: only include interactive elements (default: false)'
    },
    maxDepth: {
      type: 'number',
      description: 'For screen_summary: maximum depth to traverse DOM tree (default: 10)'
    }
  },

  /**
   * Execute page content extraction
   */
  async execute(input: PageContentInput, context: ToolContext): Promise<ToolResult> {
    const { action, selector, interactiveOnly = false, maxDepth = 10 } = input;
    const tabId = context.tabId;

    try {
      switch (action) {
        case 'get_text':
          return await handleGetText(tabId, selector);

        case 'get_html':
          return await handleGetHtml(tabId, selector);

        case 'screen_summary':
          return await handleScreenSummary(tabId, interactiveOnly, maxDepth);

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
      name: 'page_content',
      description: 'Extract content from web pages: get visible text, HTML structure, or accessibility tree with interactive elements.',
      input_schema: {
        type: 'object' as const,
        properties: {
          action: {
            type: 'string',
            enum: ['get_text', 'get_html', 'screen_summary'],
            description: 'The extraction action to perform'
          },
          selector: {
            type: 'string',
            description: 'Optional CSS selector to limit extraction'
          },
          interactiveOnly: {
            type: 'boolean',
            description: 'For screen_summary: only include interactive elements'
          },
          maxDepth: {
            type: 'number',
            description: 'For screen_summary: maximum DOM depth to traverse'
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
        name: 'page_content',
        description: 'Extract content from web pages: get visible text, HTML structure, or accessibility tree with interactive elements.',
        parameters: {
          type: 'object' as const,
          properties: {
            action: {
              type: 'string',
              enum: ['get_text', 'get_html', 'screen_summary'],
              description: 'The extraction action to perform'
            },
            selector: {
              type: 'string',
              description: 'Optional CSS selector to limit extraction'
            },
            interactiveOnly: {
              type: 'boolean',
              description: 'For screen_summary: only include interactive elements'
            },
            maxDepth: {
              type: 'number',
              description: 'For screen_summary: maximum DOM depth to traverse'
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
 * Extract visible text from the page
 */
async function handleGetText(tabId: number, selector?: string): Promise<ToolResult> {
  const result = await chrome.scripting.executeScript({
    target: { tabId },
    func: extractText,
    args: [selector]
  });

  if (!result || result.length === 0 || !result[0].result) {
    return { error: 'Failed to extract text from page' };
  }

  const { text, error } = result[0].result;

  if (error) {
    return { error };
  }

  return {
    output: text || '(No visible text found)'
  };
}

/**
 * Extract HTML from the page
 */
async function handleGetHtml(tabId: number, selector?: string): Promise<ToolResult> {
  const result = await chrome.scripting.executeScript({
    target: { tabId },
    func: extractHtml,
    args: [selector]
  });

  if (!result || result.length === 0 || !result[0].result) {
    return { error: 'Failed to extract HTML from page' };
  }

  const { html, error } = result[0].result;

  if (error) {
    return { error };
  }

  return {
    output: html || '(No HTML found)'
  };
}

/**
 * Generate accessibility tree summary
 */
async function handleScreenSummary(
  tabId: number, 
  interactiveOnly: boolean, 
  maxDepth: number
): Promise<ToolResult> {
  // First, inject the accessibility tree script if not already present
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['src/content/accessibility-tree.js']
    });
  } catch (error) {
    // Script might already be injected, continue
  }

  // Generate the accessibility tree
  const result = await chrome.scripting.executeScript({
    target: { tabId },
    func: generateAccessibilityTree,
    args: [{ interactiveOnly, maxDepth, visibleOnly: true, includeText: true, includeBounds: true }]
  });

  if (!result || result.length === 0 || !result[0].result) {
    return { error: 'Failed to generate accessibility tree' };
  }

  const tree = result[0].result;

  // Format the tree into a readable summary
  const summary = formatAccessibilityTree(tree);

  return {
    output: summary
  };
}

// ===== Helper Functions (executed in page context) =====

/**
 * Extract visible text from page (runs in page context)
 */
function extractText(selector?: string): { text?: string; error?: string } {
  try {
    let element: Element | null = document.body;
    
    if (selector) {
      element = document.querySelector(selector);
      if (!element) {
        return { error: `Element not found: ${selector}` };
      }
    }

    // Get all text nodes
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip script and style elements
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          
          const tagName = parent.tagName.toLowerCase();
          if (tagName === 'script' || tagName === 'style') {
            return NodeFilter.FILTER_REJECT;
          }

          // Check if element is visible
          const style = window.getComputedStyle(parent);
          if (style.display === 'none' || style.visibility === 'hidden') {
            return NodeFilter.FILTER_REJECT;
          }

          // Check if text has content
          const text = node.textContent?.trim();
          if (!text) return NodeFilter.FILTER_REJECT;

          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textParts: string[] = [];
    let node: Node | null;
    
    while ((node = walker.nextNode())) {
      const text = node.textContent?.trim();
      if (text) {
        textParts.push(text);
      }
    }

    return { text: textParts.join('\n') };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Extract HTML from page (runs in page context)
 */
function extractHtml(selector?: string): { html?: string; error?: string } {
  try {
    let element: Element | null = document.body;
    
    if (selector) {
      element = document.querySelector(selector);
      if (!element) {
        return { error: `Element not found: ${selector}` };
      }
    }

    return { html: element.outerHTML };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Generate accessibility tree (runs in page context)
 * This function is defined in accessibility-tree.js
 */
function generateAccessibilityTree(options: any): any {
  // This will be executed in page context where accessibility-tree.js is loaded
  return (window as any).__claudeAccessibilityTree?.generateAccessibilityTree(options);
}

/**
 * Format accessibility tree into readable summary
 */
function formatAccessibilityTree(tree: any): string {
  const lines: string[] = [];
  
  lines.push(`Page: ${tree.title}`);
  lines.push(`URL: ${tree.url}`);
  lines.push(`Viewport: ${tree.viewport.width}x${tree.viewport.height}`);
  lines.push('');
  lines.push('Interactive Elements:');
  lines.push('');

  // Recursively format elements
  function formatElement(element: any, indent: number = 0) {
    const prefix = '  '.repeat(indent);
    
    if (element.ref) {
      // Interactive element with reference
      const bounds = element.bounds 
        ? ` [${element.bounds.x},${element.bounds.y} ${element.bounds.width}x${element.bounds.height}]`
        : '';
      
      lines.push(`${prefix}[${element.ref}] ${element.description}${bounds}`);
    } else if (element.description && element.visible) {
      // Non-interactive but visible element
      lines.push(`${prefix}${element.description}`);
    }

    // Process children
    if (element.children && element.children.length > 0) {
      for (const child of element.children) {
        formatElement(child, indent + 1);
      }
    }
  }

  for (const element of tree.elements) {
    formatElement(element);
  }

  return lines.join('\n');
}
