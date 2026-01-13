/**
 * Element Reference System
 * 
 * Provides stable reference IDs for DOM elements across browser automation actions.
 * Inspired by browser-use patterns with WeakRef mapping and persistent element tracking.
 */

export interface ElementInfo {
  ref: string;
  tagName: string;
  type?: string;
  role?: string;
  text?: string;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  id?: string;
  href?: string;
  src?: string;
  value?: string;
  checked?: boolean;
  disabled?: boolean;
  visible: boolean;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  description: string; // Natural language description
}

export interface HighlightStyle {
  color?: string;
  width?: number;
  style?: 'solid' | 'dashed' | 'dotted';
  opacity?: number;
}

/**
 * Element reference manager for stable DOM element targeting
 */
export class ElementReferences {
  private elementMaps = new Map<number, Map<string, WeakRef<Element>>>();
  private refCounters = new Map<number, number>();
  private highlightedElements = new Map<number, Set<string>>();

  /**
   * Generate a new reference ID for a tab
   */
  generateRef(tabId: number): string {
    const counter = this.refCounters.get(tabId) || 0;
    const newCounter = counter + 1;
    this.refCounters.set(tabId, newCounter);
    return `element_${newCounter}`;
  }

  /**
   * Register an element with a reference ID
   */
  registerElement(tabId: number, element: Element, ref?: string): string {
    if (!this.elementMaps.has(tabId)) {
      this.elementMaps.set(tabId, new Map());
    }

    const elementMap = this.elementMaps.get(tabId)!;
    const elementRef = ref || this.generateRef(tabId);
    
    elementMap.set(elementRef, new WeakRef(element));
    return elementRef;
  }

  /**
   * Get element by reference ID
   */
  getElement(tabId: number, ref: string): Element | null {
    const elementMap = this.elementMaps.get(tabId);
    if (!elementMap) return null;

    const weakRef = elementMap.get(ref);
    if (!weakRef) return null;

    const element = weakRef.deref();
    if (!element) {
      // Element was garbage collected, remove the reference
      elementMap.delete(ref);
      return null;
    }

    return element;
  }

  /**
   * Check if element reference exists and is valid
   */
  hasElement(tabId: number, ref: string): boolean {
    return this.getElement(tabId, ref) !== null;
  }

  /**
   * Remove element reference
   */
  removeElement(tabId: number, ref: string): void {
    const elementMap = this.elementMaps.get(tabId);
    if (elementMap) {
      elementMap.delete(ref);
    }

    // Remove from highlights if present
    const highlights = this.highlightedElements.get(tabId);
    if (highlights) {
      highlights.delete(ref);
    }
  }

  /**
   * Clear all element references for a tab
   */
  clearTab(tabId: number): void {
    this.elementMaps.delete(tabId);
    this.refCounters.delete(tabId);
    this.highlightedElements.delete(tabId);
  }

  /**
   * Get all valid element references for a tab
   */
  getAllRefs(tabId: number): string[] {
    const elementMap = this.elementMaps.get(tabId);
    if (!elementMap) return [];

    const validRefs: string[] = [];
    
    for (const [ref, weakRef] of elementMap.entries()) {
      const element = weakRef.deref();
      if (element) {
        validRefs.push(ref);
      } else {
        // Clean up garbage collected elements
        elementMap.delete(ref);
      }
    }

    return validRefs;
  }

  /**
   * Clean up garbage collected element references
   */
  cleanup(tabId: number): void {
    const elementMap = this.elementMaps.get(tabId);
    if (!elementMap) return;

    const toRemove: string[] = [];
    
    for (const [ref, weakRef] of elementMap.entries()) {
      if (!weakRef.deref()) {
        toRemove.push(ref);
      }
    }

    toRemove.forEach(ref => {
      elementMap.delete(ref);
      // Also remove from highlights
      const highlights = this.highlightedElements.get(tabId);
      if (highlights) {
        highlights.delete(ref);
      }
    });
  }

  /**
   * Highlight an element visually
   */
  async highlightElement(
    tabId: number, 
    ref: string, 
    style: HighlightStyle = {}
  ): Promise<boolean> {
    const element = this.getElement(tabId, ref);
    if (!element) return false;

    // Default highlight style
    const highlightStyle = {
      color: style.color || '#ff0000',
      width: style.width || 2,
      style: style.style || 'solid',
      opacity: style.opacity || 0.8
    };

    try {
      // Inject highlighting script into the page
      await chrome.scripting.executeScript({
        target: { tabId },
        func: this.injectHighlight,
        args: [ref, highlightStyle]
      });

      // Track highlighted elements
      if (!this.highlightedElements.has(tabId)) {
        this.highlightedElements.set(tabId, new Set());
      }
      this.highlightedElements.get(tabId)!.add(ref);

      return true;
    } catch (error) {
      console.error(`Failed to highlight element ${ref}:`, error);
      return false;
    }
  }

