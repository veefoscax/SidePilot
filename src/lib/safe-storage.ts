/**
 * Safe Storage Utility
 * 
 * P2 QA fix: Handles chrome.storage.local quota limits.
 * Chrome storage has a 5MB limit (10MB with unlimitedStorage).
 */

import { createLogger } from './logger';

const logger = createLogger('Storage');

/**
 * Maximum storage size before cleanup (4.5MB to leave buffer)
 */
const MAX_STORAGE_BYTES = 4.5 * 1024 * 1024;

/**
 * Storage usage info
 */
export interface StorageUsage {
    bytesUsed: number;
    bytesRemaining: number;
    percentUsed: number;
    isNearLimit: boolean;
}

/**
 * Get current storage usage
 */
export async function getStorageUsage(): Promise<StorageUsage> {
    try {
        const bytesUsed = await chrome.storage.local.getBytesInUse();
        const bytesRemaining = MAX_STORAGE_BYTES - bytesUsed;
        const percentUsed = (bytesUsed / MAX_STORAGE_BYTES) * 100;

        return {
            bytesUsed,
            bytesRemaining,
            percentUsed,
            isNearLimit: percentUsed > 80,
        };
    } catch (error) {
        logger.error('Failed to get storage usage', error);
        return {
            bytesUsed: 0,
            bytesRemaining: MAX_STORAGE_BYTES,
            percentUsed: 0,
            isNearLimit: false,
        };
    }
}

/**
 * Safely set storage item with quota handling
 */
export async function safeStorageSet(
    data: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
    try {
        await chrome.storage.local.set(data);
        return { success: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Check if it's a quota error
        if (errorMessage.includes('QUOTA_BYTES') || errorMessage.includes('quota')) {
            logger.warn('Storage quota exceeded, attempting cleanup...');

            // Try to free up space
            const freed = await pruneOldData();

            if (freed) {
                // Retry after cleanup
                try {
                    await chrome.storage.local.set(data);
                    logger.info('Storage set successful after cleanup');
                    return { success: true };
                } catch (retryError) {
                    logger.error('Storage set failed after cleanup', retryError);
                    return { success: false, error: 'Storage quota exceeded even after cleanup' };
                }
            }

            return { success: false, error: 'Unable to free enough storage space' };
        }

        logger.error('Storage set failed', error);
        return { success: false, error: errorMessage };
    }
}

/**
 * Prune old data to free up storage space
 */
async function pruneOldData(): Promise<boolean> {
    try {
        const data = await chrome.storage.local.get(null);
        const keys = Object.keys(data);

        // Find and remove old conversations (keep last 20)
        const conversationKeys = keys.filter(k => k.startsWith('conversation-'));
        if (conversationKeys.length > 20) {
            // Sort by timestamp if available, otherwise by key
            const toRemove = conversationKeys.slice(0, conversationKeys.length - 20);
            await chrome.storage.local.remove(toRemove);
            logger.info(`Pruned ${toRemove.length} old conversations`);
            return true;
        }

        // Find and remove old workflow recordings (keep last 10)
        const workflowKeys = keys.filter(k => k.startsWith('workflow-'));
        if (workflowKeys.length > 10) {
            const toRemove = workflowKeys.slice(0, workflowKeys.length - 10);
            await chrome.storage.local.remove(toRemove);
            logger.info(`Pruned ${toRemove.length} old workflows`);
            return true;
        }

        // Clear cache data
        const cacheKeys = keys.filter(k => k.startsWith('cache-') || k.includes('Cache'));
        if (cacheKeys.length > 0) {
            await chrome.storage.local.remove(cacheKeys);
            logger.info(`Pruned ${cacheKeys.length} cache entries`);
            return true;
        }

        return false;
    } catch (error) {
        logger.error('Failed to prune old data', error);
        return false;
    }
}

/**
 * Monitor storage and warn when near limit
 */
export async function checkStorageHealth(): Promise<void> {
    const usage = await getStorageUsage();

    if (usage.isNearLimit) {
        logger.warn(`Storage usage high: ${usage.percentUsed.toFixed(1)}% (${(usage.bytesUsed / 1024 / 1024).toFixed(2)}MB)`);
        await pruneOldData();
    }
}
