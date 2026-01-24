/**
 * Permission System for Browser Automation
 * 
 * Provides domain-based permission control for browser automation tools.
 * Supports multiple permission modes and tool-specific overrides.
 */

/**
 * Permission modes that control how actions are authorized
 */
export type PermissionMode = 'always_allow' | 'ask_once' | 'ask_always' | 'deny';

/**
 * Domain-level permission configuration
 */
export interface DomainPermission {
  /** The domain this permission applies to (e.g., "example.com") */
  domain: string;
  
  /** Default permission mode for all tools on this domain */
  defaultMode: PermissionMode;
  
  /** Tool-specific permission overrides (toolName -> mode) */
  toolOverrides: Record<string, PermissionMode>;
  
  /** Timestamp of last permission usage */
  lastUsed: number;
  
  /** Timestamp when permission was created */
  createdAt: number;
}

/**
 * Request for permission to execute a tool action
 */
export interface PermissionRequest {
  /** Unique identifier for this request */
  id: string;
  
  /** Name of the tool requesting permission */
  toolName: string;
  
  /** Domain where the action will be performed */
  domain: string;
  
  /** Optional action-specific data for display */
  actionData?: {
    /** Screenshot showing the action context */
    screenshot?: string;
    
    /** Coordinate for click actions [x, y] */
    coordinate?: [number, number];
    
    /** Text content for type actions */
    text?: string;
  };
  
  /** Timestamp when request was created */
  timestamp: number;
}

/**
 * Result of a permission check
 */
export interface PermissionResult {
  /** Whether the action is allowed to proceed */
  allowed: boolean;
  
  /** Whether user prompt is needed */
  needsPrompt: boolean;
  
  /** Whether to remember the user's choice */
  rememberChoice?: boolean;
}

/**
 * Extract domain from a URL
 * 
 * @param url - Full URL or partial URL string
 * @returns The hostname/domain, or the original string if parsing fails
 * 
 * @example
 * extractDomain('https://example.com/path') // 'example.com'
 * extractDomain('http://sub.example.com:8080/') // 'sub.example.com'
 * extractDomain('invalid') // 'invalid'
 */
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    // If URL parsing fails, return the original string
    // This handles edge cases like relative URLs or malformed input
    return url;
  }
}

/**
 * Validate if a string is a valid PermissionMode
 * 
 * @param mode - String to validate
 * @returns True if the string is a valid PermissionMode
 */
export function isValidPermissionMode(mode: string): mode is PermissionMode {
  return ['always_allow', 'ask_once', 'ask_always', 'deny'].includes(mode);
}

/**
 * Create a new permission request
 * 
 * @param toolName - Name of the tool requesting permission
 * @param url - URL where the action will be performed
 * @param actionData - Optional action-specific data
 * @returns A new PermissionRequest object
 */
export function createPermissionRequest(
  toolName: string,
  url: string,
  actionData?: PermissionRequest['actionData']
): PermissionRequest {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    toolName,
    domain: extractDomain(url),
    actionData,
    timestamp: Date.now(),
  };
}

/**
 * Create a new domain permission with default values
 * 
 * @param domain - Domain for the permission
 * @param defaultMode - Default permission mode (defaults to 'ask_always')
 * @returns A new DomainPermission object
 */
export function createDomainPermission(
  domain: string,
  defaultMode: PermissionMode = 'ask_always'
): DomainPermission {
  return {
    domain,
    defaultMode,
    toolOverrides: {},
    lastUsed: Date.now(),
    createdAt: Date.now(),
  };
}

/**
 * Storage schema version for migrations
 */
const STORAGE_VERSION = 1;

/**
 * Storage structure for permissions
 */
interface PermissionStorage {
  version: number;
  permissions: DomainPermission[];
}

/**
 * Permission Manager - Singleton class for managing browser automation permissions
 * 
 * Handles permission checking, storage, and session-based approvals.
 * Supports domain-level and tool-specific permission modes.
 */
export class PermissionManager {
  private static instance: PermissionManager | null = null;
  
  /** Map of domain -> DomainPermission for quick lookup */
  private permissions: Map<string, DomainPermission> = new Map();
  
  /** Set of approved actions for this session (domain:toolName) */
  private sessionApprovals: Set<string> = new Set();
  
  /** Flag to track if permissions have been loaded from storage */
  private initialized = false;
  
  /** Storage key for persisting permissions */
  private static readonly STORAGE_KEY = 'domain_permissions';
  
