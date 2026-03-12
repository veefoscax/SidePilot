/**
 * Network Tool - Network Request Monitoring
 * 
 * Provides network monitoring capabilities including:
 * - View recent network requests
 * - Filter by URL pattern, method, or status code
 * - View request/response headers
 * - Structured JSON output
 * 
 * Requirements: AC2, AC3
 */

import { cdpWrapper } from '@/lib/cdp-wrapper';
import type { ToolDefinition, ToolContext, ToolResult } from './types';

/**
 * All supported network actions
 */
type NetworkAction = 
  | 'get_requests' 
  | 'get_errors'
  | 'clear_requests';

/**
 * Input parameters for network tool actions
 */
interface NetworkInput {
  action: NetworkAction;
  /** URL substring filter - matches requests containing this string */
  url_filter?: string;
  /** HTTP method filter (GET, POST, PUT, DELETE, etc.) */
  method_filter?: string;
  /** Status code filter (e.g., 200, 404, 500) */
  status_filter?: number;
  /** Resource type filter */
  type_filter?: 'all' | 'xhr' | 'fetch' | 'document' | 'script' | 'stylesheet' | 'image';
  /** Maximum number of requests to return (default: 20) */
  limit?: number;
}

/**
 * Request/Response headers
 */
interface Headers {
  [key: string]: string;
}

/**
 * Network request information with headers
 */
