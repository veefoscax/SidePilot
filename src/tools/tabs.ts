/**
 * Tab Management Tool - Tab Operations
 * 
 * Provides tab management capabilities including:
 * - Create new tabs with optional URL
 * - Close tabs by ID
 * - Switch to tabs (bring to focus)
 * - List all tabs with metadata
 */

import type { ToolDefinition, ToolContext, ToolResult } from './types';

/**
 * All supported tab management actions
 */
type TabAction =
  | 'create_tab'
  | 'close_tab'
  | 'switch_tab'
  | 'list_tabs'
  | 'group_tabs'
  | 'ungroup_tabs'
  | 'list_groups';

/**
 * Input parameters for tab management actions
 */
interface TabInput {
  action: TabAction;
  url?: string;
  tab_id?: number;
  tab_ids?: number[];
  group_id?: number;
  group_title?: string;
  group_color?: chrome.tabGroups.Color;
}

/**
 * Tab metadata for list_tabs action
 */
interface TabMetadata {
  id: number;
  title: string;
  url: string;
  active: boolean;
  index: number;
  windowId: number;
  groupId?: number;
  favIconUrl?: string;
}

/**
 * Tab Group metadata
 */
interface GroupMetadata {
  id: number;
  title?: string;
  color: string;
  collapsed: boolean;
  windowId: number;
}

/**
 * Validate URL format
 */
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    // Allow http, https, and chrome extension URLs
    return url.protocol === 'http:' ||
      url.protocol === 'https:' ||
      url.protocol === 'chrome-extension:';
  } catch {
    return false;
  }
}

/**
 * Tab Management Tool Definition
 * 
 * Provides tab operations through Chrome tabs API.
 */
