/**
 * Notification Manager for SidePilot
 * Handles Chrome notifications for task completion, permission requests, and errors
 * 
 * Requirements: AC1, AC2, AC3
 */

import { storage } from './storage';

/**
 * Configuration for notification preferences
 */
export interface NotificationConfig {
  enabled: boolean;
  soundEnabled: boolean;
  types: {
    taskComplete: boolean;
    permissionRequired: boolean;
    error: boolean;
  };
}

/**
 * Default notification configuration
 */
const DEFAULT_CONFIG: NotificationConfig = {
  enabled: true,
  soundEnabled: false,
  types: {
    taskComplete: true,
    permissionRequired: true,
    error: true
  }
};

/**
 * Icon paths for different notification types
 * Currently all use the same icon, but structured for future customization
 */
const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  taskComplete: '/icons/icon128.png',      // Success icon (green checkmark in future)
  permissionRequired: '/icons/icon128.png', // Warning icon (yellow warning in future)
  error: '/icons/icon128.png'               // Error icon (red X in future)
};

/**
 * Storage key for notification configuration
 */
const STORAGE_KEY = 'notificationConfig';

/**
 * Notification type for type-safe access
 */
export type NotificationType = keyof NotificationConfig['types'];

/**
 * Options for individual notification types
 */
interface NotificationTypeOptions {
  requireInteraction: boolean;
  priority: 0 | 1 | 2;
}

/**
 * Type-specific notification options
 */
const NOTIFICATION_TYPE_OPTIONS: Record<NotificationType, NotificationTypeOptions> = {
  taskComplete: {
    requireInteraction: false,
    priority: 1
  },
  permissionRequired: {
    requireInteraction: true, // Keep permission notifications visible until user interacts
    priority: 2
  },
  error: {
    requireInteraction: false,
    priority: 2
  }
};

/**
 * NotificationManager handles all Chrome notification operations
 * including configuration persistence and notification creation
 */
class NotificationManager {
  private config: NotificationConfig = { ...DEFAULT_CONFIG };
  private initialized = false;

  /**
   * Load notification configuration from chrome.storage
   * Falls back to default config if none exists
   */
  async loadConfig(): Promise<void> {
    try {
      const stored = await storage.get<NotificationConfig>(STORAGE_KEY);
      if (stored) {
        // Merge with defaults to handle any missing properties from older configs
        this.config = {
          ...DEFAULT_CONFIG,
          ...stored,
          types: {
            ...DEFAULT_CONFIG.types,
            ...stored.types
          }
        };
      }
      this.initialized = true;
    } catch (error) {
      console.error('[NotificationManager] Failed to load config:', error);
      // Keep default config on error
      this.initialized = true;
    }
  }

  /**
   * Update notification configuration and persist to storage
   * @param updates - Partial configuration updates to apply
   */
  async updateConfig(updates: Partial<NotificationConfig>): Promise<void> {
    // Handle nested types object properly
    if (updates.types) {
      this.config = {
        ...this.config,
        ...updates,
        types: {
          ...this.config.types,
          ...updates.types
        }
      };
    } else {
      this.config = { ...this.config, ...updates };
    }
    
    try {
      await storage.set(STORAGE_KEY, this.config);
    } catch (error) {
      console.error('[NotificationManager] Failed to save config:', error);
      throw error;
    }
  }

  /**
   * Get current notification configuration
   */
  getConfig(): NotificationConfig {
    return { ...this.config };
  }

  /**
   * Check if manager has been initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Base notification method using chrome.notifications API
   * Uses type-specific icons and respects sound settings
   * @param type - The notification type (taskComplete, permissionRequired, error)
   * @param title - Notification title
   * @param message - Notification message body
   * @returns The notification ID if created, null if disabled
   */
  private async notify(
    type: NotificationType,
    title: string,
    message: string
  ): Promise<string | null> {
    // Check if notifications are enabled globally and for this type
    if (!this.config.enabled || !this.config.types[type]) {
      return null;
    }

    return new Promise((resolve) => {
      // Check if chrome.notifications API is available
      if (typeof chrome === 'undefined' || !chrome.notifications) {
        console.warn('[NotificationManager] chrome.notifications API not available');
        resolve(null);
        return;
      }

      // Get type-specific options
      const typeOptions = NOTIFICATION_TYPE_OPTIONS[type];
      const iconUrl = NOTIFICATION_ICONS[type];

      chrome.notifications.create(
        {
          type: 'basic',
          iconUrl,
          title,
          message,
          priority: typeOptions.priority,
          requireInteraction: typeOptions.requireInteraction,
          // silent: true means no sound, silent: false means play sound
          // When soundEnabled is true, we want sound (silent: false)
          // When soundEnabled is false, we want no sound (silent: true)
          silent: !this.config.soundEnabled
        },
        (notificationId) => {
          if (chrome.runtime.lastError) {
            console.error('[NotificationManager] Failed to create notification:', chrome.runtime.lastError);
            resolve(null);
          } else {
            resolve(notificationId);
          }
        }
      );
    });
  }

  /**
   * Notify user that a task has completed
   * Uses success icon and normal priority
   * @param taskName - Name of the completed task
   */
  async notifyTaskComplete(taskName: string): Promise<string | null> {
    return this.notify(
      'taskComplete',
      'Task Complete',
      `"${taskName}" has finished`
    );
  }

  /**
   * Notify user that permission is required for an action
   * Uses warning icon, high priority, and requires user interaction
   * @param tool - Name of the tool requiring permission
   */
  async notifyPermissionRequired(tool: string): Promise<string | null> {
    return this.notify(
      'permissionRequired',
      'Permission Required',
      `Action "${tool}" needs your approval`
    );
  }

  /**
   * Notify user about an error
   * Uses error icon and high priority
   * @param error - Error message (truncated to 100 chars)
   */
  async notifyError(error: string): Promise<string | null> {
    // Truncate error message to prevent overly long notifications
    const truncatedError = error.length > 100 ? error.substring(0, 100) + '...' : error;
    return this.notify('error', 'Error', truncatedError);
  }
}

// Create singleton instance
export const notifications = new NotificationManager();

/**
 * Set up notification click handler to open the extension
 * This should be called from the service worker
 */
export function setupNotificationClickHandler(): void {
  if (typeof chrome === 'undefined' || !chrome.notifications) {
    console.warn('[NotificationManager] chrome.notifications API not available for click handler');
    return;
  }

  chrome.notifications.onClicked.addListener((notificationId) => {
    // Open the side panel when notification is clicked
    if (chrome.sidePanel) {
      // Get the current window and open side panel
      chrome.windows.getCurrent((window) => {
        if (window.id) {
          chrome.sidePanel.open({ windowId: window.id }).catch((error) => {
            console.error('[NotificationManager] Failed to open side panel:', error);
          });
        }
      });
    }

    // Clear the notification after clicking
    chrome.notifications.clear(notificationId);
  });
}
