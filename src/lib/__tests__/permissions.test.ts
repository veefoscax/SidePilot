import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  extractDomain,
  isValidPermissionMode,
  createPermissionRequest,
  createDomainPermission,
  PermissionManager,
  getPermissionManager,
  type PermissionMode,
} from '../permissions';

describe('Permission Types', () => {
  describe('extractDomain', () => {
    it('should extract domain from standard HTTPS URL', () => {
      expect(extractDomain('https://example.com/path')).toBe('example.com');
    });

    it('should extract domain from HTTP URL', () => {
      expect(extractDomain('http://example.com')).toBe('example.com');
    });

    it('should extract domain with subdomain', () => {
      expect(extractDomain('https://sub.example.com/path')).toBe('sub.example.com');
    });

    it('should extract domain with port', () => {
      expect(extractDomain('http://example.com:8080/path')).toBe('example.com');
    });

    it('should extract domain with query parameters', () => {
      expect(extractDomain('https://example.com/path?query=value')).toBe('example.com');
    });

    it('should extract domain with hash fragment', () => {
      expect(extractDomain('https://example.com/path#section')).toBe('example.com');
    });

    it('should handle localhost', () => {
      expect(extractDomain('http://localhost:3000')).toBe('localhost');
    });

    it('should handle IP addresses', () => {
      expect(extractDomain('http://192.168.1.1:8080')).toBe('192.168.1.1');
    });

    it('should return original string for invalid URLs', () => {
      expect(extractDomain('not-a-url')).toBe('not-a-url');
    });

    it('should return original string for empty string', () => {
      expect(extractDomain('')).toBe('');
    });

    it('should handle URLs with authentication', () => {
      expect(extractDomain('https://user:pass@example.com/path')).toBe('example.com');
    });

    it('should handle file:// protocol', () => {
      expect(extractDomain('file:///path/to/file.html')).toBe('');
    });
  });

  describe('isValidPermissionMode', () => {
    it('should return true for "always_allow"', () => {
      expect(isValidPermissionMode('always_allow')).toBe(true);
    });

    it('should return true for "ask_once"', () => {
      expect(isValidPermissionMode('ask_once')).toBe(true);
    });

    it('should return true for "ask_always"', () => {
      expect(isValidPermissionMode('ask_always')).toBe(true);
    });

    it('should return true for "deny"', () => {
      expect(isValidPermissionMode('deny')).toBe(true);
    });

    it('should return false for invalid mode', () => {
      expect(isValidPermissionMode('invalid')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidPermissionMode('')).toBe(false);
    });

    it('should return false for similar but incorrect values', () => {
      expect(isValidPermissionMode('always-allow')).toBe(false);
      expect(isValidPermissionMode('ALWAYS_ALLOW')).toBe(false);
      expect(isValidPermissionMode('allow')).toBe(false);
    });
  });

  describe('createPermissionRequest', () => {
    it('should create a basic permission request', () => {
      const request = createPermissionRequest('click', 'https://example.com/path');
      
      expect(request.toolName).toBe('click');
      expect(request.domain).toBe('example.com');
      expect(request.id).toBeDefined();
      expect(request.timestamp).toBeGreaterThan(0);
      expect(request.actionData).toBeUndefined();
    });

    it('should create request with action data', () => {
      const actionData = {
        screenshot: 'data:image/png;base64,abc123',
        coordinate: [100, 200] as [number, number],
      };
      
      const request = createPermissionRequest('click', 'https://example.com', actionData);
      
      expect(request.actionData).toEqual(actionData);
    });

    it('should create request with text action data', () => {
      const actionData = {
        text: 'Hello, World!',
      };
      
      const request = createPermissionRequest('type', 'https://example.com', actionData);
      
      expect(request.actionData?.text).toBe('Hello, World!');
    });

    it('should generate unique IDs for different requests', () => {
      const request1 = createPermissionRequest('click', 'https://example.com');
      const request2 = createPermissionRequest('click', 'https://example.com');
      
      expect(request1.id).not.toBe(request2.id);
    });

    it('should extract domain from URL', () => {
      const request = createPermissionRequest('navigate', 'https://sub.example.com:8080/path?q=1');
      
      expect(request.domain).toBe('sub.example.com');
    });

    it('should handle invalid URLs gracefully', () => {
      const request = createPermissionRequest('click', 'invalid-url');
      
      expect(request.domain).toBe('invalid-url');
    });
  });

  describe('createDomainPermission', () => {
    it('should create domain permission with default mode', () => {
      const permission = createDomainPermission('example.com');
      
      expect(permission.domain).toBe('example.com');
      expect(permission.defaultMode).toBe('ask_always');
      expect(permission.toolOverrides).toEqual({});
      expect(permission.lastUsed).toBeGreaterThan(0);
      expect(permission.createdAt).toBeGreaterThan(0);
    });

    it('should create domain permission with custom mode', () => {
      const permission = createDomainPermission('example.com', 'always_allow');
      
      expect(permission.defaultMode).toBe('always_allow');
    });

    it('should create permission with all valid modes', () => {
      const modes: PermissionMode[] = ['always_allow', 'ask_once', 'ask_always', 'deny'];
      
      modes.forEach(mode => {
        const permission = createDomainPermission('example.com', mode);
        expect(permission.defaultMode).toBe(mode);
      });
    });

    it('should initialize empty tool overrides', () => {
      const permission = createDomainPermission('example.com');
      
      expect(permission.toolOverrides).toEqual({});
      expect(Object.keys(permission.toolOverrides).length).toBe(0);
    });

    it('should set timestamps correctly', () => {
      const before = Date.now();
      const permission = createDomainPermission('example.com');
      const after = Date.now();
      
      expect(permission.createdAt).toBeGreaterThanOrEqual(before);
      expect(permission.createdAt).toBeLessThanOrEqual(after);
      expect(permission.lastUsed).toBeGreaterThanOrEqual(before);
      expect(permission.lastUsed).toBeLessThanOrEqual(after);
    });

    it('should handle different domain formats', () => {
      const domains = [
        'example.com',
        'sub.example.com',
        'localhost',
        '192.168.1.1',
      ];
      
      domains.forEach(domain => {
        const permission = createDomainPermission(domain);
        expect(permission.domain).toBe(domain);
      });
    });
  });
});


