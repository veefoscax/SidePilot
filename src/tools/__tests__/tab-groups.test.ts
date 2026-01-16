/**
 * Integration tests for tab_groups tool
 * 
 * Tests the tool's execute function for all actions:
 * - create_group: Create group with multiple tabs
 * - update_group: Update color (all 9 colors), title, collapse/expand
 * - ungroup: Remove tabs from groups
 * - list: List all groups with metadata
 * 
 * Requirements: AC4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tabGroupsTool } from '../tab-groups';
import type { ToolContext } from '../types';

// Mock Chrome API
const mockChrome = {
  tabs: {
    create: vi.fn(),
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

describe('Tab Groups Tool', () => {
  let mockContext: ToolContext;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup mock context
    mockContext = {
      tabId: 1,
      url: 'https://example.com',
      permissionManager: {
        checkPermission: vi.fn().mockResolvedValue({ allowed: true, needsPrompt: false })
      } as any
    };
  });

  describe('Tool Definition', () => {
    it('should have correct name', () => {
      expect(tabGroupsTool.name).toBe('tab_groups');
    });

    it('should have description', () => {
      expect(tabGroupsTool.description).toBeTruthy();
      expect(tabGroupsTool.description).toContain('tab group');
    });

    it('should have parameters defined', () => {
      expect(tabGroupsTool.parameters).toBeDefined();
      expect(tabGroupsTool.parameters.action).toBeDefined();
      expect(tabGroupsTool.parameters.action.enum).toContain('create_group');
      expect(tabGroupsTool.parameters.action.enum).toContain('update_group');
      expect(tabGroupsTool.parameters.action.enum).toContain('add_to_group');
      expect(tabGroupsTool.parameters.action.enum).toContain('ungroup');
      expect(tabGroupsTool.parameters.action.enum).toContain('list');
    });
  });

  describe('Schema Generation', () => {
    it('should generate Anthropic schema', () => {
      const schema = tabGroupsTool.toAnthropicSchema();
      
      expect(schema.name).toBe('tab_groups');
      expect(schema.description).toBeTruthy();
      expect(schema.input_schema.type).toBe('object');
      expect(schema.input_schema.properties.action).toBeDefined();
      expect(schema.input_schema.required).toContain('action');
    });

    it('should generate OpenAI schema', () => {
      const schema = tabGroupsTool.toOpenAISchema();
      
      expect(schema.type).toBe('function');
      expect(schema.function.name).toBe('tab_groups');
      expect(schema.function.description).toBeTruthy();
      expect(schema.function.parameters.type).toBe('object');
      expect(schema.function.parameters.properties.action).toBeDefined();
      expect(schema.function.parameters.required).toContain('action');
    });
  });

  describe('create_group action', () => {
    /**
     * Validates: Requirements AC4
     * Test create group with multiple tabs
     */
    
    it('should create group with multiple tabs', async () => {
      const tabIds = [1, 2, 3];
      const groupId = 100;
      
      mockChrome.tabs.get.mockResolvedValue({ id: 1 });
      mockChrome.tabs.group.mockResolvedValue(groupId);
      mockChrome.tabGroups.update.mockResolvedValue({});
      
      const result = await tabGroupsTool.execute(
        { action: 'create_group', title: 'My Group', tab_ids: tabIds, color: 'blue' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toContain('Created tab group');
      expect(result.output).toContain('100');
      expect(result.output).toContain('My Group');
      expect(result.output).toContain('3 tabs');
      expect(mockChrome.tabs.group).toHaveBeenCalledWith({ tabIds });
      expect(mockChrome.tabGroups.update).toHaveBeenCalledWith(groupId, {
        title: 'My Group',
        color: 'blue'
      });
    });

    it('should create group with single tab', async () => {
      mockChrome.tabs.get.mockResolvedValue({ id: 1 });
      mockChrome.tabs.group.mockResolvedValue(101);
      mockChrome.tabGroups.update.mockResolvedValue({});
      
      const result = await tabGroupsTool.execute(
        { action: 'create_group', title: 'Single Tab Group', tab_ids: [1] },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toContain('1 tab');
      expect(result.output).not.toContain('1 tabs');
    });

    it('should create group using current tab when no tab_ids provided', async () => {
      mockChrome.tabs.get.mockResolvedValue({ id: 1 });
      mockChrome.tabs.group.mockResolvedValue(102);
      mockChrome.tabGroups.update.mockResolvedValue({});
      
      const result = await tabGroupsTool.execute(
        { action: 'create_group', title: 'Current Tab Group' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toContain('Created tab group');
      expect(mockChrome.tabs.group).toHaveBeenCalledWith({ tabIds: [1] });
    });

    it('should handle tab not found error', async () => {
      mockChrome.tabs.get.mockRejectedValue(new Error('Tab not found'));
      
      const result = await tabGroupsTool.execute(
        { action: 'create_group', title: 'Test', tab_ids: [999] },
        mockContext
      );

      expect(result.error).toBeTruthy();
      expect(result.error).toContain('not found');
    });
  });

  describe('update_group action - colors', () => {
    /**
     * Validates: Requirements AC4
     * Test update group color (all 9 colors)
     */
    
    const allColors = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'] as const;

    it.each(allColors)('should update group color to %s', async (color) => {
      mockChrome.tabGroups.get.mockResolvedValue({ id: 100 });
      mockChrome.tabGroups.update.mockResolvedValue({});
      
      const result = await tabGroupsTool.execute(
        { action: 'update_group', group_id: 100, color },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toContain('Updated tab group 100');
      expect(result.output).toContain(`color to ${color}`);
      expect(mockChrome.tabGroups.update).toHaveBeenCalledWith(100, { color });
    });
  });

  describe('update_group action - title', () => {
    /**
     * Validates: Requirements AC4
     * Test update group title
     */
    
    it('should update group title', async () => {
      mockChrome.tabGroups.get.mockResolvedValue({ id: 100 });
      mockChrome.tabGroups.update.mockResolvedValue({});
      
      const result = await tabGroupsTool.execute(
        { action: 'update_group', group_id: 100, title: 'New Title' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toContain('Updated tab group 100');
      expect(result.output).toContain('title to "New Title"');
      expect(mockChrome.tabGroups.update).toHaveBeenCalledWith(100, { title: 'New Title' });
    });

    it('should update group with empty title', async () => {
      mockChrome.tabGroups.get.mockResolvedValue({ id: 100 });
      mockChrome.tabGroups.update.mockResolvedValue({});
      
      const result = await tabGroupsTool.execute(
        { action: 'update_group', group_id: 100, title: '' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toContain('title to ""');
    });
  });

  describe('update_group action - collapse/expand', () => {
    /**
     * Validates: Requirements AC4
     * Test collapse/expand group
     */
    
    it('should collapse group', async () => {
      mockChrome.tabGroups.get.mockResolvedValue({ id: 100 });
      mockChrome.tabGroups.update.mockResolvedValue({});
      
      const result = await tabGroupsTool.execute(
        { action: 'update_group', group_id: 100, collapsed: true },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toContain('Updated tab group 100');
      expect(result.output).toContain('collapsed');
      expect(mockChrome.tabGroups.update).toHaveBeenCalledWith(100, { collapsed: true });
    });

    it('should expand group', async () => {
      mockChrome.tabGroups.get.mockResolvedValue({ id: 100 });
      mockChrome.tabGroups.update.mockResolvedValue({});
      
      const result = await tabGroupsTool.execute(
        { action: 'update_group', group_id: 100, collapsed: false },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toContain('Updated tab group 100');
      expect(result.output).toContain('expanded');
      expect(mockChrome.tabGroups.update).toHaveBeenCalledWith(100, { collapsed: false });
    });
  });

  describe('update_group action - multiple properties', () => {
    it('should update multiple properties at once', async () => {
      mockChrome.tabGroups.get.mockResolvedValue({ id: 100 });
      mockChrome.tabGroups.update.mockResolvedValue({});
      
      const result = await tabGroupsTool.execute(
        { 
          action: 'update_group', 
          group_id: 100, 
          title: 'Updated Group',
          color: 'purple',
          collapsed: true 
        },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toContain('title to "Updated Group"');
      expect(result.output).toContain('color to purple');
      expect(result.output).toContain('collapsed');
      expect(mockChrome.tabGroups.update).toHaveBeenCalledWith(100, {
        title: 'Updated Group',
        color: 'purple',
        collapsed: true
      });
    });

    it('should require group_id for update', async () => {
      const result = await tabGroupsTool.execute(
        { action: 'update_group', title: 'Test' },
        mockContext
      );

      expect(result.error).toBeTruthy();
      expect(result.error).toContain('group_id');
    });

    it('should require at least one property to update', async () => {
      mockChrome.tabGroups.get.mockResolvedValue({ id: 100 });
      
      const result = await tabGroupsTool.execute(
        { action: 'update_group', group_id: 100 },
        mockContext
      );

      expect(result.error).toBeTruthy();
      expect(result.error).toContain('At least one');
    });

    it('should handle group not found error', async () => {
      mockChrome.tabGroups.get.mockRejectedValue(new Error('Group not found'));
      
      const result = await tabGroupsTool.execute(
        { action: 'update_group', group_id: 999, title: 'Test' },
        mockContext
      );

      expect(result.error).toBeTruthy();
      expect(result.error).toContain('not found');
    });
  });

  describe('ungroup action', () => {
    /**
     * Validates: Requirements AC4
     * Test ungroup tabs
     */
    
    it('should ungroup multiple tabs', async () => {
      const tabIds = [1, 2, 3];
      
      mockChrome.tabs.get.mockResolvedValue({ id: 1 });
      mockChrome.tabs.ungroup.mockResolvedValue(undefined);
      
      const result = await tabGroupsTool.execute(
        { action: 'ungroup', tab_ids: tabIds },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toContain('Removed 3 tabs');
      expect(mockChrome.tabs.ungroup).toHaveBeenCalledWith(tabIds);
    });

    it('should ungroup single tab', async () => {
      mockChrome.tabs.get.mockResolvedValue({ id: 1 });
      mockChrome.tabs.ungroup.mockResolvedValue(undefined);
      
      const result = await tabGroupsTool.execute(
        { action: 'ungroup', tab_ids: [1] },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toContain('Removed 1 tab');
      expect(result.output).not.toContain('1 tabs');
    });

    it('should require tab_ids for ungroup', async () => {
      const result = await tabGroupsTool.execute(
        { action: 'ungroup' },
        mockContext
      );

      expect(result.error).toBeTruthy();
      expect(result.error).toContain('tab_ids');
    });

    it('should require non-empty tab_ids array', async () => {
      const result = await tabGroupsTool.execute(
        { action: 'ungroup', tab_ids: [] },
        mockContext
      );

      expect(result.error).toBeTruthy();
      expect(result.error).toContain('at least one tab ID');
    });

    it('should handle tab not found error', async () => {
      mockChrome.tabs.get.mockRejectedValue(new Error('Tab not found'));
      
      const result = await tabGroupsTool.execute(
        { action: 'ungroup', tab_ids: [999] },
        mockContext
      );

      expect(result.error).toBeTruthy();
      expect(result.error).toContain('not found');
    });
  });

  describe('list action', () => {
    /**
     * Validates: Requirements AC4
     * Test list all groups with metadata
     */
    
    it('should list all groups with metadata', async () => {
      mockChrome.tabGroups.query.mockResolvedValue([
        { id: 100, title: 'Group 1', color: 'blue', collapsed: false },
        { id: 101, title: 'Group 2', color: 'red', collapsed: true }
      ]);
      
      mockChrome.tabs.query
        .mockResolvedValueOnce([{ id: 1 }, { id: 2 }]) // Tabs in group 100
        .mockResolvedValueOnce([{ id: 3 }]); // Tabs in group 101
      
      const result = await tabGroupsTool.execute(
        { action: 'list' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toBeTruthy();
      
      // Parse the JSON output
      const groups = JSON.parse(result.output!);
      
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
      
      const result = await tabGroupsTool.execute(
        { action: 'list', window_id: 1 },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(mockChrome.tabGroups.query).toHaveBeenCalledWith({ windowId: 1 });
    });

    it('should return message when no groups exist', async () => {
      mockChrome.tabGroups.query.mockResolvedValue([]);
      
      const result = await tabGroupsTool.execute(
        { action: 'list' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toBe('No tab groups found');
    });

    it('should handle groups with empty title', async () => {
      mockChrome.tabGroups.query.mockResolvedValue([
        { id: 100, title: '', color: 'blue', collapsed: false }
      ]);
      mockChrome.tabs.query.mockResolvedValue([{ id: 1 }]);
      
      const result = await tabGroupsTool.execute(
        { action: 'list' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      const groups = JSON.parse(result.output!);
      expect(groups[0].title).toBe('');
    });

    it('should include all group metadata', async () => {
      mockChrome.tabGroups.query.mockResolvedValue([
        { id: 100, title: 'Test Group', color: 'purple', collapsed: true }
      ]);
      mockChrome.tabs.query.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);
      
      const result = await tabGroupsTool.execute(
        { action: 'list' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      const groups = JSON.parse(result.output!);
      
      expect(groups[0]).toHaveProperty('id', 100);
      expect(groups[0]).toHaveProperty('title', 'Test Group');
      expect(groups[0]).toHaveProperty('color', 'purple');
      expect(groups[0]).toHaveProperty('collapsed', true);
      expect(groups[0]).toHaveProperty('tabIds');
      expect(groups[0].tabIds).toEqual([1, 2, 3]);
    });
  });

  describe('add_to_group action', () => {
    it('should add tabs to existing group', async () => {
      mockChrome.tabGroups.get.mockResolvedValue({ id: 100, title: 'My Group' });
      mockChrome.tabs.get.mockResolvedValue({ id: 1 });
      mockChrome.tabs.group.mockResolvedValue(100);
      mockChrome.tabs.query.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);
      
      const result = await tabGroupsTool.execute(
        { action: 'add_to_group', group_id: 100, tab_ids: [2, 3] },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toContain('Added 2 tabs');
      expect(result.output).toContain('group 100');
      expect(mockChrome.tabs.group).toHaveBeenCalledWith({
        groupId: 100,
        tabIds: [2, 3]
      });
    });

    it('should require group_id for add_to_group', async () => {
      const result = await tabGroupsTool.execute(
        { action: 'add_to_group', tab_ids: [1, 2] },
        mockContext
      );

      expect(result.error).toBeTruthy();
      expect(result.error).toContain('group_id');
    });

    it('should require tab_ids for add_to_group', async () => {
      const result = await tabGroupsTool.execute(
        { action: 'add_to_group', group_id: 100 },
        mockContext
      );

      expect(result.error).toBeTruthy();
      expect(result.error).toContain('tab_ids');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown action', async () => {
      const result = await tabGroupsTool.execute(
        { action: 'invalid_action' as any },
        mockContext
      );

      expect(result.error).toBeTruthy();
      expect(result.error).toContain('Unknown action');
    });

    it('should handle Chrome API errors gracefully', async () => {
      mockChrome.tabs.get.mockResolvedValue({ id: 1 });
      mockChrome.tabs.group.mockRejectedValue(new Error('Chrome API error'));
      
      const result = await tabGroupsTool.execute(
        { action: 'create_group', title: 'Test', tab_ids: [1] },
        mockContext
      );

      expect(result.error).toBeTruthy();
      expect(result.error).toContain('Chrome API error');
    });
  });
});
