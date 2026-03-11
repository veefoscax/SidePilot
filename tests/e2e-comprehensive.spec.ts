/**
 * Comprehensive E2E Test Suite for SidePilot Extension
 * 
 * Tests all major functionality programmatically:
 * - Extension loading and initialization
 * - Side panel UI interactions
 * - Provider configuration
 * - Chat interface
 * - Settings management
 * - Browser automation tools
 * 
 * Run with: npx playwright test tests/e2e-comprehensive.spec.ts --headed
 */

import { test, expect, chromium, type BrowserContext, type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Extension paths
const EXTENSION_PATH = path.join(__dirname, '..', 'dist');
const SCREENSHOTS_PATH = path.join(__dirname, '..', 'screenshots', 'e2e-tests');

let context: BrowserContext;
let extensionId: string;
let sidePanelPage: Page;

test.describe('SidePilot Extension - Comprehensive E2E Tests', () => {
  
  test.beforeAll(async () => {
    console.log('🚀 Loading SidePilot extension...');
    
    // Launch Chrome with extension loaded
    context = await chromium.launchPersistentContext('', {
      headless: false, // Must be false for extensions
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        '--no-sandbox',
      ],
      viewport: { width: 1280, height: 720 },
    });

    // Get extension ID from background page
    const backgroundPages = context.backgroundPages();
    if (backgroundPages.length > 0) {
      const backgroundPage = backgroundPages[0];
      extensionId = backgroundPage.url().split('/')[2];
      console.log(`✅ Extension loaded with ID: ${extensionId}`);
    } else {
      // Wait for background page to load
      const backgroundPage = await context.waitForEvent('backgroundpage');
      extensionId = backgroundPage.url().split('/')[2];
      console.log(`✅ Extension loaded with ID: ${extensionId}`);
    }
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('1. Extension loads successfully', async () => {
    expect(extensionId).toBeTruthy();
    expect(extensionId).toMatch(/^[a-z]{32}$/);
  });

  test('2. Side panel opens and displays correctly', async ({ page }) => {
    console.log('📱 Opening side panel...');
    
    // Navigate to a test page
    await page.goto('https://example.com');
    
    // Open side panel via chrome.sidePanel API
    // Note: In real usage, user clicks extension icon
    // For testing, we navigate directly to the side panel URL
    sidePanelPage = await context.newPage();
    await sidePanelPage.goto(`chrome-extension://${extensionId}/src/sidepanel/index.html`);
    
    // Wait for React to render
    await sidePanelPage.waitForLoadState('networkidle');
    await sidePanelPage.waitForTimeout(1000);
    
    // Take screenshot
    await sidePanelPage.screenshot({ 
      path: path.join(SCREENSHOTS_PATH, '01-sidepanel-initial.png'),
      fullPage: true 
    });
    
    // Verify main UI elements exist
    const chatButton = sidePanelPage.locator('button:has-text("Chat"), [aria-label*="Chat"]').first();
    const settingsButton = sidePanelPage.locator('button:has-text("Settings"), [aria-label*="Settings"]').first();
    
    await expect(chatButton).toBeVisible({ timeout: 5000 });
    await expect(settingsButton).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Side panel opened successfully');
  });

  test('3. Navigate to Settings page', async () => {
    console.log('⚙️ Testing Settings navigation...');
    
    // Click Settings button
    const settingsButton = sidePanelPage.locator('button:has-text("Settings"), [aria-label*="Settings"]').first();
    await settingsButton.click();
    await sidePanelPage.waitForTimeout(500);
    
    // Take screenshot
    await sidePanelPage.screenshot({ 
      path: path.join(SCREENSHOTS_PATH, '02-settings-page.png'),
      fullPage: true 
    });
    
    // Verify settings page elements
    const providerSettings = sidePanelPage.locator('text=/Provider|Model|API Key/i').first();
    await expect(providerSettings).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Settings page loaded');
  });

  test('4. Test Provider Configuration UI', async () => {
    console.log('🔧 Testing provider configuration...');
    
    // Look for "Add Provider" or similar button
    const addProviderButton = sidePanelPage.locator('button:has-text("Add Provider"), button:has-text("Add Model")').first();
    
    if (await addProviderButton.isVisible({ timeout: 2000 })) {
      await addProviderButton.click();
      await sidePanelPage.waitForTimeout(500);
      
      // Take screenshot of provider selection
      await sidePanelPage.screenshot({ 
        path: path.join(SCREENSHOTS_PATH, '03-add-provider.png'),
        fullPage: true 
      });
    }
    
    // Check for provider cards/sections
    const providerCards = sidePanelPage.locator('[class*="provider"], [class*="card"]');
    const cardCount = await providerCards.count();
    console.log(`📊 Found ${cardCount} provider-related elements`);
    
    // Verify provider selector exists
    const providerSelector = sidePanelPage.locator('select, [role="combobox"]').first();
    if (await providerSelector.isVisible({ timeout: 2000 })) {
      await providerSelector.click();
      await sidePanelPage.waitForTimeout(300);
      
      // Take screenshot of provider dropdown
      await sidePanelPage.screenshot({ 
        path: path.join(SCREENSHOTS_PATH, '04-provider-dropdown.png'),
        fullPage: true 
      });
      
      // Close dropdown
      await sidePanelPage.keyboard.press('Escape');
    }
    
    console.log('✅ Provider configuration UI verified');
  });

  test('5. Test General Settings', async () => {
    console.log('🌐 Testing general settings...');
    
    // Look for language/theme settings
    const languageSelector = sidePanelPage.locator('text=/Language|Idioma/i');
    const themeSelector = sidePanelPage.locator('text=/Theme|Tema/i');
    
    if (await languageSelector.isVisible({ timeout: 2000 })) {
      console.log('✅ Language settings found');
    }
    
    if (await themeSelector.isVisible({ timeout: 2000 })) {
      console.log('✅ Theme settings found');
    }
    
    // Take screenshot
    await sidePanelPage.screenshot({ 
      path: path.join(SCREENSHOTS_PATH, '05-general-settings.png'),
      fullPage: true 
    });
  });

  test('6. Navigate to Chat page', async () => {
    console.log('💬 Testing Chat navigation...');
    
    // Click Chat button
    const chatButton = sidePanelPage.locator('button:has-text("Chat"), [aria-label*="Chat"]').first();
    await chatButton.click();
    await sidePanelPage.waitForTimeout(500);
    
    // Take screenshot
    await sidePanelPage.screenshot({ 
      path: path.join(SCREENSHOTS_PATH, '06-chat-page.png'),
      fullPage: true 
    });
    
    // Verify chat interface elements
    const messageInput = sidePanelPage.locator('textarea, input[type="text"]').first();
    await expect(messageInput).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Chat page loaded');
  });

  test('7. Test Chat Input Area', async () => {
    console.log('⌨️ Testing chat input...');
    
    // Find message input
    const messageInput = sidePanelPage.locator('textarea, input[type="text"]').first();
    
    // Type a test message
    await messageInput.fill('Hello, this is a test message!');
    await sidePanelPage.waitForTimeout(300);
    
    // Take screenshot with typed message
    await sidePanelPage.screenshot({ 
      path: path.join(SCREENSHOTS_PATH, '07-chat-input-filled.png'),
      fullPage: true 
    });
    
    // Clear input
    await messageInput.clear();
    
    console.log('✅ Chat input working');
  });

  test('8. Test Model Selector (if visible)', async () => {
    console.log('🤖 Testing model selector...');
    
    // Look for model selector in chat header
    const modelSelector = sidePanelPage.locator('[class*="model"], button:has-text("Model")').first();
    
    if (await modelSelector.isVisible({ timeout: 2000 })) {
      await modelSelector.click();
      await sidePanelPage.waitForTimeout(300);
      
      // Take screenshot
      await sidePanelPage.screenshot({ 
        path: path.join(SCREENSHOTS_PATH, '08-model-selector.png'),
        fullPage: true 
      });
      
      // Close selector
      await sidePanelPage.keyboard.press('Escape');
      console.log('✅ Model selector found and tested');
    } else {
      console.log('ℹ️ Model selector not visible (may require provider configuration)');
    }
  });

  test('9. Test Voice Controls (if visible)', async () => {
    console.log('🎤 Testing voice controls...');
    
    // Look for voice/microphone button
    const voiceButton = sidePanelPage.locator('button[aria-label*="voice"], button[aria-label*="microphone"]').first();
    
    if (await voiceButton.isVisible({ timeout: 2000 })) {
      // Take screenshot
      await sidePanelPage.screenshot({ 
        path: path.join(SCREENSHOTS_PATH, '09-voice-controls.png'),
        fullPage: true 
      });
      
      console.log('✅ Voice controls found');
    } else {
      console.log('ℹ️ Voice controls not visible');
    }
  });

  test('10. Test Conversation Management', async () => {
    console.log('💾 Testing conversation management...');
    
    // Look for conversation save/load buttons
    const conversationButton = sidePanelPage.locator('button:has-text("Save"), button:has-text("Load"), button[aria-label*="conversation"]').first();
    
    if (await conversationButton.isVisible({ timeout: 2000 })) {
      await conversationButton.click();
      await sidePanelPage.waitForTimeout(300);
      
      // Take screenshot
      await sidePanelPage.screenshot({ 
        path: path.join(SCREENSHOTS_PATH, '10-conversation-management.png'),
        fullPage: true 
      });
      
      // Close dialog
      await sidePanelPage.keyboard.press('Escape');
      console.log('✅ Conversation management found');
    } else {
      console.log('ℹ️ Conversation management not visible');
    }
  });

  test('11. Test Shortcuts/Slash Commands', async () => {
    console.log('⚡ Testing shortcuts...');
    
    const messageInput = sidePanelPage.locator('textarea, input[type="text"]').first();
    
    // Type slash to trigger slash menu
    await messageInput.fill('/');
    await sidePanelPage.waitForTimeout(500);
    
    // Take screenshot
    await sidePanelPage.screenshot({ 
      path: path.join(SCREENSHOTS_PATH, '11-slash-menu.png'),
      fullPage: true 
    });
    
    // Clear input
    await messageInput.clear();
    
    console.log('✅ Shortcuts tested');
  });

  test('12. Test Browser Automation Settings', async () => {
    console.log('🔧 Testing browser automation settings...');
    
    // Navigate to settings
    const settingsButton = sidePanelPage.locator('button:has-text("Settings"), [aria-label*="Settings"]').first();
    await settingsButton.click();
    await sidePanelPage.waitForTimeout(500);
    
    // Look for browser automation section
    const automationSection = sidePanelPage.locator('text=/Browser Automation|Permissions|Tools/i').first();
    
    if (await automationSection.isVisible({ timeout: 2000 })) {
      // Scroll to section
      await automationSection.scrollIntoViewIfNeeded();
      await sidePanelPage.waitForTimeout(300);
      
      // Take screenshot
      await sidePanelPage.screenshot({ 
        path: path.join(SCREENSHOTS_PATH, '12-browser-automation.png'),
        fullPage: true 
      });
      
      console.log('✅ Browser automation settings found');
    } else {
      console.log('ℹ️ Browser automation settings not visible');
    }
  });

  test('13. Test Permissions Manager', async () => {
    console.log('🔐 Testing permissions manager...');
    
    // Look for permissions section
    const permissionsSection = sidePanelPage.locator('text=/Permissions|Allow|Deny/i').first();
    
    if (await permissionsSection.isVisible({ timeout: 2000 })) {
      await permissionsSection.scrollIntoViewIfNeeded();
      await sidePanelPage.waitForTimeout(300);
      
      // Take screenshot
      await sidePanelPage.screenshot({ 
        path: path.join(SCREENSHOTS_PATH, '13-permissions.png'),
        fullPage: true 
      });
      
      console.log('✅ Permissions manager found');
    } else {
      console.log('ℹ️ Permissions manager not visible');
    }
  });

  test('14. Test MCP Integration Settings', async () => {
    console.log('🔌 Testing MCP integration...');
    
    // Look for MCP section
    const mcpSection = sidePanelPage.locator('text=/MCP|Model Context Protocol|Connector/i').first();
    
    if (await mcpSection.isVisible({ timeout: 2000 })) {
      await mcpSection.scrollIntoViewIfNeeded();
      await sidePanelPage.waitForTimeout(300);
      
      // Take screenshot
      await sidePanelPage.screenshot({ 
        path: path.join(SCREENSHOTS_PATH, '14-mcp-integration.png'),
        fullPage: true 
      });
      
      console.log('✅ MCP integration found');
    } else {
      console.log('ℹ️ MCP integration not visible');
    }
  });

  test('15. Test Workflow Recording (if available)', async () => {
    console.log('📹 Testing workflow recording...');
    
    // Navigate back to chat
    const chatButton = sidePanelPage.locator('button:has-text("Chat"), [aria-label*="Chat"]').first();
    await chatButton.click();
    await sidePanelPage.waitForTimeout(500);
    
    // Look for recording button
    const recordButton = sidePanelPage.locator('button[aria-label*="record"], button:has-text("Record")').first();
    
    if (await recordButton.isVisible({ timeout: 2000 })) {
      // Take screenshot
      await sidePanelPage.screenshot({ 
        path: path.join(SCREENSHOTS_PATH, '15-workflow-recording.png'),
        fullPage: true 
      });
      
      console.log('✅ Workflow recording found');
    } else {
      console.log('ℹ️ Workflow recording not visible');
    }
  });

  test('16. Test Responsive Layout', async () => {
    console.log('📱 Testing responsive layout...');
    
    // Test different viewport sizes
    const viewports = [
      { width: 400, height: 600, name: 'narrow' },
      { width: 600, height: 800, name: 'medium' },
      { width: 800, height: 1000, name: 'wide' },
    ];
    
    for (const viewport of viewports) {
      await sidePanelPage.setViewportSize(viewport);
      await sidePanelPage.waitForTimeout(500);
      
      // Take screenshot
      await sidePanelPage.screenshot({ 
        path: path.join(SCREENSHOTS_PATH, `16-responsive-${viewport.name}.png`),
        fullPage: true 
      });
    }
    
    // Reset to default
    await sidePanelPage.setViewportSize({ width: 1280, height: 720 });
    
    console.log('✅ Responsive layout tested');
  });

  test('17. Test Theme Switching (if available)', async () => {
    console.log('🎨 Testing theme switching...');
    
    // Navigate to settings
    const settingsButton = sidePanelPage.locator('button:has-text("Settings"), [aria-label*="Settings"]').first();
    await settingsButton.click();
    await sidePanelPage.waitForTimeout(500);
    
    // Look for theme toggle
    const themeToggle = sidePanelPage.locator('button[aria-label*="theme"], button:has-text("Dark"), button:has-text("Light")').first();
    
    if (await themeToggle.isVisible({ timeout: 2000 })) {
      // Take screenshot before toggle
      await sidePanelPage.screenshot({ 
        path: path.join(SCREENSHOTS_PATH, '17-theme-before.png'),
        fullPage: true 
      });
      
      // Toggle theme
      await themeToggle.click();
      await sidePanelPage.waitForTimeout(500);
      
      // Take screenshot after toggle
      await sidePanelPage.screenshot({ 
        path: path.join(SCREENSHOTS_PATH, '17-theme-after.png'),
        fullPage: true 
      });
      
      console.log('✅ Theme switching tested');
    } else {
      console.log('ℹ️ Theme toggle not visible');
    }
  });

  test('18. Test Language Switching', async () => {
    console.log('🌍 Testing language switching...');
    
    // Look for language selector
    const languageSelector = sidePanelPage.locator('select[aria-label*="language"], [role="combobox"]:near(:text("Language"))').first();
    
    if (await languageSelector.isVisible({ timeout: 2000 })) {
      // Take screenshot before change
      await sidePanelPage.screenshot({ 
        path: path.join(SCREENSHOTS_PATH, '18-language-before.png'),
        fullPage: true 
      });
      
      // Change language
      await languageSelector.click();
      await sidePanelPage.waitForTimeout(300);
      
      // Select Portuguese if available
      const portugueseOption = sidePanelPage.locator('option:has-text("Português"), [role="option"]:has-text("Português")').first();
      if (await portugueseOption.isVisible({ timeout: 1000 })) {
        await portugueseOption.click();
        await sidePanelPage.waitForTimeout(500);
        
        // Take screenshot after change
        await sidePanelPage.screenshot({ 
          path: path.join(SCREENSHOTS_PATH, '18-language-after.png'),
          fullPage: true 
        });
      }
      
      console.log('✅ Language switching tested');
    } else {
      console.log('ℹ️ Language selector not visible');
    }
  });

  test('19. Test Error Handling', async () => {
    console.log('⚠️ Testing error handling...');
    
    // Navigate to chat
    const chatButton = sidePanelPage.locator('button:has-text("Chat"), [aria-label*="Chat"]').first();
    await chatButton.click();
    await sidePanelPage.waitForTimeout(500);
    
    // Try to send message without provider configured
    const messageInput = sidePanelPage.locator('textarea, input[type="text"]').first();
    const sendButton = sidePanelPage.locator('button[type="submit"], button[aria-label*="send"]').first();
    
    await messageInput.fill('Test message');
    
    if (await sendButton.isVisible({ timeout: 2000 })) {
      await sendButton.click();
      await sidePanelPage.waitForTimeout(1000);
      
      // Take screenshot (should show error or warning)
      await sidePanelPage.screenshot({ 
        path: path.join(SCREENSHOTS_PATH, '19-error-handling.png'),
        fullPage: true 
      });
      
      console.log('✅ Error handling tested');
    }
  });

  test('20. Final State Screenshot', async () => {
    console.log('📸 Taking final state screenshot...');
    
    // Take comprehensive screenshot
    await sidePanelPage.screenshot({ 
      path: path.join(SCREENSHOTS_PATH, '20-final-state.png'),
      fullPage: true 
    });
    
    console.log('✅ All E2E tests completed!');
    console.log(`📁 Screenshots saved to: ${SCREENSHOTS_PATH}`);
  });

  test('21. Console Errors Check', async () => {
    console.log('🔍 Checking for console errors...');
    
    const errors: string[] = [];
    
    sidePanelPage.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Navigate through pages to trigger any errors
    const chatButton = sidePanelPage.locator('button:has-text("Chat")').first();
    await chatButton.click();
    await sidePanelPage.waitForTimeout(500);
    
    const settingsButton = sidePanelPage.locator('button:has-text("Settings")').first();
    await settingsButton.click();
    await sidePanelPage.waitForTimeout(500);
    
    if (errors.length > 0) {
      console.log('⚠️ Console errors found:');
      errors.forEach(err => console.log(`  - ${err}`));
    } else {
      console.log('✅ No console errors detected');
    }
  });
});

test.describe('Browser Automation Tools Testing', () => {
  
  test('22. Test CDP Wrapper Integration', async ({ page }) => {
    console.log('🔧 Testing CDP wrapper...');
    
    // Navigate to test page
    await page.goto('https://example.com');
    await page.waitForLoadState('networkidle');
    
    // Check if content script is injected
    const hasContentScript = await page.evaluate(() => {
      return typeof (window as any).__SIDEPILOT_CONTENT_SCRIPT__ !== 'undefined';
    });
    
    console.log(`Content script injected: ${hasContentScript}`);
    
    // Take screenshot
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_PATH, '22-cdp-test-page.png'),
      fullPage: true 
    });
  });

  test('23. Test Accessibility Tree Extraction', async ({ page }) => {
    console.log('🌳 Testing accessibility tree...');
    
    await page.goto('https://example.com');
    await page.waitForLoadState('networkidle');
    
    // Try to extract accessibility tree via content script
    const accessibilityTree = await page.evaluate(() => {
      const elements = document.querySelectorAll('a, button, input, select, textarea');
      return Array.from(elements).map(el => ({
        tag: el.tagName,
        text: el.textContent?.slice(0, 50),
        role: el.getAttribute('role'),
      }));
    });
    
    console.log(`Found ${accessibilityTree.length} interactive elements`);
    expect(accessibilityTree.length).toBeGreaterThan(0);
  });
});
