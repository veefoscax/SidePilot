/**
 * RefManager - Assigns short, deterministic refs to DOM elements for minimal-token targeting
 * 
 * Provides O(1) lookup performance through WeakMap caching and deterministic ref assignment
 * based on DOM structure traversal order.
 */

import {
  RefMap,
  RefMetadata,
  RefManagerOptions,
  RefAssignment,
  SnapshotFilterOptions,
  RefResolutionError,
  INTERACTIVE_ROLES,
  INTERACTIVE_TAGS
} from './types';

/**
 * Default options for RefManager
 */
const DEFAULT_OPTIONS: Required<RefManagerOptions> = {
  prefix: 'e',
  persistAcrossNavigation: true, // Enabled for technical excellence (S28)
  maxRefs: 1000
};

/**
 * RefManager handles assignment and resolution of short element references
 */
export class RefManager {
  private refs: RefMap;
  private counter: number = 0;
  private options: Required<RefManagerOptions>;
  private currentPageId: string = '';
  
  // Persistence storage (Ref ID -> DOM Fingerprint)
  private fingerprints: Map<string, string> = new Map();

  constructor(options: RefManagerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.refs = this.createEmptyRefMap();
    this.setupNavigationDetection();
  }

  /**
   * Generates a unique fingerprint for an element to allow re-hydration after navigation
   */
  private generateFingerprint(element: Element): string {
    const tagName = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const classes = Array.from(element.classList).sort().join('.');
    const name = element.getAttribute('name') || '';
    const type = element.getAttribute('type') || '';
    
    // Simple path-like identifier
    const parent = element.parentElement;
    const index = parent ? Array.from(parent.children).indexOf(element) : 0;
    
    return `${tagName}|${id}|${classes}|${name}|${type}|idx:${index}`;
  }

  /**
   * Attempts to find an element in the current DOM that matches a fingerprint
   */
  private findByFingerprint(fingerprint: string): Element | null {
    const [tagName, id, classes, name, type, idxStr] = fingerprint.split('|');
    const index = parseInt(idxStr.split(':')[1]);

    // 1. Try by ID (strongest match)
    if (id) {
      const element = document.querySelector(id);
      if (element && element.tagName.toLowerCase() === tagName) return element;
    }

    // 2. Try by Name/Type
    if (name || type) {
      const selector = `${tagName}${name ? `[name="${name}"]` : ''}${type ? `[type="${type}"]` : ''}`;
      const elements = document.querySelectorAll(selector);
      if (elements.length === 1) return elements[0];
    }

    // 3. Try by Tag + Classes + Index fallback
    const classSelector = classes ? `.${classes.replace(/\./g, '.')}` : '';
    const elements = document.querySelectorAll(`${tagName}${classSelector}`);
    if (elements[index]) return elements[index];

    return null;
  }

  /**
   * Resolve a ref string to its corresponding element
   */
  resolve(ref: string): Element | null {
    let element = this.refs.refToElement.get(ref);
    
    // If element is missing or detached from DOM, try re-hydration
    if (!element || !document.contains(element)) {
      const fingerprint = this.fingerprints.get(ref);
      if (fingerprint) {
        element = this.findByFingerprint(fingerprint);
        if (element) {
          console.log(`🧠 [RefManager] Re-hydrated persistent ref: ${ref}`);
          this.refs.refToElement.set(ref, element);
          this.refs.elementToRef.set(element, ref);
        }
      }
    }

    return element && document.contains(element) ? element : null;
  }

  /**
   * Get or create a ref for an element
   */
  getOrCreateRef(element: Element): string {
    const existingRef = this.refs.elementToRef.get(element);
    if (existingRef) return existingRef;

    const ref = this.generateRef();
    const fingerprint = this.generateFingerprint(element);
    
    this.refs.refToElement.set(ref, element);
    this.refs.elementToRef.set(element, ref);
    this.fingerprints.set(ref, fingerprint);
    
    this.counter++;
    return ref;
  }

