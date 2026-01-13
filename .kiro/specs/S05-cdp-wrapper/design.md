# S05: CDP Wrapper - Design (Browser-Use Enhanced)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CDP Wrapper Layer                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ CDPWrapper  │  │Accessibility│  │   Element References    │  │
│  │  (Core)     │  │    Tree     │  │      System             │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Smart Wait  │  │ Human-like  │  │   Visual Indicators     │  │
│  │   System    │  │   Delays    │  │      System             │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────┐
              │  Chrome DevTools Protocol │
              │       (CDP 1.3)           │
              └───────────────────────────┘
```

## Core Interfaces

```typescript
// src/lib/cdp-wrapper.ts

// === Element Reference System (Browser-Use Pattern) ===

interface ElementRef {
  refId: string;                    // Stable ID e.g., "ref_42"
  tagName: string;
  role: string;                     // ARIA role
  name: string;                     // Accessible name
  description?: string;             // Natural language description
  boundingBox: BoundingBox;
  states: ElementStates;
  attributes: Record<string, string>;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;                  // Computed center for clicking
  centerY: number;
}

interface ElementStates {
  visible: boolean;
  enabled: boolean;
  focusable: boolean;
  focused: boolean;
  checked?: boolean;
  expanded?: boolean;
  selected?: boolean;
}

// === Accessibility Tree (Browser-Use Core) ===

interface AccessibilityNode {
  refId: string;
  role: string;
  name: string;
  value?: string;
  description?: string;
  boundingBox: BoundingBox;
  states: ElementStates;
  children?: AccessibilityNode[];
  depth: number;
}

interface AccessibilityTreeOptions {
  maxDepth?: number;                // Default: 10
  interactiveOnly?: boolean;        // Only buttons, links, inputs, etc.
  visibleOnly?: boolean;            // Only visible elements
  includeBoundingBoxes?: boolean;   // Include coordinates (default: true)
  includeText?: boolean;            // Include text content
  startFromRef?: string;            // Start from specific element
}

interface AccessibilityTreeResult {
  tree: AccessibilityNode[];
  totalElements: number;
  interactiveElements: number;
  textRepresentation: string;       // Formatted text for LLM context
}

// === Screenshot with Annotations (Browser-Use Enhanced) ===

interface ScreenshotOptions {
  format?: 'png' | 'jpeg';
  quality?: number;                 // For JPEG
  annotateElements?: boolean;       // Draw bounding boxes
  highlightRefs?: string[];         // Highlight specific elements
  maxWidth?: number;                // Resize for token limits
  maxHeight?: number;
}

interface ScreenshotResult {
  base64: string;
  width: number;
  height: number;
  format: 'png' | 'jpeg';
  viewportWidth: number;
  viewportHeight: number;
  annotations?: ElementAnnotation[];
}

interface ElementAnnotation {
  refId: string;
  label: string;
  boundingBox: BoundingBox;
  color: string;                    // Annotation color
}

// === Smart Click Options ===

interface ClickOptions {
  // Target - one of these required
  x?: number;
  y?: number;
  ref?: string;                     // Click by element ref ID
  description?: string;             // Natural language targeting
  selector?: string;                // CSS selector fallback
  
  // Click behavior
  button?: 'left' | 'right' | 'middle';
  clickCount?: number;              // 1, 2, or 3
  modifiers?: number;               // Ctrl, Shift, etc.
  
  // Human-like options
  humanDelay?: boolean;             // Add natural delays
  moveFirst?: boolean;              // Move mouse before clicking
}

// === Smart Wait Options ===

interface WaitOptions {
  timeout?: number;                 // Max wait time (default: 30000ms)
  pollInterval?: number;            // Check interval (default: 100ms)
}

interface WaitForElementOptions extends WaitOptions {
  ref?: string;
  description?: string;
  selector?: string;
  state?: 'visible' | 'hidden' | 'enabled' | 'disabled';
}

// === Human-Like Delay Configuration ===

interface HumanDelayConfig {
  typingBaseDelay: number;          // Base delay between chars (default: 50ms)
  typingVariance: number;           // Random variance (default: 30ms)
  clickDelay: number;               // Delay after click (default: 100ms)
  scrollDelay: number;              // Delay after scroll (default: 150ms)
  mouseMoveDuration: number;        // Mouse movement time (default: 200ms)
}
```

## CDPWrapper Class (Enhanced)

```typescript
// src/lib/cdp-wrapper.ts

