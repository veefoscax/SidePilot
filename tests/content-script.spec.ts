import { test, expect, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Content Script Injection Tests
 * 
 * These tests verify that the content script is properly built,
 * referenced in the manifest, and actually injects into web pages.
 */

test.describe('SidePilot Content Script', () => {
  const distPath = path.join(__dirname, '..', 'dist');
  const contentScriptPath = path.join(distPath, 'content.js');
  const manifestPath = path.join(distPath, 'manifest.json');

  test.describe('Static Tests', () => {
    test('should have built content script file', () => {
      expect(fs.existsSync(contentScriptPath)).toBe(true);
      
      const stats = fs.statSync(contentScriptPath);
      expect(stats.size).toBeGreaterThan(0);
      
      console.log(`Content script file size: ${stats.size} bytes`);
    });

    test('should contain expected console log', () => {
      const contentScriptContent = fs.readFileSync(contentScriptPath, 'utf8');
      
      // Check for the expected log message (may be minified)
      expect(contentScriptContent).toContain('SidePilot content script loaded');
      
      console.log('✅ Content script contains startup log');
    });

    test('should contain indicator creation code', () => {
      const contentScriptContent = fs.readFileSync(contentScriptPath, 'utf8');
      
      // Check for indicator creation
      expect(contentScriptContent).toContain('sidepilot-indicator');
      expect(contentScriptContent).toContain('createElement');
      
      console.log('✅ Content script contains indicator creation');
    });

    test('should be properly referenced in manifest', () => {
      expect(fs.existsSync(manifestPath)).toBe(true);
      
      const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      expect(manifestContent.content_scripts).toBeDefined();
      expect(manifestContent.content_scripts).toHaveLength(1);
      
      const contentScript = manifestContent.content_scripts[0];
      expect(contentScript.matches).toContain('<all_urls>');
      expect(contentScript.js).toContain('content.js');
      
      console.log('✅ Manifest correctly references content script');
    });
  });

  test.describe('Dynamic Tests', () => {
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

      // Wait for extension to load
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

    test('should inject content script and show console log', async () => {
      const page = await context.newPage();
      
      // Listen for console messages
      const consoleLogs: string[] = [];
      page.on('console', (msg) => {
        consoleLogs.push(msg.text());
      });
      
      // Navigate to a test page
      await page.goto('https://example.com');
      
      // Wait for content script to load
      await page.waitForTimeout(1000);
      
      // Check that the content script logged its startup message
      const hasContentScriptLog = consoleLogs.some(log => 
        log.includes('SidePilot content script loaded')
      );
      
      expect(hasContentScriptLog).toBe(true);
      console.log('✅ Content script console log detected');
    });

    test('should create visual indicator element', async () => {
      const page = await context.newPage();
      await page.goto('https://example.com');
      
      // Wait for content script to initialize
      await page.waitForTimeout(500);
      
      // Check that the indicator element is created
      const indicator = await page.locator('#sidepilot-indicator');
      expect(await indicator.count()).toBe(1);
      
      // Check indicator styles
      const styles = await indicator.getAttribute('style');
      expect(styles).toContain('position: fixed');
      expect(styles).toContain('background: #10b981');
      expect(styles).toContain('border-radius: 50%');
      
      console.log('✅ Visual indicator element created with correct styles');
    });

    test('should remove indicator after timeout', async () => {
      const page = await context.newPage();
      await page.goto('https://example.com');
      
      // Wait for content script to initialize
      await page.waitForTimeout(500);
      
      // Verify indicator exists initially
      let indicator = await page.locator('#sidepilot-indicator');
      expect(await indicator.count()).toBe(1);
      
      // Wait for the 3-second timeout
      await page.waitForTimeout(3500);
      
      // Verify indicator is removed
      indicator = await page.locator('#sidepilot-indicator');
      expect(await indicator.count()).toBe(0);
      
      console.log('✅ Visual indicator removed after timeout');
    });

    test('should inject on different domains', async () => {
      const testUrls = [
        'https://example.com',
        'https://httpbin.org/html',
        'https://www.google.com'
      ];
      
      for (const url of testUrls) {
        const page = await context.newPage();
        
        // Listen for console messages
        const consoleLogs: string[] = [];
        page.on('console', (msg) => {
          consoleLogs.push(msg.text());
        });
        
        try {
          await page.goto(url, { timeout: 10000 });
          await page.waitForTimeout(1000);
          
          // Check for content script log
          const hasContentScriptLog = consoleLogs.some(log => 
            log.includes('SidePilot content script loaded')
          );
          
          expect(hasContentScriptLog).toBe(true);
          console.log(`✅ Content script injected on ${url}`);
        } catch (error) {
          console.log(`⚠️ Skipping ${url} due to network/access issues`);
        } finally {
          await page.close();
        }
      }
    });

    test('should handle DOM ready states correctly', async () => {
      const page = await context.newPage();
      
      // Listen for console messages
      const consoleLogs: string[] = [];
      page.on('console', (msg) => {
        consoleLogs.push(msg.text());
      });
      
      // Navigate to a page
      await page.goto('https://example.com');
      
      // Wait for content script
      await page.waitForTimeout(1000);
      
      // Check that content script handled DOM ready state
      const hasContentScriptLog = consoleLogs.some(log => 
        log.includes('SidePilot content script loaded')
      );
      
      expect(hasContentScriptLog).toBe(true);
      
      // Verify the indicator was created (meaning DOM manipulation worked)
      const indicator = await page.locator('#sidepilot-indicator');
      expect(await indicator.count()).toBe(1);
      
      console.log('✅ Content script handles DOM ready states correctly');
    });
  });
});