  /**
   * Clear all refs (optionally keeps fingerprints if persistence is on)
   */
  clear(): void {
    this.refs.refToElement.clear();
    this.refs.elementToRef = new WeakMap();
    
    if (!this.options.persistAcrossNavigation) {
      this.fingerprints.clear();
      this.counter = 0;
    }
    
    this.refs.pageId = this.generatePageId();
    this.currentPageId = this.refs.pageId;
  }

  /**
   * Get all current refs with their metadata
   * 
   * @returns Record mapping ref strings to their metadata
   */
  getRefMap(): Record<string, RefMetadata> {
    const refMap: Record<string, RefMetadata> = {};

    for (const [ref, element] of this.refs.refToElement.entries()) {
      // Skip stale refs
      if (!document.contains(element)) {
        this.refs.refToElement.delete(ref);
        continue;
      }

      refMap[ref] = this.createRefMetadata(element, ref);
    }

    return refMap;
  }

  /**
   * Get the current page ID
   */
  getPageId(): string {
    return this.refs.pageId;
  }

  /**
   * Check if the page has changed (for navigation detection)
   */
  hasPageChanged(): boolean {
    return this.currentPageId !== this.refs.pageId;
  }

  /**
   * Get statistics about the current ref state
   */
  getStats(): {
    totalRefs: number;
    interactiveRefs: number;
    staleRefs: number;
    memoryUsage: number;
  } {
    let totalRefs = 0;
    let interactiveRefs = 0;
    let staleRefs = 0;

    for (const [ref, element] of this.refs.refToElement.entries()) {
      totalRefs++;
      
      if (!document.contains(element)) {
        staleRefs++;
      } else if (this.isInteractive(element)) {
        interactiveRefs++;
      }
    }

    // Estimate memory usage (rough approximation)
    const memoryUsage = totalRefs * 100; // ~100 bytes per ref entry

    return {
      totalRefs,
      interactiveRefs,
      staleRefs,
      memoryUsage
    };
  }

  /**
   * Clean up stale refs (elements no longer in DOM)
   */
  cleanupStaleRefs(): number {
    let cleaned = 0;
    const staleRefs: string[] = [];

    for (const [ref, element] of this.refs.refToElement.entries()) {
      if (!document.contains(element)) {
        staleRefs.push(ref);
      }
    }

    for (const ref of staleRefs) {
      this.refs.refToElement.delete(ref);
      cleaned++;
    }

    return cleaned;
  }

  /**
   * Validate that a ref string is properly formatted
   */
  static isValidRef(ref: string): boolean {
    return /^[a-zA-Z]\d+$/.test(ref);
  }

  /**
   * Extract ref from a selector string (handles @ref format)
   */
  static extractRef(selector: string): string | null {
    if (selector.startsWith('@')) {
      const ref = selector.slice(1);
      return this.isValidRef(ref) ? ref : null;
    }
    return null;
  }
}

/**
 * Global ref manager instance
 */
export const refManager = new RefManager();

/**
 * Utility function to resolve a selector that might be a ref
 */
export function resolveSelector(selector: string, manager: RefManager = refManager): Element | null {
  const ref = RefManager.extractRef(selector);
  if (ref) {
    const element = manager.resolve(ref);
    if (!element) {
      throw new RefResolutionError(ref, 'Element not found or stale');
    }
    return element;
  }

  // Check if it's an invalid @ref format
  if (selector.startsWith('@')) {
    const invalidRef = selector.slice(1);
    throw new RefResolutionError(invalidRef, 'Invalid ref format');
  }

  // Fallback to regular CSS selector
  return document.querySelector(selector);
}

/**
 * Utility function to get element description for debugging
 */
export function getElementDescription(element: Element, manager: RefManager = refManager): string {
  const ref = manager.refs.elementToRef.get(element);
  const tagName = element.tagName.toLowerCase();
  const name = element.getAttribute('aria-label') || 
               element.textContent?.trim().slice(0, 30) || 
               element.getAttribute('placeholder') || 
               '';

  if (ref) {
    return `${tagName}[${ref}]${name ? ` "${name}"` : ''}`;
  }

  return `${tagName}${name ? ` "${name}"` : ''}`;
}