export class CDPWrapper {
  private static CDP_VERSION = '1.3';
  private static MAX_REQUESTS = 100;
  private static MAX_LOGS = 100;
  
  private attachedTabs = new Set<number>();
  private networkRequests = new Map<number, NetworkRequest[]>();
  private consoleLogs = new Map<number, ConsoleLog[]>();
  private elementMaps = new Map<number, Map<string, WeakRef<Element>>>();
  private refCounters = new Map<number, number>();
  
  // Human-like delay generator
  private humanDelays = new HumanDelayGenerator();

  // === Debugger Management ===
  
  async attachDebugger(tabId: number): Promise<void> { /* ... */ }
  async detachDebugger(tabId: number): Promise<void> { /* ... */ }
  async sendCommand(tabId: number, method: string, params?: object): Promise<any> { /* ... */ }

  // === Smart Click (Browser-Use Enhanced) ===
  
  async click(tabId: number, options: ClickOptions): Promise<void> {
    let x: number, y: number;
    
    // Resolve target coordinates
    if (options.ref) {
      const element = await this.getElementByRef(tabId, options.ref);
      x = element.boundingBox.centerX;
      y = element.boundingBox.centerY;
    } else if (options.description) {
      const element = await this.findElementByDescription(tabId, options.description);
      x = element.boundingBox.centerX;
      y = element.boundingBox.centerY;
    } else if (options.selector) {
      const element = await this.getElementBySelector(tabId, options.selector);
      x = element.boundingBox.centerX;
      y = element.boundingBox.centerY;
    } else {
      x = options.x!;
      y = options.y!;
    }
    
    // Human-like mouse movement
    if (options.moveFirst !== false) {
      await this.moveMouseHumanlike(tabId, x, y);
    }
    
    // Execute click
    await this.executeClick(tabId, x, y, options);
    
    // Human-like post-click delay
    if (options.humanDelay !== false) {
      await this.humanDelays.afterClick();
    }
  }
  
  // === Natural Language Element Targeting ===
  
  async findElementByDescription(tabId: number, description: string): Promise<ElementRef> {
    // Get accessibility tree
    const tree = await this.generateAccessibilityTree(tabId, { 
      interactiveOnly: true, 
      visibleOnly: true 
    });
    
    // Score elements by description match (fuzzy matching)
    const scored = tree.tree.map(node => ({
      node,
      score: this.matchScore(description, node.name, node.role, node.description)
    }));
    
    // Return best match
    const best = scored.sort((a, b) => b.score - a.score)[0];
    if (!best || best.score < 0.3) {
      throw new Error(`No element found matching: "${description}"`);
    }
    
    return this.nodeToElementRef(best.node);
  }
  
  private matchScore(query: string, name: string, role: string, description?: string): number {
    const q = query.toLowerCase();
    const n = (name || '').toLowerCase();
    const r = (role || '').toLowerCase();
    const d = (description || '').toLowerCase();
    
    // Exact name match
    if (n === q) return 1.0;
    // Contains query
    if (n.includes(q)) return 0.8;
    if (d.includes(q)) return 0.7;
    // Role + partial name match
    if (q.includes(r) && n.includes(q.replace(r, '').trim())) return 0.6;
    // Fuzzy match
    return this.levenshteinSimilarity(q, n);
  }

  // === Human-Like Mouse Movement ===
  
  private async moveMouseHumanlike(tabId: number, targetX: number, targetY: number): Promise<void> {
    const currentPos = await this.getMousePosition(tabId);
    const steps = this.generateBezierPath(currentPos.x, currentPos.y, targetX, targetY, 10);
    
    for (const point of steps) {
      await this.dispatchMouseEvent(tabId, {
        type: 'mouseMoved',
        x: point.x,
        y: point.y,
        button: 'none',
        buttons: 0
      });
      await this.humanDelays.mouseMoveStep();
    }
  }
  