describe('PermissionManager', () => {
  let manager: PermissionManager;
  
  // Mock chrome.storage.local
  const mockStorage: Record<string, any> = {};
  
  beforeEach(() => {
    // Reset the singleton instance before each test
    PermissionManager.resetInstance();
    manager = PermissionManager.getInstance();
    
    // Clear mock storage
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    
    // Mock chrome.storage.local
    global.chrome = {
      storage: {
        local: {
          get: vi.fn((key: string) => {
            return Promise.resolve({ [key]: mockStorage[key] });
          }),
          set: vi.fn((items: Record<string, any>) => {
            Object.assign(mockStorage, items);
            return Promise.resolve();
          }),
          remove: vi.fn((key: string) => {
            delete mockStorage[key];
            return Promise.resolve();
          }),
        },
      },
    } as any;
  });
  
  afterEach(() => {
    PermissionManager.resetInstance();
  });
  
  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = PermissionManager.getInstance();
      const instance2 = PermissionManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });
    
    it('should reset instance correctly', () => {
      const instance1 = PermissionManager.getInstance();
      PermissionManager.resetInstance();
      const instance2 = PermissionManager.getInstance();
      
      expect(instance1).not.toBe(instance2);
    });
  });
  
  describe('Initialization', () => {
    it('should initialize with empty permissions', async () => {
      await manager.initialize();
      const permissions = await manager.getAllPermissions();
      
      expect(permissions).toEqual([]);
    });
    
    it('should load permissions from storage', async () => {
      const storedPermissions = [
        createDomainPermission('example.com', 'always_allow'),
        createDomainPermission('test.com', 'deny'),
      ];
      
      mockStorage['domain_permissions'] = storedPermissions;
      
      await manager.initialize();
      const permissions = await manager.getAllPermissions();
      
      expect(permissions).toHaveLength(2);
      expect(permissions.find(p => p.domain === 'example.com')?.defaultMode).toBe('always_allow');
      expect(permissions.find(p => p.domain === 'test.com')?.defaultMode).toBe('deny');
    });
    
    it('should handle storage errors gracefully', async () => {
      global.chrome.storage.local.get = vi.fn(() => Promise.reject(new Error('Storage error')));
      
      await expect(manager.initialize()).resolves.not.toThrow();
      const permissions = await manager.getAllPermissions();
      expect(permissions).toEqual([]);
    });
    
    it('should only initialize once', async () => {
      await manager.initialize();
      await manager.initialize();
      await manager.initialize();
      
      expect(chrome.storage.local.get).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('checkPermission', () => {
    it('should return needsPrompt for unknown domain', async () => {
      const result = await manager.checkPermission('https://example.com', 'click');
      
      expect(result.allowed).toBe(false);
      expect(result.needsPrompt).toBe(true);
    });
    
    it('should allow action for always_allow mode', async () => {
      await manager.setPermission('example.com', 'always_allow');
      const result = await manager.checkPermission('https://example.com/path', 'click');
      
      expect(result.allowed).toBe(true);
      expect(result.needsPrompt).toBe(false);
    });
    
    it('should deny action for deny mode', async () => {
      await manager.setPermission('example.com', 'deny');
      const result = await manager.checkPermission('https://example.com', 'click');
      
      expect(result.allowed).toBe(false);
      expect(result.needsPrompt).toBe(false);
    });
    
    it('should prompt for ask_always mode', async () => {
      await manager.setPermission('example.com', 'ask_always');
      const result = await manager.checkPermission('https://example.com', 'click');
      
      expect(result.allowed).toBe(false);
      expect(result.needsPrompt).toBe(true);
    });
    
    it('should prompt first time for ask_once mode', async () => {
      await manager.setPermission('example.com', 'ask_once');
      const result = await manager.checkPermission('https://example.com', 'click');
      
      expect(result.allowed).toBe(false);
      expect(result.needsPrompt).toBe(true);
    });
    
    it('should allow after session approval for ask_once mode', async () => {
      await manager.setPermission('example.com', 'ask_once');
      manager.approveSession('example.com', 'click');
      
      const result = await manager.checkPermission('https://example.com', 'click');
      
      expect(result.allowed).toBe(true);
      expect(result.needsPrompt).toBe(false);
    });
    
    it('should use tool-specific override over default mode', async () => {
      await manager.setPermission('example.com', 'deny');
      await manager.setToolPermission('example.com', 'click', 'always_allow');
      
      const clickResult = await manager.checkPermission('https://example.com', 'click');
      const typeResult = await manager.checkPermission('https://example.com', 'type');
      
      expect(clickResult.allowed).toBe(true);
      expect(clickResult.needsPrompt).toBe(false);
      expect(typeResult.allowed).toBe(false);
      expect(typeResult.needsPrompt).toBe(false);
    });
    
    it('should extract domain from URL correctly', async () => {
      await manager.setPermission('example.com', 'always_allow');
      
      const result1 = await manager.checkPermission('https://example.com/path', 'click');
      const result2 = await manager.checkPermission('http://example.com:8080', 'click');
      const result3 = await manager.checkPermission('https://example.com?query=value', 'click');
      
      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(result3.allowed).toBe(true);
    });
  });
  
  describe('setPermission', () => {
    it('should create new permission for unknown domain', async () => {
      await manager.setPermission('example.com', 'always_allow');
      
      const permission = await manager.getPermission('example.com');
      expect(permission).not.toBeNull();
      expect(permission?.defaultMode).toBe('always_allow');
      expect(permission?.domain).toBe('example.com');
    });
    
    it('should update existing permission', async () => {
      await manager.setPermission('example.com', 'deny');
      await manager.setPermission('example.com', 'always_allow');
      
      const permission = await manager.getPermission('example.com');
      expect(permission?.defaultMode).toBe('always_allow');
    });
    
    it('should persist permission to storage', async () => {
      await manager.setPermission('example.com', 'always_allow');
      await manager.flushPendingSaves(); // Flush debounced save
      
      expect(chrome.storage.local.set).toHaveBeenCalled();
      expect(mockStorage['domain_permissions']).toBeDefined();
      expect(mockStorage['domain_permissions'].permissions).toHaveLength(1);
      expect(mockStorage['domain_permissions'].permissions[0].domain).toBe('example.com');
    });
    
    it('should update lastUsed timestamp', async () => {
      const before = Date.now();
      await manager.setPermission('example.com', 'always_allow');
      const after = Date.now();
      
      const permission = await manager.getPermission('example.com');
      expect(permission?.lastUsed).toBeGreaterThanOrEqual(before);
      expect(permission?.lastUsed).toBeLessThanOrEqual(after);
    });
  });
  
  describe('setToolPermission', () => {
    it('should set tool-specific override', async () => {
      await manager.setToolPermission('example.com', 'click', 'always_allow');
      
      const permission = await manager.getPermission('example.com');
      expect(permission?.toolOverrides['click']).toBe('always_allow');
    });
    
    it('should create permission if domain does not exist', async () => {
      await manager.setToolPermission('example.com', 'click', 'always_allow');
      
      const permission = await manager.getPermission('example.com');
      expect(permission).not.toBeNull();
      expect(permission?.defaultMode).toBe('ask_always'); // Default mode
      expect(permission?.toolOverrides['click']).toBe('always_allow');
    });
    
    it('should allow multiple tool overrides', async () => {
      await manager.setToolPermission('example.com', 'click', 'always_allow');
      await manager.setToolPermission('example.com', 'type', 'deny');
      await manager.setToolPermission('example.com', 'navigate', 'ask_once');
      
      const permission = await manager.getPermission('example.com');
      expect(permission?.toolOverrides['click']).toBe('always_allow');
      expect(permission?.toolOverrides['type']).toBe('deny');
      expect(permission?.toolOverrides['navigate']).toBe('ask_once');
    });
    
    it('should persist tool permission to storage', async () => {
      await manager.setToolPermission('example.com', 'click', 'always_allow');
      await manager.flushPendingSaves(); // Flush debounced save
      
      expect(chrome.storage.local.set).toHaveBeenCalled();
      expect(mockStorage['domain_permissions'].permissions[0].toolOverrides['click']).toBe('always_allow');
    });
  });
  
  describe('Session Approvals', () => {
    it('should track session approval', async () => {
      await manager.setPermission('example.com', 'ask_once');
      
      manager.approveSession('example.com', 'click');
      
      const result = await manager.checkPermission('https://example.com', 'click');
      expect(result.allowed).toBe(true);
    });
    
    it('should track separate approvals for different tools', async () => {
      await manager.setPermission('example.com', 'ask_once');
      
      manager.approveSession('example.com', 'click');
      
      const clickResult = await manager.checkPermission('https://example.com', 'click');
      const typeResult = await manager.checkPermission('https://example.com', 'type');
      
      expect(clickResult.allowed).toBe(true);
      expect(typeResult.allowed).toBe(false);
    });
    
    it('should track separate approvals for different domains', async () => {
      await manager.setPermission('example.com', 'ask_once');
      await manager.setPermission('test.com', 'ask_once');
      
      manager.approveSession('example.com', 'click');
      
      const exampleResult = await manager.checkPermission('https://example.com', 'click');
      const testResult = await manager.checkPermission('https://test.com', 'click');
      
      expect(exampleResult.allowed).toBe(true);
      expect(testResult.allowed).toBe(false);
    });
    
    it('should not persist session approvals to storage', async () => {
      await manager.setPermission('example.com', 'ask_once');
      await manager.flushPendingSaves(); // Flush the setPermission save
      
      // Reset the mock to count only new calls
      (chrome.storage.local.set as any).mockClear();
      
      manager.approveSession('example.com', 'click');
      
      // Session approvals should not trigger storage writes immediately
      // (no debounced save should be scheduled)
      const setCalls = (chrome.storage.local.set as any).mock.calls.length;
      expect(setCalls).toBe(0); // No calls after session approval
      
      // Also flush to ensure no pending saves
      await manager.flushPendingSaves();
      const setCallsAfterFlush = (chrome.storage.local.set as any).mock.calls.length;
      expect(setCallsAfterFlush).toBe(0); // Still no calls
    });
    
    it('should clear session approvals when deleting permission', async () => {
      await manager.setPermission('example.com', 'ask_once');
      manager.approveSession('example.com', 'click');
      manager.approveSession('example.com', 'type');
      
      await manager.deletePermission('example.com');
      
      // Re-add permission and check that session approvals are gone
      await manager.setPermission('example.com', 'ask_once');
      const result = await manager.checkPermission('https://example.com', 'click');
      expect(result.allowed).toBe(false);
    });
  });
  
  describe('Domain Permission Persistence', () => {
    it('should persist permission across manager instances', async () => {
      await manager.setPermission('example.com', 'always_allow');
      await manager.flushPendingSaves(); // Flush debounced save
      
      // Create new manager instance
      PermissionManager.resetInstance();
      const newManager = PermissionManager.getInstance();
      
      const permission = await newManager.getPermission('example.com');
      expect(permission?.defaultMode).toBe('always_allow');
    });
    
    it('should persist multiple permissions', async () => {
      await manager.setPermission('example.com', 'always_allow');
      await manager.setPermission('test.com', 'deny');
      await manager.setPermission('demo.com', 'ask_once');
      
      const permissions = await manager.getAllPermissions();
      expect(permissions).toHaveLength(3);
    });
    
    it('should persist tool overrides', async () => {
      await manager.setPermission('example.com', 'deny');
      await manager.setToolPermission('example.com', 'click', 'always_allow');
      await manager.flushPendingSaves(); // Flush debounced save
      
      PermissionManager.resetInstance();
      const newManager = PermissionManager.getInstance();
      
      const permission = await newManager.getPermission('example.com');
      expect(permission?.toolOverrides['click']).toBe('always_allow');
    });
  });
  
  describe('getAllPermissions', () => {
    it('should return empty array when no permissions exist', async () => {
      const permissions = await manager.getAllPermissions();
      expect(permissions).toEqual([]);
    });
    
    it('should return all permissions', async () => {
      await manager.setPermission('example.com', 'always_allow');
      await manager.setPermission('test.com', 'deny');
      
      const permissions = await manager.getAllPermissions();
      expect(permissions).toHaveLength(2);
      expect(permissions.map(p => p.domain)).toContain('example.com');
      expect(permissions.map(p => p.domain)).toContain('test.com');
    });
  });
  
  describe('deletePermission', () => {
    it('should delete permission', async () => {
      await manager.setPermission('example.com', 'always_allow');
      await manager.deletePermission('example.com');
      
      const permission = await manager.getPermission('example.com');
      expect(permission).toBeNull();
    });
    
    it('should persist deletion to storage', async () => {
      await manager.setPermission('example.com', 'always_allow');
      await manager.deletePermission('example.com');
      await manager.flushPendingSaves(); // Flush debounced save
      
      expect(mockStorage['domain_permissions'].permissions).toEqual([]);
    });
    
    it('should not affect other permissions', async () => {
      await manager.setPermission('example.com', 'always_allow');
      await manager.setPermission('test.com', 'deny');
      await manager.deletePermission('example.com');
      
      const testPermission = await manager.getPermission('test.com');
      expect(testPermission).not.toBeNull();
    });
  });
  
  describe('clearAll', () => {
    it('should clear all permissions', async () => {
      await manager.setPermission('example.com', 'always_allow');
      await manager.setPermission('test.com', 'deny');
      
      await manager.clearAll();
      
      const permissions = await manager.getAllPermissions();
      expect(permissions).toEqual([]);
    });
    
    it('should clear session approvals', async () => {
      await manager.setPermission('example.com', 'ask_once');
      manager.approveSession('example.com', 'click');
      
      await manager.clearAll();
      
      // Re-add permission and check that session approval is gone
      await manager.setPermission('example.com', 'ask_once');
      const result = await manager.checkPermission('https://example.com', 'click');
      expect(result.allowed).toBe(false);
    });
    
    it('should persist clear to storage', async () => {
      await manager.setPermission('example.com', 'always_allow');
      await manager.clearAll();
      await manager.flushPendingSaves(); // Flush debounced save
      
      expect(mockStorage['domain_permissions'].permissions).toEqual([]);
    });
  });
  
  describe('getPermissionManager', () => {
    it('should return singleton instance', () => {
      const manager1 = getPermissionManager();
      const manager2 = getPermissionManager();
      
      expect(manager1).toBe(manager2);
    });
  });
});
