/**
 * SidePilot Permission Store
 * 
 * Zustand store for managing browser automation permissions and permission requests.
 * Syncs with PermissionManager singleton for permission checking and storage.
 */

import { create } from 'zustand';
import { 
  DomainPermission, 
  PermissionRequest, 
  PermissionMode,
  getPermissionManager 
} from '@/lib/permissions';

interface PermissionState {
  // Permission data
  permissions: DomainPermission[];
  
  // Pending permission request (shown in dialog)
  pendingRequest: PermissionRequest | null;
  
  // Loading state
  isLoading: boolean;
  
  // Error state
  error: string | null;
  
  // Actions
  loadPermissions: () => Promise<void>;
  setPendingRequest: (request: PermissionRequest | null) => void;
  approveRequest: (remember: boolean) => Promise<void>;
  denyRequest: (remember: boolean) => Promise<void>;
  updateDomainPermission: (domain: string, mode: PermissionMode) => Promise<void>;
  updateToolPermission: (domain: string, toolName: string, mode: PermissionMode) => Promise<void>;
  deletePermission: (domain: string) => Promise<void>;
  clearAllPermissions: () => Promise<void>;
  setError: (error: string | null) => void;
}

/**
 * Permission store for managing browser automation permissions
 */
export const usePermissionStore = create<PermissionState>((set, get) => ({
  // Initial state
  permissions: [],
  pendingRequest: null,
  isLoading: false,
  error: null,
  
  /**
   * Load all permissions from PermissionManager
   * This syncs the store with the singleton's state
   */
  loadPermissions: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const manager = getPermissionManager();
      const permissions = await manager.getAllPermissions();
      
      set({ 
        permissions,
        isLoading: false 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load permissions';
      set({ 
        error: errorMessage,
        isLoading: false 
      });
    }
  },
  
  /**
   * Set the pending permission request
   * This is used to show the permission dialog
   * 
   * @param request - The permission request to show, or null to hide dialog
   */
  setPendingRequest: (request: PermissionRequest | null) => {
    set({ pendingRequest: request });
  },
  
  /**
   * Approve the pending permission request
   * 
   * @param remember - Whether to remember this choice for the domain
   */
  approveRequest: async (remember: boolean) => {
    const { pendingRequest } = get();
    
    if (!pendingRequest) {
      console.warn('No pending request to approve');
      return;
    }
    
    try {
      const manager = getPermissionManager();
      
      if (remember) {
        // Save permanent permission for this domain
        await manager.setPermission(pendingRequest.domain, 'always_allow');
      } else {
        // Just approve for this session (ask_once behavior)
        manager.approveSession(pendingRequest.domain, pendingRequest.toolName);
      }
      
      // Clear the pending request
      set({ pendingRequest: null, error: null });
      
      // Reload permissions to reflect changes
      await get().loadPermissions();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve request';
      set({ error: errorMessage });
    }
  },
  
  /**
   * Deny the pending permission request
   * 
   * @param remember - Whether to remember this choice for the domain
   */
  denyRequest: async (remember: boolean) => {
    const { pendingRequest } = get();
    
    if (!pendingRequest) {
      console.warn('No pending request to deny');
      return;
    }
    
    try {
      const manager = getPermissionManager();
      
      if (remember) {
        // Save permanent denial for this domain
        await manager.setPermission(pendingRequest.domain, 'deny');
      }
      // If not remembering, just close the dialog (no session state needed for denial)
      
      // Clear the pending request
      set({ pendingRequest: null, error: null });
      
      // Reload permissions to reflect changes
      await get().loadPermissions();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to deny request';
      set({ error: errorMessage });
    }
  },
  
  /**
   * Update the default permission mode for a domain
   * 
   * @param domain - The domain to update
   * @param mode - The new permission mode
   */
  updateDomainPermission: async (domain: string, mode: PermissionMode) => {
    try {
      const manager = getPermissionManager();
      await manager.setPermission(domain, mode);
      
      // Reload permissions to reflect changes
      await get().loadPermissions();
      
      set({ error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update permission';
      set({ error: errorMessage });
    }
  },
  
  /**
   * Update a tool-specific permission override for a domain
   * 
   * @param domain - The domain to update
   * @param toolName - The tool to set permission for
   * @param mode - The new permission mode
   */
  updateToolPermission: async (domain: string, toolName: string, mode: PermissionMode) => {
    try {
      const manager = getPermissionManager();
      await manager.setToolPermission(domain, toolName, mode);
      
      // Reload permissions to reflect changes
      await get().loadPermissions();
      
      set({ error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update tool permission';
      set({ error: errorMessage });
    }
  },
  
  /**
   * Delete a domain permission
   * 
   * @param domain - The domain to delete permission for
   */
  deletePermission: async (domain: string) => {
    try {
      const manager = getPermissionManager();
      await manager.deletePermission(domain);
      
      // Reload permissions to reflect changes
      await get().loadPermissions();
      
      set({ error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete permission';
      set({ error: errorMessage });
    }
  },
  
  /**
   * Clear all permissions
   */
  clearAllPermissions: async () => {
    try {
      const manager = getPermissionManager();
      await manager.clearAll();
      
      // Reload permissions (should be empty now)
      await get().loadPermissions();
      
      set({ error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear permissions';
      set({ error: errorMessage });
    }
  },
  
  /**
   * Set or clear error message
   * 
   * @param error - Error message or null to clear
   */
  setError: (error: string | null) => {
    set({ error });
  },
}));

// Initialize permissions on store creation
usePermissionStore.getState().loadPermissions();

// Export types for use in components
export type { DomainPermission, PermissionRequest, PermissionMode };
