/**
 * Permission System Integration Tests
 * 
 * Tests the integration between PermissionManager and permission store.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PermissionManager,
  getPermissionManager,
  createPermissionRequest,
  extractDomain,
  type PermissionMode,
} from '../permissions';

// Mock chrome.storage.local
const mockStorage: Record<string, any> = {};

globalThis.chrome = {
  storage: {
    local: {
      get: vi.fn((keys) => {
        if (typeof keys === 'string') {
          return Promise.resolve({ [keys]: mockStorage[keys] });
        }
        return Promise.resolve(mockStorage);
      }),
      set: vi.fn((items) => {
        Object.assign(mockStorage, items);
        return Promise.resolve();
      }),
      remove: vi.fn((keys) => {
        if (Array.isArray(keys)) {
          keys.forEach(key => delete mockStorage[key]);
        } else {
          delete mockStorage[keys];
        }
        return Promise.resolve();
      }),
    },
  },
} as any;

describe('Permission System Integration', () => {
  let manager: PermissionManager;

  beforeEach(async () => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    PermissionManager.resetInstance();
    manager = getPermissionManager();
    await manager.initialize();
  });

  it('should handle complete permission approval flow', async () => {
    const domain = 'example.com';
    const url = `https://${domain}/path`;
    
    const result1 = await manager.checkPermission(url, 'click');
    expect(result1.needsPrompt).toBe(true);
    
    await manager.setPermission(domain, 'always_allow');
    await manager.flushPendingSaves();
    
    const result2 = await manager.checkPermission(url, 'click');
    expect(result2.allowed).toBe(true);
  });

  it('should handle permission denial flow', async () => {
    const domain = 'example.com';
    const url = `https://${domain}/path`;
    
    await manager.setPermission(domain, 'deny');
    
    const result = await manager.checkPermission(url, 'click');
    expect(result.allowed).toBe(false);
    expect(result.needsPrompt).toBe(false);
  });

  it('should handle session-only approvals', async () => {
    const domain = 'example.com';
    const url = `https://${domain}/path`;
    
    await manager.setPermission(domain, 'ask_once');
    manager.approveSession(domain, 'click');
    
    const result = await manager.checkPermission(url, 'click');
    expect(result.allowed).toBe(true);
  });

  it('should handle tool-specific overrides', async () => {
    const domain = 'example.com';
    const url = `https://${domain}/path`;
    
    await manager.setPermission(domain, 'deny');
    await manager.setToolPermission(domain, 'click', 'always_allow');
    
    const clickResult = await manager.checkPermission(url, 'click');
    expect(clickResult.allowed).toBe(true);
    
    const typeResult = await manager.checkPermission(url, 'type');
    expect(typeResult.allowed).toBe(false);
  });

  it('should create permission requests correctly', async () => {
    const request = createPermissionRequest('click', 'https://example.com/path', {
      screenshot: 'data:image/png;base64,abc',
      coordinate: [100, 200] as [number, number],
    });
    
    expect(request.toolName).toBe('click');
    expect(request.domain).toBe('example.com');
    expect(request.actionData?.screenshot).toBeDefined();
  });

  it('should extract domains from URLs', async () => {
    expect(extractDomain('https://example.com/path')).toBe('example.com');
    expect(extractDomain('http://example.com:8080')).toBe('example.com');
    expect(extractDomain('https://sub.example.com')).toBe('sub.example.com');
  });

  it('should persist permissions across restarts', async () => {
    await manager.setPermission('example.com', 'always_allow');
    await manager.flushPendingSaves();
    
    PermissionManager.resetInstance();
    const newManager = getPermissionManager();
    await newManager.initialize();
    
    const permission = await newManager.getPermission('example.com');
    expect(permission?.defaultMode).toBe('always_allow');
  });

  it('should not persist session approvals', async () => {
    await manager.setPermission('example.com', 'ask_once');
    manager.approveSession('example.com', 'click');
    await manager.flushPendingSaves();
    
    PermissionManager.resetInstance();
    const newManager = getPermissionManager();
    await newManager.initialize();
    
    const result = await newManager.checkPermission('https://example.com', 'click');
    expect(result.needsPrompt).toBe(true);
  });

  it('should handle permission mode transitions', async () => {
    const domain = 'example.com';
    const url = `https://${domain}/path`;
    const modes: PermissionMode[] = ['always_allow', 'deny', 'ask_once', 'ask_always'];
    
    for (const mode of modes) {
      await manager.setPermission(domain, mode);
      const permission = await manager.getPermission(domain);
      expect(permission?.defaultMode).toBe(mode);
    }
  });
});
