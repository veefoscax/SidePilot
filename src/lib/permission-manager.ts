/**
 * Permission Manager
 * 
 * Handles requesting and checking optional host permissions.
 * Required because we use optional_host_permissions in manifest
 * for better Chrome Web Store compliance.
 */

export interface PermissionResult {
    granted: boolean;
    error?: string;
}

/**
 * Check if we have host permissions for a specific URL
 */
export async function hasHostPermission(url: string): Promise<boolean> {
    try {
        const result = await chrome.permissions.contains({
            origins: [new URL(url).origin + '/*']
        });
        return result;
    } catch (error) {
        console.error('[Permissions] Error checking host permission:', error);
        return false;
    }
}

/**
 * Check if we have permissions for all URLs
 */
export async function hasAllUrlsPermission(): Promise<boolean> {
    try {
        const result = await chrome.permissions.contains({
            origins: ['<all_urls>']
        });
        return result;
    } catch (error) {
        console.error('[Permissions] Error checking all_urls permission:', error);
        return false;
    }
}

/**
 * Request host permissions for all URLs
 * This will show a permission dialog to the user
 */
export async function requestAllUrlsPermission(): Promise<PermissionResult> {
    try {
        const granted = await chrome.permissions.request({
            origins: ['<all_urls>']
        });

        if (granted) {
            console.log('[Permissions] All URLs permission granted');
            return { granted: true };
        } else {
            console.log('[Permissions] All URLs permission denied by user');
            return { granted: false, error: 'User denied permission' };
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Permissions] Error requesting permission:', error);
        return { granted: false, error: errorMessage };
    }
}

/**
 * Request host permission for a specific origin
 */
export async function requestHostPermission(url: string): Promise<PermissionResult> {
    try {
        const origin = new URL(url).origin + '/*';
        const granted = await chrome.permissions.request({
            origins: [origin]
        });

        if (granted) {
            console.log(`[Permissions] Permission granted for ${origin}`);
            return { granted: true };
        } else {
            console.log(`[Permissions] Permission denied for ${origin}`);
            return { granted: false, error: 'User denied permission' };
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Permissions] Error requesting permission:', error);
        return { granted: false, error: errorMessage };
    }
}

/**
 * Ensure we have host permissions before executing automation
 * Will prompt user if permissions not already granted
 */
export async function ensureHostPermission(url?: string): Promise<PermissionResult> {
    // First check if we already have all_urls permission
    if (await hasAllUrlsPermission()) {
        return { granted: true };
    }

    // If specific URL provided, check/request for that origin only
    if (url) {
        if (await hasHostPermission(url)) {
            return { granted: true };
        }
        return requestHostPermission(url);
    }

    // Otherwise request all_urls
    return requestAllUrlsPermission();
}
