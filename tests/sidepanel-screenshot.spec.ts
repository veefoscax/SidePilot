import { test, expect, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Side Panel Screenshot Tests
 * 
 * These tests capture screenshots of the SidePilot side panel
 * for visual regression testing and DEVLOG documentation.
 */

test.describe('SidePilot Side Panel Screenshots', () => {
  let context: BrowserContext;
  let extensionId: string;

  test.beforeAll(async () => {
    // Launch Chrome with extension loaded
    const pathToExtension = path.join(__dirname, '..', 'dist');
    
    context = await chromium.launchPersistentContext('', {
      headless: false, // Extensions require non-headless mode
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        '--no-sandbox',
        '--disable-dev-shm-usage'
      ],
      viewport: { width: 1280, height: 720 }
    });

    // Get extension ID from chrome://extensions page
    const extensionsPage = await context.newPage();
    await extensionsPage.goto('chrome://extensions/');
    
    // Enable developer mode if not already enabled
    const devModeToggle = extensionsPage.locator('#devMode');
    if (await devModeToggle.isVisible()) {
      await devModeToggle.click();
    }

    // Find SidePilot extension
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
    console.log('Extension ID:', extensionId);
    
    await extensionsPage.close();
  });

  test.afterAll(async () => {
    if (context) {
      await context.close();
    }
  });

  test('should capture side panel screenshot', async () => {
    // Open side panel by navigating directly to the extension's side panel URL
    const sidePanelUrl = `chrome-extension://${extensionId}/sidepanel.html`;
    const sidePanelPage = await context.newPage();
    await sidePanelPage.goto(sidePanelUrl);
    
    // Wait for React to render
    await sidePanelPage.waitForTimeout(3000);
    
    // Verify the side panel loaded correctly
    const title = await sidePanelPage.locator('h1').textContent();
    expect(title).toBe('SidePilot');
    
    // Verify key elements are present
    const statusCard = sidePanelPage.locator('text=Extension Active');
    expect(await statusCard.count()).toBe(1);
    
    // Ensure screenshots directory exists
    const screenshotsDir = path.join(__dirname, '..', 'screenshots', 'side-panel');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    
    // Capture screenshot with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const screenshotPath = path.join(screenshotsDir, `sidepanel-${timestamp}.png`);
    
    await sidePanelPage.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    
    console.log(`✅ Screenshot saved: ${screenshotPath}`);
    
    // Verify screenshot file was created
    expect(fs.existsSync(screenshotPath)).toBe(true);
    
    // Get file size for verification
    const stats = fs.statSync(screenshotPath);
    expect(stats.size).toBeGreaterThan(1000); // Should be at least 1KB
    
    console.log(`📸 Screenshot size: ${Math.round(stats.size / 1024)}KB`);
    
    await sidePanelPage.close();
  });
});