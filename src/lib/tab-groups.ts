/**
 * Tab Groups Manager - Core Tab Group Management
 * 
 * Provides a singleton class for managing Chrome tab groups.
 * Uses Chrome's tabGroups API for all operations.
 * 
 * Requirements: AC1, AC2
 */

/**
 * Valid Chrome tab group colors
 */
export type TabGroupColor = 
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
 * Tab group information with associated tabs
 */
export interface TabGroup {
  /** Unique group identifier */
  id: number;
  /** Group title (may be empty string) */
  title: string;
  /** Group color */
  color: chrome.tabGroups.ColorEnum;
  /** Whether the group is collapsed */
  collapsed: boolean;
  /** IDs of tabs in this group */
  tabIds: number[];
}

/**
 * Options for updating a tab group
 */
export interface UpdateGroupOptions {
  /** New title for the group */
  title?: string;
  /** New color for the group */
  color?: TabGroupColor;
  /** Whether to collapse the group */
  collapsed?: boolean;
}

/**
 * TabGroupManager - Singleton class for managing Chrome tab groups
 * 
 * Provides methods to create, update, ungroup, and list tab groups
 * using Chrome's tabGroups API.
 */
export class TabGroupManager {
  private static instance: TabGroupManager | null = null;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

  /**
   * Get the singleton instance of TabGroupManager
   */
  public static getInstance(): TabGroupManager {
    if (!TabGroupManager.instance) {
      TabGroupManager.instance = new TabGroupManager();
    }
    return TabGroupManager.instance;
  }

  /**
   * Create a new tab group with the specified tabs
   * 
   * @param title - Title for the new group
   * @param tabIds - Array of tab IDs to include in the group
   * @param color - Optional color for the group (defaults to 'blue')
   * @returns The ID of the newly created group
   * @throws Error if no tab IDs provided or if grouping fails
   * 
   * Requirements: AC1
   */
  async createGroup(title: string, tabIds: number[], color?: TabGroupColor): Promise<number> {
    if (!tabIds || tabIds.length === 0) {
      throw new Error('At least one tab ID is required to create a group');
    }

    // Validate that all tabs exist
    for (const tabId of tabIds) {
      try {
        await chrome.tabs.get(tabId);
      } catch {
        throw new Error(`Tab with ID ${tabId} not found`);
      }
    }

    // Create the group by grouping the tabs
    const groupId = await chrome.tabs.group({ tabIds });

    // Update group properties
    const updateProps: chrome.tabGroups.UpdateProperties = {
      title,
      color: (color || 'blue') as chrome.tabGroups.ColorEnum
    };

    await chrome.tabGroups.update(groupId, updateProps);

    return groupId;
  }

  /**
   * Update an existing tab group's properties
   * 
   * @param groupId - ID of the group to update
   * @param options - Properties to update (title, color, collapsed)
   * @throws Error if group not found or update fails
   * 
   * Requirements: AC2
   */
  async updateGroup(groupId: number, options: UpdateGroupOptions): Promise<void> {
    if (groupId === undefined || groupId === null) {
      throw new Error('Group ID is required');
    }

    // Verify group exists
    try {
      await chrome.tabGroups.get(groupId);
    } catch {
      throw new Error(`Tab group with ID ${groupId} not found`);
    }

    // Build update properties
    const updateProps: chrome.tabGroups.UpdateProperties = {};
    
    if (options.title !== undefined) {
      updateProps.title = options.title;
    }
    
    if (options.color !== undefined) {
      updateProps.color = options.color as chrome.tabGroups.ColorEnum;
    }
    
    if (options.collapsed !== undefined) {
      updateProps.collapsed = options.collapsed;
    }

    // Only update if there are properties to change
    if (Object.keys(updateProps).length === 0) {
      throw new Error('At least one property (title, color, or collapsed) must be provided');
    }

    await chrome.tabGroups.update(groupId, updateProps);
  }

  /**
   * Remove tabs from their current groups
   * 
   * @param tabIds - Array of tab IDs to ungroup
   * @throws Error if no tab IDs provided or ungrouping fails
   * 
   * Requirements: AC2
   */
  async ungroupTabs(tabIds: number[]): Promise<void> {
    if (!tabIds || tabIds.length === 0) {
      throw new Error('At least one tab ID is required to ungroup');
    }

    // Validate that all tabs exist
    for (const tabId of tabIds) {
      try {
        await chrome.tabs.get(tabId);
      } catch {
        throw new Error(`Tab with ID ${tabId} not found`);
      }
    }

    await chrome.tabs.ungroup(tabIds);
  }

  /**
   * List all tab groups in a window with their associated tabs
   * 
   * @param windowId - Optional window ID to filter groups (defaults to all windows)
   * @returns Array of TabGroup objects with tab information
   * 
   * Requirements: AC1, AC2
   */
  async listGroups(windowId?: number): Promise<TabGroup[]> {
    // Query for groups, optionally filtered by window
    const queryOptions: chrome.tabGroups.QueryInfo = {};
    if (windowId !== undefined) {
      queryOptions.windowId = windowId;
    }

    const groups = await chrome.tabGroups.query(queryOptions);

    // Map groups to our TabGroup interface with tab IDs
    const result = await Promise.all(
      groups.map(async (group) => {
        // Get all tabs in this group
        const tabs = await chrome.tabs.query({ groupId: group.id });
        
        return {
          id: group.id,
          title: group.title || '',
          color: group.color,
          collapsed: group.collapsed,
          tabIds: tabs.map(tab => tab.id!).filter(Boolean)
        };
      })
    );

    return result;
  }

  /**
   * Get a specific tab group by ID
   * 
   * @param groupId - ID of the group to retrieve
   * @returns TabGroup object with tab information
   * @throws Error if group not found
   */
  async getGroup(groupId: number): Promise<TabGroup> {
    try {
      const group = await chrome.tabGroups.get(groupId);
      const tabs = await chrome.tabs.query({ groupId: group.id });
      
      return {
        id: group.id,
        title: group.title || '',
        color: group.color,
        collapsed: group.collapsed,
        tabIds: tabs.map(tab => tab.id!).filter(Boolean)
      };
    } catch {
      throw new Error(`Tab group with ID ${groupId} not found`);
    }
  }

  /**
   * Add tabs to an existing group
   * 
   * @param groupId - ID of the group to add tabs to
   * @param tabIds - Array of tab IDs to add
   * @throws Error if group or tabs not found
   */
  async addTabsToGroup(groupId: number, tabIds: number[]): Promise<void> {
    if (!tabIds || tabIds.length === 0) {
      throw new Error('At least one tab ID is required');
    }

    // Verify group exists
    try {
      await chrome.tabGroups.get(groupId);
    } catch {
      throw new Error(`Tab group with ID ${groupId} not found`);
    }

    // Validate that all tabs exist
    for (const tabId of tabIds) {
      try {
        await chrome.tabs.get(tabId);
      } catch {
        throw new Error(`Tab with ID ${tabId} not found`);
      }
    }

    await chrome.tabs.group({ groupId, tabIds });
  }

  /**
   * Collapse or expand a tab group
   * 
   * @param groupId - ID of the group to collapse/expand
   * @param collapsed - Whether to collapse (true) or expand (false)
   * @throws Error if group not found
   */
  async setGroupCollapsed(groupId: number, collapsed: boolean): Promise<void> {
    await this.updateGroup(groupId, { collapsed });
  }
}

/**
 * Singleton instance of TabGroupManager
 * Use this exported instance for all tab group operations
 */
export const tabGroupManager = TabGroupManager.getInstance();