export const tabsTool: ToolDefinition = {
  name: 'tab_management',
  description: 'Manage browser tabs and groups. Create, close, switch tabs, or organize them into named color-coded groups.',

  parameters: {
    action: {
      type: 'string',
      description: 'The tab management action to perform',
      required: true,
      enum: ['create_tab', 'close_tab', 'switch_tab', 'list_tabs', 'group_tabs', 'ungroup_tabs', 'list_groups']
    },
    url: {
      type: 'string',
      description: 'URL to open in new tab (optional for create_tab action).'
    },
    tab_id: {
      type: 'number',
      description: 'Single tab ID for close_tab or switch_tab actions.'
    },
    tab_ids: {
      type: 'array',
      items: { type: 'number' },
      description: 'List of tab IDs for group_tabs or ungroup_tabs.'
    },
    group_id: {
      type: 'number',
      description: 'Group ID to add tabs to or modify.'
    },
    group_title: {
      type: 'string',
      description: 'Title for the tab group.'
    },
    group_color: {
      type: 'string',
      description: 'Color for the tab group',
      enum: ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange']
    }
  },

  /**
   * Execute tab management action
   */
  async execute(input: TabInput, _context: ToolContext): Promise<ToolResult> {
    const { action, url, tab_id, tab_ids, group_id, group_title, group_color } = input;

    try {
      switch (action) {
        case 'create_tab':
          return await handleCreateTab(url);
        case 'close_tab':
          return await handleCloseTab(tab_id!);
        case 'switch_tab':
          return await handleSwitchTab(tab_id!);
        case 'list_tabs':
          return await handleListTabs();
        case 'group_tabs':
          return await handleGroupTabs(tab_ids!, group_id, group_title, group_color);
        case 'ungroup_tabs':
          return await handleUngroupTabs(tab_ids!);
        case 'list_groups':
          return await handleListGroups();
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
      name: 'tab_management',
      description: 'Manage browser tabs and groups. Create, close, switch tabs, or organize them into named color-coded groups.',
      input_schema: {
        type: 'object' as const,
        properties: {
          action: {
            type: 'string',
            enum: ['create_tab', 'close_tab', 'switch_tab', 'list_tabs', 'group_tabs', 'ungroup_tabs', 'list_groups'],
            description: 'The tab management action to perform'
          },
          url: {
            type: 'string',
            description: 'URL to open in new tab (optional for create_tab action).'
          },
          tab_id: {
            type: 'number',
            description: 'Single tab ID for close_tab or switch_tab actions.'
          },
          tab_ids: {
            type: 'array',
            items: { type: 'number' },
            description: 'List of tab IDs for grouping operations.'
          },
          group_id: {
            type: 'number',
            description: 'Group ID to add tabs to.'
          },
          group_title: {
            type: 'string',
            description: 'Title for the new or existing group.'
          },
          group_color: {
            type: 'string',
            enum: ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'],
            description: 'Color for the group.'
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
        name: 'tab_management',
        description: 'Manage browser tabs and groups. Create, close, switch tabs, or organize them into named color-coded groups.',
        parameters: {
          type: 'object' as const,
          properties: {
            action: {
              type: 'string',
              enum: ['create_tab', 'close_tab', 'switch_tab', 'list_tabs', 'group_tabs', 'ungroup_tabs', 'list_groups'],
              description: 'The tab management action to perform'
            },
            url: {
              type: 'string',
              description: 'URL to open in new tab (optional for create_tab action).'
            },
            tab_id: {
              type: 'number',
              description: 'Single tab ID for close_tab or switch_tab actions.'
            },
            tab_ids: {
              type: 'array',
              items: { type: 'number' },
              description: 'List of tab IDs for grouping operations.'
            },
            group_id: {
              type: 'number',
              description: 'Group ID to add tabs to.'
            },
            group_title: {
              type: 'string',
              description: 'Title for the new or existing group.'
            },
            group_color: {
              type: 'string',
              enum: ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'],
              description: 'Color for the group.'
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
 * Handle group_tabs action
 */
async function handleGroupTabs(
  tabIds: number[], 
  groupId?: number, 
  title?: string, 
  color?: chrome.tabGroups.Color
): Promise<ToolResult> {
  if (!tabIds || tabIds.length === 0) {
    return { error: 'tab_ids parameter is required for group_tabs action' };
  }

  try {
    const group = await chrome.tabs.group({
      tabIds,
      groupId: groupId || undefined
    });

    if (title || color) {
      await chrome.tabGroups.update(group, {
        title: title || undefined,
        color: color || undefined
      });
    }

    return {
      output: `Grouped ${tabIds.length} tabs into group ${group}${title ? ` ("${title}")` : ''}`
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to group tabs' };
  }
}

/**
 * Handle ungroup_tabs action
 */
async function handleUngroupTabs(tabIds: number[]): Promise<ToolResult> {
  if (!tabIds || tabIds.length === 0) {
    return { error: 'tab_ids parameter is required for ungroup_tabs action' };
  }

  try {
    await chrome.tabs.ungroup(tabIds);
    return { output: `Ungrouped ${tabIds.length} tabs` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to ungroup tabs' };
  }
}

/**
 * Handle list_groups action
 */
async function handleListGroups(): Promise<ToolResult> {
  try {
    const groups = await chrome.tabGroups.query({});
    if (groups.length === 0) {
      return { output: 'No tab groups found' };
    }

    const groupsMetadata: GroupMetadata[] = groups.map(g => ({
      id: g.id,
      title: g.title,
      color: g.color,
      collapsed: g.collapsed,
      windowId: g.windowId
    }));

    const output = groupsMetadata.map(g => 
      `Group ${g.id}: ${g.title || 'Untitled'} (Color: ${g.color}, Collapsed: ${g.collapsed})`
    ).join('\n');

    return { output: `Found ${groups.length} group(s):\n${output}` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to list groups' };
  }
}

/**
 * Handle create_tab action
 * Creates a new tab with optional URL
 */
async function handleCreateTab(url?: string): Promise<ToolResult> {
  try {
    // Validate URL if provided
    if (url && !isValidUrl(url)) {
      return {
        error: 'Invalid URL format. URL must start with http:// or https://'
      };
    }

    // Create new tab
    const tab = await chrome.tabs.create({
      url: url || undefined, // undefined opens new tab page
      active: true // Make the new tab active
    });

    if (!tab.id) {
      return { error: 'Failed to create tab: no tab ID returned' };
    }

    const message = url
      ? `Created new tab (ID: ${tab.id}) and navigated to ${url}`
      : `Created new tab (ID: ${tab.id})`;

    return {
      output: message
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to create tab'
    };
  }
}

/**
 * Handle close_tab action
 * Closes a tab by ID
 */
async function handleCloseTab(tabId: number): Promise<ToolResult> {
  if (!tabId) {
    return { error: 'tab_id parameter is required for close_tab action' };
  }

  try {
    // Verify tab exists before closing
    const tab = await chrome.tabs.get(tabId);

    if (!tab) {
      return { error: `Tab with ID ${tabId} not found` };
    }

    // Close the tab
    await chrome.tabs.remove(tabId);

    return {
      output: `Closed tab ${tabId} (${tab.title || 'Untitled'})`
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('No tab with id')) {
      return { error: `Tab with ID ${tabId} not found` };
    }
    return {
      error: error instanceof Error ? error.message : 'Failed to close tab'
    };
  }
}

/**
 * Handle switch_tab action
 * Switches to a tab (brings it to focus)
 */
async function handleSwitchTab(tabId: number): Promise<ToolResult> {
  if (!tabId) {
    return { error: 'tab_id parameter is required for switch_tab action' };
  }

  try {
    // Get tab to verify it exists and get its window
    const tab = await chrome.tabs.get(tabId);

    if (!tab) {
      return { error: `Tab with ID ${tabId} not found` };
    }

    // Update tab to make it active
    await chrome.tabs.update(tabId, { active: true });

    // Focus the window containing the tab
    if (tab.windowId) {
      await chrome.windows.update(tab.windowId, { focused: true });
    }

    return {
      output: `Switched to tab ${tabId} (${tab.title || 'Untitled'})`
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('No tab with id')) {
      return { error: `Tab with ID ${tabId} not found` };
    }
    return {
      error: error instanceof Error ? error.message : 'Failed to switch tab'
    };
  }
}

/**
 * Handle list_tabs action
 * Lists all tabs with metadata
 */
async function handleListTabs(): Promise<ToolResult> {
  try {
    // Query all tabs in all windows
    const tabs = await chrome.tabs.query({});

    // Map to metadata format
    const tabsMetadata: TabMetadata[] = tabs.map(tab => ({
      id: tab.id!,
      title: tab.title || 'Untitled',
      url: tab.url || '',
      active: tab.active,
      index: tab.index,
      windowId: tab.windowId,
      groupId: tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE ? tab.groupId : undefined,
      favIconUrl: tab.favIconUrl
    }));

    // Format output as readable text
    const output = formatTabsList(tabsMetadata);

    return {
      output
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to list tabs'
    };
  }
}

/**
 * Format tabs list as readable text
 */
function formatTabsList(tabs: TabMetadata[]): string {
  if (tabs.length === 0) {
    return 'No tabs open';
  }

  const lines: string[] = [`Found ${tabs.length} tab(s):\n`];

  // Group tabs by window
  const tabsByWindow = new Map<number, TabMetadata[]>();
  for (const tab of tabs) {
    if (!tabsByWindow.has(tab.windowId)) {
      tabsByWindow.set(tab.windowId, []);
    }
    tabsByWindow.get(tab.windowId)!.push(tab);
  }

  // Format each window's tabs
  for (const [windowId, windowTabs] of tabsByWindow) {
    lines.push(`\nWindow ${windowId}:`);

    for (const tab of windowTabs) {
      const activeMarker = tab.active ? '* ' : '  ';
      const groupMarker = tab.groupId !== undefined ? ` [Group ${tab.groupId}]` : '';
      lines.push(`${activeMarker}Tab ${tab.id}: ${tab.title}${groupMarker}`);
      lines.push(`    URL: ${tab.url}`);
    }
  }

  return lines.join('\n');
}
