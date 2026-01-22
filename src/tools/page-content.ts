/**
 * Page Content Tool - Text and HTML Extraction
 * 
 * Provides content extraction capabilities:
 * - get_text: Extract visible text from the page
 * - get_html: Extract DOM HTML
 * - get_page_content: Get accessibility tree with refs and filtering options
 */

import { refManager } from '@/lib/context/ref-manager';
import { SnapshotFilter } from '@/lib/context/snapshot-filter';
import type { ToolDefinition, ToolContext, ToolResult } from './types';

/**
 * Supported page content actions
 */
type PageContentAction = 'get_text' | 'get_html' | 'get_page_content';

/**
 * Input parameters for page content tool
 */
interface PageContentInput {
  action: PageContentAction;
  selector?: string;
  // New filtering options for get_page_content
  interactive?: boolean;
  depth?: number;
  scope?: string;
  compact?: boolean;
  includeRefs?: boolean;
  delta?: boolean;
  includeSuggestions?: boolean;
  maxElements?: number;
}

/**
 * Page Content Tool Definition
 * 
 * Extracts content from web pages in various formats with advanced filtering.
 */
export const pageContentTool: ToolDefinition = {
  name: 'get_page_content',
  description: 'Extract content from web pages: get visible text, HTML structure, or filtered accessibility tree with element references.',
  
  parameters: {
    action: {
      type: 'string',
      description: 'The extraction action to perform',
      required: false,
      enum: ['get_text', 'get_html', 'get_page_content']
    },
    selector: {
      type: 'string',
      description: 'Optional CSS selector to limit extraction to specific element (for get_text and get_html)'
    },
    // New filtering parameters
    interactive: {
      type: 'boolean',
      description: 'Only include interactive elements (buttons, links, inputs, etc.)'
    },
    depth: {
      type: 'number',
      description: 'Maximum depth to traverse DOM tree'
    },
    scope: {
      type: 'string',
      description: 'CSS selector to scope the extraction to a specific part of the page'
    },
    compact: {
      type: 'boolean',
      description: 'Remove empty/structural nodes to reduce output size'
    },
    includeRefs: {
      type: 'boolean',
      description: 'Include element references (@ref) for targeting (default: true)'
    },
    delta: {
      type: 'boolean',
      description: 'Only return changes since last snapshot (for incremental updates)'
    },
    includeSuggestions: {
      type: 'boolean',
      description: 'Include smart action suggestions based on page type'
    },
    maxElements: {
      type: 'number',
      description: 'Maximum number of elements to include in output'
    }
  },

  /**
   * Execute page content extraction
   */
  async execute(input: PageContentInput, context: ToolContext): Promise<ToolResult> {
    const { 
      action = 'get_page_content', 
      selector, 
      interactive, 
      depth, 
      scope, 
      compact, 
      includeRefs = true, 
      delta, 
      includeSuggestions,
      maxElements
    } = input;
    const tabId = context.tabId;

    try {
      switch (action) {
        case 'get_text':
          return await handleGetText(tabId, selector);

        case 'get_html':
          return await handleGetHtml(tabId, selector);

        case 'get_page_content':
          return await handleGetPageContent(tabId, {
            interactive,
            depth,
            scope,
            compact,
            includeRefs,
            delta,
            includeSuggestions,
            maxElements
          });

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
      name: 'get_page_content',
      description: 'Extract content from web pages: get visible text, HTML structure, or filtered accessibility tree with element references.',
      input_schema: {
        type: 'object' as const,
        properties: {
          action: {
            type: 'string',
            enum: ['get_text', 'get_html', 'get_page_content'],
            description: 'The extraction action to perform (default: get_page_content)'
          },
          selector: {
            type: 'string',
            description: 'Optional CSS selector to limit extraction'
          },
          interactive: {
            type: 'boolean',
            description: 'Only include interactive elements'
          },
          depth: {
            type: 'number',
            description: 'Maximum DOM depth to traverse'
          },
          scope: {
            type: 'string',
            description: 'CSS selector to scope extraction'
          },
          compact: {
            type: 'boolean',
            description: 'Remove empty/structural nodes'
          },
          includeRefs: {
            type: 'boolean',
            description: 'Include element references for targeting'
          },
          delta: {
            type: 'boolean',
            description: 'Only return changes since last snapshot'
          },
          includeSuggestions: {
            type: 'boolean',
            description: 'Include smart action suggestions'
          },
          maxElements: {
            type: 'number',
            description: 'Maximum number of elements to include'
          }
        },
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
        name: 'get_page_content',
        description: 'Extract content from web pages: get visible text, HTML structure, or filtered accessibility tree with element references.',
        parameters: {
          type: 'object' as const,
          properties: {
            action: {
              type: 'string',
              enum: ['get_text', 'get_html', 'get_page_content'],
              description: 'The extraction action to perform (default: get_page_content)'
            },
            selector: {
              type: 'string',
              description: 'Optional CSS selector to limit extraction'
            },
            interactive: {
              type: 'boolean',
              description: 'Only include interactive elements'
            },
            depth: {
              type: 'number',
              description: 'Maximum DOM depth to traverse'
            },
            scope: {
              type: 'string',
              description: 'CSS selector to scope extraction'
            },
            compact: {
              type: 'boolean',
              description: 'Remove empty/structural nodes'
            },
            includeRefs: {
              type: 'boolean',
              description: 'Include element references for targeting'
            },
            delta: {
              type: 'boolean',
              description: 'Only return changes since last snapshot'
            },
            includeSuggestions: {
              type: 'boolean',
              description: 'Include smart action suggestions'
            },
            maxElements: {
              type: 'number',
              description: 'Maximum number of elements to include'
            }
          },
          required: []
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
 * Get page content with advanced filtering and ref assignment
 */
async function handleGetPageContent(
  tabId: number, 
  options: {
    interactive?: boolean;
    depth?: number;
    scope?: string;
    compact?: boolean;
    includeRefs?: boolean;
    delta?: boolean;
    includeSuggestions?: boolean;
    maxElements?: number;
  }
): Promise<ToolResult> {
  try {
    // Execute in page context to generate accessibility tree and assign refs
    const result = await chrome.scripting.executeScript({
      target: { tabId },
      func: generatePageSnapshot,
      args: [options]
    });

    if (!result || result.length === 0 || !result[0].result) {
      return { error: 'Failed to generate page content' };
    }

    const snapshot = result[0].result;

    if (snapshot.error) {
      return { error: snapshot.error };
    }

    // Apply filtering using SnapshotFilter
    const filter = new SnapshotFilter({
      interactive: options.interactive,
      depth: options.depth,
      scope: options.scope,
      compact: options.compact,
      includeRefs: options.includeRefs,
      maxElements: options.maxElements,
      includeVisibility: true
    });

    const filteredSnapshot = filter.filter(snapshot.tree);

    // Format the output
    let output = '';
    
    if (snapshot.pageInfo) {
      output += `Page: ${snapshot.pageInfo.title}\n`;
      output += `URL: ${snapshot.pageInfo.url}\n`;
      output += `Elements: ${filteredSnapshot.stats.filteredNodes}/${filteredSnapshot.stats.originalNodes} (${filteredSnapshot.stats.reduction}% reduction)\n`;
      output += '\n';
    }

    if (snapshot.suggestions && snapshot.suggestions.length > 0) {
      output += `[PAGE TYPE: ${snapshot.pageType} (confidence: ${snapshot.confidence})]\n`;
      output += 'Suggested actions:\n';
      for (const suggestion of snapshot.suggestions) {
        output += `${suggestion.priority}. ${suggestion.description}\n`;
      }
      output += '\n';
    }

    if (snapshot.type === 'delta') {
      output += `[DELTA since ${new Date(snapshot.timestamp).toLocaleTimeString()}]\n`;
      if (snapshot.changes) {
        for (const added of snapshot.changes.added || []) {
          output += `+ ${formatElementFromMetadata(added)}\n`;
        }
        for (const modified of snapshot.changes.modified || []) {
          output += `~ ${formatElementFromMetadata(modified)}\n`;
        }
        for (const removedRef of snapshot.changes.removed || []) {
          output += `- [was ${removedRef}]\n`;
        }
      }
    } else {
      output += filteredSnapshot.tree || 'No content found';
    }

    return { output };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to get page content'
    };
  }
}

/**
 * Generate page snapshot with accessibility tree (runs in page context)
 */
function generatePageSnapshot(options: any): any {
  try {
    // Build accessibility tree
    const tree = buildAccessibilityTree(document.body, options);
    
    return {
      type: 'full',
      tree,
      pageInfo: {
        title: document.title,
        url: window.location.href
      }
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Build accessibility tree from DOM (runs in page context)
 */
function buildAccessibilityTree(element: Element, options: any, depth: number = 0): any {
  const node: any = {
    tagName: element.tagName,
    role: getElementRole(element),
    children: []
  };

  // Add name if available
  const name = getElementName(element);
  if (name) {
    node.name = name;
  }

  // Add bounds if element is visible
  if (element instanceof HTMLElement) {
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      node.bounds = {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      };
      node.visible = true;
    } else {
      node.visible = false;
    }
  }

  // Add text content if available
  const textContent = element.textContent?.trim();
  if (textContent && textContent.length <= 200) {
    node.textContent = textContent;
  }

  // Add attributes
  const attributes: Record<string, string> = {};
  for (const attr of element.attributes) {
    attributes[attr.name] = attr.value;
  }
  if (Object.keys(attributes).length > 0) {
    node.attributes = attributes;
  }

  // Add ref if this is an interactive element
  if (isElementInteractive(element)) {
    // Generate a simple ref for now
    const ref = `e${Math.random().toString(36).substr(2, 9)}`;
    node.ref = ref;
  }

  // Add children (respecting depth limit)
  if (!options.depth || depth < options.depth) {
    for (const child of Array.from(element.children)) {
      const childNode = buildAccessibilityTree(child, options, depth + 1);
      node.children.push(childNode);
    }
  }

  return node;
}

/**
 * Format element from metadata
 */
function formatElementFromMetadata(metadata: any): string {
  const parts: string[] = [];
  
  if (metadata.role && metadata.role !== 'generic') {
    parts.push(metadata.role);
  } else {
    parts.push(metadata.tagName);
  }

  if (metadata.name) {
    parts.push(`"${metadata.name}"`);
  }

  if (metadata.ref) {
    parts.push(`[ref=${metadata.ref}]`);
  }

  return parts.join(' ');
}

/**
 * Generate filtered snapshot with refs (runs in page context)
 */
function generateFilteredSnapshot(options: any): any {
  try {
    // Import RefManager functionality into page context
    // This is a simplified version that works in the browser
    const refManager = (window as any).__refManager || createPageRefManager();
    (window as any).__refManager = refManager;

    // Assign refs to elements based on filter options
    const assignments = refManager.assignRefs(document.body, options);
    
    // Generate accessibility tree with refs
    const elements: any[] = [];
    const visited = new Set<Element>();

    function traverseElement(element: Element, depth: number = 0): void {
      if (visited.has(element) || (options.depth && depth > options.depth)) {
        return;
      }
      visited.add(element);

      const ref = refManager.getRef(element);
      const isInteractive = isElementInteractive(element);
      
      // Apply filters
      if (options.interactive && !isInteractive) {
        // Skip non-interactive elements if interactive filter is on
      } else if (options.compact && isEmptyStructural(element)) {
        // Skip empty structural elements if compact filter is on
      } else {
        // Include this element
        const elementInfo: any = {
          tagName: element.tagName.toLowerCase(),
          role: getElementRole(element),
          name: getElementName(element),
          interactable: isInteractive
        };

        if (ref && options.includeRefs !== false) {
          elementInfo.ref = ref;
        }

        elements.push(elementInfo);
      }

      // Traverse children
      for (const child of Array.from(element.children)) {
        if (options.maxElements && elements.length >= options.maxElements) {
          break;
        }
        traverseElement(child, depth + 1);
      }
    }

    // Start traversal from scope or body
    const startElement = options.scope ? 
      document.querySelector(options.scope) || document.body : 
      document.body;
    
    traverseElement(startElement);

    // Format output
    const content = elements.map(formatElement).join('\n');

    return {
      type: 'full',
      content,
      pageInfo: {
        title: document.title,
        url: window.location.href
      },
      stats: {
        originalNodes: document.querySelectorAll('*').length,
        filteredNodes: elements.length,
        reduction: Math.round((1 - elements.length / document.querySelectorAll('*').length) * 100)
      }
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Create a simple ref manager for page context
 */
function createPageRefManager() {
  const elementToRef = new WeakMap<Element, string>();
  const refToElement = new Map<string, Element>();
  let counter = 0;

  return {
    assignRefs(root: Element, options: any = {}) {
      const assignments: any[] = [];
      const visited = new Set<Element>();

      function traverse(element: Element, depth: number = 0) {
        if (visited.has(element) || (options.depth && depth > options.depth)) {
          return;
        }
        visited.add(element);

        if (depth > 0 && shouldAssignRef(element, options)) {
          const ref = `e${++counter}`;
          elementToRef.set(element, ref);
          refToElement.set(ref, element);
          assignments.push({ ref, element });
        }

        for (const child of Array.from(element.children)) {
          if (options.maxElements && assignments.length >= options.maxElements) {
            break;
          }
          traverse(child, depth + 1);
        }
      }

      traverse(root);
      return assignments;
    },

    getRef(element: Element): string | undefined {
      return elementToRef.get(element);
    }
  };

  function shouldAssignRef(element: Element, options: any): boolean {
    const isInteractive = isElementInteractive(element);
    
    if (options.compact && isEmptyStructural(element)) {
      return false;
    }

    if (options.interactive === false) {
      return true; // Include all elements
    }

    // Default: only interactive elements
    return isInteractive;
  }
}

/**
 * Check if element is interactive (page context version)
 */
function isElementInteractive(element: Element): boolean {
  const tagName = element.tagName.toLowerCase();
  const role = element.getAttribute('role');

  const interactiveTags = ['a', 'button', 'input', 'select', 'textarea', 'details', 'summary'];
  const interactiveRoles = ['button', 'link', 'textbox', 'checkbox', 'radio', 'combobox', 'listbox', 'menuitem', 'tab', 'slider', 'searchbox', 'spinbutton', 'switch'];

  if (interactiveTags.includes(tagName)) return true;
  if (role && interactiveRoles.includes(role)) return true;
  if (element.hasAttribute('onclick') || element.hasAttribute('tabindex')) return true;
  if (element.getAttribute('contenteditable') === 'true') return true;

  return false;
}

/**
 * Check if element is empty/structural
 */
function isEmptyStructural(element: Element): boolean {
  const tagName = element.tagName.toLowerCase();
  const structuralTags = ['div', 'span', 'section', 'article', 'aside', 'header', 'footer', 'main'];
  
  if (!structuralTags.includes(tagName)) return false;

  const textContent = element.textContent?.trim() || '';
  const hasInteractiveChildren = element.querySelector('a,button,input,select,textarea');
  
  return textContent.length === 0 && !hasInteractiveChildren;
}

/**
 * Get element role
 */
function getElementRole(element: Element): string {
  const explicitRole = element.getAttribute('role');
  if (explicitRole) return explicitRole;

  const tagName = element.tagName.toLowerCase();
  const implicitRoles: Record<string, string> = {
    'a': 'link',
    'button': 'button',
    'input': getInputRole(element as HTMLInputElement),
    'select': 'combobox',
    'textarea': 'textbox',
    'h1': 'heading', 'h2': 'heading', 'h3': 'heading', 'h4': 'heading', 'h5': 'heading', 'h6': 'heading',
    'img': 'img',
    'nav': 'navigation',
    'main': 'main',
    'article': 'article',
    'section': 'region',
    'aside': 'complementary',
    'header': 'banner',
    'footer': 'contentinfo'
  };

  return implicitRoles[tagName] || 'generic';
}

/**
 * Get input role by type
 */
function getInputRole(input: HTMLInputElement): string {
  const type = (input.type || 'text').toLowerCase();
  const inputRoles: Record<string, string> = {
    'text': 'textbox', 'email': 'textbox', 'password': 'textbox', 'search': 'searchbox',
    'tel': 'textbox', 'url': 'textbox', 'number': 'spinbutton', 'range': 'slider',
    'checkbox': 'checkbox', 'radio': 'radio', 'submit': 'button', 'button': 'button',
    'reset': 'button', 'file': 'button'
  };
  return inputRoles[type] || 'textbox';
}

/**
 * Get element name
 */
function getElementName(element: Element): string | undefined {
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel.trim();

  const tagName = element.tagName.toLowerCase();
  
  if (tagName === 'input' || tagName === 'select' || tagName === 'textarea') {
    const placeholder = element.getAttribute('placeholder');
    if (placeholder) return placeholder.trim();
  }

  if (tagName === 'button' || tagName === 'a') {
    const textContent = element.textContent?.trim();
    if (textContent) return textContent;
  }

  if (tagName === 'img') {
    const alt = element.getAttribute('alt');
    if (alt) return alt.trim();
  }

  const textContent = element.textContent?.trim();
  if (textContent && textContent.length <= 100) {
    return textContent;
  }

  return undefined;
}

/**
 * Format element for output
 */
function formatElement(element: any): string {
  const parts: string[] = [];
  
  if (element.role && element.role !== 'generic') {
    parts.push(element.role);
  } else {
    parts.push(element.tagName);
  }

  if (element.name) {
    parts.push(`"${element.name}"`);
  }

  if (element.ref) {
    parts.push(`[ref=${element.ref}]`);
  }

  return parts.join(' ');
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
