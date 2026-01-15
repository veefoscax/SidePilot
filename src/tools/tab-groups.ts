/**
 * Tab Groups Tool - Tab Group Management
 * 
 * Provides tab group management capabilities including:
 * - Create new tab groups with title and color
 * - Update group title and color
 * - Add tabs to groups
 * - Remove tabs from groups (ungroup)
 */

import type { ToolDefinition, ToolContext, ToolResult } from './types';

/**
 * All supported tab group actions
 */
type TabGroupAction = 
  | 'create_group' 
  | 'update_group' 
  | 'add_to_group' 
  | 'ungroup';

/**
 * Valid Chrome tab group colors
 */
type TabGroupColor = 
  | 'grey' 
  | 'blue' 
  | 'red' 
  | 'yellow' 
  | 'green' 
  | 'pink' 
  | 'purple' 
  | 'cyan' 
  | 'orange';

/**
 * Input parameters for tab group actions
 */
interface TabGroupInput {
  action: TabGroupAction;
  title?: string;
  color?: TabGroupColor;
  group_id?: number;
  tab_ids?: number[];
}

/**
 * Tab Groups Tool Definition
 * 
 * Provides tab group operations through Chrome tabGroups API.
 * Requires 'tabGroups' permission in manifest.
 */
export const tabGroupsTool: ToolDefinition = {
  name: 'tab_groups',
  description: 'Manage tab groups: create groups with title and color, update group properties, add tabs to groups, or remove tabs from groups.',
  
  parameters: {
    action: {
      type: 'string',
      description: 'The tab group action to perform',
      required: true,
      enum: ['create_group', 'update_group', 'add_to_group', 'ungroup']
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
      description: 'Group ID for update_group, add_to_group, or ungroup actions (required for those actions)'
    },
    tab_ids: {
      type: 'array',
      description: 'Array of tab IDs to add to group (required for add_to_group action) or to ungroup (required for ungroup action)',
      items: {
        type: 'number'
      }
    }
  },

  /**
   * Execute tab group action
   */
  async execute(input: TabGroupInput, context: ToolContext): Promise<ToolResult> {
    const { action, title, color, group_id, tab_ids } = input;

    try {
      switch (action) {
        case 'create_group':
          return await handleCreateGroup(title, color, context.tabId);

        case 'update_group':
          return await handleUpdateGroup(group_id!, title, color);

        case 'add_to_group':
          return await handleAddToGroup(group_id!, tab_ids!);

        case 'ungroup':
          return await handleUngroup(tab_ids!);

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
      description: 'Manage tab groups: create groups with title and color, update group properties, add tabs to groups, or remove tabs from groups.',
      input_schema: {
        type: 'object' as const,
        properties: {
          action: {
            type: 'string',
            enum: ['create_group', 'update_group', 'add_to_group', 'ungroup'],
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
            description: 'Group ID for update_group, add_to_group, or ungroup actions (required for those actions)'
          },
          tab_ids: {
            type: 'array',
            items: { type: 'number' },
            description: 'Array of tab IDs to add to group (required for add_to_group action) or to ungroup (required for ungroup action)'
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
        description: 'Manage tab groups: create groups with title and color, update group properties, add tabs to groups, or remove tabs from groups.',
        parameters: {
          type: 'object' as const,
          properties: {
            action: {
              type: 'string',
              enum: ['create_group', 'update_group', 'add_to_group', 'ungroup'],
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
              description: 'Group ID for update_group, add_to_group, or ungroup actions (required for those actions)'
            },
            tab_ids: {
              type: 'array',
              items: { type: 'number' },
              description: 'Array of tab IDs to add to group (required for add_to_group action) or to ungroup (required for ungroup action)'
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
 * Creates a new tab group with optional title and color
 */
async function handleCreateGroup(
  title?: string,
  color?: TabGroupColor,
  currentTabId?: number
): Promise<ToolResult> {
  try {
    // Create a new group by grouping the current tab (or a new tab)
    // We need at least one tab to create a group
    let tabId = currentTabId;
    
    if (!tabId) {
      // If no current tab, create a new one
      const tab = await chrome.tabs.create({ active: false });
      tabId = tab.id!;
    }

    // Group the tab
    const groupId = await chrome.tabs.group({ tabIds: [tabId] });

    // Update group properties if provided
    const updateProps: chrome.tabGroups.UpdateProperties = {};
    if (title !== undefined) {
      updateProps.title = title;
    }
    if (color !== undefined) {
      updateProps.color = color;
    }

    if (Object.keys(updateProps).length > 0) {
      await chrome.tabGroups.update(groupId, updateProps);
    }

    const titleText = title ? ` with title "${title}"` : '';
    const colorText = color ? ` and color ${color}` : '';

    return {
      output: `Created tab group ${groupId}${titleText}${colorText}`
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to create tab group'
    };
  }
}

/**
 * Handle update_group action
 * Updates a tab group's title and/or color
 */
async function handleUpdateGroup(
  groupId: number,
  title?: string,
  color?: TabGroupColor
): Promise<ToolResult> {
  if (groupId === undefined) {
    return { error: 'group_id parameter is required for update_group action' };
  }

  if (title === undefined && color === undefined) {
    return { error: 'At least one of title or color must be provided for update_group action' };
  }

  try {
    // Verify group exists by getting it
    const group = await chrome.tabGroups.get(groupId);
    
    if (!group) {
      return { error: `Tab group with ID ${groupId} not found` };
    }

    // Update group properties
    const updateProps: chrome.tabGroups.UpdateProperties = {};
    if (title !== undefined) {
      updateProps.title = title;
    }
    if (color !== undefined) {
      updateProps.color = color;
    }

    await chrome.tabGroups.update(groupId, updateProps);

    const updates: string[] = [];
    if (title !== undefined) updates.push(`title to "${title}"`);
    if (color !== undefined) updates.push(`color to ${color}`);

    return {
      output: `Updated tab group ${groupId}: ${updates.join(' and ')}`
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('No group with id')) {
      return { error: `Tab group with ID ${groupId} not found` };
    }
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
    // Verify group exists
    const group = await chrome.tabGroups.get(groupId);
    
    if (!group) {
      return { error: `Tab group with ID ${groupId} not found` };
    }

    // Verify all tabs exist
    for (const tabId of tabIds) {
      try {
        await chrome.tabs.get(tabId);
      } catch {
        return { error: `Tab with ID ${tabId} not found` };
      }
    }

    // Add tabs to group
    await chrome.tabs.group({ groupId, tabIds });

    const tabText = tabIds.length === 1 ? 'tab' : 'tabs';
    const groupTitle = group.title ? ` "${group.title}"` : '';

    return {
      output: `Added ${tabIds.length} ${tabText} to group ${groupId}${groupTitle}`
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('No group with id')) {
      return { error: `Tab group with ID ${groupId} not found` };
    }
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
    // Verify all tabs exist
    for (const tabId of tabIds) {
      try {
        await chrome.tabs.get(tabId);
      } catch {
        return { error: `Tab with ID ${tabId} not found` };
      }
    }

    // Ungroup tabs by setting groupId to -1 (TAB_GROUP_ID_NONE)
    await chrome.tabs.ungroup(tabIds);

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
