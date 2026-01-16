/**
 * Tab Groups Tool - Tab Group Management
 * 
 * Provides tab group management capabilities including:
 * - Create new tab groups with title and color
 * - Update group title, color, and collapsed state
 * - Add tabs to groups
 * - Remove tabs from groups (ungroup)
 * - List all tab groups with their tabs
 * 
 * Uses TabGroupManager from src/lib/tab-groups.ts for all operations.
 */

import type { ToolDefinition, ToolContext, ToolResult } from './types';
import { tabGroupManager, type TabGroupColor } from '../lib/tab-groups';

/**
 * All supported tab group actions
 */
type TabGroupAction = 
  | 'create_group' 
  | 'update_group' 
  | 'add_to_group' 
  | 'ungroup'
  | 'list';

/**
 * Input parameters for tab group actions
 */
interface TabGroupInput {
  action: TabGroupAction;
  title?: string;
  color?: TabGroupColor;
  group_id?: number;
  tab_ids?: number[];
  collapsed?: boolean;
  window_id?: number;
}

/**
 * Tab Groups Tool Definition
 * 
 * Provides tab group operations through Chrome tabGroups API.
 * Requires 'tabGroups' permission in manifest.
 */
export const tabGroupsTool: ToolDefinition = {
  name: 'tab_groups',
  description: 'Manage tab groups: create groups with title and color, update group properties, add tabs to groups, remove tabs from groups, or list all groups.',
  
  parameters: {
    action: {
      type: 'string',
      description: 'The tab group action to perform',
      required: true,
      enum: ['create_group', 'update_group', 'add_to_group', 'ungroup', 'list']
    },
    title: {
      type: 'string',
      description: 'Title for the tab group (used in create_group and update_group actions)'
    },
    color: {
      type: 'string',
      description: 'Color for the tab group (used in create_group and update_group actions)',
      enum: ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange']
    },
    group_id: {
      type: 'number',
      description: 'Group ID for update_group or add_to_group actions (required for those actions)'
    },
    tab_ids: {
      type: 'array',
      description: 'Array of tab IDs for create_group, add_to_group, or ungroup actions',
      items: {
        type: 'number'
      }
    },
    collapsed: {
      type: 'boolean',
      description: 'Whether to collapse the group (used in update_group action)'
    },
    window_id: {
      type: 'number',
      description: 'Window ID to filter groups (used in list action, optional)'
    }
  },

  /**
   * Execute tab group action
   */
  async execute(input: TabGroupInput, context: ToolContext): Promise<ToolResult> {
    const { action, title, color, group_id, tab_ids, collapsed, window_id } = input;

    try {
      switch (action) {
        case 'create_group':
          return await handleCreateGroup(title, tab_ids, color, context.tabId);

        case 'update_group':
          return await handleUpdateGroup(group_id!, title, color, collapsed);

        case 'add_to_group':
          return await handleAddToGroup(group_id!, tab_ids!);

        case 'ungroup':
          return await handleUngroup(tab_ids!);

        case 'list':
          return await handleListGroups(window_id);

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
      name: 'tab_groups',
      description: 'Manage tab groups: create groups with title and color, update group properties, add tabs to groups, remove tabs from groups, or list all groups.',
      input_schema: {
        type: 'object' as const,
        properties: {
          action: {
            type: 'string',
            enum: ['create_group', 'update_group', 'add_to_group', 'ungroup', 'list'],
            description: 'The tab group action to perform'
          },
          title: {
            type: 'string',
            description: 'Title for the tab group (used in create_group and update_group actions)'
          },
          color: {
            type: 'string',
            enum: ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'],
            description: 'Color for the tab group (used in create_group and update_group actions)'
          },
          group_id: {
            type: 'number',
            description: 'Group ID for update_group or add_to_group actions (required for those actions)'
          },
          tab_ids: {
            type: 'array',
            items: { type: 'number' },
            description: 'Array of tab IDs for create_group, add_to_group, or ungroup actions'
          },
          collapsed: {
            type: 'boolean',
            description: 'Whether to collapse the group (used in update_group action)'
          },
          window_id: {
            type: 'number',
            description: 'Window ID to filter groups (used in list action, optional)'
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
        name: 'tab_groups',
        description: 'Manage tab groups: create groups with title and color, update group properties, add tabs to groups, remove tabs from groups, or list all groups.',
        parameters: {
          type: 'object' as const,
          properties: {
            action: {
              type: 'string',
              enum: ['create_group', 'update_group', 'add_to_group', 'ungroup', 'list'],
              description: 'The tab group action to perform'
            },
            title: {
              type: 'string',
              description: 'Title for the tab group (used in create_group and update_group actions)'
            },
            color: {
              type: 'string',
              enum: ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'],
              description: 'Color for the tab group (used in create_group and update_group actions)'
            },
            group_id: {
              type: 'number',
              description: 'Group ID for update_group or add_to_group actions (required for those actions)'
            },
            tab_ids: {
              type: 'array',
              items: { type: 'number' },
              description: 'Array of tab IDs for create_group, add_to_group, or ungroup actions'
            },
            collapsed: {
              type: 'boolean',
              description: 'Whether to collapse the group (used in update_group action)'
            },
            window_id: {
              type: 'number',
              description: 'Window ID to filter groups (used in list action, optional)'
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
 * Handle create_group action
 * Creates a new tab group with specified tabs, title, and color
 */
async function handleCreateGroup(
  title?: string,
  tabIds?: number[],
  color?: TabGroupColor,
  currentTabId?: number
): Promise<ToolResult> {
  try {
    // Determine which tabs to group
    let targetTabIds = tabIds;
    
    if (!targetTabIds || targetTabIds.length === 0) {
      // If no tab IDs provided, use the current tab
      if (currentTabId) {
        targetTabIds = [currentTabId];
      } else {
        // Create a new tab if no current tab
        const tab = await chrome.tabs.create({ active: false });
        targetTabIds = [tab.id!];
      }
    }

    // Use TabGroupManager to create the group
    const groupId = await tabGroupManager.createGroup(
      title || '',
      targetTabIds,
      color
    );

    const titleText = title ? ` with title "${title}"` : '';
    const colorText = color ? ` and color ${color}` : '';
    const tabCount = targetTabIds.length;
    const tabText = tabCount === 1 ? 'tab' : 'tabs';

    return {
      output: `Created tab group ${groupId}${titleText}${colorText} with ${tabCount} ${tabText}`
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to create tab group'
    };
  }
}

/**
 * Handle update_group action
 * Updates a tab group's title, color, and/or collapsed state
 */
async function handleUpdateGroup(
  groupId: number,
  title?: string,
  color?: TabGroupColor,
  collapsed?: boolean
): Promise<ToolResult> {
  if (groupId === undefined) {
    return { error: 'group_id parameter is required for update_group action' };
  }

  if (title === undefined && color === undefined && collapsed === undefined) {
    return { error: 'At least one of title, color, or collapsed must be provided for update_group action' };
  }

  try {
    // Use TabGroupManager to update the group
    await tabGroupManager.updateGroup(groupId, { title, color, collapsed });

    const updates: string[] = [];
    if (title !== undefined) updates.push(`title to "${title}"`);
    if (color !== undefined) updates.push(`color to ${color}`);
    if (collapsed !== undefined) updates.push(collapsed ? 'collapsed' : 'expanded');

    return {
      output: `Updated tab group ${groupId}: ${updates.join(', ')}`
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to update tab group'
    };
  }
}

/**
 * Handle add_to_group action
 * Adds tabs to an existing group
 */
async function handleAddToGroup(
  groupId: number,
  tabIds: number[]
): Promise<ToolResult> {
  if (groupId === undefined) {
    return { error: 'group_id parameter is required for add_to_group action' };
  }

  if (!tabIds || tabIds.length === 0) {
    return { error: 'tab_ids parameter is required and must contain at least one tab ID for add_to_group action' };
  }

  try {
    // Use TabGroupManager to add tabs to the group
    await tabGroupManager.addTabsToGroup(groupId, tabIds);

    // Get group info for the response
    const group = await tabGroupManager.getGroup(groupId);
    const tabText = tabIds.length === 1 ? 'tab' : 'tabs';
    const groupTitle = group.title ? ` "${group.title}"` : '';

    return {
      output: `Added ${tabIds.length} ${tabText} to group ${groupId}${groupTitle}`
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to add tabs to group'
    };
  }
}

/**
 * Handle ungroup action
 * Removes tabs from their groups
 */
async function handleUngroup(tabIds: number[]): Promise<ToolResult> {
  if (!tabIds || tabIds.length === 0) {
    return { error: 'tab_ids parameter is required and must contain at least one tab ID for ungroup action' };
  }

  try {
    // Use TabGroupManager to ungroup tabs
    await tabGroupManager.ungroupTabs(tabIds);

    const tabText = tabIds.length === 1 ? 'tab' : 'tabs';

    return {
      output: `Removed ${tabIds.length} ${tabText} from their group(s)`
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to ungroup tabs'
    };
  }
}

/**
 * Handle list action
 * Lists all tab groups with their tabs
 */
async function handleListGroups(windowId?: number): Promise<ToolResult> {
  try {
    // Use TabGroupManager to list groups
    const groups = await tabGroupManager.listGroups(windowId);

    if (groups.length === 0) {
      return {
        output: 'No tab groups found'
      };
    }

    return {
      output: JSON.stringify(groups, null, 2)
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to list tab groups'
    };
  }
}
