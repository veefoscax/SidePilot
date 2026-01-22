/**
 * Browser Automation Tools
 * 
 * Exposes CDP wrapper functionality as tools that can be called by LLMs
 */

import { cdpWrapper } from '@/lib/cdp-wrapper';
import { resolveSelector } from '@/lib/context/ref-manager';
import { Tool, ToolResult } from './types';

/**
 * Screenshot Tool - Capture and annotate page screenshots
 */
export const screenshotTool: Tool = {
  name: 'screenshot',
  description: 'Capture a screenshot of the current page with optional element annotations and highlighting',
  parameters: [
    {
      name: 'annotate',
      type: 'boolean',
      description: 'Whether to annotate elements with bounding boxes and indices',
      required: false
    },
    {
      name: 'highlightRefs',
      type: 'array',
      description: 'Array of element references to highlight',
      required: false,
      items: { name: 'ref', type: 'string', description: 'Element reference ID', required: true }
    },
    {
      name: 'fullPage',
      type: 'boolean',
      description: 'Capture full page instead of just viewport',
      required: false
    }
  ],
  execute: async (params): Promise<ToolResult> => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]) {
        return { success: false, error: 'No active tab found' };
      }

      const result = await cdpWrapper.screenshot(tabs[0].id!, {
        annotate: params.annotate ?? true,
        highlightRefs: params.highlightRefs ?? [],
        fullPage: params.fullPage ?? false,
        format: 'png'
      });

      return {
        success: true,
        data: {
          width: result.width,
          height: result.height,
          elementCount: result.elements?.length ?? 0
        },
        screenshot: result.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Screenshot failed'
      };
    }
  }
};

/**
 * Click Tool - Click on elements using various targeting methods
 */
export const clickTool: Tool = {
  name: 'click',
  description: 'Click on an element using coordinates, element reference (@ref), index, or description',
  parameters: [
    {
      name: 'target',
      type: 'object',
      description: 'Target specification - use one of: coordinates {x, y}, ref {ref}, selector {selector}, index {index}, or description {description}',
      required: true,
      properties: {
        x: { name: 'x', type: 'number', description: 'X coordinate', required: false },
        y: { name: 'y', type: 'number', description: 'Y coordinate', required: false },
        ref: { name: 'ref', type: 'string', description: 'Element reference ID (e.g., "@e1" or "e1")', required: false },
        selector: { name: 'selector', type: 'string', description: 'CSS selector or @ref format (e.g., "@e1", "button.primary")', required: false },
        index: { name: 'index', type: 'number', description: 'Element index from screenshot annotation', required: false },
        description: { name: 'description', type: 'string', description: 'Natural language description of element', required: false }
      }
    },
    {
      name: 'clickType',
      type: 'string',
      description: 'Type of click: "left", "right", "double", or "triple"',
      required: false
    }
  ],
  execute: async (params): Promise<ToolResult> => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]) {
        return { success: false, error: 'No active tab found' };
      }

      const { target, clickType = 'left' } = params;
      
      // Handle @ref or CSS selector format
      if (target.selector) {
        try {
          const element = resolveSelector(target.selector);
          if (element) {
            // Convert element to coordinates for CDP wrapper
            const rect = element.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            target.x = x;
            target.y = y;
          }
        } catch (error) {
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Failed to resolve selector' 
          };
        }
      }
      
      let result;
      switch (clickType) {
        case 'right':
          result = await cdpWrapper.rightClick(tabs[0].id!, target);
          break;
        case 'double':
          result = await cdpWrapper.doubleClick(tabs[0].id!, target);
          break;
        case 'triple':
          result = await cdpWrapper.tripleClick(tabs[0].id!, target);
          break;
        default:
          result = await cdpWrapper.click(tabs[0].id!, target);
      }

      return {
        success: true,
        data: { clickType, target: result.target }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Click failed'
      };
    }
  }
};

/**
 * Type Tool - Type text into input fields
 */
export const typeTool: Tool = {
  name: 'type',
  description: 'Type text into an input field or text area',
  parameters: [
    {
      name: 'text',
      type: 'string',
      description: 'Text to type',
      required: true
    },
    {
      name: 'target',
      type: 'object',
      description: 'Target input field - use ref, selector, index, or description',
      required: false,
      properties: {
        ref: { name: 'ref', type: 'string', description: 'Element reference ID (e.g., "@e1" or "e1")', required: false },
        selector: { name: 'selector', type: 'string', description: 'CSS selector or @ref format (e.g., "@e1", "input[name=email]")', required: false },
        index: { name: 'index', type: 'number', description: 'Element index', required: false },
        description: { name: 'description', type: 'string', description: 'Description of input field', required: false }
      }
    },
    {
      name: 'delay',
      type: 'string',
      description: 'Typing speed: "human", "fast", or "instant"',
      required: false
    },
    {
      name: 'clear',
      type: 'boolean',
      description: 'Clear field before typing',
      required: false
    }
  ],
  execute: async (params): Promise<ToolResult> => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]) {
        return { success: false, error: 'No active tab found' };
      }

      const { text, target, delay = 'human', clear = false } = params;

      // Handle @ref or CSS selector format
      if (target?.selector) {
        try {
          const element = resolveSelector(target.selector);
          if (element) {
            // Focus the element first
            element.focus();
            
            // Clear if requested
            if (clear && (element as HTMLInputElement).value !== undefined) {
              (element as HTMLInputElement).value = '';
            }
            
            // Type the text
            await cdpWrapper.type(tabs[0].id!, text, { delay });
          } else {
            return { success: false, error: 'Element not found' };
          }
        } catch (error) {
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Failed to resolve selector' 
          };
        }
      } else if (target) {
        // Use CDP wrapper's existing target resolution
        await cdpWrapper.input(tabs[0].id!, target, text, { clear });
      } else {
        // Type at current focus
        await cdpWrapper.type(tabs[0].id!, text, { delay });
      }

      return {
        success: true,
        data: { text: text.substring(0, 50) + (text.length > 50 ? '...' : ''), delay, clear }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Type failed'
      };
    }
  }
};