  /**
   * Remove highlight from an element
   */
  async removeHighlight(tabId: number, ref: string): Promise<boolean> {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: this.removeHighlightScript,
        args: [ref]
      });

      const highlights = this.highlightedElements.get(tabId);
      if (highlights) {
        highlights.delete(ref);
      }

      return true;
    } catch (error) {
      console.error(`Failed to remove highlight from element ${ref}:`, error);
      return false;
    }
  }

  /**
   * Clear all highlights for a tab
   */
  async clearHighlights(tabId: number): Promise<void> {
    const highlights = this.highlightedElements.get(tabId);
    if (!highlights || highlights.size === 0) return;

    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: this.clearAllHighlightsScript
      });

      highlights.clear();
    } catch (error) {
      console.error(`Failed to clear highlights for tab ${tabId}:`, error);
    }
  }

  /**
   * Get highlighted element references for a tab
   */
  getHighlightedRefs(tabId: number): string[] {
    const highlights = this.highlightedElements.get(tabId);
    return highlights ? Array.from(highlights) : [];
  }

  /**
   * Script to inject element highlighting
   */
  private injectHighlight(ref: string, style: any): void {
    // This function runs in the page context
    const element = (window as any).__claudeElementMap?.get(ref)?.deref();
    if (!element) return;

    // Create highlight overlay
    const highlight = document.createElement('div');
    highlight.id = `claude-highlight-${ref}`;
    highlight.style.position = 'absolute';
    highlight.style.pointerEvents = 'none';
    highlight.style.zIndex = '999999';
    highlight.style.border = `${style.width}px ${style.style} ${style.color}`;
    highlight.style.opacity = style.opacity.toString();
    highlight.style.boxSizing = 'border-box';

    // Position the highlight
    const rect = element.getBoundingClientRect();
    highlight.style.left = `${rect.left + window.scrollX}px`;
    highlight.style.top = `${rect.top + window.scrollY}px`;
    highlight.style.width = `${rect.width}px`;
    highlight.style.height = `${rect.height}px`;

    document.body.appendChild(highlight);
  }

  /**
   * Script to remove element highlighting
   */
  private removeHighlightScript(ref: string): void {
    // This function runs in the page context
    const highlight = document.getElementById(`claude-highlight-${ref}`);
    if (highlight) {
      highlight.remove();
    }
  }

  /**
   * Script to clear all highlights
   */
  private clearAllHighlightsScript(): void {
    // This function runs in the page context
    const highlights = document.querySelectorAll('[id^="claude-highlight-"]');
    highlights.forEach(highlight => highlight.remove());
  }

  /**
   * Extract element information for accessibility tree
   */
  extractElementInfo(element: Element, ref: string): ElementInfo {
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);
    
    // Check if element is visible
    const visible = rect.width > 0 && 
                   rect.height > 0 && 
                   computedStyle.visibility !== 'hidden' && 
                   computedStyle.display !== 'none' &&
                   computedStyle.opacity !== '0';

    // Extract text content
    let text = '';
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      text = (element as HTMLInputElement).value;
    } else {
      text = element.textContent?.trim() || '';
      // Limit text length for performance
      if (text.length > 100) {
        text = text.substring(0, 100) + '...';
      }
    }

    // Generate natural language description
    const description = this.generateElementDescription(element, text);

    return {
      ref,
      tagName: element.tagName.toLowerCase(),
      type: (element as HTMLInputElement).type,
      role: element.getAttribute('role') || undefined,
      text,
      placeholder: (element as HTMLInputElement).placeholder,
      ariaLabel: element.getAttribute('aria-label') || undefined,
      className: element.className,
      id: element.id,
      href: (element as HTMLAnchorElement).href,
      src: (element as HTMLImageElement).src,
      value: (element as HTMLInputElement).value,
      checked: (element as HTMLInputElement).checked,
      disabled: (element as HTMLInputElement).disabled,
      visible,
      bounds: {
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      },
      description
    };
  }

  /**
   * Generate natural language description for an element
   */
  private generateElementDescription(element: Element, text: string): string {
    const tagName = element.tagName.toLowerCase();
    const type = (element as HTMLInputElement).type;
    const role = element.getAttribute('role');
    const ariaLabel = element.getAttribute('aria-label');
    const placeholder = (element as HTMLInputElement).placeholder;

    // Start with aria-label if available
    if (ariaLabel) {
      return `${tagName} "${ariaLabel}"`;
    }

    // Handle different element types
    switch (tagName) {
      case 'button':
        return `button "${text || 'button'}"`;
      
      case 'a':
        const href = (element as HTMLAnchorElement).href;
        return `link "${text || href || 'link'}"`;
      
      case 'input':
        if (type === 'submit') return `submit button "${(element as HTMLInputElement).value || 'Submit'}"`;
        if (type === 'button') return `button "${(element as HTMLInputElement).value || 'button'}"`;
        if (type === 'checkbox') return `checkbox "${text || placeholder || 'checkbox'}"`;
        if (type === 'radio') return `radio button "${text || placeholder || 'radio'}"`;
        return `${type || 'text'} input "${placeholder || text || 'input'}"`;
      
      case 'textarea':
        return `textarea "${placeholder || text || 'textarea'}"`;
      
      case 'select':
        return `dropdown "${text || 'select'}"`;
      
      case 'img':
        const alt = element.getAttribute('alt');
        return `image "${alt || 'image'}"`;
      
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        return `${tagName} heading "${text}"`;
      
      default:
        if (role) {
          return `${role} "${text || tagName}"`;
        }
        return text ? `${tagName} "${text}"` : tagName;
    }
  }
}