interface NetworkRequest {
  requestId: string;
  url: string;
  method: string;
  type: string;
  status?: number;
  statusText?: string;
  timestamp: number;
  requestHeaders?: Headers;
  responseHeaders?: Headers;
  mimeType?: string;
  contentLength?: number;
  errorBody?: string;
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
 * 
 * Requirements: AC2 (filter by URL pattern), AC3 (capture HTTP requests)
 */
export const networkTool: ToolDefinition = {
  name: 'network_requests',
  description: 'View recent network requests made by the page. Use this to inspect API calls, resource loading, and network activity. Supports filtering by URL pattern, HTTP method, and status code.',
  
  parameters: {
    action: {
      type: 'string',
      description: 'The network action to perform',
      required: true,
      enum: ['get_requests', 'clear_requests']
    },
    url_filter: {
      type: 'string',
      description: 'Filter requests by URL substring (e.g., "api" to match all API calls)'
    },
    method_filter: {
      type: 'string',
      description: 'Filter requests by HTTP method (GET, POST, PUT, DELETE, etc.)'
    },
    status_filter: {
      type: 'number',
      description: 'Filter requests by status code (e.g., 200, 404, 500)'
    },
    type_filter: {
      type: 'string',
      description: 'Filter requests by resource type',
      enum: ['all', 'xhr', 'fetch', 'document', 'script', 'stylesheet', 'image']
    },
    limit: {
      type: 'number',
      description: 'Maximum number of requests to return (default: 20, max: 100)'
    }
  },

  /**
   * Execute network tool action
   */
  async execute(input: NetworkInput, context: ToolContext): Promise<ToolResult> {
    const { 
      action, 
      url_filter, 
      method_filter, 
      status_filter, 
      type_filter = 'all', 
      limit = 20 
    } = input;
    const tabId = context.tabId;

    try {
      // Ensure monitoring is started
      await startMonitoring(tabId);

      switch (action) {
        case 'get_requests':
          return await handleGetRequests(tabId, {
            url_filter,
            method_filter,
            status_filter,
            type_filter,
            limit: Math.min(limit, MAX_REQUESTS)
          });

        case 'get_errors':
          return await handleGetErrors(tabId, limit);

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
      description: 'View recent network requests made by the page. Use "get_errors" to specifically find failing API calls with response bodies.',
      input_schema: {
        type: 'object' as const,
        properties: {
          action: {
            type: 'string',
            enum: ['get_requests', 'get_errors', 'clear_requests'],
            description: 'The network action to perform'
          },
          url_filter: {
            type: 'string',
            description: 'Filter requests by URL substring'
          },
          method_filter: {
            type: 'string',
            description: 'Filter requests by HTTP method'
          },
          status_filter: {
            type: 'number',
            description: 'Filter requests by status code'
          },
          type_filter: {
            type: 'string',
            enum: ['all', 'xhr', 'fetch', 'document', 'script', 'stylesheet', 'image'],
            description: 'Filter requests by resource type'
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
        description: 'View recent network requests made by the page. Use "get_errors" to specifically find failing API calls with response bodies.',
        parameters: {
          type: 'object' as const,
          properties: {
            action: {
              type: 'string',
              enum: ['get_requests', 'get_errors', 'clear_requests'],
              description: 'The network action to perform'
            },
            url_filter: {
              type: 'string',
              description: 'Filter requests by URL substring'
            },
            method_filter: {
              type: 'string',
              description: 'Filter requests by HTTP method'
            },
            status_filter: {
              type: 'number',
              description: 'Filter requests by status code'
            },
            type_filter: {
              type: 'string',
              enum: ['all', 'xhr', 'fetch', 'document', 'script', 'stylesheet', 'image'],
              description: 'Filter requests by resource type'
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
 * Filter options for get_requests
 */
interface FilterOptions {
  url_filter?: string;
  method_filter?: string;
  status_filter?: number;
  type_filter?: string;
  limit: number;
}

/**
 * Structured JSON output for a network request
 */
interface NetworkRequestOutput {
  url: string;
  method: string;
  status: number | null;
  statusText: string | null;
  type: string;
  timestamp: number;
  mimeType: string | null;
  contentLength: number | null;
  requestHeaders: Headers | null;
  responseHeaders: Headers | null;
  errorBody?: string | null;
}

/**
 * Handle get_errors action - returns only failing requests with bodies
 */
async function handleGetErrors(tabId: number, limit: number): Promise<ToolResult> {
  const requests = networkRequests.get(tabId) || [];
  const failingRequests = requests.filter(req => req.status && req.status >= 400).slice(-limit);

  if (failingRequests.length === 0) {
    return {
      output: JSON.stringify({
        count: 0,
        message: 'No failing network requests (4xx/5xx) found.'
      }, null, 2)
    };
  }

  // Try to capture bodies for failing requests
  const outputRequests: NetworkRequestOutput[] = await Promise.all(
    failingRequests.map(async (req) => {
      let errorBody = null;
      try {
        const response = await cdpWrapper.executeCDPCommand(tabId, 'Network.getResponseBody', {
          requestId: req.requestId
        });
        errorBody = response.body;
      } catch (e) {
        // Body might have been evicted or not available
        errorBody = "(Body not available)";
      }

      return {
        url: req.url,
        method: req.method,
        status: req.status ?? null,
        statusText: req.statusText ?? null,
        type: req.type,
        timestamp: req.timestamp,
        mimeType: req.mimeType ?? null,
        contentLength: req.contentLength ?? null,
        requestHeaders: req.requestHeaders ?? null,
        responseHeaders: req.responseHeaders ?? null,
        errorBody
      };
    })
  );

  return {
    output: JSON.stringify({
      count: outputRequests.length,
      message: 'Failing requests detected. Inspect "errorBody" for API error details.',
      requests: outputRequests
    }, null, 2)
  };
}

/**
 * Handle get requests action with filtering
 * 
 * Requirements: AC2 - Return request URL, method, status code with optional URL pattern filter
 */
async function handleGetRequests(
  tabId: number, 
  options: FilterOptions
): Promise<ToolResult> {
  const { url_filter, method_filter, status_filter, type_filter, limit } = options;
  const requests = networkRequests.get(tabId) || [];
  
  // Apply all filters
  let filteredRequests = requests;
  
  // Filter by URL pattern (substring match)
  if (url_filter) {
    filteredRequests = filteredRequests.filter(req => 
      req.url.toLowerCase().includes(url_filter.toLowerCase())
    );
  }
  
  // Filter by HTTP method
  if (method_filter) {
    filteredRequests = filteredRequests.filter(req => 
      req.method.toUpperCase() === method_filter.toUpperCase()
    );
  }
  
  // Filter by status code
  if (status_filter !== undefined) {
    filteredRequests = filteredRequests.filter(req => 
      req.status === status_filter
    );
  }
  
  // Filter by resource type
  if (type_filter && type_filter !== 'all') {
    filteredRequests = filteredRequests.filter(req => 
      req.type.toLowerCase() === type_filter.toLowerCase()
    );
  }
  
  // Limit results (take most recent)
  const limitedRequests = filteredRequests.slice(-limit);
  
  // Format output as structured JSON
  if (limitedRequests.length === 0) {
    return {
      output: JSON.stringify({
        count: 0,
        requests: [],
        message: 'No network requests found matching the filters. The page may not have made any requests yet, or monitoring was not active.'
      }, null, 2)
    };
  }
  
  // Convert to structured output format with headers
  const outputRequests: NetworkRequestOutput[] = limitedRequests.map(req => ({
    url: req.url,
    method: req.method,
    status: req.status ?? null,
    statusText: req.statusText ?? null,
    type: req.type,
    timestamp: req.timestamp,
    mimeType: req.mimeType ?? null,
    contentLength: req.contentLength ?? null,
    requestHeaders: req.requestHeaders ?? null,
    responseHeaders: req.responseHeaders ?? null
  }));
  
  return {
    output: JSON.stringify({
      count: outputRequests.length,
      total_captured: requests.length,
      filters_applied: {
        url: url_filter || null,
        method: method_filter || null,
        status: status_filter ?? null,
        type: type_filter !== 'all' ? type_filter : null
      },
      requests: outputRequests
    }, null, 2)
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
 * 
 * Captures request/response headers as required by AC2
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
      timestamp: params.timestamp,
      requestHeaders: params.request.headers || undefined
    });
  } else if (method === 'Network.responseReceived') {
    // Update request with response status and headers
    const requests = networkRequests.get(tabId) || [];
    const request = requests.find(r => r.requestId === params.requestId);
    if (request) {
      request.status = params.response.status;
      request.statusText = params.response.statusText;
      request.responseHeaders = params.response.headers || undefined;
      request.mimeType = params.response.mimeType;
      
      // Extract content length from headers if available
      const contentLength = params.response.headers?.['content-length'] || 
                           params.response.headers?.['Content-Length'];
      if (contentLength) {
        request.contentLength = parseInt(contentLength, 10);
      }
    }
  }
}