/**
 * Navigate Tool - Navigate to URLs or search
 */
export const navigateTool: Tool = {
  name: 'navigate',
  description: 'Navigate to a URL or perform a search',
  parameters: [
    {
      name: 'url',
      type: 'string',
      description: 'URL to navigate to (optional if using search)',
      required: false
    },
    {
      name: 'search',
      type: 'object',
      description: 'Search parameters (optional if using url)',
      required: false,
      properties: {
        query: { name: 'query', type: 'string', description: 'Search query', required: true },
        engine: { name: 'engine', type: 'string', description: 'Search engine: "google", "duckduckgo", or "bing"', required: false }
      }
    }
  ],
  execute: async (params): Promise<ToolResult> => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]) {
        return { success: false, error: 'No active tab found' };
      }

      if (params.url) {
        await cdpWrapper.navigate(tabs[0].id!, params.url);
        return {
          success: true,
          data: { action: 'navigate', url: params.url }
        };
      } else if (params.search) {
        const { query, engine = 'duckduckgo' } = params.search;
        await cdpWrapper.search(tabs[0].id!, query, engine);
        return {
          success: true,
          data: { action: 'search', query, engine }
        };
      } else {
        return { success: false, error: 'Either url or search parameters required' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Navigation failed'
      };
    }
  }
};

/**
 * Wait Tool - Wait for elements or conditions
 */
export const waitTool: Tool = {
  name: 'wait',
  description: 'Wait for elements to appear, page to load, or specific conditions',
  parameters: [
    {
      name: 'type',
      type: 'string',
      description: 'Wait type: "element", "navigation", "network", "time", "text", "url"',
      required: true
    },
    {
      name: 'target',
      type: 'string',
      description: 'Target to wait for (element ref/description, text content, URL pattern, or seconds for time)',
      required: true
    },
    {
      name: 'timeout',
      type: 'number',
      description: 'Timeout in milliseconds (default: 10000)',
      required: false
    }
  ],
  execute: async (params): Promise<ToolResult> => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]) {
        return { success: false, error: 'No active tab found' };
      }

      const { type, target, timeout = 10000 } = params;

      switch (type) {
        case 'element':
          await cdpWrapper.waitForElement(tabs[0].id!, { description: target, timeout });
          break;
        case 'navigation':
          await cdpWrapper.waitForNavigation(tabs[0].id!, timeout);
          break;
        case 'network':
          await cdpWrapper.waitForNetworkIdle(tabs[0].id!, 500, timeout);
          break;
        case 'time':
          await cdpWrapper.wait(tabs[0].id!, parseInt(target));
          break;
        case 'text':
          await cdpWrapper.waitForText(tabs[0].id!, target, timeout);
          break;
        case 'url':
          await cdpWrapper.waitForUrl(tabs[0].id!, target, timeout);
          break;
        default:
          return { success: false, error: `Unknown wait type: ${type}` };
      }

      return {
        success: true,
        data: { type, target, timeout }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Wait failed'
      };
    }
  }
};

/**
 * Extract Tool - Extract content from the page
 */
export const extractTool: Tool = {
  name: 'extract',
  description: 'Extract text, HTML, links, or structured data from the page',
  parameters: [
    {
      name: 'type',
      type: 'string',
      description: 'Extraction type: "text", "html", "links", "images", "structured"',
      required: true
    },
    {
      name: 'schema',
      type: 'object',
      description: 'Schema for structured extraction (required for type "structured")',
      required: false
    }
  ],
  execute: async (params): Promise<ToolResult> => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]) {
        return { success: false, error: 'No active tab found' };
      }

      const { type, schema } = params;
      let result;

      switch (type) {
        case 'text':
          result = await cdpWrapper.getText(tabs[0].id!);
          break;
        case 'html':
          result = await cdpWrapper.getHtml(tabs[0].id!);
          break;
        case 'links':
          result = await cdpWrapper.getLinks(tabs[0].id!);
          break;
        case 'images':
          result = await cdpWrapper.getImages(tabs[0].id!);
          break;
        case 'structured':
          if (!schema) {
            return { success: false, error: 'Schema required for structured extraction' };
          }
          result = await cdpWrapper.extract(tabs[0].id!, schema);
          break;
        default:
          return { success: false, error: `Unknown extraction type: ${type}` };
      }

      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Extraction failed'
      };
    }
  }
};

// Export all browser tools
export const browserTools: Tool[] = [
  screenshotTool,
  clickTool,
  typeTool,
  navigateTool,
  waitTool,
  extractTool
];