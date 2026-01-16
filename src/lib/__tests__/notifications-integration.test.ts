/**
 * Integration Tests for Notification System
 * 
 * This file documents the integration test coverage for the S12-notifications spec.
 * Most integration scenarios are already covered by the unit tests in notifications.test.ts.
 * 
 * Task 6 Requirements Coverage:
 * 
 * 1. Test notifications appear correctly
 *    - Covered by: notifications.test.ts
 *      - "should create notification when enabled"
 *      - "should create permission notification with requireInteraction"
 *      - "should create error notification"
 *      - Sound support tests (AC3)
 *      - Type-specific options tests (AC3)
 * 
 * 2. Test disable toggle works
 *    - Covered by: notifications.test.ts
 *      - "should not create notification when globally disabled"
 *      - "should not create notification when specific type is disabled"
 *      - "should respect taskComplete toggle"
 *      - "should respect permissionRequired toggle"
 *      - "should respect error toggle"
 *      - Config persistence tests (AC1)
 * 
 * 3. Test notification click opens extension
 *    - Covered by: notifications.test.ts
 *      - "should register click listener"
 *      - "should open side panel when notification is clicked"
 *      - "should clear notification after clicking"
 * 
 * 4. Test focus detection
 *    - NOTE: Focus detection was mentioned in Task 5 ("Only notify when side panel not focused")
 *      but is not yet implemented in the notification manager.
 *    - The notification system currently sends notifications regardless of focus state.
 *    - Future implementation would add a check before sending notifications.
 * 
 * Requirements Mapping:
 * - AC1 (Enable/Disable): Config Loading, Config Updates tests
 * - AC2 (Task Complete): Notification Creation tests
 * - AC3 (Permission Required): Permission notification tests with requireInteraction
 * - AC4 (Error Notification): Error notification tests with truncation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Declare global for TypeScript
declare const global: typeof globalThis;

// Mock storage module
vi.mock('../storage', () => {
  const mockStorage: Record<string, unknown> = {};
  return {
    storage: {
      get: vi.fn(async (key: string) => mockStorage[key] ?? null),
      set: vi.fn(async (key: string, value: unknown) => {
        mockStorage[key] = value;
      }),
      remove: vi.fn(async (key: string) => {
        delete mockStorage[key];
      }),
      _mockStorage: mockStorage,
      _clearMockStorage: () => {
        Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
      },
    },
  };
});

// Mock chrome APIs
const mockNotifications: Record<string, unknown> = {};
let notificationIdCounter = 0;

const mockChromeNotifications = {
  create: vi.fn((options: unknown, callback?: (id: string) => void) => {
    const id = `notification-${++notificationIdCounter}`;
    mockNotifications[id] = options;
    if (callback) callback(id);
    return id;
  }),
  clear: vi.fn((id: string, callback?: (wasCleared: boolean) => void) => {
    const wasCleared = id in mockNotifications;
    delete mockNotifications[id];
    if (callback) callback(wasCleared);
    return Promise.resolve(wasCleared);
  }),
  onClicked: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
};

const mockChromeRuntime = {
  lastError: null as { message: string } | null,
};

const mockChromeSidePanel = {
  open: vi.fn(() => Promise.resolve()),
};

const mockChromeWindows = {
  getCurrent: vi.fn((callback: (window: { id: number }) => void) => {
    callback({ id: 1 });
  }),
};

// Set up global chrome mock
global.chrome = {
  notifications: mockChromeNotifications,
  runtime: mockChromeRuntime,
  sidePanel: mockChromeSidePanel,
  windows: mockChromeWindows,
} as unknown as typeof chrome;

// Import after mocks
import { storage } from '../storage';

// Helper to get fresh NotificationManager instance
async function createFreshNotificationManager() {
  vi.resetModules();
  
  vi.doMock('../storage', () => ({
    storage: {
      get: vi.fn(async (key: string) => (storage as Record<string, unknown>)._mockStorage[key] ?? null),
      set: vi.fn(async (key: string, value: unknown) => {
        (storage as Record<string, unknown>)._mockStorage[key] = value;
      }),
      remove: vi.fn(async (key: string) => {
        delete (storage as Record<string, unknown>)._mockStorage[key];
      }),
    },
  }));
  
  const module = await import('../notifications');
  return module;
}

describe('Notifications Integration Tests', () => {
  beforeEach(() => {
    (storage as Record<string, unknown>)._clearMockStorage();
    Object.keys(mockNotifications).forEach(key => delete mockNotifications[key]);
    notificationIdCounter = 0;
    mockChromeRuntime.lastError = null;
    vi.clearAllMocks();
    
    (storage.get as ReturnType<typeof vi.fn>).mockImplementation(
      async (key: string) => (storage as Record<string, unknown>)._mockStorage[key] ?? null
    );
    (storage.set as ReturnType<typeof vi.fn>).mockImplementation(
      async (key: string, value: unknown) => {
        (storage as Record<string, unknown>)._mockStorage[key] = value;
      }
    );
  });

  describe('End-to-End Notification Flow', () => {
    it('should complete full notification lifecycle: create -> click -> open side panel -> clear', async () => {
      const { notifications, setupNotificationClickHandler } = await createFreshNotificationManager();
      
      // Initialize
      await notifications.loadConfig();
      setupNotificationClickHandler();
      
      // Create notification
      const notificationId = await notifications.notifyTaskComplete('Integration Test Task');
      expect(notificationId).toBe('notification-1');
      expect(mockChromeNotifications.create).toHaveBeenCalledTimes(1);
      
      // Simulate click
      const clickHandler = mockChromeNotifications.onClicked.addListener.mock.calls[0][0];
      clickHandler(notificationId);
      
      // Verify side panel opened
      expect(mockChromeWindows.getCurrent).toHaveBeenCalled();
      expect(mockChromeSidePanel.open).toHaveBeenCalledWith({ windowId: 1 });
      
      // Verify notification cleared
      expect(mockChromeNotifications.clear).toHaveBeenCalledWith(notificationId);
    });

    it('should persist config changes across manager reloads', async () => {
      // First session - update config
      const { notifications: notifications1 } = await createFreshNotificationManager();
      await notifications1.loadConfig();
      await notifications1.updateConfig({ enabled: false, soundEnabled: true });
      
      // Verify storage was updated
      const storedConfig = (storage as Record<string, unknown>)._mockStorage['notificationConfig'];
      expect(storedConfig).toEqual(expect.objectContaining({
        enabled: false,
        soundEnabled: true,
      }));
      
      // Second session - load config
      const { notifications: notifications2 } = await createFreshNotificationManager();
      await notifications2.loadConfig();
      
      const config = notifications2.getConfig();
      expect(config.enabled).toBe(false);
      expect(config.soundEnabled).toBe(true);
    });
  });

  describe('Multiple Notification Types Integration', () => {
    it('should handle multiple notification types in sequence', async () => {
      const { notifications } = await createFreshNotificationManager();
      await notifications.loadConfig();
      
      // Send different notification types
      const taskId = await notifications.notifyTaskComplete('Task 1');
      const permId = await notifications.notifyPermissionRequired('click');
      const errorId = await notifications.notifyError('Something went wrong');
      
      expect(taskId).toBe('notification-1');
      expect(permId).toBe('notification-2');
      expect(errorId).toBe('notification-3');
      
      // Verify each was created with correct options
      expect(mockChromeNotifications.create).toHaveBeenCalledTimes(3);
      
      // Task complete - normal priority
      expect(mockChromeNotifications.create).toHaveBeenNthCalledWith(1,
        expect.objectContaining({
          title: 'Task Complete',
          priority: 1,
          requireInteraction: false,
        }),
        expect.any(Function)
      );
      
      // Permission required - high priority, requires interaction
      expect(mockChromeNotifications.create).toHaveBeenNthCalledWith(2,
        expect.objectContaining({
          title: 'Permission Required',
          priority: 2,
          requireInteraction: true,
        }),
        expect.any(Function)
      );
      
      // Error - high priority
      expect(mockChromeNotifications.create).toHaveBeenNthCalledWith(3,
        expect.objectContaining({
          title: 'Error',
          priority: 2,
        }),
        expect.any(Function)
      );
    });

    it('should selectively disable notification types while keeping others enabled', async () => {
      const { notifications } = await createFreshNotificationManager();
      await notifications.loadConfig();
      
      // Disable only task complete notifications
      await notifications.updateConfig({
        types: { taskComplete: false, permissionRequired: true, error: true },
      });
      
      const taskId = await notifications.notifyTaskComplete('Task');
      const permId = await notifications.notifyPermissionRequired('click');
      const errorId = await notifications.notifyError('Error');
      
      expect(taskId).toBeNull(); // Disabled
      expect(permId).toBe('notification-1'); // Enabled
      expect(errorId).toBe('notification-2'); // Enabled
    });
  });

  describe('Config and Notification State Consistency', () => {
    it('should immediately reflect config changes in notification behavior', async () => {
      const { notifications } = await createFreshNotificationManager();
      await notifications.loadConfig();
      
      // Initially enabled
      const id1 = await notifications.notifyTaskComplete('Task 1');
      expect(id1).not.toBeNull();
      
      // Disable
      await notifications.updateConfig({ enabled: false });
      const id2 = await notifications.notifyTaskComplete('Task 2');
      expect(id2).toBeNull();
      
      // Re-enable
      await notifications.updateConfig({ enabled: true });
      const id3 = await notifications.notifyTaskComplete('Task 3');
      expect(id3).not.toBeNull();
    });

    it('should handle rapid config toggles correctly', async () => {
      const { notifications } = await createFreshNotificationManager();
      await notifications.loadConfig();
      
      // Rapid toggles
      await notifications.updateConfig({ enabled: false });
      await notifications.updateConfig({ enabled: true });
      await notifications.updateConfig({ enabled: false });
      await notifications.updateConfig({ enabled: true });
      
      // Final state should be enabled
      const config = notifications.getConfig();
      expect(config.enabled).toBe(true);
      
      // Notification should work
      const id = await notifications.notifyTaskComplete('Task');
      expect(id).not.toBeNull();
    });
  });

  describe('Focus Detection (Not Yet Implemented)', () => {
    /**
     * NOTE: Focus detection is mentioned in Task 5 requirements:
     * "Only notify when side panel not focused"
     * 
     * This functionality is NOT YET IMPLEMENTED in the notification manager.
     * The tests below document the expected behavior for future implementation.
     * 
     * Future implementation would:
     * 1. Track side panel focus state (via document.hasFocus() or visibility API)
     * 2. Check focus state before sending notifications
     * 3. Skip notifications when side panel is focused (user is already looking at it)
     */
    
    it.skip('should not send notifications when side panel is focused', async () => {
      // Future test: When side panel has focus, notifications should be suppressed
      // This prevents redundant notifications when user is already viewing the extension
    });

    it.skip('should send notifications when side panel is not focused', async () => {
      // Future test: When side panel loses focus (user switches tabs/windows),
      // notifications should be sent normally
    });

    it.skip('should resume notifications when side panel loses focus', async () => {
      // Future test: Verify notifications resume after focus is lost
    });
  });

  describe('Error Handling Integration', () => {
    it('should gracefully handle chrome API errors during notification creation', async () => {
      const { notifications } = await createFreshNotificationManager();
      await notifications.loadConfig();
      
      // Simulate API error
      mockChromeNotifications.create.mockImplementationOnce(
        (_options: unknown, callback?: (id: string) => void) => {
          mockChromeRuntime.lastError = { message: 'Notification limit reached' };
          if (callback) callback('');
          return '';
        }
      );
      
      const id = await notifications.notifyTaskComplete('Task');
      expect(id).toBeNull();
      
      // Reset error state
      mockChromeRuntime.lastError = null;
      
      // Subsequent notifications should work
      const id2 = await notifications.notifyTaskComplete('Task 2');
      expect(id2).not.toBeNull();
    });

    it('should handle storage errors during config load gracefully', async () => {
      (storage.get as ReturnType<typeof vi.fn>).mockImplementationOnce(
        () => Promise.reject(new Error('Storage unavailable'))
      );
      
      const { notifications } = await createFreshNotificationManager();
      
      // Should not throw
      await expect(notifications.loadConfig()).resolves.not.toThrow();
      
      // Should use default config
      const config = notifications.getConfig();
      expect(config.enabled).toBe(true);
      expect(config.types.taskComplete).toBe(true);
    });
  });
});
