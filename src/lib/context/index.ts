/**
 * Context Optimization Module
 * 
 * Provides token-efficient browser automation through ref-based targeting,
 * snapshot filtering, incremental updates, and context budget management.
 * 
 * @example Basic Usage
 * ```typescript
 * import { refManager, createSnapshotFilter } from '@/lib/context';
 * 
 * // Assign refs to interactive elements
 * const assignments = refManager.assignRefs(document.body, { interactive: true });
 * 
 * // Filter accessibility tree
 * const filter = createSnapshotFilter({ interactive: true, compact: true });
 * const filtered = filter.filter(accessibilityTree);
 * ```
 * 
 * @example Tool Integration
 * ```typescript
 * import { resolveSelector } from '@/lib/context';
 * 
 * // Resolve @ref or CSS selector
 * const element = resolveSelector('@e1'); // or 'button.primary'
 * if (element) {
 *   element.click();
 * }
 * ```
 * 
 * @example Advanced Filtering
 * ```typescript
 * import { SnapshotFilter } from '@/lib/context';
 * 
 * const filter = new SnapshotFilter({
 *   interactive: true,    // Only interactive elements
 *   depth: 3,            // Max depth of 3
 *   compact: true,       // Remove empty structural nodes
 *   maxElements: 50      // Limit to 50 elements
 * });
 * 
 * const result = filter.filter(tree);
 * console.log(`Reduced by ${result.stats.reduction}%`);
 * ```
 */

// Core exports
export { RefManager, refManager, resolveSelector, getElementDescription } from './ref-manager';
export { SnapshotFilter, createSnapshotFilter, filterSnapshot } from './snapshot-filter';

// Type exports
export type {
  RefMap,
  RefMetadata,
  RefManagerOptions,
  RefAssignment,
  SnapshotFilterOptions,
  FilteredSnapshot,
  RefResolutionError
} from './types';

// Constants
export {
  INTERACTIVE_ROLES,
  INTERACTIVE_TAGS
} from './types';

// Utility functions
export { createRefManager } from './ref-manager';

/**
 * Quick setup function for common use cases
 */
export function setupContextOptimization(options: {
  interactive?: boolean;
  compact?: boolean;
  depth?: number;
  maxElements?: number;
} = {}) {
  const {
    interactive = true,
    compact = true,
    depth = 10,
    maxElements = 100
  } = options;

  // Configure ref manager for interactive elements
  const assignments = refManager.assignRefs(document.body, {
    interactive,
    compact,
    depth,
    maxElements
  });

  // Create optimized filter
  const filter = createSnapshotFilter({
    interactive,
    compact,
    depth,
    maxElements,
    includeRefs: true
  });

  return {
    assignments,
    filter,
    refCount: assignments.length,
    refManager
  };
}

/**
 * Get optimization statistics for current page
 */
export function getOptimizationStats() {
  const stats = refManager.getStats();
  const totalElements = document.querySelectorAll('*').length;
  
  return {
    ...stats,
    totalElements,
    coverage: Math.round((stats.totalRefs / totalElements) * 100),
    efficiency: stats.staleRefs === 0 ? 100 : Math.round(((stats.totalRefs - stats.staleRefs) / stats.totalRefs) * 100)
  };
}

/**
 * Clean up stale refs and optimize memory usage
 */
export function optimizeMemory() {
  const cleaned = refManager.cleanupStaleRefs();
  return {
    cleaned,
    remaining: refManager.getStats().totalRefs
  };
}

/**
 * Reset all context optimization state
 */
export function resetContext() {
  refManager.clear();
  return {
    message: 'Context optimization state reset'
  };
}