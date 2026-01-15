/**
 * Accessibility Tool - Accessibility Tree Snapshot
 * 
 * Provides accessibility information including:
 * - Get full accessibility tree
 * - Get accessibility info for specific elements
 * - Analyze page accessibility
 */

import { cdpWrapper } from '@/lib/cdp-wrapper';
import type { ToolDefinition, ToolContext, ToolResult } from './types';

/**
 * All supported accessibility actions
 */
type AccessibilityAction = 
  | 'get_tree' 
  | 'get_element_info';

/**
 * Input parameters for accessibility tool actions
 */
interface AccessibilityInput {
  action: AccessibilityAction;
  coordinate?: [number, number];
  depth?: number;
}

/**
 * Accessibility node information
 */
interface AccessibilityNode {
  role: string;
  name?: string;
  description?: string;
  value?: string;
  children?: AccessibilityNode[];
}

/**
 * Accessibility Tool Definition
 * 
 * Provides accessibility tree information through CDP.
 * Useful for understanding page structure and testing accessibility.
 */
export const accessibilityTool: ToolDefinition = {
  name: 'accessibility_snapshot',
  description: 'Get accessibility tree information from the page. Use this to understand page structure, find elements by role, or test accessibility.',
  
  parameters: {
    action: {
      type: 'string',
      description: 'The accessibility action to perform',
      required: true,
      enum: ['get_tree', 'get_element_info']
    },
    coordinate: {
      type: 'array',
      description: '[x, y] coordinates to get element info at (for get_element_info action)',
      items: {
        type: 'number'
      }
    },
    depth: {
      type: 'number',
      description: 'Maximum depth of tree to return (default: 3, max: 10)'
    }
  },

  /**
   * Execute accessibility tool action
   */
  async execute(input: AccessibilityInput, context: ToolContext): Promise<ToolResult> {
    const { action, coordinate, depth = 3 } = input;
    const tabId = context.tabId;

    try {
      await cdpWrapper.ensureAttached(tabId);

      switch (action) {
        case 'get_tree':
          return await handleGetTree(tabId, depth);

        case 'get_element_info':
          return await handleGetElementInfo(tabId, coordinate!);

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
      name: 'accessibility_snapshot',
      description: 'Get accessibility tree information from the page. Use this to understand page structure, find elements by role, or test accessibility.',
      input_schema: {
        type: 'object' as const,
        properties: {
          action: {
            type: 'string',
            enum: ['get_tree', 'get_element_info'],
            description: 'The accessibility action to perform'
          },
          coordinate: {
            type: 'array',
            items: { type: 'number' },
            description: '[x, y] coordinates to get element info at'
          },
          depth: {
            type: 'number',
            description: 'Maximum depth of tree to return (default: 3, max: 10)'
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
        name: 'accessibility_snapshot',
        description: 'Get accessibility tree information from the page. Use this to understand page structure, find elements by role, or test accessibility.',
        parameters: {
          type: 'object' as const,
          properties: {
            action: {
              type: 'string',
              enum: ['get_tree', 'get_element_info'],
              description: 'The accessibility action to perform'
            },
            coordinate: {
              type: 'array',
              items: { type: 'number' },
              description: '[x, y] coordinates to get element info at'
            },
            depth: {
              type: 'number',
              description: 'Maximum depth of tree to return (default: 3, max: 10)'
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
 * Handle get tree action
 */
async function handleGetTree(tabId: number, depth: number): Promise<ToolResult> {
  try {
    // Enable accessibility
    await cdpWrapper.executeCDPCommand(tabId, 'Accessibility.enable');
    
    // Get full accessibility tree
    const result = await cdpWrapper.executeCDPCommand(tabId, 'Accessibility.getFullAXTree');
    
    if (!result || !result.nodes || result.nodes.length === 0) {
      return {
        output: 'No accessibility tree available. The page may not be fully loaded.'
      };
    }
    
    // Cap depth for safety
    const cappedDepth = Math.min(depth, 10);
    
    // Format tree output
    const tree = formatAccessibilityTree(result.nodes, cappedDepth);
    
    return {
      output: `Accessibility Tree (depth: ${cappedDepth}):\n${tree}`
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to get accessibility tree'
    };
  }
}

/**
 * Handle get element info action
 */
async function handleGetElementInfo(
  tabId: number, 
  coordinate: [number, number]
): Promise<ToolResult> {
  if (!coordinate || coordinate.length !== 2) {
    return { error: 'Invalid coordinate format. Expected [x, y]' };
  }

  const [x, y] = coordinate;

  try {
    // Enable accessibility
    await cdpWrapper.executeCDPCommand(tabId, 'Accessibility.enable');
    
    // Get node at coordinates
    await cdpWrapper.executeCDPCommand(tabId, 'DOM.getDocument');
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
    
    // Get accessibility info for the node
    const axResult = await cdpWrapper.executeCDPCommand(tabId, 'Accessibility.getPartialAXTree', {
      nodeId: nodeResult.nodeId,
      fetchRelatives: true
    });
    
    if (!axResult || !axResult.nodes || axResult.nodes.length === 0) {
      return {
        output: `Element at (${x}, ${y}) has no accessibility information`
      };
    }
    
    // Format element info
    const node = axResult.nodes[0];
    const info = formatAccessibilityNode(node);
    
    return {
      output: `Element at (${x}, ${y}):\n${info}`
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to get element info'
    };
  }
}

// ===== Helper Functions =====

/**
 * Format accessibility tree for display
 */
function formatAccessibilityTree(
  nodes: any[], 
  maxDepth: number, 
  currentDepth: number = 0
): string {
  if (currentDepth >= maxDepth || !nodes || nodes.length === 0) {
    return '';
  }

  const indent = '  '.repeat(currentDepth);
  const lines: string[] = [];

  for (const node of nodes) {
    const role = node.role?.value || 'unknown';
    const name = node.name?.value || '';
    const value = node.value?.value || '';
    
    let line = `${indent}${role}`;
    if (name) line += `: "${name}"`;
    if (value) line += ` = "${value}"`;
    
    lines.push(line);
    
    // Process children
    if (node.childIds && node.childIds.length > 0) {
      const children = nodes.filter(n => node.childIds.includes(n.nodeId));
      const childTree = formatAccessibilityTree(children, maxDepth, currentDepth + 1);
      if (childTree) {
        lines.push(childTree);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Format single accessibility node for display
 */
function formatAccessibilityNode(node: any): string {
  const lines: string[] = [];
  
  if (node.role?.value) {
    lines.push(`Role: ${node.role.value}`);
  }
  
  if (node.name?.value) {
    lines.push(`Name: ${node.name.value}`);
  }
  
  if (node.description?.value) {
    lines.push(`Description: ${node.description.value}`);
  }
  
  if (node.value?.value) {
    lines.push(`Value: ${node.value.value}`);
  }
  
  if (node.properties) {
    for (const prop of node.properties) {
      if (prop.name && prop.value?.value) {
        lines.push(`${prop.name}: ${prop.value.value}`);
      }
    }
  }
  
  return lines.join('\n');
}