  /** Debounce timer for saving permissions */
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  
  /** Debounce delay in milliseconds */
  private static readonly SAVE_DEBOUNCE_MS = 500;
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}
  
  /**
   * Get the singleton instance of PermissionManager
   */
  static getInstance(): PermissionManager {
    if (!PermissionManager.instance) {
      PermissionManager.instance = new PermissionManager();
    }
    return PermissionManager.instance;
  }
  
  /**
   * Initialize the permission manager by loading permissions from storage
   * This should be called once when the extension starts
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      const stored = await chrome.storage.local.get(PermissionManager.STORAGE_KEY);
      const data = stored[PermissionManager.STORAGE_KEY];
      
      if (!data) {
        // No stored permissions, start fresh
        this.initialized = true;
        return;
      }
      
      // Handle migration from old format to new format
      const migrated = await this.migrateStorage(data);
      
      if (migrated.permissions && Array.isArray(migrated.permissions)) {
        this.permissions.clear();
        migrated.permissions.forEach(permission => {
          // Validate permission structure
          if (this.isValidPermission(permission)) {
            this.permissions.set(permission.domain, permission);
          } else {
            console.warn('Skipping invalid permission:', permission);
          }
        });
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to load permissions from storage:', error);
      // Continue with empty permissions on error
      this.initialized = true;
    }
  }
  
  /**
   * Migrate storage data to current version
   * Handles schema changes between versions
   * 
   * @param data - Raw data from storage
   * @returns Migrated storage structure
   */
  private async migrateStorage(data: any): Promise<PermissionStorage> {
    // Check if data is already in new format with version
    if (data && typeof data === 'object' && 'version' in data) {
      const storage = data as PermissionStorage;
      
      // Handle future migrations here
      if (storage.version < STORAGE_VERSION) {
        console.log(`Migrating permissions from version ${storage.version} to ${STORAGE_VERSION}`);
        // Add migration logic for future versions here
        // For now, just update the version
        storage.version = STORAGE_VERSION;
        await this.savePermissionsImmediate();
      }
      
      return storage;
    }
    
    // Migrate from old format (array) to new format (versioned object)
    if (Array.isArray(data)) {
      console.log('Migrating permissions from legacy array format to versioned format');
      const migrated: PermissionStorage = {
        version: STORAGE_VERSION,
        permissions: data
      };
      
      // Save migrated data immediately
      await chrome.storage.local.set({
        [PermissionManager.STORAGE_KEY]: migrated
      });
      
      return migrated;
    }
    
    // Unknown format, return empty
    console.warn('Unknown storage format, starting fresh');
    return {
      version: STORAGE_VERSION,
      permissions: []
    };
  }
  
  /**
   * Validate that a permission object has the required structure
   * 
   * @param permission - Object to validate
   * @returns True if valid, false otherwise
   */
  private isValidPermission(permission: any): permission is DomainPermission {
    return (
      permission &&
      typeof permission === 'object' &&
      typeof permission.domain === 'string' &&
      typeof permission.defaultMode === 'string' &&
      isValidPermissionMode(permission.defaultMode) &&
      typeof permission.toolOverrides === 'object' &&
      typeof permission.lastUsed === 'number' &&
      typeof permission.createdAt === 'number'
    );
  }
  
  /**
   * Check if a tool action is permitted on a given URL
   * 
   * @param url - The URL where the action will be performed
   * @param toolName - The name of the tool requesting permission
   * @returns PermissionResult indicating if action is allowed and if prompt is needed
   */
  async checkPermission(url: string, toolName: string): Promise<PermissionResult> {
    // Ensure permissions are loaded
    await this.initialize();
    
    const domain = extractDomain(url);
    const permission = this.permissions.get(domain);
    
    // If no permission exists for this domain, prompt is needed
    if (!permission) {
      return { allowed: false, needsPrompt: true };
    }
    
    // Check tool-specific override first, fall back to default mode
    const mode = permission.toolOverrides[toolName] ?? permission.defaultMode;
    
    switch (mode) {
      case 'always_allow':
        return { allowed: true, needsPrompt: false };
        
      case 'deny':
        return { allowed: false, needsPrompt: false };
        
      case 'ask_once': {
        // Check if already approved this session
        const sessionKey = `${domain}:${toolName}`;
        const approved = this.sessionApprovals.has(sessionKey);
        return { allowed: approved, needsPrompt: !approved };
      }
        
      case 'ask_always':
      default:
        return { allowed: false, needsPrompt: true };
    }
  }
  
  /**
   * Set the default permission mode for a domain
   * 
   * @param domain - The domain to set permission for
   * @param mode - The permission mode to set
   */
  async setPermission(domain: string, mode: PermissionMode): Promise<void> {
    await this.initialize();
    
    let permission = this.permissions.get(domain);
    
    if (!permission) {
      // Create new permission if it doesn't exist
      permission = createDomainPermission(domain, mode);
    } else {
      // Update existing permission
      permission.defaultMode = mode;
      permission.lastUsed = Date.now();
    }
    
    this.permissions.set(domain, permission);
    await this.savePermissions();
  }
  
  /**
   * Set a tool-specific permission override for a domain
   * 
   * @param domain - The domain to set permission for
   * @param toolName - The tool to set permission for
   * @param mode - The permission mode to set
   */
  async setToolPermission(domain: string, toolName: string, mode: PermissionMode): Promise<void> {
    await this.initialize();
    
    let permission = this.permissions.get(domain);
    
    if (!permission) {
      // Create new permission with default mode if it doesn't exist
      permission = createDomainPermission(domain);
    }
    
    // Set tool-specific override
    permission.toolOverrides[toolName] = mode;
    permission.lastUsed = Date.now();
    
    this.permissions.set(domain, permission);
    await this.savePermissions();
  }
  
  /**
   * Approve a permission request for the current session
   * This is used for 'ask_once' mode to remember the approval
   * 
   * @param domain - The domain to approve
   * @param toolName - The tool to approve
   */
  approveSession(domain: string, toolName: string): void {
    const sessionKey = `${domain}:${toolName}`;
    this.sessionApprovals.add(sessionKey);
  }
  
  /**
   * Get the permission configuration for a domain
   * 
   * @param domain - The domain to get permission for
   * @returns The DomainPermission or null if not found
   */
  async getPermission(domain: string): Promise<DomainPermission | null> {
    await this.initialize();
    return this.permissions.get(domain) ?? null;
  }
  
  /**
   * Get all domain permissions
   * 
   * @returns Array of all DomainPermission objects
   */
  async getAllPermissions(): Promise<DomainPermission[]> {
    await this.initialize();
    return Array.from(this.permissions.values());
  }
  
  /**
   * Delete a domain permission
   * 
   * @param domain - The domain to delete permission for
   */
  async deletePermission(domain: string): Promise<void> {
    await this.initialize();
    this.permissions.delete(domain);
    
    // Also clear any session approvals for this domain
    const keysToDelete = Array.from(this.sessionApprovals)
      .filter(key => key.startsWith(`${domain}:`));
    keysToDelete.forEach(key => this.sessionApprovals.delete(key));
    
    await this.savePermissions();
  }
  
  /**
   * Clear all permissions and session approvals
   */
  async clearAll(): Promise<void> {
    await this.initialize();
    this.permissions.clear();
    this.sessionApprovals.clear();
    await this.savePermissions();
  }
  
  /**
   * Save permissions to chrome.storage with debouncing
   * Debouncing prevents excessive writes when multiple changes happen quickly
   */
  private async savePermissions(): Promise<void> {
    // Clear existing timer
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    
    // Set new timer for debounced save
    this.saveTimer = setTimeout(async () => {
      await this.savePermissionsImmediate();
      this.saveTimer = null;
    }, PermissionManager.SAVE_DEBOUNCE_MS);
  }
  
  /**
   * Save permissions to chrome.storage immediately without debouncing
   * Used for critical operations like migrations
   */
  private async savePermissionsImmediate(): Promise<void> {
    try {
      const permissionsArray = Array.from(this.permissions.values());
      const storage: PermissionStorage = {
        version: STORAGE_VERSION,
        permissions: permissionsArray
      };
      
      await chrome.storage.local.set({
        [PermissionManager.STORAGE_KEY]: storage
      });
    } catch (error) {
      console.error('Failed to save permissions to storage:', error);
      // Don't throw - we want to continue even if storage fails
      // The in-memory state is still valid
    }
  }
  
  /**
   * Flush any pending saves immediately
   * Useful when the extension is about to unload
   */
  async flushPendingSaves(): Promise<void> {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
      await this.savePermissionsImmediate();
    }
  }
  
  /**
   * Reset the singleton instance (useful for testing)
   * @internal
   */
  static resetInstance(): void {
    PermissionManager.instance = null;
  }
}

/**
 * Get the singleton instance of PermissionManager
 * Convenience function for accessing the manager
 */
export function getPermissionManager(): PermissionManager {
  return PermissionManager.getInstance();
}
