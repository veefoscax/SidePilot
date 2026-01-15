/**
 * Network Tool - Network Request Monitoring
 * 
 * Provides network monitoring capabilities including:
 * - View recent network requests
 * - Filter by request type
 * - View request/response details
 */

import { cdpWrapper } from '@/lib/cdp-wrapper';
import type { ToolDefinition, ToolContext, ToolResult } from './types';

/**
 * All supported network actions
 */
type NetworkAction = 
  | 'get_requests' 
  | 'clear_requests';

/**
 * Input parameters for network tool actions
 */
interface NetworkInput {
  action: NetworkAction;
  filter?: 'all' | 'xhr' | 'fetch' | 'document' | 'script' | 'stylesheet' | 'image';
  limit?: number;
}

/**
 * Network request information
 */
interface NetworkRequest {
  requestId: string;
  url: string;
  method: string;
  type: string;
  status?: number;
  timestamp: number;
}

/**
 * Store network requests per tab
 */
const networkRequests = new Map<number, NetworkRequest[]>();

/**
 * Maximum number of requests to store per tab
 */
const MAX_REQUESTS = 100;

/**
 * Start monitoring network requests for a tab
 */
async function startMonitoring(tabId: number): Promise<void> {
  try {
    await cdpWrapper.ensureAttached(tabId);
    
    // Enable network tracking
    await cdpWrapper.executeCDPCommand(tabId, 'Network.enable');
    
    // Initialize request storage
    if (!networkRequests.has(tabId)) {
      networkRequests.set(tabId, []);
    }
  } catch (error) {
    console.error('Failed to start network monitoring:', error);
  }
}

/**
 * Add network request to storage
 */
function addRequest(tabId: number, request: NetworkRequest): void {
  const requests = networkRequests.get(tabId) || [];
  
  // Add new request
  requests.push(request);
  
  // Keep only the most recent requests
  if (requests.length > MAX_REQUESTS) {
    requests.shift();
  }
  
  networkRequests.set(tabId, requests);
}

/**
 * Network Tool Definition
 * 
 * Provides network request monitoring through CDP.
 * Tracks all network activity for analysis.
 */
export const networkTool: ToolDefinition = {
  name: 'network_requests',
  description: 'View recent network requests made by the page. Use this to inspect API calls, resource loading, and network activity.',
  
  parameters: {
    action: {
      type: 'string',
      description: 'The network action to perform',
      required: true,
      enum: ['get_requests', 'clear_requests']
    },
    filter: {
      type: 'string',
      description: 'Filter requests by type (optional)',
      enum: ['all', 'xhr', 'fetch', 'document', 'script', 'stylesheet', 'image']
    },
    limit: {
      type: 'number',
      description: 'Maximum number of requests to return (default: 20)'
    }
  },

  /**
   * Execute network tool action
   */
  async execute(input: NetworkInput, context: ToolContext): Promise<ToolResult> {
    const { action, filter = 'all', limit = 20 } = input;
    const tabId = context.tabId;

    try {
      // Ensure monitoring is started
      await startMonitoring(tabId);

      switch (action) {
        case 'get_requests':
          return await handleGetRequests(tabId, filter, limit);

        case 'clear_requests':
          return await handleClearRequests(tabId);

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
      name: 'network_requests',
      description: 'View recent network requests made by the page. Use this to inspect API calls, resource loading, and network activity.',
      input_schema: {
        type: 'object' as const,
        properties: {
          action: {
            type: 'string',
            enum: ['get_requests', 'clear_requests'],
            description: 'The network action to perform'
          },
          filter: {
            type: 'string',
            enum: ['all', 'xhr', 'fetch', 'document', 'script', 'stylesheet', 'image'],
            description: 'Filter requests by type'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of requests to return (default: 20)'
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
        name: 'network_requests',
        description: 'View recent network requests made by the page. Use this to inspect API calls, resource loading, and network activity.',
        parameters: {
          type: 'object' as const,
          properties: {
            action: {
              type: 'string',
              enum: ['get_requests', 'clear_requests'],
              description: 'The network action to perform'
            },
            filter: {
              type: 'string',
              enum: ['all', 'xhr', 'fetch', 'document', 'script', 'stylesheet', 'image'],
              description: 'Filter requests by type'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of requests to return (default: 20)'
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
 * Handle get requests action
 */
async function handleGetRequests(
  tabId: number, 
  filter: string, 
  limit: number
): Promise<ToolResult> {
  const requests = networkRequests.get(tabId) || [];
  
  // Filter requests if needed
  let filteredRequests = requests;
  if (filter !== 'all') {
    filteredRequests = requests.filter(req => 
      req.type.toLowerCase() === filter.toLowerCase()
    );
  }
  
  // Limit results
  const limitedRequests = filteredRequests.slice(-limit);
  
  // Format output
  if (limitedRequests.length === 0) {
    return {
      output: 'No network requests found. The page may not have made any requests yet, or monitoring was not active.'
    };
  }
  
  const output = limitedRequests.map(req => {
    const status = req.status ? ` [${req.status}]` : '';
    return `${req.method} ${req.url}${status} (${req.type})`;
  }).join('\n');
  
  return {
    output: `Recent network requests (${limitedRequests.length}):\n${output}`
  };
}

/**
 * Handle clear requests action
 */
async function handleClearRequests(tabId: number): Promise<ToolResult> {
  networkRequests.set(tabId, []);
  
  return {
    output: 'Network request history cleared'
  };
}

/**
 * Export function to handle CDP network events
 * This should be called from the CDP wrapper when network events occur
 */
export function handleNetworkEvent(
  tabId: number, 
  method: string, 
  params: any
): void {
  if (method === 'Network.requestWillBeSent') {
    addRequest(tabId, {
      requestId: params.requestId,
      url: params.request.url,
      method: params.request.method,
      type: params.type || 'other',
      timestamp: params.timestamp
    });
  } else if (method === 'Network.responseReceived') {
    // Update request with response status
    const requests = networkRequests.get(tabId) || [];
    const request = requests.find(r => r.requestId === params.requestId);
    if (request) {
      request.status = params.response.status;
    }
  }
}
