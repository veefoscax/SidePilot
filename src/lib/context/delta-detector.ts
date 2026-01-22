/**
 * Delta Detector
 * 
 * Tracks DOM changes and provides incremental updates instead of full snapshots.
 * Uses hash-based change detection for efficient comparison.
 * 
 * S18 Requirements: AC3.1, AC3.2, AC3.3, AC3.4, TR3
 */

import type {
    DeltaState,
    DeltaResult,
    RefMetadata,
    FilteredSnapshot
} from './types';
import { TOKEN_ESTIMATION } from './types';

/**
 * Simple hash function for content comparison
 */
function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
}

/**
 * DeltaDetector tracks page state and provides incremental updates
 */
export class DeltaDetector {
    private lastState: DeltaState | null = null;
    private lastUrl: string = '';

    constructor() {
        this.lastUrl = typeof window !== 'undefined' ? window.location.href : '';
    }

    /**
     * Compute hash of a snapshot
     */
    computeHash(snapshot: FilteredSnapshot): string {
        return simpleHash(snapshot.tree);
    }

    /**
     * Detect changes between current snapshot and last state
     * 
     * @param current - Current filtered snapshot
     * @returns Delta result (full, delta, or unchanged)
     */
    detectChanges(current: FilteredSnapshot): DeltaResult {
        const timestamp = Date.now();
        const currentHash = this.computeHash(current);
        const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

        // Check for navigation (always return full snapshot)
        if (currentUrl !== this.lastUrl) {
            this.lastUrl = currentUrl;
            this.saveState(current, currentHash, timestamp);
            return {
                type: 'full',
                content: current.tree,
                hash: currentHash,
                timestamp
            };
        }

        // No previous state - return full snapshot
        if (!this.lastState) {
            this.saveState(current, currentHash, timestamp);
            return {
                type: 'full',
                content: current.tree,
                hash: currentHash,
                timestamp
            };
        }

        // Same hash - unchanged
        if (currentHash === this.lastState.hash) {
            return {
                type: 'unchanged',
                hash: currentHash,
                timestamp,
                stats: {
                    changeCount: 0,
                    tokenSavings: this.estimateTokens(current.tree)
                }
            };
        }

        // Different hash - compute delta
        const changes = this.computeDelta(this.lastState.refs, current.refs);
        const deltaContent = this.formatDelta(changes, this.lastState.timestamp);

        // Save new state
        this.saveState(current, currentHash, timestamp);

        const fullTokens = this.estimateTokens(current.tree);
        const deltaTokens = this.estimateTokens(deltaContent);

        return {
            type: 'delta',
            content: deltaContent,
            changes,
            hash: currentHash,
            timestamp,
            stats: {
                changeCount: changes.added.length + changes.removed.length + changes.modified.length,
                tokenSavings: Math.max(0, fullTokens - deltaTokens)
            }
        };
    }

    /**
     * Compute the difference between two ref maps
     */
    private computeDelta(
        oldRefs: Record<string, RefMetadata>,
        newRefs: Record<string, RefMetadata>
    ): { added: RefMetadata[]; removed: string[]; modified: RefMetadata[] } {
        const added: RefMetadata[] = [];
        const removed: string[] = [];
        const modified: RefMetadata[] = [];

        // Find added and modified
        for (const [ref, metadata] of Object.entries(newRefs)) {
            if (!oldRefs[ref]) {
                added.push(metadata);
            } else if (this.hasMetadataChanged(oldRefs[ref], metadata)) {
                modified.push(metadata);
            }
        }

        // Find removed
        for (const ref of Object.keys(oldRefs)) {
            if (!newRefs[ref]) {
                removed.push(ref);
            }
        }

        return { added, removed, modified };
    }

    /**
     * Check if metadata has changed
     */
    private hasMetadataChanged(old: RefMetadata, current: RefMetadata): boolean {
        return (
            old.name !== current.name ||
            old.value !== current.value ||
            old.visible !== current.visible
        );
    }

    /**
     * Format delta changes as a string
     */
    private formatDelta(
        changes: { added: RefMetadata[]; removed: string[]; modified: RefMetadata[] },
        since: number
    ): string {
        const lines: string[] = [`[DELTA since ${since}]`];

        for (const metadata of changes.added) {
            lines.push(`+ ${metadata.role} "${metadata.name || ''}" [ref=${metadata.ref}]`);
        }

        for (const metadata of changes.modified) {
            lines.push(`~ ${metadata.role} "${metadata.name || ''}" [ref=${metadata.ref}] → changed`);
        }

        for (const ref of changes.removed) {
            lines.push(`- [was ref=${ref}]`);
        }

        if (lines.length === 1) {
            lines.push('(no changes)');
        }

        return lines.join('\n');
    }

    /**
     * Save current state for future comparison
     */
    private saveState(snapshot: FilteredSnapshot, hash: string, timestamp: number): void {
        this.lastState = {
            hash,
            timestamp,
            refs: { ...snapshot.refs },
            snapshot: snapshot.tree,
            url: typeof window !== 'undefined' ? window.location.href : ''
        };
    }

    /**
     * Estimate tokens for text
     */
    private estimateTokens(text: string): number {
        return Math.ceil(text.length / TOKEN_ESTIMATION.CHARS_PER_TOKEN);
    }

    /**
     * Force full snapshot on next call
     */
    invalidate(): void {
        this.lastState = null;
    }

    /**
     * Get last known state
     */
    getLastState(): DeltaState | null {
        return this.lastState;
    }

    /**
     * Check if page has navigated since last state
     */
    hasNavigated(): boolean {
        const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
        return currentUrl !== this.lastUrl;
    }
}

/**
 * Singleton instance for global delta detection
 */
let globalDeltaDetector: DeltaDetector | null = null;

export function getDeltaDetector(): DeltaDetector {
    if (!globalDeltaDetector) {
        globalDeltaDetector = new DeltaDetector();
    }
    return globalDeltaDetector;
}

export default DeltaDetector;
