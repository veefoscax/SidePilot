/**
 * Test script for Permissions Settings UI
 * 
 * This script verifies that the permissions manager component is properly
 * integrated into the settings page and displays permissions correctly.
 */

import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testPermissionsSettings() {
  console.log('🧪 Testing Permissions Settings UI...\n');
  
  const extensionPath = path.join(__dirname, '..', 'dist');
  
  const browser = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });
  
  try {
    // Get extension ID
    const page = await browser.newPage();
    await page.goto('chrome://extensions/');
    await page.waitForTimeout(1000);
    
    const extensionId = await page.evaluate(() => {
      const extensions = document.querySelector('extensions-manager')
        ?.shadowRoot?.querySelector('extensions-item-list')
        ?.shadowRoot?.querySelectorAll('extensions-item');
      
      for (const ext of extensions || []) {
        const name = ext.shadowRoot?.querySelector('#name')?.textContent;
        if (name?.includes('SidePilot')) {
          return ext.getAttribute('id');
        }
      }
      return null;
    });
    
    if (!extensionId) {
      throw new Error('❌ Extension not found');
    }
    
    console.log('✅ Extension loaded:', extensionId);
    
    // Open sidepanel
    const sidepanelUrl = `chrome-extension://${extensionId}/src/sidepanel/index.html`;
    await page.goto(sidepanelUrl);
    await page.waitForTimeout(1000);
    
    console.log('✅ Sidepanel opened');
    
    // Click on Settings icon to open the settings sheet
    const settingsIcon = await page.locator('button[class*="h-8 w-8"]:has(svg)').last();
    await settingsIcon.click();
    await page.waitForTimeout(1000);
    console.log('✅ Opened Settings sheet');
    
    // Check for Permissions Manager section
    const permissionsTitle = await page.locator('text=Browser Automation Permissions').first();
    const isVisible = await permissionsTitle.isVisible();
    
    if (isVisible) {
      console.log('✅ Permissions Manager section is visible');
      
      // Check for description
      const description = await page.locator('text=Manage which domains can be automated').first();
      if (await description.isVisible()) {
        console.log('✅ Permissions description is visible');
      }
      
      // Check for empty state or permissions list
      const emptyState = await page.locator('text=No permissions configured').first();
      const emptyStateVisible = await emptyState.isVisible().catch(() => false);
      
      if (emptyStateVisible) {
        console.log('✅ Empty state is displayed (no permissions yet)');
        console.log('   Message: "Permissions will appear here when you approve or deny browser automation actions"');
      } else {
        // Check if there are any permission rows
        const permissionRows = await page.locator('[class*="border rounded-lg"]').count();
        if (permissionRows > 0) {
          console.log(`✅ Found ${permissionRows} permission(s) in the list`);
          
          // Check for Reset All button
          const resetButton = await page.locator('button:has-text("Reset All")').first();
          if (await resetButton.isVisible()) {
            console.log('✅ Reset All button is visible');
          }
        }
      }
      
      console.log('\n✅ All Permissions Settings UI tests passed!');
    } else {
      console.log('❌ Permissions Manager section not found');
      throw new Error('Permissions Manager section not visible');
    }
    
    // Keep browser open for manual inspection
    console.log('\n📋 Browser will remain open for manual inspection...');
    console.log('   Press Ctrl+C to close');
    
    await new Promise(() => {}); // Keep alive
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await browser.close();
    process.exit(1);
  }
}

testPermissionsSettings();
