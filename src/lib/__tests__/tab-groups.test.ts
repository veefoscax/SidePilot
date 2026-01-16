/**
 * Unit tests for TabGroupManager
 * 
 * Tests group creation, updates, ungrouping, and listing.
 * Mocks Chrome APIs since tests run outside browser context.
 * 
 * Requirements: AC1, AC2
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TabGroupManager, type TabGroup, type TabGroupColor, type UpdateGroupOptions } from '../tab-groups';

// Mock Chrome APIs
const mockChrome = {
  tabs: {
    get: vi.fn(),
    group: vi.fn(),
    ungroup: vi.fn(),
    query: vi.fn()
  },
  tabGroups: {
    get: vi.fn(),
    update: vi.fn(),
    query: vi.fn()
  }
};

// @ts-ignore - Mock global chrome
global.chrome = mockChrome as any;

describe('TabGroupManager', () => {
  let manager: TabGroupManager;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Reset singleton instance for clean tests
    // @ts-ignore - Access private static for testing
    TabGroupManager['instance'] = null;
    
    manager = TabGroupManager.getInstance();
  });

  afterEach(() => {
    // Reset singleton after each test
    // @ts-ignore - Access private static for testing
    TabGroupManager['instance'] = null;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = TabGroupManager.getInstance();
      const instance2 = TabGroupManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = TabGroupManager.getInstance();
      
      // @ts-ignore - Access private static for testing
      TabGroupManager['instance'] = null;
      
      const instance2 = TabGroupManager.getInstance();
      
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('createGroup', () => {
    /**
     * Validates: Requirements AC1
     * Tests that groups can be created with title, tabs, and color
     */
    
    it('should create a group with title and tabs', async () => {
      const tabIds = [1, 2, 3];
      const groupId = 100;
      
      // Mock tab existence checks
      mockChrome.tabs.get.mockResolvedValue({ id: 1 });
      mockChrome.tabs.group.mockResolvedValue(groupId);
      mockChrome.tabGroups.update.mockResolvedValue({});
      
      const result = await manager.createGroup('My Group', tabIds);
      
      expect(result).toBe(groupId);
      expect(mockChrome.tabs.group).toHaveBeenCalledWith({ tabIds });
      expect(mockChrome.tabGroups.update).toHaveBeenCalledWith(groupId, {
        title: 'My Group',
        color: 'blue' // Default color
      });
    });

    it('should create a group with custom color', async () => {
      const tabIds = [1];
      const groupId = 101;
      
      mockChrome.tabs.get.mockResolvedValue({ id: 1 });
      mockChrome.tabs.group.mockResolvedValue(groupId);
      mockChrome.tabGroups.update.mockResolvedValue({});
      
      const result = await manager.createGroup('Red Group', tabIds, 'red');
      
      expect(result).toBe(groupId);
      expect(mockChrome.tabGroups.update).toHaveBeenCalledWith(groupId, {
        title: 'Red Group',
        color: 'red'
      });
    });

    it('should support all valid colors', async () => {
      const colors: TabGroupColor[] = [
        'grey', 'blue', 'red', 'yellow', 'green', 
        'pink', 'purple', 'cyan', 'orange'
      ];
      
      for (const color of colors) {
        vi.clearAllMocks();
        mockChrome.tabs.get.mockResolvedValue({ id: 1 });
        mockChrome.tabs.group.mockResolvedValue(100);
        mockChrome.tabGroups.update.mockResolvedValue({});
        
        await manager.createGroup('Test', [1], color);
        
        expect(mockChrome.tabGroups.update).toHaveBeenCalledWith(100, {
          title: 'Test',
          color
        });
      }
    });

    it('should throw error when no tab IDs provided', async () => {
      await expect(manager.createGroup('Empty', [])).rejects.toThrow(
        'At least one tab ID is required to create a group'
      );
      
      expect(mockChrome.tabs.group).not.toHaveBeenCalled();
    });

    it('should throw error when tab does not exist', async () => {
      mockChrome.tabs.get.mockRejectedValue(new Error('Tab not found'));
      
      await expect(manager.createGroup('Test', [999])).rejects.toThrow(
        'Tab with ID 999 not found'
      );
      
      expect(mockChrome.tabs.group).not.toHaveBeenCalled();
    });

    it('should validate all tabs exist before grouping', async () => {
      // First tab exists, second doesn't
      mockChrome.tabs.get
        .mockResolvedValueOnce({ id: 1 })
        .mockRejectedValueOnce(new Error('Tab not found'));
      
      await expect(manager.createGroup('Test', [1, 999])).rejects.toThrow(
        'Tab with ID 999 not found'
      );
      
      expect(mockChrome.tabs.group).not.toHaveBeenCalled();
    });

    it('should create group with empty title', async () => {
      mockChrome.tabs.get.mockResolvedValue({ id: 1 });
      mockChrome.tabs.group.mockResolvedValue(100);
      mockChrome.tabGroups.update.mockResolvedValue({});
      
      const result = await manager.createGroup('', [1]);
      
      expect(result).toBe(100);
      expect(mockChrome.tabGroups.update).toHaveBeenCalledWith(100, {
        title: '',
        color: 'blue'
      });
    });
  });

  describe('updateGroup', () => {
    /**
     * Validates: Requirements AC2
     * Tests that groups can be updated with new title, color, or collapsed state
     */
    
    it('should update group title', async () => {
      mockChrome.tabGroups.get.mockResolvedValue({ id: 100 });
      mockChrome.tabGroups.update.mockResolvedValue({});
      
      await manager.updateGroup(100, { title: 'New Title' });
      
      expect(mockChrome.tabGroups.update).toHaveBeenCalledWith(100, {
        title: 'New Title'
      });
    });

    it('should update group color', async () => {
      mockChrome.tabGroups.get.mockResolvedValue({ id: 100 });
      mockChrome.tabGroups.update.mockResolvedValue({});
      
      await manager.updateGroup(100, { color: 'green' });
      
      expect(mockChrome.tabGroups.update).toHaveBeenCalledWith(100, {
        color: 'green'
      });
    });

    it('should update group collapsed state', async () => {
      mockChrome.tabGroups.get.mockResolvedValue({ id: 100 });
      mockChrome.tabGroups.update.mockResolvedValue({});
      
      await manager.updateGroup(100, { collapsed: true });
      
      expect(mockChrome.tabGroups.update).toHaveBeenCalledWith(100, {
        collapsed: true
      });
    });

    it('should update multiple properties at once', async () => {
      mockChrome.tabGroups.get.mockResolvedValue({ id: 100 });
      mockChrome.tabGroups.update.mockResolvedValue({});
      
      await manager.updateGroup(100, { 
        title: 'Updated', 
        color: 'purple', 
        collapsed: true 
      });
      
      expect(mockChrome.tabGroups.update).toHaveBeenCalledWith(100, {
        title: 'Updated',
        color: 'purple',
        collapsed: true
      });
    });

    it('should throw error when group not found', async () => {
      mockChrome.tabGroups.get.mockRejectedValue(new Error('Group not found'));
      
      await expect(manager.updateGroup(999, { title: 'Test' })).rejects.toThrow(
        'Tab group with ID 999 not found'
      );
      
      expect(mockChrome.tabGroups.update).not.toHaveBeenCalled();
    });

    it('should throw error when no properties provided', async () => {
      mockChrome.tabGroups.get.mockResolvedValue({ id: 100 });
      
      await expect(manager.updateGroup(100, {})).rejects.toThrow(
        'At least one property (title, color, or collapsed) must be provided'
      );
      
      expect(mockChrome.tabGroups.update).not.toHaveBeenCalled();
    });

    it('should throw error when group ID is undefined', async () => {
      await expect(manager.updateGroup(undefined as any, { title: 'Test' })).rejects.toThrow(
        'Group ID is required'
      );
    });

    it('should throw error when group ID is null', async () => {
      await expect(manager.updateGroup(null as any, { title: 'Test' })).rejects.toThrow(
        'Group ID is required'
      );
    });

    it('should allow setting collapsed to false', async () => {
      mockChrome.tabGroups.get.mockResolvedValue({ id: 100 });
      mockChrome.tabGroups.update.mockResolvedValue({});
      
      await manager.updateGroup(100, { collapsed: false });
      
      expect(mockChrome.tabGroups.update).toHaveBeenCalledWith(100, {
        collapsed: false
      });
    });
  });

  describe('ungroupTabs', () => {
    /**
     * Validates: Requirements AC2
     * Tests that tabs can be removed from groups
     */
    
    it('should ungroup specified tabs', async () => {
      const tabIds = [1, 2, 3];
      
      mockChrome.tabs.get.mockResolvedValue({ id: 1 });
      mockChrome.tabs.ungroup.mockResolvedValue(undefined);
      
      await manager.ungroupTabs(tabIds);
      
      expect(mockChrome.tabs.ungroup).toHaveBeenCalledWith(tabIds);
    });

    it('should ungroup single tab', async () => {
      mockChrome.tabs.get.mockResolvedValue({ id: 1 });
      mockChrome.tabs.ungroup.mockResolvedValue(undefined);
      
      await manager.ungroupTabs([1]);
      
      expect(mockChrome.tabs.ungroup).toHaveBeenCalledWith([1]);
    });

    it('should throw error when no tab IDs provided', async () => {
      await expect(manager.ungroupTabs([])).rejects.toThrow(
        'At least one tab ID is required to ungroup'
      );
      
      expect(mockChrome.tabs.ungroup).not.toHaveBeenCalled();
    });

    it('should throw error when tab does not exist', async () => {
      mockChrome.tabs.get.mockRejectedValue(new Error('Tab not found'));
      
      await expect(manager.ungroupTabs([999])).rejects.toThrow(
        'Tab with ID 999 not found'
      );
      
      expect(mockChrome.tabs.ungroup).not.toHaveBeenCalled();
    });

    it('should validate all tabs exist before ungrouping', async () => {
      mockChrome.tabs.get
        .mockResolvedValueOnce({ id: 1 })
        .mockRejectedValueOnce(new Error('Tab not found'));
      
      await expect(manager.ungroupTabs([1, 999])).rejects.toThrow(
        'Tab with ID 999 not found'
      );
      
      expect(mockChrome.tabs.ungroup).not.toHaveBeenCalled();
    });
  });

  describe('listGroups', () => {
    /**
     * Validates: Requirements AC1, AC2
     * Tests that groups can be listed with their associated tabs
     */
    
    it('should list all groups with tab information', async () => {
      mockChrome.tabGroups.query.mockResolvedValue([
        { id: 100, title: 'Group 1', color: 'blue', collapsed: false },
        { id: 101, title: 'Group 2', color: 'red', collapsed: true }
      ]);
      
      mockChrome.tabs.query
        .mockResolvedValueOnce([{ id: 1 }, { id: 2 }]) // Tabs in group 100
        .mockResolvedValueOnce([{ id: 3 }]); // Tabs in group 101
      
      const groups = await manager.listGroups();
      
      expect(groups).toHaveLength(2);
      expect(groups[0]).toEqual({
        id: 100,
        title: 'Group 1',
        color: 'blue',
        collapsed: false,
        tabIds: [1, 2]
      });
      expect(groups[1]).toEqual({
        id: 101,
        title: 'Group 2',
        color: 'red',
        collapsed: true,
        tabIds: [3]
      });
    });

    it('should list groups for specific window', async () => {
      mockChrome.tabGroups.query.mockResolvedValue([
        { id: 100, title: 'Window Group', color: 'green', collapsed: false }
      ]);
      mockChrome.tabs.query.mockResolvedValue([{ id: 1 }]);
      
      await manager.listGroups(1);
      
      expect(mockChrome.tabGroups.query).toHaveBeenCalledWith({ windowId: 1 });
    });

    it('should return empty array when no groups exist', async () => {
      mockChrome.tabGroups.query.mockResolvedValue([]);
      
      const groups = await manager.listGroups();
      
      expect(groups).toEqual([]);
    });

    it('should handle groups with empty title', async () => {
      mockChrome.tabGroups.query.mockResolvedValue([
        { id: 100, title: '', color: 'blue', collapsed: false }
      ]);
      mockChrome.tabs.query.mockResolvedValue([{ id: 1 }]);
      
      const groups = await manager.listGroups();
      
      expect(groups[0].title).toBe('');
    });

    it('should handle groups with undefined title', async () => {
      mockChrome.tabGroups.query.mockResolvedValue([
        { id: 100, title: undefined, color: 'blue', collapsed: false }
      ]);
      mockChrome.tabs.query.mockResolvedValue([{ id: 1 }]);
      
      const groups = await manager.listGroups();
      
      expect(groups[0].title).toBe('');
    });

    it('should filter out tabs with undefined IDs', async () => {
      mockChrome.tabGroups.query.mockResolvedValue([
        { id: 100, title: 'Test', color: 'blue', collapsed: false }
      ]);
      mockChrome.tabs.query.mockResolvedValue([
        { id: 1 },
        { id: undefined },
        { id: 2 }
      ]);
      
      const groups = await manager.listGroups();
      
      expect(groups[0].tabIds).toEqual([1, 2]);
    });

    it('should query all windows when windowId not specified', async () => {
      mockChrome.tabGroups.query.mockResolvedValue([]);
      
      await manager.listGroups();
      
      expect(mockChrome.tabGroups.query).toHaveBeenCalledWith({});
    });
  });

  describe('getGroup', () => {
    it('should get a specific group by ID', async () => {
      mockChrome.tabGroups.get.mockResolvedValue({
        id: 100,
        title: 'My Group',
        color: 'blue',
        collapsed: false
      });
      mockChrome.tabs.query.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      
      const group = await manager.getGroup(100);
      
      expect(group).toEqual({
        id: 100,
        title: 'My Group',
        color: 'blue',
        collapsed: false,
        tabIds: [1, 2]
      });
    });

    it('should throw error when group not found', async () => {
      mockChrome.tabGroups.get.mockRejectedValue(new Error('Group not found'));
      
      await expect(manager.getGroup(999)).rejects.toThrow(
        'Tab group with ID 999 not found'
      );
    });
  });

  describe('addTabsToGroup', () => {
    it('should add tabs to existing group', async () => {
      mockChrome.tabGroups.get.mockResolvedValue({ id: 100 });
      mockChrome.tabs.get.mockResolvedValue({ id: 1 });
      mockChrome.tabs.group.mockResolvedValue(100);
      
      await manager.addTabsToGroup(100, [1, 2]);
      
      expect(mockChrome.tabs.group).toHaveBeenCalledWith({
        groupId: 100,
        tabIds: [1, 2]
      });
    });

    it('should throw error when no tab IDs provided', async () => {
      await expect(manager.addTabsToGroup(100, [])).rejects.toThrow(
        'At least one tab ID is required'
      );
    });

    it('should throw error when group not found', async () => {
      mockChrome.tabGroups.get.mockRejectedValue(new Error('Group not found'));
      
      await expect(manager.addTabsToGroup(999, [1])).rejects.toThrow(
        'Tab group with ID 999 not found'
      );
    });

    it('should throw error when tab not found', async () => {
      mockChrome.tabGroups.get.mockResolvedValue({ id: 100 });
      mockChrome.tabs.get.mockRejectedValue(new Error('Tab not found'));
      
      await expect(manager.addTabsToGroup(100, [999])).rejects.toThrow(
        'Tab with ID 999 not found'
      );
    });
  });

  describe('setGroupCollapsed', () => {
    it('should collapse a group', async () => {
      mockChrome.tabGroups.get.mockResolvedValue({ id: 100 });
      mockChrome.tabGroups.update.mockResolvedValue({});
      
      await manager.setGroupCollapsed(100, true);
      
      expect(mockChrome.tabGroups.update).toHaveBeenCalledWith(100, {
        collapsed: true
      });
    });

    it('should expand a group', async () => {
      mockChrome.tabGroups.get.mockResolvedValue({ id: 100 });
      mockChrome.tabGroups.update.mockResolvedValue({});
      
      await manager.setGroupCollapsed(100, false);
      
      expect(mockChrome.tabGroups.update).toHaveBeenCalledWith(100, {
        collapsed: false
      });
    });
  });
});
