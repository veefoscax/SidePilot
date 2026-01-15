/**
 * Test script for tab groups tool
 * 
 * Tests all tab group actions:
 * - create_group
 * - update_group
 * - add_to_group
 * - ungroup
 */

import { tabGroupsTool } from '../src/tools/tab-groups.ts';

// Mock permission manager
const mockPermissionManager = {
  async checkPermission() {
    return { allowed: true, needsPrompt: false };
  }
};

async function testTabGroups() {
  console.log('🧪 Testing Tab Groups Tool\n');

  try {
    // Test 1: Create group
    console.log('Test 1: Create group with title and color');
    const createResult = await tabGroupsTool.execute(
      {
        action: 'create_group',
        title: 'Test Group',
        color: 'blue'
      },
      {
        tabId: 0, // Will create new tab if needed
        url: 'about:blank',
        permissionManager: mockPermissionManager
      }
    );
    console.log('✓ Create result:', createResult);

    // Extract group ID from result (assuming format "Created tab group {id}...")
    const groupIdMatch = createResult.output?.match(/Created tab group (\d+)/);
    const groupId = groupIdMatch ? parseInt(groupIdMatch[1]) : null;

    if (!groupId) {
      console.error('❌ Failed to extract group ID from create result');
      return;
    }

    // Test 2: Update group
    console.log('\nTest 2: Update group title and color');
    const updateResult = await tabGroupsTool.execute(
      {
        action: 'update_group',
        group_id: groupId,
        title: 'Updated Group',
        color: 'red'
      },
      {
        tabId: 0,
        url: 'about:blank',
        permissionManager: mockPermissionManager
      }
    );
    console.log('✓ Update result:', updateResult);

    // Test 3: Create a new tab to add to group
    console.log('\nTest 3: Create new tab and add to group');
    const newTab = await chrome.tabs.create({ url: 'about:blank', active: false });
    
    const addResult = await tabGroupsTool.execute(
      {
        action: 'add_to_group',
        group_id: groupId,
        tab_ids: [newTab.id]
      },
      {
        tabId: 0,
        url: 'about:blank',
        permissionManager: mockPermissionManager
      }
    );
    console.log('✓ Add to group result:', addResult);

    // Test 4: Ungroup tabs
    console.log('\nTest 4: Ungroup tabs');
    const ungroupResult = await tabGroupsTool.execute(
      {
        action: 'ungroup',
        tab_ids: [newTab.id]
      },
      {
        tabId: 0,
        url: 'about:blank',
        permissionManager: mockPermissionManager
      }
    );
    console.log('✓ Ungroup result:', ungroupResult);

    // Test 5: Error handling - invalid group ID
    console.log('\nTest 5: Error handling - invalid group ID');
    const errorResult = await tabGroupsTool.execute(
      {
        action: 'update_group',
        group_id: 99999,
        title: 'Should Fail'
      },
      {
        tabId: 0,
        url: 'about:blank',
        permissionManager: mockPermissionManager
      }
    );
    console.log('✓ Error result:', errorResult);

    // Test 6: Schema generation
    console.log('\nTest 6: Schema generation');
    const anthropicSchema = tabGroupsTool.toAnthropicSchema();
    console.log('✓ Anthropic schema:', JSON.stringify(anthropicSchema, null, 2));

    const openaiSchema = tabGroupsTool.toOpenAISchema();
    console.log('✓ OpenAI schema:', JSON.stringify(openaiSchema, null, 2));

    console.log('\n✅ All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests
testTabGroups();
