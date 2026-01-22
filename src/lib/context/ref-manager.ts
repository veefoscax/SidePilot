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
  persistAcrossNavigation: false,
  maxRefs: 1000
};

/**
 * RefManager handles assignment and resolution of short element references
 * 
 * Key features:
 * - Deterministic ref assignment (same DOM = same refs)
 * - O(1) lookup via WeakMap cache
 * - Navigation detection for cache invalidation
 * - Memory-efficient using WeakRef for element storage
 */
export class RefManager {
  private refs: RefMap;
  private counter: number = 0;
  private options: Required<RefManagerOptions>;
  private currentPageId: string = '';

  constructor(options: RefManagerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.refs = this.createEmptyRefMap();
    this.setupNavigationDetection();
  }

  /**
   * Create an empty ref map structure
   */
  private createEmptyRefMap(): RefMap {
    return {
      refToElement: new Map<string, Element>(),
      elementToRef: new WeakMap<Element, string>(),
      pageId: this.generatePageId()
    };
  }

  /**
   * Generate a unique page identifier
   */
  private generatePageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Setup navigation detection to invalidate cache
   */
  private setupNavigationDetection(): void {
    if (typeof window !== 'undefined') {
      // Listen for navigation events
      window.addEventListener('beforeunload', () => {
        if (!this.options.persistAcrossNavigation) {
          this.clear();
        }
      });

      // Listen for URL changes (SPA navigation)
      let lastUrl = window.location.href;
      const checkUrlChange = () => {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
          lastUrl = currentUrl;
          if (!this.options.persistAcrossNavigation) {
            this.clear();
          }
        }
      };

      // Check for URL changes periodically (fallback for SPA navigation)
      setInterval(checkUrlChange, 1000);

      // Listen for popstate events (back/forward navigation)
      window.addEventListener('popstate', () => {
        if (!this.options.persistAcrossNavigation) {
          this.clear();
        }
      });
    }
  }

  /**
   * Assign refs to all interactive elements in deterministic order
   * 
   * @param root - Root element to start traversal from
   * @param filter - Optional filter options to limit which elements get refs
   * @returns Array of ref assignments
   */
  assignRefs(root: Element = document.body, filter?: SnapshotFilterOptions): RefAssignment[] {
    const assignments: RefAssignment[] = [];
    const visited = new Set<Element>();

    // Reset counter for deterministic assignment
    this.counter = 0;

    // Traverse DOM in deterministic order (depth-first, document order)
    const traverse = (element: Element, depth: number = 0): void => {
      // Skip if already visited
      if (visited.has(element)) {
        return;
      }
      visited.add(element);

      // Check if element should get a ref (don't assign to root unless it's interactive)
      if (depth > 0 && this.shouldAssignRef(element, filter)) {
        const assignment = this.createRefAssignment(element);
        if (assignment) {
          assignments.push(assignment);
        }
      }

      // Check depth limit before traversing children
      // If depth limit is set, don't traverse beyond that depth
      if (filter?.depth && depth >= filter.depth) {
        return;
      }

      // Traverse children in document order
      const children = Array.from(element.children || []);
      for (const child of children) {
        // Check max elements limit
        if (filter?.maxElements && assignments.length >= filter.maxElements) {
          break;
        }
        traverse(child, depth + 1);
      }
    };

    // Apply scope filter if specified
    const startElement = filter?.scope ? 
      document.querySelector(filter.scope) || root : root;

    traverse(startElement, 0);

    return assignments;
  }

  /**
   * Determine if an element should get a ref assigned
   */
  private shouldAssignRef(element: Element, filter?: SnapshotFilterOptions): boolean {
    // Check if we've hit the max refs limit
    if (this.counter >= this.options.maxRefs) {
      return false;
    }

    // Skip if element already has a ref
    if (this.refs.elementToRef.has(element)) {
      return false;
    }

    // Apply interactive filter if specified
    if (filter?.interactive && !this.isInteractive(element)) {
      return false;
    }

    // Apply compact filter - skip empty/structural elements
    if (filter?.compact && this.isEmptyStructural(element)) {
      return false;
    }

    // Check visibility if required
    if (filter?.includeVisibility && !this.isVisible(element)) {
      return false;
    }

    // Always assign refs to interactive elements
    if (this.isInteractive(element)) {
      return true;
    }

    // For non-interactive elements, only assign if not in interactive-only mode
    return !filter?.interactive;
  }

  /**
   * Check if element is interactive
   */
  private isInteractive(element: Element): boolean {
    const tagName = element.tagName.toLowerCase();
    const role = element.getAttribute('role');

    // Check interactive tags
    if (INTERACTIVE_TAGS.includes(tagName as any)) {
      return true;
    }

    // Check interactive roles
    if (role && INTERACTIVE_ROLES.includes(role as any)) {
      return true;
    }

    // Check for click handlers or tabindex
    if (element.hasAttribute('onclick') || 
        element.hasAttribute('tabindex') ||
        element.getAttribute('tabindex') === '0') {
      return true;
    }

    // Check for contenteditable
    if (element.getAttribute('contenteditable') === 'true') {
      return true;
    }

    return false;
  }

  /**
   * Check if element is empty/structural and should be skipped in compact mode
   */
  private isEmptyStructural(element: Element): boolean {
    const tagName = element.tagName.toLowerCase();
    
    // Structural tags that are often empty
    const structuralTags = ['div', 'span', 'section', 'article', 'aside', 'header', 'footer', 'main'];
    
    if (!structuralTags.includes(tagName)) {
      return false;
    }

    // Check if element has meaningful content
    const textContent = element.textContent?.trim() || '';
    const hasInteractiveChildren = element.querySelector && element.querySelector(INTERACTIVE_TAGS.join(','));
    
    // Empty if no text content and no interactive children
    return textContent.length === 0 && !hasInteractiveChildren;
  }

  /**
   * Check if element is visible
   */
  private isVisible(element: Element): boolean {
    if (!(element instanceof HTMLElement)) {
      return true; // Assume visible for non-HTML elements
    }

    const style = window.getComputedStyle(element);
    
    // Check CSS visibility
    if (style.display === 'none' || 
        style.visibility === 'hidden' || 
        style.opacity === '0') {
      return false;
    }

    // Check if element has dimensions
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      return false;
    }

    return true;
  }

  /**
   * Create a ref assignment for an element
   */
  private createRefAssignment(element: Element): RefAssignment | null {
    // Check if element already has a ref
    const existingRef = this.refs.elementToRef.get(element);
    if (existingRef) {
      const metadata = this.createRefMetadata(element, existingRef);
      return { ref: existingRef, element, metadata };
    }

    // Generate new ref
    const ref = this.generateRef();
    
    // Store in both directions
    this.refs.refToElement.set(ref, element);
    this.refs.elementToRef.set(element, ref);

    // Create metadata
    const metadata = this.createRefMetadata(element, ref);

    this.counter++;

    return { ref, element, metadata };
  }

  /**
   * Generate a new ref ID
   */
  private generateRef(): string {
    return `${this.options.prefix}${this.counter + 1}`;
  }

  /**
   * Create metadata for a ref-assigned element
   */
  private createRefMetadata(element: Element, ref: string, includeVisibility: boolean = false): RefMetadata {
    const tagName = element.tagName.toLowerCase();
    const role = this.getElementRole(element);
    const name = this.getElementName(element);
    const interactable = this.isInteractive(element);
    
    const metadata: RefMetadata = {
      ref,
      role,
      tagName,
      interactable
    };

    // Add optional properties
    if (name) {
      metadata.name = name;
    }

    // Handle input elements - check if it's actually an HTMLInputElement or mock
    if (tagName === 'input') {
      const inputElement = element as any;
      metadata.type = inputElement.type || 'text';
      metadata.value = inputElement.value || '';
    } else if (tagName === 'select') {
      const selectElement = element as any;
      metadata.value = selectElement.value || '';
    } else if (tagName === 'textarea') {
      const textareaElement = element as any;
      metadata.value = textareaElement.value || '';
    }

    if (includeVisibility && this.isVisible(element)) {
      metadata.visible = true;
    }

    return metadata;
  }

  /**
   * Get the role of an element
   */
  private getElementRole(element: Element): string {
    // Explicit role attribute
    const explicitRole = element.getAttribute('role');
    if (explicitRole) {
      return explicitRole;
    }

    // Implicit role based on tag
    const tagName = element.tagName.toLowerCase();
    const implicitRoles: Record<string, string> = {
      'a': 'link',
      'button': 'button',
      'input': this.getInputRole(element as HTMLInputElement),
      'select': 'combobox',
      'textarea': 'textbox',
      'h1': 'heading',
      'h2': 'heading',
      'h3': 'heading',
      'h4': 'heading',
      'h5': 'heading',
      'h6': 'heading',
      'img': 'img',
      'nav': 'navigation',
      'main': 'main',
      'article': 'article',
      'section': 'region',
      'aside': 'complementary',
      'header': 'banner',
      'footer': 'contentinfo'
    };

    return implicitRoles[tagName] || 'generic';
  }

  /**
   * Get the role for an input element based on its type
   */
  private getInputRole(input: HTMLInputElement): string {
    const type = (input.type || 'text').toLowerCase();
    const inputRoles: Record<string, string> = {
      'text': 'textbox',
      'email': 'textbox',
      'password': 'textbox',
      'search': 'searchbox',
      'tel': 'textbox',
      'url': 'textbox',
      'number': 'spinbutton',
      'range': 'slider',
      'checkbox': 'checkbox',
      'radio': 'radio',
      'submit': 'button',
      'button': 'button',
      'reset': 'button',
      'file': 'button'
    };

    return inputRoles[type] || 'textbox';
  }

  /**
   * Get the accessible name of an element
   */
  private getElementName(element: Element): string | undefined {
    // aria-label takes precedence
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      return ariaLabel.trim();
    }

    // aria-labelledby
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labelElement = document.getElementById(labelledBy);
      if (labelElement) {
        return labelElement.textContent?.trim();
      }
    }

    // For form elements, check associated label
    const tagName = element.tagName.toLowerCase();
    if (tagName === 'input' || tagName === 'select' || tagName === 'textarea') {
      
      // Check for label element
      const elementId = element.getAttribute('id');
      if (elementId) {
        const labels = document.querySelectorAll(`label[for="${elementId}"]`);
        if (labels.length > 0) {
          return labels[0].textContent?.trim();
        }
      }

      // Check for wrapping label
      const parentLabel = element.closest('label');
      if (parentLabel) {
        return parentLabel.textContent?.trim();
      }

      // Check placeholder
      const placeholder = element.getAttribute('placeholder');
      if (placeholder) {
        return placeholder.trim();
      }
    }

    // For buttons, use text content
    if (tagName === 'button') {
      return element.textContent?.trim();
    }

    // For links, use text content or title
    if (tagName === 'a') {
      const textContent = element.textContent?.trim();
      if (textContent) {
        return textContent;
      }
      const title = element.getAttribute('title');
      if (title) {
        return title.trim();
      }
    }

    // For images, use alt text
    if (tagName === 'img') {
      const alt = element.getAttribute('alt');
      if (alt) {
        return alt.trim();
      }
    }

    // Fallback to text content for other elements
    const textContent = element.textContent?.trim();
    if (textContent && textContent.length <= 100) { // Limit length
      return textContent;
    }

    return undefined;
  }

  /**
   * Resolve a ref string to its corresponding element
   * 
   * @param ref - The ref string (e.g., "e1")
   * @returns The element or null if not found/stale
   */
  resolve(ref: string): Element | null {
    const element = this.refs.refToElement.get(ref);
    
    if (!element) {
      return null;
    }

    // Check if element is still in the DOM
    if (!document.contains(element)) {
      // Clean up stale ref
      this.refs.refToElement.delete(ref);
      this.refs.elementToRef.delete(element);
      return null;
    }

    return element;
  }

  /**
   * Get or create a ref for an element
   * 
   * @param element - The element to get/create a ref for
   * @returns The ref string
   */
  getOrCreateRef(element: Element): string {
    // Check if element already has a ref
    const existingRef = this.refs.elementToRef.get(element);
    if (existingRef) {
      return existingRef;
    }

    // Create new ref
    const ref = this.generateRef();
    this.refs.refToElement.set(ref, element);
    this.refs.elementToRef.set(element, ref);
    this.counter++;

    return ref;
  }

  /**
   * Clear all refs (typically called on navigation)
   */
  clear(): void {
    this.refs.refToElement.clear();
    // WeakMap clears itself when elements are garbage collected
    this.refs.elementToRef = new WeakMap();
    this.refs.pageId = this.generatePageId();
    this.counter = 0;
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