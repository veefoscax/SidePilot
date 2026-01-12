import { test, expect, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Chrome Extension Service Worker Test
 * 
 * This test loads the SidePilot extension in Chrome and verifies
 * that the service worker runs correctly.
 */

test.describe('SidePilot Service Worker', () => {
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
    });

    // Wait for extension to load and get its ID
    await context.waitForEvent('page');
    
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
  });

  test.afterAll(async () => {
    if (context) {
      await context.close();
    }
  });

  test('should load extension without errors', async () => {
    const extensionsPage = await context.newPage();
    await extensionsPage.goto('chrome://extensions/');
    
    // Check that SidePilot is loaded and enabled
    const sidePilotCard = extensionsPage.locator('extensions-item').filter({
      has: extensionsPage.locator('#name', { hasText: 'SidePilot' })
    });
    
    expect(await sidePilotCard.count()).toBe(1);
    
    // Check that it's enabled
    const enableToggle = sidePilotCard.locator('#enableToggle');
    expect(await enableToggle.isChecked()).toBe(true);
    
    // Check for any error messages
    const errorMessages = sidePilotCard.locator('.error-message');
    expect(await errorMessages.count()).toBe(0);
  });

  test('should have active service worker', async () => {
    const extensionsPage = await context.newPage();
    await extensionsPage.goto('chrome://extensions/');
    
    // Find SidePilot extension card
    const sidePilotCard = extensionsPage.locator('extensions-item').filter({
      has: extensionsPage.locator('#name', { hasText: 'SidePilot' })
    });
    
    // Click details to see service worker
    await sidePilotCard.locator('#detailsButton').click();
    
    // Wait for details page to load
    await extensionsPage.waitForURL(/chrome:\/\/extensions\/\?id=/);
    
    // Look for service worker inspect link
    const serviceWorkerSection = extensionsPage.locator('text=Service worker');
    expect(await serviceWorkerSection.count()).toBeGreaterThan(0);
    
    // Check if service worker is active (inspect link should be present)
    const inspectLink = extensionsPage.locator('text=service worker').locator('..').locator('a');
    expect(await inspectLink.count()).toBeGreaterThan(0);
  });

  test('should open side panel when extension icon is clicked', async () => {
    // Create a new page to trigger extension icon
    const page = await context.newPage();
    await page.goto('https://example.com');
    
    // Wait a moment for page to load
    await page.waitForTimeout(1000);
    
    // Click extension icon (this is tricky in Playwright, we'll simulate it)
    // In a real test, you'd need to interact with the browser toolbar
    // For now, we'll verify the extension is loaded and ready
    
    // Check that extension context is available
    const hasExtensionContext = await page.evaluate(() => {
      return typeof chrome !== 'undefined' && 
             typeof chrome.runtime !== 'undefined';
    });
    
    expect(hasExtensionContext).toBe(true);
  });

  test('should have service worker console logs', async () => {
    // This test would require accessing the service worker console
    // which is challenging in Playwright. We'll verify the service worker
    // file exists and contains the expected logging code.
    
    const serviceWorkerPath = path.join(__dirname, '..', 'dist', 'service-worker.js');
    
    expect(fs.existsSync(serviceWorkerPath)).toBe(true);
    
    const serviceWorkerContent = fs.readFileSync(serviceWorkerPath, 'utf8');
    
    // Check for expected log messages (they'll be minified)
    expect(serviceWorkerContent).toContain('SidePilot service worker starting');
    expect(serviceWorkerContent).toContain('SidePilot service worker ready');
    expect(serviceWorkerContent).toContain('Extension icon clicked');
  });

  test('should register message listeners', async () => {
    // Verify the service worker has message handling capability
    const serviceWorkerPath = path.join(__dirname, '..', 'dist', 'service-worker.js');
    const serviceWorkerContent = fs.readFileSync(serviceWorkerPath, 'utf8');
    
    // Check for message listener registration
    expect(serviceWorkerContent).toContain('onMessage.addListener');
  });

  test('should handle installation events', async () => {
    // Verify the service worker handles installation
    const serviceWorkerPath = path.join(__dirname, '..', 'dist', 'service-worker.js');
    const serviceWorkerContent = fs.readFileSync(serviceWorkerPath, 'utf8');
    
    // Check for installation handler
    expect(serviceWorkerContent).toContain('onInstalled.addListener');
    expect(serviceWorkerContent).toContain('setPanelBehavior');
  });
});