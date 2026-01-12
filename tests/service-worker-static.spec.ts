import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Static Service Worker Tests
 * 
 * These tests verify the service worker file is built correctly
 * without requiring a running Chrome instance.
 */

test.describe('SidePilot Service Worker - Static Tests', () => {
  const distPath = path.join(__dirname, '..', 'dist');
  const serviceWorkerPath = path.join(distPath, 'service-worker.js');
  const manifestPath = path.join(distPath, 'manifest.json');

  test('should have built service worker file', () => {
    expect(fs.existsSync(serviceWorkerPath)).toBe(true);
    
    const stats = fs.statSync(serviceWorkerPath);
    expect(stats.size).toBeGreaterThan(0);
    
    console.log(`Service worker file size: ${stats.size} bytes`);
  });

  test('should contain expected startup logs', () => {
    const serviceWorkerContent = fs.readFileSync(serviceWorkerPath, 'utf8');
    
    // Check for expected log messages (they'll be minified)
    expect(serviceWorkerContent).toContain('SidePilot service worker starting');
    expect(serviceWorkerContent).toContain('SidePilot service worker ready');
    
    console.log('✅ Service worker contains startup logs');
  });

  test('should contain extension icon click handler', () => {
    const serviceWorkerContent = fs.readFileSync(serviceWorkerPath, 'utf8');
    
    expect(serviceWorkerContent).toContain('Extension icon clicked');
    expect(serviceWorkerContent).toContain('opening side panel');
    
    console.log('✅ Service worker contains click handler');
  });

  test('should register message listeners', () => {
    const serviceWorkerContent = fs.readFileSync(serviceWorkerPath, 'utf8');
    
    // Check for message listener registration
    expect(serviceWorkerContent).toContain('onMessage.addListener');
    
    console.log('✅ Service worker registers message listeners');
  });

  test('should handle installation events', () => {
    const serviceWorkerContent = fs.readFileSync(serviceWorkerPath, 'utf8');
    
    // Check for installation handler
    expect(serviceWorkerContent).toContain('onInstalled.addListener');
    expect(serviceWorkerContent).toContain('SidePilot installed');
    expect(serviceWorkerContent).toContain('setPanelBehavior');
    
    console.log('✅ Service worker handles installation events');
  });

  test('should be properly referenced in manifest', () => {
    expect(fs.existsSync(manifestPath)).toBe(true);
    
    const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    expect(manifestContent.background).toBeDefined();
    expect(manifestContent.background.service_worker).toBe('service-worker.js');
    expect(manifestContent.background.type).toBe('module');
    
    console.log('✅ Manifest correctly references service worker');
  });

  test('should have correct Chrome extension permissions', () => {
    const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    expect(manifestContent.permissions).toContain('sidePanel');
    expect(manifestContent.permissions).toContain('storage');
    expect(manifestContent.permissions).toContain('activeTab');
    
    console.log('✅ Manifest has required permissions');
  });

  test('should have side panel configuration', () => {
    const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    expect(manifestContent.side_panel).toBeDefined();
    expect(manifestContent.side_panel.default_path).toBeDefined();
    
    console.log('✅ Manifest has side panel configuration');
  });

  test('should have action configuration for extension icon', () => {
    const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    expect(manifestContent.action).toBeDefined();
    expect(manifestContent.action.default_title).toBe('Open SidePilot');
    
    console.log('✅ Manifest has action configuration');
  });
});