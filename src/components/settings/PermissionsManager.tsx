/**
 * Permissions Manager Component
 * 
 * Displays and manages domain-based permissions for browser automation.
 * Allows users to view, edit, and delete permission rules for different domains.
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  Delete01Icon, 
  Alert02Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  InformationCircleIcon
} from '@hugeicons/core-free-icons';
import { usePermissionStore, type DomainPermission, type PermissionMode } from '@/stores/permissions';

/**
 * Get icon for a permission mode
 */
function getPermissionModeIcon(mode: PermissionMode) {
  switch (mode) {
    case 'always_allow':
      return CheckmarkCircle02Icon;
    case 'ask_once':
    case 'ask_always':
      return InformationCircleIcon;
    case 'deny':
      return Cancel01Icon;
    default:
      return InformationCircleIcon;
  }
}

/**
 * Format timestamp to relative time
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}

/**
 * Single permission row component
 */
interface PermissionRowProps {
  permission: DomainPermission;
  onUpdate: (domain: string, mode: PermissionMode) => void;
  onDelete: (domain: string) => void;
}

function PermissionRow({ permission, onUpdate, onDelete }: PermissionRowProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const Icon = getPermissionModeIcon(permission.defaultMode);
  
  const handleDelete = () => {
    setIsDeleting(true);
  };
  
  const confirmDelete = () => {
    onDelete(permission.domain);
    setIsDeleting(false);
  };
  
  const cancelDelete = () => {
    setIsDeleting(false);
  };
  
  return (
    <>
      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <HugeiconsIcon icon={Icon} className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium truncate">{permission.domain}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Last used {formatRelativeTime(permission.lastUsed)}
          </div>
          {Object.keys(permission.toolOverrides).length > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              {Object.keys(permission.toolOverrides).length} tool override{Object.keys(permission.toolOverrides).length > 1 ? 's' : ''}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <Select
            value={permission.defaultMode}
            onValueChange={(value) => onUpdate(permission.domain, value as PermissionMode)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="always_allow">Always Allow</SelectItem>
              <SelectItem value="ask_once">Ask Once</SelectItem>
              <SelectItem value="ask_always">Ask Always</SelectItem>
              <SelectItem value="deny">Deny</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-destructive hover:text-destructive"
          >
            <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Permission</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the permission for <strong>{permission.domain}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/**
 * Permissions Manager Component
 */
export function PermissionsManager() {
  const { 
    permissions, 
    isLoading, 
    error,
    loadPermissions,
    updateDomainPermission,
    deletePermission,
    clearAllPermissions,
    setError
  } = usePermissionStore();
  
  const [isResetting, setIsResetting] = useState(false);
  
  // Load permissions on mount
  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);
  
  const handleUpdate = async (domain: string, mode: PermissionMode) => {
    await updateDomainPermission(domain, mode);
  };
  
  const handleDelete = async (domain: string) => {
    await deletePermission(domain);
  };
  
  const handleResetAll = () => {
    setIsResetting(true);
  };
  
  const confirmResetAll = async () => {
    await clearAllPermissions();
    setIsResetting(false);
  };
  
  const cancelResetAll = () => {
    setIsResetting(false);
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Browser Automation Permissions</CardTitle>
            <CardDescription>
              Manage which domains can be automated by browser tools
            </CardDescription>
          </div>
          {permissions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetAll}
              className="text-destructive hover:text-destructive"
            >
              <HugeiconsIcon icon={Alert02Icon} className="h-4 w-4 mr-2" />
              Reset All
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {error && (
          <div className="mb-4 p-3 border border-destructive/50 bg-destructive/10 rounded-lg flex items-start gap-2">
            <HugeiconsIcon icon={Alert02Icon} className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-destructive font-medium">Error</p>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="text-destructive hover:text-destructive"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading permissions...
          </div>
        ) : permissions.length === 0 ? (
          <div className="text-center py-8">
            <HugeiconsIcon icon={InformationCircleIcon} className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground mb-1">No permissions configured</p>
            <p className="text-sm text-muted-foreground">
              Permissions will appear here when you approve or deny browser automation actions
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {permissions.map((permission) => (
              <PermissionRow
                key={permission.domain}
                permission={permission}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </CardContent>
      
      <AlertDialog open={isResetting} onOpenChange={setIsResetting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset All Permissions</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all {permissions.length} permission{permissions.length > 1 ? 's' : ''}?
              This will remove all domain rules and tool overrides. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelResetAll}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmResetAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Reset All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
