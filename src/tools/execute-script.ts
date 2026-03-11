/**
 * Execute Script Tool - JavaScript Execution
 * 
 * Allows execution of arbitrary JavaScript in the page context.
 * Provides sandboxed execution with result serialization.
 */

import type { ToolDefinition, ToolContext, ToolResult } from './types';

/**
 * Input parameters for execute script tool
 */
interface ExecuteScriptInput {
  script: string;
  args?: any[];
}

/**
 * Execute Script Tool Definition
 * 
 * Executes JavaScript code in the page context and returns the result.
 * Useful for custom interactions, data extraction, and page manipulation.
 */
export const executeScriptTool: ToolDefinition = {
  name: 'execute_script',
  description: 'Execute JavaScript code in the page context. Returns the result of the script execution. Use this for custom interactions, data extraction, or page manipulation that cannot be achieved with other tools.',

  parameters: {
    script: {
      type: 'string',
      description: 'JavaScript code to execute in the page context. The code should return a value that can be serialized to JSON.',
      required: true
    },
    args: {
      type: 'array',
      description: 'Optional array of arguments to pass to the script. Arguments must be JSON-serializable.'
    }
  },

  /**
   * Execute JavaScript in page context
   */
  async execute(input: ExecuteScriptInput, context: ToolContext): Promise<ToolResult> {
    const { script, args = [] } = input;
    const tabId = context.tabId;

    if (!script || script.trim().length === 0) {
      return { error: 'Script parameter is required and cannot be empty' };
    }

    // Security check: validate script for dangerous patterns
    const securityCheck = validateScriptSecurity(script);
    if (!securityCheck.safe) {
      return {
        error: `Security warning: ${securityCheck.warning}\n\nIf you need to use these patterns, please explain the purpose to the user first.`
      };
    }

    try {
      // Validate that args are JSON-serializable
      try {
        JSON.stringify(args);
      } catch (error) {
        return { error: 'Arguments must be JSON-serializable' };
      }

      // Execute the script in the page context
      const result = await chrome.scripting.executeScript({
        target: { tabId },
        func: executeInPageContext,
        args: [script, args]
      });

      if (!result || result.length === 0) {
        return { error: 'Script execution failed: no result returned' };
      }

      const { success, value, error } = result[0].result;

      if (!success) {
        return { error: `Script execution error: ${error}` };
      }

      // Serialize the result
      let output: string;
      try {
        if (value === undefined) {
          output = 'undefined';
        } else if (value === null) {
          output = 'null';
        } else if (typeof value === 'string') {
          output = value;
        } else {
          output = JSON.stringify(value, null, 2);
        }
      } catch (error) {
        output = String(value);
      }

      return {
        output: `Script executed successfully:\n${output}`
      };
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
      name: 'execute_script',
      description: 'Execute JavaScript code in the page context. Returns the result of the script execution. Use this for custom interactions, data extraction, or page manipulation that cannot be achieved with other tools.',
      input_schema: {
        type: 'object' as const,
        properties: {
          script: {
            type: 'string',
            description: 'JavaScript code to execute in the page context'
          },
          args: {
            type: 'array',
            description: 'Optional array of arguments to pass to the script'
          }
        },
        required: ['script']
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
        name: 'execute_script',
        description: 'Execute JavaScript code in the page context. Returns the result of the script execution. Use this for custom interactions, data extraction, or page manipulation that cannot be achieved with other tools.',
        parameters: {
          type: 'object' as const,
          properties: {
            script: {
              type: 'string',
              description: 'JavaScript code to execute in the page context'
            },
            args: {
              type: 'array',
              description: 'Optional array of arguments to pass to the script'
            }
          },
          required: ['script']
        }
      }
    };
  }
};

// ===== Helper Functions =====

/**
 * Dangerous patterns that could be used for data exfiltration or malicious actions
 */
const DANGEROUS_PATTERNS: { pattern: RegExp; description: string }[] = [
  { pattern: /\bfetch\s*\(/, description: 'Network requests (fetch)' },
  { pattern: /\bXMLHttpRequest\b/, description: 'Network requests (XMLHttpRequest)' },
  { pattern: /\bWebSocket\b/, description: 'WebSocket connections' },
  { pattern: /\blocalStorage\b/, description: 'Local storage access' },
  { pattern: /\bsessionStorage\b/, description: 'Session storage access' },
  { pattern: /\bdocument\.cookie\b/, description: 'Cookie access' },
  { pattern: /\bchrome\.\w+/, description: 'Chrome API access' },
  { pattern: /\bwindow\.open\s*\(/, description: 'Opening new windows' },
  { pattern: /\blocation\s*=/, description: 'Page navigation' },
  { pattern: /\bnavigator\.sendBeacon\b/, description: 'Beacon requests' },
  { pattern: /\beval\s*\(/, description: 'Dynamic code execution (eval)' },
  { pattern: /\bimportScripts\b/, description: 'Script imports' },
];

/**
 * Security result interface
 */
interface SecurityCheckResult {
  safe: boolean;
  warning?: string;
  detectedPatterns?: string[];
}

/**
 * Validate script for dangerous patterns
 * Returns safe=true if no dangerous patterns found
 */
function validateScriptSecurity(script: string): SecurityCheckResult {
  const detectedPatterns: string[] = [];

  for (const { pattern, description } of DANGEROUS_PATTERNS) {
    if (pattern.test(script)) {
      detectedPatterns.push(description);
    }
  }

  if (detectedPatterns.length > 0) {
    return {
      safe: false,
      warning: `Script contains potentially dangerous patterns: ${detectedPatterns.join(', ')}. These could be used for data exfiltration or malicious actions.`,
      detectedPatterns
    };
  }

  return { safe: true };
}

/**
 * Execute script in page context with error handling
 * This function runs in the page context
 */
function executeInPageContext(
  script: string,
  args: any[]
): { success: boolean; value?: any; error?: string } {
  try {
    // Create a function from the script
    // eslint-disable-next-line no-new-func
    const func = new Function(...args.map((_, i) => `arg${i}`), script);

    // Execute the function with provided arguments
    const result = func(...args);

    // Handle promises
    if (result && typeof result.then === 'function') {
      return {
        success: false,
        error: 'Async functions are not supported. Use synchronous code only.'
      };
    }

    return {
      success: true,
      value: result
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
