/**
 * Computer Tool - Mouse and Keyboard Actions
 * 
 * Provides comprehensive browser automation capabilities including:
 * - Screenshots
 * - Mouse clicks (left, right, double, triple)
 * - Keyboard input with human-like delays
 * - Scrolling
 * - Drag operations
 * - Wait actions
 */

import { cdpWrapper } from '@/lib/cdp-wrapper';
import type { ToolDefinition, ToolContext, ToolResult } from './types';

/**
 * All supported computer actions
 */
type ComputerAction = 
  | 'screenshot' 
  | 'left_click' 
  | 'right_click' 
  | 'double_click' 
  | 'triple_click' 
  | 'type' 
  | 'key' 
  | 'scroll' 
  | 'wait' 
  | 'left_click_drag' 
  | 'zoom';

/**
 * Input parameters for computer tool actions
 */
interface ComputerInput {
  action: ComputerAction;
  coordinate?: [number, number];
  text?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
  start_coordinate?: [number, number];
  region?: [number, number, number, number];
}

/**
 * Computer Tool Definition
 * 
 * Provides low-level browser automation through CDP wrapper.
 * All actions use human-like delays to avoid detection.
 */
export const computerTool: ToolDefinition = {
  name: 'computer',
  description: 'Interact with the browser: take screenshots, click, type, scroll, wait, and more. Use this for all mouse and keyboard interactions.',
  
  parameters: {
    action: {
      type: 'string',
      description: 'The action to perform',
      required: true,
      enum: [
        'screenshot', 
        'left_click', 
        'right_click', 
        'double_click', 
        'triple_click', 
        'type', 
        'key', 
        'scroll', 
        'wait', 
        'left_click_drag', 
        'zoom'
      ]
    },
    coordinate: {
      type: 'array',
      description: '[x, y] coordinates for click/scroll actions. Required for click and scroll actions.',
      items: {
        type: 'number'
      }
    },
    text: {
      type: 'string',
      description: 'Text to type (for type action) or key combination (for key action, e.g., "Ctrl+A", "Enter")'
    },
    direction: {
      type: 'string',
      description: 'Scroll direction (for scroll action)',
      enum: ['up', 'down', 'left', 'right']
    },
    duration: {
      type: 'number',
      description: 'Wait duration in seconds (for wait action, max 30 seconds)'
    },
    start_coordinate: {
      type: 'array',
      description: '[x, y] starting coordinates for drag action',
      items: {
        type: 'number'
      }
    },
    region: {
      type: 'array',
      description: '[x0, y0, x1, y1] region coordinates for zoom screenshot',
      items: {
        type: 'number'
      }
    }
  },

  /**
   * Execute computer tool action
   */
  async execute(input: ComputerInput, context: ToolContext): Promise<ToolResult> {
    const { action, coordinate, text, direction, duration, start_coordinate, region } = input;
    const tabId = context.tabId;

    try {
      // Ensure CDP is attached
      await cdpWrapper.ensureAttached(tabId);

      switch (action) {
        case 'screenshot':
          return await handleScreenshot(tabId);

        case 'left_click':
          return await handleClick(tabId, coordinate!, 'left', 1);

        case 'right_click':
          return await handleClick(tabId, coordinate!, 'right', 1);

        case 'double_click':
          return await handleClick(tabId, coordinate!, 'left', 2);

        case 'triple_click':
          return await handleClick(tabId, coordinate!, 'left', 3);

        case 'type':
          return await handleType(tabId, text!);

        case 'key':
          return await handleKey(tabId, text!);

        case 'scroll':
          return await handleScroll(tabId, coordinate!, direction!);

        case 'wait':
          return await handleWait(duration!);

        case 'left_click_drag':
          return await handleDrag(tabId, start_coordinate!, coordinate!);

        case 'zoom':
          return await handleZoom(tabId, region!);

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
      name: 'computer',
      description: 'Interact with the browser: take screenshots, click, type, scroll, wait, and more. Use this for all mouse and keyboard interactions.',
      input_schema: {
        type: 'object' as const,
        properties: {
          action: {
            type: 'string',
            enum: [
              'screenshot', 
              'left_click', 
              'right_click', 
              'double_click', 
              'triple_click', 
              'type', 
              'key', 
              'scroll', 
              'wait', 
              'left_click_drag', 
              'zoom'
            ],
            description: 'The action to perform'
          },
          coordinate: {
            type: 'array',
            items: { type: 'number' },
            description: '[x, y] coordinates for click/scroll actions'
          },
          text: {
            type: 'string',
            description: 'Text to type or key combination to press'
          },
          direction: {
            type: 'string',
            enum: ['up', 'down', 'left', 'right'],
            description: 'Scroll direction'
          },
          duration: {
            type: 'number',
            description: 'Wait duration in seconds (max 30)'
          },
          start_coordinate: {
            type: 'array',
            items: { type: 'number' },
            description: '[x, y] starting coordinates for drag'
          },
          region: {
            type: 'array',
            items: { type: 'number' },
            description: '[x0, y0, x1, y1] region for zoom screenshot'
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
        name: 'computer',
        description: 'Interact with the browser: take screenshots, click, type, scroll, wait, and more. Use this for all mouse and keyboard interactions.',
        parameters: {
          type: 'object' as const,
          properties: {
            action: {
              type: 'string',
              enum: [
                'screenshot', 
                'left_click', 
                'right_click', 
                'double_click', 
                'triple_click', 
                'type', 
                'key', 
                'scroll', 
                'wait', 
                'left_click_drag', 
                'zoom'
              ],
              description: 'The action to perform'
            },
            coordinate: {
              type: 'array',
              items: { type: 'number' },
              description: '[x, y] coordinates for click/scroll actions'
            },
            text: {
              type: 'string',
              description: 'Text to type or key combination to press'
            },
            direction: {
              type: 'string',
              enum: ['up', 'down', 'left', 'right'],
              description: 'Scroll direction'
            },
            duration: {
              type: 'number',
              description: 'Wait duration in seconds (max 30)'
            },
            start_coordinate: {
              type: 'array',
              items: { type: 'number' },
              description: '[x, y] starting coordinates for drag'
            },
            region: {
              type: 'array',
              items: { type: 'number' },
              description: '[x0, y0, x1, y1] region for zoom screenshot'
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
 * Handle screenshot action
 */
async function handleScreenshot(tabId: number): Promise<ToolResult> {
  const result = await cdpWrapper.screenshot(tabId);
  
  return {
    output: `Screenshot captured (${result.width}x${result.height}, DPR: ${result.devicePixelRatio})`,
    screenshot: `data:image/png;base64,${result.data}`
  };
}

/**
 * Handle click actions (left, right, double, triple)
 */
async function handleClick(
  tabId: number, 
  coordinate: [number, number], 
  button: 'left' | 'right', 
  clickCount: number
): Promise<ToolResult> {
  if (!coordinate || coordinate.length !== 2) {
    return { error: 'Invalid coordinate format. Expected [x, y]' };
  }

  const [x, y] = coordinate;
  
  await cdpWrapper.click(tabId, x, y, {
    button,
    clickCount,
    delay: 'human'
  });

  const clickType = clickCount === 1 ? '' : 
                   clickCount === 2 ? 'Double-' : 
                   'Triple-';
  const buttonName = button === 'left' ? 'Left' : 'Right';
  
  return {
    output: `${clickType}${buttonName} clicked at (${x}, ${y})`
  };
}

/**
 * Handle type action with human-like delays
 */
async function handleType(tabId: number, text: string): Promise<ToolResult> {
  if (!text) {
    return { error: 'Text parameter is required for type action' };
  }

  await cdpWrapper.type(tabId, text, {
    delay: 'human'
  });

  return {
    output: `Typed: "${text}"`
  };
}

/**
 * Handle key press action (special keys and combinations)
 */
async function handleKey(tabId: number, key: string): Promise<ToolResult> {
  if (!key) {
    return { error: 'Key parameter is required for key action' };
  }

  // Handle key combinations (e.g., "Ctrl+A", "Shift+Tab")
  if (key.includes('+')) {
    await cdpWrapper.pressKeyChord(tabId, key);
  } else {
    // Single key press
    await cdpWrapper.pressKey(tabId, key);
  }

  return {
    output: `Pressed key: ${key}`
  };
}

/**
 * Handle scroll action
 */
async function handleScroll(
  tabId: number, 
  coordinate: [number, number], 
  direction: 'up' | 'down' | 'left' | 'right'
): Promise<ToolResult> {
  if (!direction) {
    return { error: 'Direction parameter is required for scroll action' };
  }

  // Default scroll amount (pixels)
  const scrollAmount = 100;

  await cdpWrapper.scroll(tabId, direction, scrollAmount);

  return {
    output: `Scrolled ${direction} by ${scrollAmount}px`
  };
}

/**
 * Handle wait action
 */
async function handleWait(duration: number): Promise<ToolResult> {
  if (!duration || duration <= 0) {
    return { error: 'Duration must be a positive number' };
  }

  // Cap at 30 seconds for safety
  const cappedDuration = Math.min(duration, 30);
  
  await new Promise(resolve => setTimeout(resolve, cappedDuration * 1000));

  return {
    output: `Waited ${cappedDuration} seconds`
  };
}

/**
 * Handle drag action
 */
async function handleDrag(
  tabId: number, 
  startCoordinate: [number, number], 
  endCoordinate: [number, number]
): Promise<ToolResult> {
  if (!startCoordinate || startCoordinate.length !== 2) {
    return { error: 'Invalid start_coordinate format. Expected [x, y]' };
  }

  if (!endCoordinate || endCoordinate.length !== 2) {
    return { error: 'Invalid coordinate format. Expected [x, y]' };
  }

  const [startX, startY] = startCoordinate;
  const [endX, endY] = endCoordinate;

  await cdpWrapper.leftClickDrag(tabId, startX, startY, endX, endY);

  return {
    output: `Dragged from (${startX}, ${startY}) to (${endX}, ${endY})`
  };
}

/**
 * Handle zoom screenshot action
 */
async function handleZoom(
  tabId: number, 
  region: [number, number, number, number]
): Promise<ToolResult> {
  if (!region || region.length !== 4) {
    return { error: 'Invalid region format. Expected [x0, y0, x1, y1]' };
  }

  const [x0, y0, x1, y1] = region;

  // For now, take a regular screenshot
  // TODO: Implement region-specific screenshot cropping
  const result = await cdpWrapper.screenshot(tabId);

  return {
    output: `Zoom screenshot captured for region (${x0}, ${y0}) to (${x1}, ${y1})`,
    screenshot: `data:image/png;base64,${result.data}`
  };
}