  private generateBezierPath(x0: number, y0: number, x1: number, y1: number, steps: number): Array<{x: number, y: number}> {
    // Cubic bezier with random control points for natural movement
    const cp1x = x0 + (x1 - x0) * 0.3 + (Math.random() - 0.5) * 50;
    const cp1y = y0 + (y1 - y0) * 0.1 + (Math.random() - 0.5) * 50;
    const cp2x = x0 + (x1 - x0) * 0.7 + (Math.random() - 0.5) * 50;
    const cp2y = y0 + (y1 - y0) * 0.9 + (Math.random() - 0.5) * 50;
    
    const path: Array<{x: number, y: number}> = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Math.pow(1-t, 3) * x0 + 3 * Math.pow(1-t, 2) * t * cp1x + 3 * (1-t) * Math.pow(t, 2) * cp2x + Math.pow(t, 3) * x1;
      const y = Math.pow(1-t, 3) * y0 + 3 * Math.pow(1-t, 2) * t * cp1y + 3 * (1-t) * Math.pow(t, 2) * cp2y + Math.pow(t, 3) * y1;
      path.push({ x: Math.round(x), y: Math.round(y) });
    }
    return path;
  }

  // === Smart Wait System ===
  
  async waitForElement(tabId: number, options: WaitForElementOptions): Promise<ElementRef> {
    const startTime = Date.now();
    const timeout = options.timeout || 30000;
    const pollInterval = options.pollInterval || 100;
    
    while (Date.now() - startTime < timeout) {
      try {
        let element: ElementRef;
        
        if (options.ref) {
          element = await this.getElementByRef(tabId, options.ref);
        } else if (options.description) {
          element = await this.findElementByDescription(tabId, options.description);
        } else if (options.selector) {
          element = await this.getElementBySelector(tabId, options.selector);
        } else {
          throw new Error('Must specify ref, description, or selector');
        }
        
        // Check state requirements
        if (options.state === 'visible' && !element.states.visible) continue;
        if (options.state === 'hidden' && element.states.visible) continue;
        if (options.state === 'enabled' && !element.states.enabled) continue;
        if (options.state === 'disabled' && element.states.enabled) continue;
        
        return element;
      } catch (e) {
        // Element not found yet, continue polling
      }
      
      await this.delay(pollInterval);
    }
    
    throw new Error(`Timeout waiting for element: ${JSON.stringify(options)}`);
  }
  
  async waitForNavigation(tabId: number, timeout: number = 30000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        chrome.webNavigation.onCompleted.removeListener(listener);
        reject(new Error('Navigation timeout'));
      }, timeout);
      
      const listener = (details: chrome.webNavigation.WebNavigationFramedCallbackDetails) => {
        if (details.tabId === tabId && details.frameId === 0) {
          clearTimeout(timer);
          chrome.webNavigation.onCompleted.removeListener(listener);
          resolve();
        }
      };
      
      chrome.webNavigation.onCompleted.addListener(listener);
    });
  }
  
  async waitForNetworkIdle(tabId: number, idleTime: number = 500, timeout: number = 30000): Promise<void> {
    const startTime = Date.now();
    let lastRequestTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const requests = this.networkRequests.get(tabId) || [];
      const recentRequests = requests.filter(r => Date.now() - r.timestamp < idleTime);
      
      if (recentRequests.length === 0 && Date.now() - lastRequestTime >= idleTime) {
        return;
      }
      
      if (recentRequests.length > 0) {
        lastRequestTime = Date.now();
      }
      
      await this.delay(100);
    }
    
    throw new Error('Network idle timeout');
  }

  // === Accessibility Tree Generation ===
  
  async generateAccessibilityTree(tabId: number, options: AccessibilityTreeOptions = {}): Promise<AccessibilityTreeResult> {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId },
      func: this.accessibilityTreeScript,
      args: [options]
    });
    
    return result;
  }
  
  // Injected script for accessibility tree parsing (browser-use inspired)
  private accessibilityTreeScript = (options: AccessibilityTreeOptions) => {
    const INTERACTIVE_ROLES = ['button', 'link', 'textbox', 'checkbox', 'radio', 'combobox', 'listbox', 'menuitem', 'tab', 'slider', 'spinbutton', 'switch'];
    const ARIA_ROLE_MAP: Record<string, string> = {
      'a': 'link', 'button': 'button', 'input': 'textbox', 'select': 'combobox',
      'textarea': 'textbox', 'h1': 'heading', 'h2': 'heading', 'h3': 'heading',
      'img': 'image', 'nav': 'navigation', 'main': 'main', 'form': 'form'
    };
    
    window.__claudeElementMap = window.__claudeElementMap || new Map();
    window.__claudeRefCounter = window.__claudeRefCounter || 0;
    
    function generateRefId(): string {
      window.__claudeRefCounter!++;
      return `ref_${window.__claudeRefCounter}`;
    }
    
    function getRole(el: Element): string {
      const ariaRole = el.getAttribute('role');
      if (ariaRole) return ariaRole;
      return ARIA_ROLE_MAP[el.tagName.toLowerCase()] || 'generic';
    }
    
    function getAccessibleName(el: Element): string {
      // aria-label > aria-labelledby > innerText > alt > placeholder > title
      const ariaLabel = el.getAttribute('aria-label');
      if (ariaLabel) return ariaLabel;
      
      if (el instanceof HTMLInputElement) {
        return el.placeholder || el.value || '';
      }
      if (el instanceof HTMLImageElement) {
        return el.alt || '';
      }
      
      return el.textContent?.trim().slice(0, 100) || '';
    }
    
    function getBoundingBox(el: Element): BoundingBox {
      const rect = el.getBoundingClientRect();
      return {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        centerX: Math.round(rect.x + rect.width / 2),
        centerY: Math.round(rect.y + rect.height / 2)
      };
    }
    
    function getStates(el: Element): ElementStates {
      const rect = el.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0 && 
                       window.getComputedStyle(el).visibility !== 'hidden' &&
                       window.getComputedStyle(el).display !== 'none';
      
      return {
        visible: isVisible,
        enabled: !(el as HTMLInputElement).disabled,
        focusable: el.matches('a, button, input, select, textarea, [tabindex]'),
        focused: document.activeElement === el,
        checked: (el as HTMLInputElement).checked,
        expanded: el.getAttribute('aria-expanded') === 'true',
        selected: el.getAttribute('aria-selected') === 'true' || (el as HTMLOptionElement).selected
      };
    }
    
    function parseElement(el: Element, depth: number, maxDepth: number): AccessibilityNode | null {
      if (depth > maxDepth) return null;
      
      const role = getRole(el);
      const states = getStates(el);
      
      // Filter based on options
      if (options.visibleOnly && !states.visible) return null;
      if (options.interactiveOnly && !INTERACTIVE_ROLES.includes(role)) return null;
      
      const refId = generateRefId();
      window.__claudeElementMap!.set(refId, new WeakRef(el));
      
      const node: AccessibilityNode = {
        refId,
        role,
        name: getAccessibleName(el),
        boundingBox: options.includeBoundingBoxes !== false ? getBoundingBox(el) : undefined as any,
        states,
        depth,
        children: []
      };
      
      // Parse children
      for (const child of el.children) {
        const childNode = parseElement(child, depth + 1, maxDepth);
        if (childNode) {
          node.children!.push(childNode);
        }
      }
      
      // Remove empty children array
      if (node.children!.length === 0) delete node.children;
      
      return node;
    }
    
    function nodeToText(node: AccessibilityNode, indent: string = ''): string {
      let text = `${indent}${node.role}`;
      if (node.name) text += ` "${node.name}"`;
      text += ` [${node.refId}]`;
      if (node.boundingBox) text += ` @(${node.boundingBox.centerX},${node.boundingBox.centerY})`;
      text += '\n';
      
      for (const child of node.children || []) {
        text += nodeToText(child, indent + '  ');
      }
      
      return text;
    }
    
    const maxDepth = options.maxDepth || 10;
    const tree: AccessibilityNode[] = [];
    let totalElements = 0;
    let interactiveElements = 0;
    
    for (const child of document.body.children) {
      const node = parseElement(child, 0, maxDepth);
      if (node) {
        tree.push(node);
        totalElements++;
        if (INTERACTIVE_ROLES.includes(node.role)) interactiveElements++;
      }
    }
    
    const textRepresentation = tree.map(n => nodeToText(n)).join('');
    
    return { tree, totalElements, interactiveElements, textRepresentation };
  };

  // === Screenshot with Annotations ===
  
  async screenshot(tabId: number, options: ScreenshotOptions = {}): Promise<ScreenshotResult> {
    // Get viewport info
    const [{ result: viewport }] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => ({
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio
      })
    });
    
    // Capture screenshot
    const result = await this.sendCommand(tabId, 'Page.captureScreenshot', {
      format: options.format || 'png',
      quality: options.quality,
      captureBeyondViewport: false,
      fromSurface: true
    });
    
    let screenshotData = result.data;
    let annotations: ElementAnnotation[] | undefined;
    
    // Add annotations if requested
    if (options.annotateElements || options.highlightRefs?.length) {
      const tree = await this.generateAccessibilityTree(tabId, { interactiveOnly: true, visibleOnly: true });
      annotations = tree.tree.map(node => ({
        refId: node.refId,
        label: `${node.role}: ${node.name.slice(0, 20)}`,
        boundingBox: node.boundingBox,
        color: options.highlightRefs?.includes(node.refId) ? '#ff0000' : '#00ff00'
      }));
      
      // TODO: Draw annotations on image using canvas (if needed)
    }
    
    return {
      base64: screenshotData,
      width: Math.round(viewport.width * viewport.devicePixelRatio),
      height: Math.round(viewport.height * viewport.devicePixelRatio),
      format: options.format || 'png',
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
      annotations
    };
  }

  // === Element Reference System ===
  
  async getElementByRef(tabId: number, refId: string): Promise<ElementRef> {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId },
      func: (refId: string) => {
        const weakRef = window.__claudeElementMap?.get(refId);
        if (!weakRef) throw new Error(`Reference ${refId} not found`);
        
        const element = weakRef.deref();
        if (!element) throw new Error(`Element for ${refId} has been garbage collected`);
        
        const rect = element.getBoundingClientRect();
        return {
          refId,
          tagName: element.tagName.toLowerCase(),
          role: element.getAttribute('role') || element.tagName.toLowerCase(),
          name: element.textContent?.trim().slice(0, 100) || '',
          boundingBox: {
            x: rect.x, y: rect.y, width: rect.width, height: rect.height,
            centerX: rect.x + rect.width / 2,
            centerY: rect.y + rect.height / 2
          },
          states: {
            visible: rect.width > 0 && rect.height > 0,
            enabled: !(element as HTMLInputElement).disabled,
            focusable: element.matches('a, button, input, select, textarea, [tabindex]'),
            focused: document.activeElement === element
          },
          attributes: Object.fromEntries(
            Array.from(element.attributes).map(a => [a.name, a.value])
          )
        };
      },
      args: [refId]
    });
    
    return result;
  }
  
  async highlightElement(tabId: number, refId: string, color: string = '#ff0000'): Promise<void> {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (refId: string, color: string) => {
        const weakRef = window.__claudeElementMap?.get(refId);
        if (!weakRef) return;
        
        const element = weakRef.deref();
        if (!element) return;
        
        // Create highlight overlay
        const rect = element.getBoundingClientRect();
        const highlight = document.createElement('div');
        highlight.id = `highlight-${refId}`;
        highlight.style.cssText = `
          position: fixed;
          top: ${rect.top}px;
          left: ${rect.left}px;
          width: ${rect.width}px;
          height: ${rect.height}px;
          border: 2px solid ${color};
          background: ${color}33;
          pointer-events: none;
          z-index: 999999;
          transition: all 0.2s ease;
        `;
        document.body.appendChild(highlight);
      },
      args: [refId, color]
    });
  }
  
  async clearHighlights(tabId: number): Promise<void> {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        document.querySelectorAll('[id^="highlight-"]').forEach(el => el.remove());
      }
    });
  }

  // === Human-Like Delays ===
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// === Human Delay Generator ===

class HumanDelayGenerator {
  private config: HumanDelayConfig = {
    typingBaseDelay: 50,
    typingVariance: 30,
    clickDelay: 100,
    scrollDelay: 150,
    mouseMoveDuration: 200
  };
  
  async typeChar(): Promise<void> {
    const delay = this.config.typingBaseDelay + (Math.random() * this.config.typingVariance * 2 - this.config.typingVariance);
    await this.delay(Math.max(10, delay));
  }
  
  async afterClick(): Promise<void> {
    const delay = this.config.clickDelay + (Math.random() * 50 - 25);
    await this.delay(delay);
  }
  
  async afterScroll(): Promise<void> {
    const delay = this.config.scrollDelay + (Math.random() * 50 - 25);
    await this.delay(delay);
  }
  
  async mouseMoveStep(): Promise<void> {
    const delay = this.config.mouseMoveDuration / 10 + (Math.random() * 10);
    await this.delay(delay);
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const cdpWrapper = new CDPWrapper();
```

## Files to Create
- src/lib/cdp-wrapper.ts (main wrapper with all features)
- src/lib/types/cdp-types.ts (TypeScript interfaces)
- src/content/accessibility-tree.js (content script version for DOM injection)
