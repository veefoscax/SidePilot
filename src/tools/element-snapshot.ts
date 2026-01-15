/**
 * Element Snapshot Tool - Element Information at Coordinates
 * 
 * Provides detailed element information including:
 * - Get element details at specific coordinates
 * - View element attributes, styles, and properties
 * - Inspect element hierarchy
 */

import { cdpWrapper } from '@/lib/cdp-wrapper';
import type { ToolDefinition, ToolContext, ToolResult } from './types';

/**
 * All supported element snapshot actions
 */
type ElementSnapshotAction = 
  | 'get_element' 
  | 'get_element_styles';

/**
 * Input parameters for element snapshot tool actions
 */
interface ElementSnapshotInput {
  action: ElementSnapshotAction;
  coordinate: [number, number];
  includeStyles?: boolean;
}

/**
 * Element Snapshot Tool Definition
 * 
 * Provides detailed element information through CDP.
 * Useful for inspecting elements and understanding page structure.
 */
export const elementSnapshotTool: ToolDefinition = {
  name: 'element_snapshot',
  description: 'Get detailed information about an element at specific coordinates. Use this to inspect element properties, attributes, and styles.',
  
  parameters: {
    action: {
      type: 'string',
      description: 'The element snapshot action to perform',
      required: true,
      enum: ['get_element', 'get_element_styles']
    },
    coordinate: {
      type: 'array',
      description: '[x, y] coordinates to inspect',
      required: true,
      items: {
        type: 'number'
      }
    },
    includeStyles: {
      type: 'boolean',
      description: 'Include computed styles in the output (default: false)'
    }
  },

  /**
   * Execute element snapshot tool action
   */
  async execute(input: ElementSnapshotInput, context: ToolContext): Promise<ToolResult> {
    const { action, coordinate, includeStyles = false } = input;
    const tabId = context.tabId;

    if (!coordinate || coordinate.length !== 2) {
      return { error: 'Invalid coordinate format. Expected [x, y]' };
    }

    try {
      await cdpWrapper.ensureAttached(tabId);

      switch (action) {
        case 'get_element':
          return await handleGetElement(tabId, coordinate, includeStyles);

        case 'get_element_styles':
          return await handleGetElementStyles(tabId, coordinate);

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
      name: 'element_snapshot',
      description: 'Get detailed information about an element at specific coordinates. Use this to inspect element properties, attributes, and styles.',
      input_schema: {
        type: 'object' as const,
        properties: {
          action: {
            type: 'string',
            enum: ['get_element', 'get_element_styles'],
            description: 'The element snapshot action to perform'
          },
          coordinate: {
            type: 'array',
            items: { type: 'number' },
            description: '[x, y] coordinates to inspect'
          },
          includeStyles: {
            type: 'boolean',
            description: 'Include computed styles in the output'
          }
        },
        required: ['action', 'coordinate']
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
        name: 'element_snapshot',
        description: 'Get detailed information about an element at specific coordinates. Use this to inspect element properties, attributes, and styles.',
        parameters: {
          type: 'object' as const,
          properties: {
            action: {
              type: 'string',
              enum: ['get_element', 'get_element_styles'],
              description: 'The element snapshot action to perform'
            },
            coordinate: {
              type: 'array',
              items: { type: 'number' },
              description: '[x, y] coordinates to inspect'
            },
            includeStyles: {
              type: 'boolean',
              description: 'Include computed styles in the output'
            }
          },
          required: ['action', 'coordinate']
        }
      }
    };
  }
};

// ===== Action Handlers =====

/**
 * Handle get element action
 */
async function handleGetElement(
  tabId: number, 
  coordinate: [number, number],
  includeStyles: boolean
): Promise<ToolResult> {
  const [x, y] = coordinate;

  try {
    // Enable DOM
    await cdpWrapper.executeCDPCommand(tabId, 'DOM.enable');
    
    // Get document
    await cdpWrapper.executeCDPCommand(tabId, 'DOM.getDocument');
    
    // Get node at coordinates
    const nodeResult = await cdpWrapper.executeCDPCommand(tabId, 'DOM.getNodeForLocation', {
      x,
      y,
      includeUserAgentShadowDOM: true
    });
    
    if (!nodeResult || !nodeResult.nodeId) {
      return {
        output: `No element found at coordinates (${x}, ${y})`
      };
    }
    
    // Get node details
    const nodeInfo = await cdpWrapper.executeCDPCommand(tabId, 'DOM.describeNode', {
      nodeId: nodeResult.nodeId
    });
    
    if (!nodeInfo || !nodeInfo.node) {
      return {
        error: 'Failed to get element details'
      };
    }
    
    const node = nodeInfo.node;
    
    // Format element info
    const info: string[] = [];
    info.push(`Tag: <${node.nodeName.toLowerCase()}>`);
    
    if (node.attributes) {
      const attrs: Record<string, string> = {};
      for (let i = 0; i < node.attributes.length; i += 2) {
        attrs[node.attributes[i]] = node.attributes[i + 1];
      }
      
      if (attrs.id) {
        info.push(`ID: ${attrs.id}`);
      }
      
      if (attrs.class) {
        info.push(`Class: ${attrs.class}`);
      }
      
      // Show other attributes
      const otherAttrs = Object.entries(attrs)
        .filter(([key]) => key !== 'id' && key !== 'class')
        .map(([key, value]) => `${key}="${value}"`)
        .join(', ');
      
      if (otherAttrs) {
        info.push(`Attributes: ${otherAttrs}`);
      }
    }
    
    // Get computed styles if requested
    if (includeStyles) {
      const styles = await getComputedStyles(tabId, nodeResult.nodeId);
      if (styles) {
        info.push('\nComputed Styles:');
        for (const [prop, value] of Object.entries(styles)) {
          info.push(`  ${prop}: ${value}`);
        }
      }
    }
    
    return {
      output: `Element at (${x}, ${y}):\n${info.join('\n')}`
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to get element info'
    };
  }
}

/**
 * Handle get element styles action
 */
async function handleGetElementStyles(
  tabId: number, 
  coordinate: [number, number]
): Promise<ToolResult> {
  const [x, y] = coordinate;

  try {
    // Enable DOM and CSS
    await cdpWrapper.executeCDPCommand(tabId, 'DOM.enable');
    await cdpWrapper.executeCDPCommand(tabId, 'CSS.enable');
    
    // Get document
    await cdpWrapper.executeCDPCommand(tabId, 'DOM.getDocument');
    
    // Get node at coordinates
    const nodeResult = await cdpWrapper.executeCDPCommand(tabId, 'DOM.getNodeForLocation', {
      x,
      y,
      includeUserAgentShadowDOM: true
    });
    
    if (!nodeResult || !nodeResult.nodeId) {
      return {
        output: `No element found at coordinates (${x}, ${y})`
      };
    }
    
    // Get computed styles
    const styles = await getComputedStyles(tabId, nodeResult.nodeId);
    
    if (!styles || Object.keys(styles).length === 0) {
      return {
        output: `Element at (${x}, ${y}) has no computed styles`
      };
    }
    
    // Format styles output
    const styleLines = Object.entries(styles)
      .map(([prop, value]) => `  ${prop}: ${value}`)
      .join('\n');
    
    return {
      output: `Computed styles for element at (${x}, ${y}):\n${styleLines}`
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to get element styles'
    };
  }
}

// ===== Helper Functions =====

/**
 * Get computed styles for a node
 */
async function getComputedStyles(
  tabId: number, 
  nodeId: number
): Promise<Record<string, string> | null> {
  try {
    const result = await cdpWrapper.executeCDPCommand(tabId, 'CSS.getComputedStyleForNode', {
      nodeId
    });
    
    if (!result || !result.computedStyle) {
      return null;
    }
    
    // Convert to key-value pairs
    const styles: Record<string, string> = {};
    
    // Get most important styles
    const importantProps = [
      'display', 'position', 'width', 'height', 
      'top', 'left', 'right', 'bottom',
      'margin', 'padding', 'border',
      'background-color', 'color', 'font-size',
      'z-index', 'opacity', 'visibility'
    ];
    
    for (const prop of result.computedStyle) {
      if (importantProps.includes(prop.name)) {
        styles[prop.name] = prop.value;
      }
    }
    
    return styles;
  } catch (error) {
    console.error('Failed to get computed styles:', error);
    return null;
  }
}
