/**
 * Permission System Integration Tests
 * 
 * End-to-end tests for the browser automation permission system.
 * Tests permission dialog, remember checkbox, and settings page integration.
 */

import { test, expect, chromium, type BrowserContext, type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Permission System Integration', () => {
  let context: BrowserContext;
  let extensionId: string;
  let sidepanelPage: Page;

  test.beforeAll(async () => {
    // Launch Chrome with extension loaded
    const pathToExtension = path.join(__dirname, '..', 'dist');
    
    context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        '--no-sandbox',
        '--disable-dev-shm-usage'
      ],
    });

    // Get extension ID
    const extensionsPage = await context.newPage();
    await extensionsPage.goto('chrome://extensions/');
    
    const extensionCards = extensionsPage.locator('extensions-item');
    const count = await extensionCards.count();
    
    for (let i = 0; i < count; i++) {
      const card = extensionCards.nth(i);
      const name = await card.locator('#name').textContent();
      
      if (name?.includes('SidePilot')) {
        const idElement = await card.locator('#extension-id').textContent();
        extensionId = idElement?.replace('ID: ', '') || '';
        break;
      }
    }

    expect(extensionId).toBeTruthy();
    await extensionsPage.close();
  });

  test.afterAll(async () => {
    if (context) {
      await context.close();
    }
  });

  test.beforeEach(async () => {
    // Clear permissions before each test
    await context.clearCookies();
    
    // Open a test page
    const testPage = await context.newPage();
    await testPage.goto('https://example.com');
    
    // Open sidepanel (simulate clicking extension icon)
    // In a real extension, this would open the sidepanel
    // For testing, we'll navigate directly to the sidepanel URL
    sidepanelPage = await context.newPage();
    await sidepanelPage.goto(`chrome-extension://${extensionId}/sidepanel.html`);
    
    // Wait for sidepanel to load
    await sidepanelPage.waitForLoadState('networkidle');
  });

  test('permission dialog appears when tool requires permission', async () => {
    // Navigate to settings to verify no permissions exist initially
    const settingsButton = sidepanelPage.locator('button:has-text("Settings")');
    await settingsButton.click();
    
    // Check that permissions section shows "No permissions configured"
    const noPermissionsText = sidepanelPage.locator('text=No permissions configured');
    await expect(noPermissionsText).toBeVisible();
    
    // Navigate back to chat
    const chatButton = sidepanelPage.locator('button:has-text("Chat")');
    await chatButton.click();
    
    // Simulate a tool execution that requires permission
    // This would normally happen through the chat interface
    // For testing, we'll trigger it programmatically
    await sidepanelPage.evaluate(async () => {
      const { toolRegistry } = await import('./src/tools/registry');
      const { createPermissionRequest } = await import('./src/lib/permissions');
      const { usePermissionStore } = await import('./src/stores/permissions');
      
      // Create a mock permission request
      const request = createPermissionRequest(
        'computer',
        'https://example.com',
        {
          coordinate: [100, 200],
          text: 'test input'
        }
      );
      
      // Set it as pending
      usePermissionStore.getState().setPendingRequest(request);
    });
    
    // Wait for permission dialog to appear
    const dialogTitle = sidepanelPage.locator('text=Permission Required');
    await expect(dialogTitle).toBeVisible({ timeout: 5000 });
    
    // Verify dialog content
    const toolName = sidepanelPage.locator('text=computer');
    await expect(toolName).toBeVisible();
    
    const domain = sidepanelPage.locator('text=example.com');
    await expect(domain).toBeVisible();
    
    // Verify action buttons are present
    const allowButton = sidepanelPage.locator('button:has-text("Allow")');
    const denyButton = sidepanelPage.locator('button:has-text("Deny")');
    await expect(allowButton).toBeVisible();
    await expect(denyButton).toBeVisible();
    
    // Verify remember checkbox is present
    const rememberCheckbox = sidepanelPage.locator('text=Remember my choice for this domain');
    await expect(rememberCheckbox).toBeVisible();
  });

  test('remember checkbox saves permission preference', async () => {
    // Navigate to chat
    const chatButton = sidepanelPage.locator('button:has-text("Chat")');
    await chatButton.click();
    
    // Trigger permission request
    await sidepanelPage.evaluate(async () => {
      const { createPermissionRequest } = await import('./src/lib/permissions');
      const { usePermissionStore } = await import('./src/stores/permissions');
      
      const request = createPermissionRequest(
        'computer',
        'https://example.com',
        { coordinate: [100, 200] }
      );
      
      usePermissionStore.getState().setPendingRequest(request);
    });
    
    // Wait for dialog
    await sidepanelPage.waitForSelector('text=Permission Required', { timeout: 5000 });
    
    // Check the remember checkbox
    const checkbox = sidepanelPage.locator('input[type="checkbox"]');
    await checkbox.check();
    await expect(checkbox).toBeChecked();
    
    // Click allow
    const allowButton = sidepanelPage.locator('button:has-text("Allow")');
    await allowButton.click();
    
    // Wait for dialog to close
    await sidepanelPage.waitForSelector('text=Permission Required', { state: 'hidden', timeout: 5000 });
    
    // Navigate to settings
    const settingsButton = sidepanelPage.locator('button:has-text("Settings")');
    await settingsButton.click();
    
    // Wait for settings to load
    await sidepanelPage.waitForLoadState('networkidle');
    
    // Verify permission was saved
    const permissionRow = sidepanelPage.locator('text=example.com');
    await expect(permissionRow).toBeVisible({ timeout: 5000 });
    
    // Verify the permission mode is "Always Allow"
    const alwaysAllowSelect = sidepanelPage.locator('select:has-text("Always Allow")');
    await expect(alwaysAllowSelect).toBeVisible();
  });

  test('settings page displays and updates permissions', async () => {
    // First, create a permission
    await sidepanelPage.evaluate(async () => {
      const { getPermissionManager } = await import('./src/lib/permissions');
      const manager = getPermissionManager();
      await manager.setPermission('example.com', 'always_allow');
      await manager.setPermission('test.com', 'deny');
    });
    
    // Navigate to settings
    const settingsButton = sidepanelPage.locator('button:has-text("Settings")');
    await settingsButton.click();
    
    // Wait for permissions to load
    await sidepanelPage.waitForLoadState('networkidle');
    
    // Verify both permissions are displayed
    const exampleDomain = sidepanelPage.locator('text=example.com');
    const testDomain = sidepanelPage.locator('text=test.com');
    await expect(exampleDomain).toBeVisible();
    await expect(testDomain).toBeVisible();
    
    // Find the select for example.com and change it
    const exampleRow = sidepanelPage.locator('div:has-text("example.com")').first();
    const selectTrigger = exampleRow.locator('[role="combobox"]');
    await selectTrigger.click();
    
    // Select "Ask Always"
    const askAlwaysOption = sidepanelPage.locator('[role="option"]:has-text("Ask Always")');
    await askAlwaysOption.click();
    
    // Wait for update to complete
    await sidepanelPage.waitForTimeout(1000);
    
    // Verify the change was saved
    const updatedMode = await sidepanelPage.evaluate(async () => {
      const { getPermissionManager } = await import('./src/lib/permissions');
      const manager = getPermissionManager();
      const permission = await manager.getPermission('example.com');
      return permission?.defaultMode;
    });
    
    expect(updatedMode).toBe('ask_always');
  });

  test('settings page allows deleting permissions', async () => {
    // Create a permission
    await sidepanelPage.evaluate(async () => {
      const { getPermissionManager } = await import('./src/lib/permissions');
      const manager = getPermissionManager();
      await manager.setPermission('example.com', 'always_allow');
    });
    
    // Navigate to settings
    const settingsButton = sidepanelPage.locator('button:has-text("Settings")');
    await settingsButton.click();
    
    // Wait for permissions to load
    await sidepanelPage.waitForLoadState('networkidle');
    
    // Verify permission exists
    const exampleDomain = sidepanelPage.locator('text=example.com');
    await expect(exampleDomain).toBeVisible();
    
    // Click delete button
    const deleteButton = sidepanelPage.locator('button[aria-label="Delete"]').first();
    await deleteButton.click();
    
    // Confirm deletion in alert dialog
    const confirmButton = sidepanelPage.locator('button:has-text("Delete")');
    await confirmButton.click();
    
    // Wait for deletion to complete
    await sidepanelPage.waitForTimeout(1000);
    
    // Verify permission was deleted
    await expect(exampleDomain).not.toBeVisible();
    
    // Verify "No permissions configured" message appears
    const noPermissionsText = sidepanelPage.locator('text=No permissions configured');
    await expect(noPermissionsText).toBeVisible();
  });

  test('deny without remember does not save permission', async () => {
    // Navigate to chat
    const chatButton = sidepanelPage.locator('button:has-text("Chat")');
    await chatButton.click();
    
    // Trigger permission request
    await sidepanelPage.evaluate(async () => {
      const { createPermissionRequest } = await import('./src/lib/permissions');
      const { usePermissionStore } = await import('./src/stores/permissions');
      
      const request = createPermissionRequest(
        'computer',
        'https://example.com',
        { coordinate: [100, 200] }
      );
      
      usePermissionStore.getState().setPendingRequest(request);
    });
    
    // Wait for dialog
    await sidepanelPage.waitForSelector('text=Permission Required', { timeout: 5000 });
    
    // Do NOT check the remember checkbox
    const checkbox = sidepanelPage.locator('input[type="checkbox"]');
    await expect(checkbox).not.toBeChecked();
    
    // Click deny
    const denyButton = sidepanelPage.locator('button:has-text("Deny")');
    await denyButton.click();
    
    // Wait for dialog to close
    await sidepanelPage.waitForSelector('text=Permission Required', { state: 'hidden', timeout: 5000 });
    
    // Navigate to settings
    const settingsButton = sidepanelPage.locator('button:has-text("Settings")');
    await settingsButton.click();
    
    // Verify no permission was saved
    const noPermissionsText = sidepanelPage.locator('text=No permissions configured');
    await expect(noPermissionsText).toBeVisible();
  });

  test('deny with remember saves deny permission', async () => {
    // Navigate to chat
    const chatButton = sidepanelPage.locator('button:has-text("Chat")');
    await chatButton.click();
    
    // Trigger permission request
    await sidepanelPage.evaluate(async () => {
      const { createPermissionRequest } = await import('./src/lib/permissions');
      const { usePermissionStore } = await import('./src/stores/permissions');
      
      const request = createPermissionRequest(
        'computer',
        'https://example.com',
        { coordinate: [100, 200] }
      );
      
      usePermissionStore.getState().setPendingRequest(request);
    });
    
    // Wait for dialog
    await sidepanelPage.waitForSelector('text=Permission Required', { timeout: 5000 });
    
    // Check the remember checkbox
    const checkbox = sidepanelPage.locator('input[type="checkbox"]');
    await checkbox.check();
    await expect(checkbox).toBeChecked();
    
    // Click deny
    const denyButton = sidepanelPage.locator('button:has-text("Deny")');
    await denyButton.click();
    
    // Wait for dialog to close
    await sidepanelPage.waitForSelector('text=Permission Required', { state: 'hidden', timeout: 5000 });
    
    // Navigate to settings
    const settingsButton = sidepanelPage.locator('button:has-text("Settings")');
    await settingsButton.click();
    
    // Wait for settings to load
    await sidepanelPage.waitForLoadState('networkidle');
    
    // Verify permission was saved with "Deny" mode
    const permissionRow = sidepanelPage.locator('text=example.com');
    await expect(permissionRow).toBeVisible({ timeout: 5000 });
    
    // Verify the permission mode is "Deny"
    const denySelect = sidepanelPage.locator('select:has-text("Deny")');
    await expect(denySelect).toBeVisible();
  });

  test('reset all permissions clears all saved permissions', async () => {
    // Create multiple permissions
    await sidepanelPage.evaluate(async () => {
      const { getPermissionManager } = await import('./src/lib/permissions');
      const manager = getPermissionManager();
      await manager.setPermission('example.com', 'always_allow');
      await manager.setPermission('test.com', 'deny');
      await manager.setPermission('demo.com', 'ask_once');
    });
    
    // Navigate to settings
    const settingsButton = sidepanelPage.locator('button:has-text("Settings")');
    await settingsButton.click();
    
    // Wait for permissions to load
    await sidepanelPage.waitForLoadState('networkidle');
    
    // Verify all permissions are displayed
    await expect(sidepanelPage.locator('text=example.com')).toBeVisible();
    await expect(sidepanelPage.locator('text=test.com')).toBeVisible();
    await expect(sidepanelPage.locator('text=demo.com')).toBeVisible();
    
    // Click reset all button
    const resetButton = sidepanelPage.locator('button:has-text("Reset All")');
    await resetButton.click();
    
    // Confirm in alert dialog
    const confirmButton = sidepanelPage.locator('button:has-text("Reset All")').last();
    await confirmButton.click();
    
    // Wait for reset to complete
    await sidepanelPage.waitForTimeout(1000);
    
    // Verify all permissions were deleted
    const noPermissionsText = sidepanelPage.locator('text=No permissions configured');
    await expect(noPermissionsText).toBeVisible();
    
    // Verify permissions are actually cleared in storage
    const permissionCount = await sidepanelPage.evaluate(async () => {
      const { getPermissionManager } = await import('./src/lib/permissions');
      const manager = getPermissionManager();
      const permissions = await manager.getAllPermissions();
      return permissions.length;
    });
    
    expect(permissionCount).toBe(0);
  });

  test('permission dialog shows screenshot for click actions', async () => {
    // Navigate to chat
    const chatButton = sidepanelPage.locator('button:has-text("Chat")');
    await chatButton.click();
    
    // Trigger permission request with screenshot
    await sidepanelPage.evaluate(async () => {
      const { createPermissionRequest } = await import('./src/lib/permissions');
      const { usePermissionStore } = await import('./src/stores/permissions');
      
      // Create a simple base64 image for testing
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 100, 100);
      }
      const screenshot = canvas.toDataURL();
      
      const request = createPermissionRequest(
        'computer',
        'https://example.com',
        {
          screenshot,
          coordinate: [50, 50]
        }
      );
      
      usePermissionStore.getState().setPendingRequest(request);
    });
    
    // Wait for dialog
    await sidepanelPage.waitForSelector('text=Permission Required', { timeout: 5000 });
    
    // Verify screenshot is displayed
    const screenshot = sidepanelPage.locator('img[alt="Action context"]');
    await expect(screenshot).toBeVisible();
    
    // Verify click indicator is displayed
    const clickIndicator = sidepanelPage.locator('div[aria-label*="Click target"]');
    await expect(clickIndicator).toBeVisible();
  });

  test('permission dialog shows text preview for type actions', async () => {
    // Navigate to chat
    const chatButton = sidepanelPage.locator('button:has-text("Chat")');
    await chatButton.click();
    
    // Trigger permission request with text
    await sidepanelPage.evaluate(async () => {
      const { createPermissionRequest } = await import('./src/lib/permissions');
      const { usePermissionStore } = await import('./src/stores/permissions');
      
      const request = createPermissionRequest(
        'computer',
        'https://example.com',
        {
          text: 'Hello, World!'
        }
      );
      
      usePermissionStore.getState().setPendingRequest(request);
    });
    
    // Wait for dialog
    await sidepanelPage.waitForSelector('text=Permission Required', { timeout: 5000 });
    
    // Verify text preview is displayed
    const textLabel = sidepanelPage.locator('text=Text to type:');
    await expect(textLabel).toBeVisible();
    
    const textPreview = sidepanelPage.locator('pre:has-text("Hello, World!")');
    await expect(textPreview).toBeVisible();
  });
});
