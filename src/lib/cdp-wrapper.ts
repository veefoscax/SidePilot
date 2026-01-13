/**
 * Chrome DevTools Protocol Wrapper
 * 
 * Advanced CDP wrapper inspired by browser-use patterns for AI-powered browser automation.
 * Provides intelligent element targeting, accessibility tree parsing, smart waits, 
 * and human-like interactions.
 */

import { HumanDelays } from './human-delays';
import { ElementReferences } from './element-references';

export interface ScreenshotOptions {
  format?: 'png' | 'jpeg';
  quality?: number;
  annotateElements?: boolean;
  highlightElement?: string; // ref ID
}

export interface ScreenshotResult {
  data: string; // base64
  width: number;
  height: number;
  devicePixelRatio: number;
}

export interface ClickOptions {
  button?: 'left' | 'right' | 'middle';
  clickCount?: number;
  delay?: number | 'human' | 'fast';
}

export interface TypeOptions {
  delay?: number | 'human' | 'fast';
  clearFirst?: boolean;
}

export interface ScrollOptions {
  behavior?: 'smooth' | 'instant';
  block?: 'start' | 'center' | 'end' | 'nearest';
}

export interface WaitOptions {
  timeout?: number;
  interval?: number;
}

export interface NetworkRequest {
  url: string;
  method: string;
  status?: number;
  timestamp: number;
  requestId: string;
}

export interface ConsoleMessage {
  level: 'log' | 'info' | 'warn' | 'error';
  text: string;
  timestamp: number;
  stackTrace?: string;
}

/**
 * Main CDP Wrapper class providing browser automation capabilities
 */
export class CDPWrapper {
  private attachedTabs = new Set<number>();
  private networkRequests = new Map<number, NetworkRequest[]>();
  private consoleMessages = new Map<number, ConsoleMessage[]>();
  private humanDelays: HumanDelays;
  private elementRefs: ElementReferences;

  constructor() {
    this.humanDelays = new HumanDelays();
    this.elementRefs = new ElementReferences();
    this.setupEventListeners();
  }

  /**
   * Attach debugger to a tab
   */
  async attachDebugger(tabId: number): Promise<void> {
    try {
      // Check if already attached
      if (this.attachedTabs.has(tabId)) {
        return;
      }

      // Attach debugger with CDP 1.3
      await chrome.debugger.attach({ tabId }, '1.3');
      this.attachedTabs.add(tabId);

      // Enable required domains
      await this.enableDomains(tabId);

      // Initialize tracking for this tab
      this.networkRequests.set(tabId, []);
      this.consoleMessages.set(tabId, []);

      console.log(`CDP debugger attached to tab ${tabId}`);
    } catch (error) {
      console.error(`Failed to attach debugger to tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Detach debugger from a tab
   */
  async detachDebugger(tabId: number): Promise<void> {
    try {
      if (!this.attachedTabs.has(tabId)) {
        return;
      }

      await chrome.debugger.detach({ tabId });
      this.attachedTabs.delete(tabId);

      // Clean up tracking data
      this.networkRequests.delete(tabId);
      this.consoleMessages.delete(tabId);
      this.elementRefs.clearTab(tabId);

      console.log(`CDP debugger detached from tab ${tabId}`);
    } catch (error) {
      console.error(`Failed to detach debugger from tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Check if debugger is attached to a tab
   */
  isAttached(tabId: number): boolean {
    return this.attachedTabs.has(tabId);
  }

  /**
   * Get list of attached tab IDs
   */
  getAttachedTabs(): number[] {
    return Array.from(this.attachedTabs);
  }

  /**
   * Send CDP command to a tab
   */
  private async sendCommand(tabId: number, method: string, params?: any): Promise<any> {
    if (!this.attachedTabs.has(tabId)) {
      throw new Error(`Debugger not attached to tab ${tabId}`);
    }

    try {
      return await chrome.debugger.sendCommand({ tabId }, method, params);
    } catch (error) {
      // Handle disconnection
      if (error.message?.includes('Debugger is not attached')) {
        this.attachedTabs.delete(tabId);
        throw new Error(`Debugger disconnected from tab ${tabId}`);
      }
      throw error;
    }
  }

  /**
   * Enable required CDP domains
   */
  private async enableDomains(tabId: number): Promise<void> {
    const domains = [
      'Runtime',
      'Page',
      'DOM',
      'Input',
      'Network',
      'Console',
      'Accessibility'
    ];

    for (const domain of domains) {
      await this.sendCommand(tabId, `${domain}.enable`);
    }
  }

  /**
   * Setup event listeners for CDP events
   */
  private setupEventListeners(): void {
    chrome.debugger.onEvent.addListener((source, method, params) => {
      const tabId = source.tabId;
      if (!tabId || !this.attachedTabs.has(tabId)) return;

      // Handle network events
      if (method === 'Network.responseReceived') {
        this.handleNetworkResponse(tabId, params);
      } else if (method === 'Network.requestWillBeSent') {
        this.handleNetworkRequest(tabId, params);
      }

      // Handle console events
      if (method === 'Runtime.consoleAPICalled') {
        this.handleConsoleMessage(tabId, params);
      } else if (method === 'Runtime.exceptionThrown') {
        this.handleException(tabId, params);
      }
    });

    // Handle debugger detachment
    chrome.debugger.onDetach.addListener((source, reason) => {
      const tabId = source.tabId;
      if (tabId && this.attachedTabs.has(tabId)) {
        console.log(`Debugger detached from tab ${tabId}, reason: ${reason}`);
        this.attachedTabs.delete(tabId);
        this.networkRequests.delete(tabId);
        this.consoleMessages.delete(tabId);
        this.elementRefs.clearTab(tabId);
      }
    });
  }

  /**
   * Handle network request events
   */
  private handleNetworkRequest(tabId: number, params: any): void {
    const requests = this.networkRequests.get(tabId) || [];
    const request: NetworkRequest = {
      url: params.request.url,
      method: params.request.method,
      timestamp: Date.now(),
      requestId: params.requestId
    };

    requests.push(request);

    // Keep only recent 100 requests
    if (requests.length > 100) {
      requests.shift();
    }

    this.networkRequests.set(tabId, requests);
  }

  /**
   * Handle network response events
   */
  private handleNetworkResponse(tabId: number, params: any): void {
    const requests = this.networkRequests.get(tabId) || [];
    const request = requests.find(r => r.requestId === params.requestId);
    if (request) {
      request.status = params.response.status;
    }
  }

  /**
   * Handle console message events
   */
  private handleConsoleMessage(tabId: number, params: any): void {
    const messages = this.consoleMessages.get(tabId) || [];
    const message: ConsoleMessage = {
      level: params.type,
      text: params.args.map((arg: any) => arg.value || arg.description || '').join(' '),
      timestamp: Date.now()
    };

    messages.push(message);

    // Keep only recent 100 messages
    if (messages.length > 100) {
      messages.shift();
    }

    this.consoleMessages.set(tabId, messages);
  }

  /**
   * Handle exception events
   */
  private handleException(tabId: number, params: any): void {
    const messages = this.consoleMessages.get(tabId) || [];
    const message: ConsoleMessage = {
      level: 'error',
      text: params.exceptionDetails.text || 'Exception thrown',
      timestamp: Date.now(),
      stackTrace: params.exceptionDetails.stackTrace?.callFrames
        ?.map((frame: any) => `${frame.functionName} (${frame.url}:${frame.lineNumber})`)
        .join('\n')
    };

    messages.push(message);

    // Keep only recent 100 messages
    if (messages.length > 100) {
      messages.shift();
    }

    this.consoleMessages.set(tabId, messages);
  }

  /**
   * Get network requests for a tab
   */
  getNetworkRequests(tabId: number): NetworkRequest[] {
    return this.networkRequests.get(tabId) || [];
  }

  /**
   * Get console messages for a tab
   */
  getConsoleMessages(tabId: number): ConsoleMessage[] {
    return this.consoleMessages.get(tabId) || [];
  }

  /**
   * Clear network requests for a tab
   */
  clearNetworkRequests(tabId: number): void {
    this.networkRequests.set(tabId, []);
  }

  /**
   * Clear console messages for a tab
   */
  clearConsoleMessages(tabId: number): void {
    this.consoleMessages.set(tabId, []);
  }

  /**
   * Click at specific coordinates
   */
  async click(tabId: number, x: number, y: number, options: ClickOptions = {}): Promise<void> {
    const {
      button = 'left',
      clickCount = 1,
      delay = 'human'
    } = options;

    try {
      // Add pre-click delay
      const clickDelay = typeof delay === 'number' ? delay : this.humanDelays.getClickDelay(delay);
      await this.humanDelays.wait(clickDelay);

      // Convert button to CDP format
      const cdpButton = button === 'left' ? 'left' : button === 'right' ? 'right' : 'middle';

      // Perform the click(s)
      for (let i = 0; i < clickCount; i++) {
        // Add slight jitter for human-like behavior
        const jitteredCoords = this.humanDelays.addJitter(x, y, 1);
        
        // Mouse down
        await this.sendCommand(tabId, 'Input.dispatchMouseEvent', {
          type: 'mousePressed',
          x: jitteredCoords.x,
          y: jitteredCoords.y,
          button: cdpButton,
          clickCount: i + 1
        });

        // Small delay between press and release
        await this.humanDelays.wait(10 + Math.random() * 20);

        // Mouse up
        await this.sendCommand(tabId, 'Input.dispatchMouseEvent', {
          type: 'mouseReleased',
          x: jitteredCoords.x,
          y: jitteredCoords.y,
          button: cdpButton,
          clickCount: i + 1
        });

        // Delay between multiple clicks
        if (i < clickCount - 1) {
          await this.humanDelays.wait(50 + Math.random() * 100);
        }
      }

      // Add post-click delay
      await this.humanDelays.wait(clickDelay);

    } catch (error) {
      console.error(`Failed to click at (${x}, ${y}) on tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Click element by reference ID
   */
  async clickElement(tabId: number, ref: string, options: ClickOptions = {}): Promise<void> {
    try {
      // Get element bounds from content script
      const [boundsResult] = await chrome.scripting.executeScript({
        target: { tabId },
        func: (elementRef) => {
          const element = window.__claudeAccessibilityTree?.getElementByRef(elementRef);
          if (!element) return null;
          
          const rect = element.getBoundingClientRect();
          return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            width: rect.width,
            height: rect.height,
            visible: rect.width > 0 && rect.height > 0
          };
        },
        args: [ref]
      });

      const bounds = boundsResult.result;
      if (!bounds) {
        throw new Error(`Element with ref ${ref} not found`);
      }

      if (!bounds.visible) {
        throw new Error(`Element with ref ${ref} is not visible`);
      }

      // Scroll element into view if needed
      await this.scrollToElement(tabId, ref);

      // Click at element center
      await this.click(tabId, bounds.x, bounds.y, options);

    } catch (error) {
      console.error(`Failed to click element ${ref} on tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Click element by natural language description
   */
  async clickByDescription(tabId: number, description: string, options: ClickOptions = {}): Promise<void> {
    try {
      // Find elements matching the description
      const [searchResult] = await chrome.scripting.executeScript({
        target: { tabId },
        func: (desc) => {
          return window.__claudeAccessibilityTree?.findElementsByDescription(desc, { limit: 5 });
        },
        args: [description]
      });

      const matches = searchResult.result;
      if (!matches || matches.length === 0) {
        throw new Error(`No elements found matching description: "${description}"`);
      }

      // Use the best match (highest score)
      const bestMatch = matches[0];
      console.log(`Clicking element "${bestMatch.element.description}" (score: ${bestMatch.score})`);

      // Click the element by reference
      await this.clickElement(tabId, bestMatch.ref, options);

    } catch (error) {
      console.error(`Failed to click element by description "${description}" on tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Hover over an element without clicking
   */
  async hover(tabId: number, ref: string): Promise<void> {
    try {
      // Get element bounds
      const [boundsResult] = await chrome.scripting.executeScript({
        target: { tabId },
        func: (elementRef) => {
          const element = window.__claudeAccessibilityTree?.getElementByRef(elementRef);
          if (!element) return null;
          
          const rect = element.getBoundingClientRect();
          return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            visible: rect.width > 0 && rect.height > 0
          };
        },
        args: [ref]
      });

      const bounds = boundsResult.result;
      if (!bounds || !bounds.visible) {
        throw new Error(`Element with ref ${ref} not found or not visible`);
      }

      // Move mouse to element with human-like path
      await this.moveMouseTo(tabId, bounds.x, bounds.y);

    } catch (error) {
      console.error(`Failed to hover over element ${ref} on tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Drag from one point to another
   */
  async leftClickDrag(tabId: number, startX: number, startY: number, endX: number, endY: number): Promise<void> {
    try {
      // Add jitter to coordinates
      const startCoords = this.humanDelays.addJitter(startX, startY, 1);
      const endCoords = this.humanDelays.addJitter(endX, endY, 1);

      // Mouse down at start position
      await this.sendCommand(tabId, 'Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x: startCoords.x,
        y: startCoords.y,
        button: 'left'
      });

      // Generate path for smooth drag
      const path = this.humanDelays.generateMousePath(
        startCoords.x, startCoords.y, 
        endCoords.x, endCoords.y, 
        15
      );

      // Move along the path
      for (let i = 1; i < path.length; i++) {
        await this.sendCommand(tabId, 'Input.dispatchMouseEvent', {
          type: 'mouseMoved',
          x: path[i].x,
          y: path[i].y
        });
        
        // Small delay between movements
        await this.humanDelays.wait(this.humanDelays.getMouseMovementDelay());
      }

      // Mouse up at end position
      await this.sendCommand(tabId, 'Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: endCoords.x,
        y: endCoords.y,
        button: 'left'
      });

    } catch (error) {
      console.error(`Failed to drag from (${startX}, ${startY}) to (${endX}, ${endY}) on tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Move mouse to coordinates with human-like path
   */
  private async moveMouseTo(tabId: number, x: number, y: number): Promise<void> {
    try {
      // Get current mouse position (approximate)
      const currentX = Math.random() * 800; // Fallback random position
      const currentY = Math.random() * 600;

      // Generate smooth path
      const path = this.humanDelays.generateMousePath(currentX, currentY, x, y, 10);

      // Move along the path
      for (const point of path) {
        await this.sendCommand(tabId, 'Input.dispatchMouseEvent', {
          type: 'mouseMoved',
          x: point.x,
          y: point.y
        });
        
        await this.humanDelays.wait(this.humanDelays.getMouseMovementDelay());
      }
    } catch (error) {
      console.error(`Failed to move mouse to (${x}, ${y}):`, error);
      throw error;
    }
  }

  /**
   * Type text with human-like delays
   */
  async type(tabId: number, text: string, options: TypeOptions = {}): Promise<void> {
    const {
      delay = 'human',
      clearFirst = false
    } = options;

    try {
      // Clear existing text if requested
      if (clearFirst) {
        await this.pressKeyChord(tabId, 'Ctrl+A');
        await this.humanDelays.wait(50);
      }

      // Type each character with realistic delays
      for (const char of text) {
        // Get delay for this character
        const charDelay = typeof delay === 'number' 
          ? delay 
          : this.humanDelays.getTypingDelay(char, delay);

        // Send the character
        await this.sendCommand(tabId, 'Input.dispatchKeyEvent', {
          type: 'char',
          text: char
        });

        // Wait before next character
        await this.humanDelays.wait(charDelay);
      }

    } catch (error) {
      console.error(`Failed to type text "${text}" on tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Insert text instantly (like paste)
   */
  async insertText(tabId: number, text: string): Promise<void> {
    try {
      await this.sendCommand(tabId, 'Input.insertText', {
        text
      });
    } catch (error) {
      console.error(`Failed to insert text "${text}" on tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Press a single key
   */
  async pressKey(tabId: number, key: string): Promise<void> {
    try {
      // Key down
      await this.sendCommand(tabId, 'Input.dispatchKeyEvent', {
        type: 'keyDown',
        key
      });

      // Small delay
      await this.humanDelays.wait(10 + Math.random() * 20);

      // Key up
      await this.sendCommand(tabId, 'Input.dispatchKeyEvent', {
        type: 'keyUp',
        key
      });

    } catch (error) {
      console.error(`Failed to press key "${key}" on tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Press key combination (e.g., "Ctrl+A", "Shift+Tab")
   */
  async pressKeyChord(tabId: number, chord: string): Promise<void> {
    try {
      const keys = chord.split('+').map(k => k.trim());
      const modifiers: any = {};
      const mainKeys: string[] = [];

      // Separate modifiers from main keys
      for (const key of keys) {
        const lowerKey = key.toLowerCase();
        if (lowerKey === 'ctrl' || lowerKey === 'control') {
          modifiers.ctrlKey = true;
        } else if (lowerKey === 'shift') {
          modifiers.shiftKey = true;
        } else if (lowerKey === 'alt') {
          modifiers.altKey = true;
        } else if (lowerKey === 'meta' || lowerKey === 'cmd') {
          modifiers.metaKey = true;
        } else {
          mainKeys.push(key);
        }
      }

      // Press modifier keys down
      const modifierOrder = ['ctrlKey', 'shiftKey', 'altKey', 'metaKey'];
      for (const mod of modifierOrder) {
        if (modifiers[mod]) {
          const keyName = mod === 'ctrlKey' ? 'Control' : 
                         mod === 'shiftKey' ? 'Shift' :
                         mod === 'altKey' ? 'Alt' : 'Meta';
          
          await this.sendCommand(tabId, 'Input.dispatchKeyEvent', {
            type: 'keyDown',
            key: keyName,
            ...modifiers
          });
        }
      }

      // Press main keys
      for (const key of mainKeys) {
        await this.sendCommand(tabId, 'Input.dispatchKeyEvent', {
          type: 'keyDown',
          key,
          ...modifiers
        });

        await this.humanDelays.wait(10);

        await this.sendCommand(tabId, 'Input.dispatchKeyEvent', {
          type: 'keyUp',
          key,
          ...modifiers
        });
      }

      // Release modifier keys (in reverse order)
      for (const mod of modifierOrder.reverse()) {
        if (modifiers[mod]) {
          const keyName = mod === 'ctrlKey' ? 'Control' : 
                         mod === 'shiftKey' ? 'Shift' :
                         mod === 'altKey' ? 'Alt' : 'Meta';
          
          await this.sendCommand(tabId, 'Input.dispatchKeyEvent', {
            type: 'keyUp',
            key: keyName
          });
        }
      }

    } catch (error) {
      console.error(`Failed to press key chord "${chord}" on tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Capture screenshot of the viewport
   */
  async screenshot(tabId: number, options: ScreenshotOptions = {}): Promise<ScreenshotResult> {
    const {
      format = 'png',
      quality = 90,
      annotateElements = false,
      highlightElement
    } = options;

    try {
      // Get viewport info
      const [viewportResult] = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => window.__claudeAccessibilityTree?.getViewportInfo() || {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio || 1
        }
      });

      const viewport = viewportResult.result;

      // Capture screenshot using CDP
      const result = await this.sendCommand(tabId, 'Page.captureScreenshot', {
        format,
        quality: format === 'jpeg' ? quality : undefined,
        clip: {
          x: 0,
          y: 0,
          width: viewport.width,
          height: viewport.height,
          scale: viewport.devicePixelRatio
        }
      });

      // Highlight specific element if requested
      if (highlightElement) {
        await this.elementRefs.highlightElement(tabId, highlightElement, {
          color: '#ff0000',
          width: 3
        });
      }

      // Annotate elements if requested
      if (annotateElements) {
        await this.annotateScreenshot(tabId);
      }

      return {
        data: result.data,
        width: viewport.width,
        height: viewport.height,
        devicePixelRatio: viewport.devicePixelRatio
      };
    } catch (error) {
      console.error(`Failed to capture screenshot for tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Annotate screenshot with element bounding boxes
   */
  private async annotateScreenshot(tabId: number): Promise<void> {
    try {
      // Get accessibility tree to find interactive elements
      const [treeResult] = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => window.__claudeAccessibilityTree?.generateAccessibilityTree({
          interactiveOnly: true,
          visibleOnly: true,
          includeBounds: true
        })
      });

      const tree = treeResult.result;
      if (!tree || !tree.elements) return;

      // Highlight all interactive elements
      const highlightPromises = tree.elements
        .filter((el: any) => el.ref && el.bounds)
        .map((el: any) => 
          this.elementRefs.highlightElement(tabId, el.ref, {
            color: '#00ff00',
            width: 2,
            opacity: 0.6
          })
        );

      await Promise.all(highlightPromises);
    } catch (error) {
      console.error('Failed to annotate screenshot:', error);
    }
  }

  /**
   * Scroll in a direction by amount
   */
  async scroll(tabId: number, direction: 'up' | 'down' | 'left' | 'right', amount: number): Promise<void> {
    try {
      let deltaX = 0;
      let deltaY = 0;

      switch (direction) {
        case 'up':
          deltaY = -amount;
          break;
        case 'down':
          deltaY = amount;
          break;
        case 'left':
          deltaX = -amount;
          break;
        case 'right':
          deltaX = amount;
          break;
      }

      // Get current viewport center for scroll position
      const [viewportResult] = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => ({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2
        })
      });

      const center = viewportResult.result;

      // Dispatch scroll event
      await this.sendCommand(tabId, 'Input.dispatchMouseEvent', {
        type: 'mouseWheel',
        x: center.x,
        y: center.y,
        deltaX,
        deltaY
      });

      // Add human-like delay after scrolling
      await this.humanDelays.wait(this.humanDelays.getScrollDelay());

    } catch (error) {
      console.error(`Failed to scroll ${direction} by ${amount} on tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Scroll to top of page
   */
  async scrollToTop(tabId: number): Promise<void> {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });

      // Wait for scroll to complete
      await this.humanDelays.wait(500);
    } catch (error) {
      console.error(`Failed to scroll to top on tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Scroll to bottom of page
   */
  async scrollToBottom(tabId: number): Promise<void> {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }
      });

      // Wait for scroll to complete
      await this.humanDelays.wait(500);
    } catch (error) {
      console.error(`Failed to scroll to bottom on tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Scroll element into view
   */
  async scrollToElement(tabId: number, ref: string, options: ScrollOptions = {}): Promise<void> {
    const {
      behavior = 'smooth',
      block = 'center'
    } = options;

    try {
      const [scrollResult] = await chrome.scripting.executeScript({
        target: { tabId },
        func: (elementRef, scrollBehavior, scrollBlock) => {
          const element = window.__claudeAccessibilityTree?.getElementByRef(elementRef);
          if (!element) return false;

          element.scrollIntoView({
            behavior: scrollBehavior,
            block: scrollBlock,
            inline: 'nearest'
          });

          return true;
        },
        args: [ref, behavior, block]
      });

      if (!scrollResult.result) {
        throw new Error(`Element with ref ${ref} not found`);
      }

      // Wait for scroll to complete
      await this.humanDelays.wait(behavior === 'smooth' ? 500 : 100);

    } catch (error) {
      console.error(`Failed to scroll to element ${ref} on tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Wait for element to appear or become visible
   */
  async waitForElement(tabId: number, refOrDescription: string, options: WaitOptions = {}): Promise<void> {
    const {
      timeout = 10000,
      interval = 500
    } = options;

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        // Check if it's a ref ID or description
        const isRef = refOrDescription.startsWith('element_');
        
        if (isRef) {
          // Check by reference ID
          const element = this.elementRefs.getElement(tabId, refOrDescription);
          if (element) {
            // Check if element is visible
            const [visibilityResult] = await chrome.scripting.executeScript({
              target: { tabId },
              func: (elementRef) => {
                const el = window.__claudeAccessibilityTree?.getElementByRef(elementRef);
                if (!el) return false;
                
                const rect = el.getBoundingClientRect();
                const style = window.getComputedStyle(el);
                
                return rect.width > 0 && 
                       rect.height > 0 && 
                       style.visibility !== 'hidden' && 
                       style.display !== 'none' &&
                       parseFloat(style.opacity) > 0;
              },
              args: [refOrDescription]
            });

            if (visibilityResult.result) {
              return; // Element found and visible
            }
          }
        } else {
          // Check by description
          const [searchResult] = await chrome.scripting.executeScript({
            target: { tabId },
            func: (description) => {
              const matches = window.__claudeAccessibilityTree?.findElementsByDescription(description, { limit: 1 });
              return matches && matches.length > 0;
            },
            args: [refOrDescription]
          });

          if (searchResult.result) {
            return; // Element found by description
          }
        }

        // Wait before next check
        await this.humanDelays.wait(interval);

      } catch (error) {
        // Continue waiting even if there's an error
        await this.humanDelays.wait(interval);
      }
    }

    throw new Error(`Element "${refOrDescription}" not found within ${timeout}ms`);
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation(tabId: number, options: WaitOptions = {}): Promise<void> {
    const {
      timeout = 30000
    } = options;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Navigation timeout after ${timeout}ms`));
      }, timeout);

      // Listen for navigation events
      const handleNavigationEvent = (source: any, method: string, params: any) => {
        if (source.tabId === tabId && method === 'Page.loadEventFired') {
          clearTimeout(timeoutId);
          chrome.debugger.onEvent.removeListener(handleNavigationEvent);
          resolve();
        }
      };

      chrome.debugger.onEvent.addListener(handleNavigationEvent);
    });
  }

  /**
   * Wait for network to be idle
   */
  async waitForNetworkIdle(tabId: number, idleTime: number = 2000, options: WaitOptions = {}): Promise<void> {
    const {
      timeout = 30000
    } = options;

    const startTime = Date.now();
    let lastNetworkActivity = Date.now();

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Network idle timeout after ${timeout}ms`));
      }, timeout);

      // Listen for network events
      const handleNetworkEvent = (source: any, method: string, params: any) => {
        if (source.tabId === tabId && (
          method === 'Network.requestWillBeSent' || 
          method === 'Network.responseReceived'
        )) {
          lastNetworkActivity = Date.now();
        }
      };

      chrome.debugger.onEvent.addListener(handleNetworkEvent);

      // Check for idle state periodically
      const checkIdle = () => {
        const now = Date.now();
        const timeSinceLastActivity = now - lastNetworkActivity;

        if (timeSinceLastActivity >= idleTime) {
          clearTimeout(timeoutId);
          chrome.debugger.onEvent.removeListener(handleNetworkEvent);
          resolve();
        } else if (now - startTime < timeout) {
          setTimeout(checkIdle, 100);
        }
      };

      // Start checking after initial delay
      setTimeout(checkIdle, idleTime);
    });
  }

  /**
   * Wait for CSS selector to appear
   */
  async waitForSelector(tabId: number, selector: string, options: WaitOptions = {}): Promise<void> {
    const {
      timeout = 10000,
      interval = 500
    } = options;

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const [selectorResult] = await chrome.scripting.executeScript({
          target: { tabId },
          func: (cssSelector) => {
            const element = document.querySelector(cssSelector);
            if (!element) return false;

            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            
            return rect.width > 0 && 
                   rect.height > 0 && 
                   style.visibility !== 'hidden' && 
                   style.display !== 'none';
          },
          args: [selector]
        });

        if (selectorResult.result) {
          return; // Element found
        }

        await this.humanDelays.wait(interval);

      } catch (error) {
        await this.humanDelays.wait(interval);
      }
    }

    throw new Error(`Selector "${selector}" not found within ${timeout}ms`);
  }

  /**
   * Generate accessibility tree for the page
   */
  async generateAccessibilityTree(tabId: number, options: any = {}): Promise<any> {
    try {
      // Inject the accessibility tree content script if not already present
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['src/content/accessibility-tree.js']
      });

      // Generate the tree
      const [treeResult] = await chrome.scripting.executeScript({
        target: { tabId },
        func: (treeOptions) => {
          return window.__claudeAccessibilityTree?.generateAccessibilityTree(treeOptions);
        },
        args: [options]
      });

      const tree = treeResult.result;
      if (!tree) {
        throw new Error('Failed to generate accessibility tree');
      }

      // Register all elements with reference IDs in our element map
      this.registerTreeElements(tabId, tree.elements);

      return tree;

    } catch (error) {
      console.error(`Failed to generate accessibility tree for tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Register elements from accessibility tree in our reference system
   */
  private registerTreeElements(tabId: number, elements: any[]): void {
    for (const element of elements) {
      if (element.ref) {
        // The element is already registered in the page context
        // We just need to track it in our system
        this.elementRefs.registerElement(tabId, null as any, element.ref);
      }

      // Recursively register child elements
      if (element.children && element.children.length > 0) {
        this.registerTreeElements(tabId, element.children);
      }
    }
  }

  /**
   * Find elements by description using accessibility tree
   */
  async findElementsByDescription(tabId: number, description: string, options: any = {}): Promise<any[]> {
    try {
      const [searchResult] = await chrome.scripting.executeScript({
        target: { tabId },
        func: (desc, searchOptions) => {
          return window.__claudeAccessibilityTree?.findElementsByDescription(desc, searchOptions);
        },
        args: [description, options]
      });

      return searchResult.result || [];

    } catch (error) {
      console.error(`Failed to find elements by description "${description}" on tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Get viewport information
   */
  async getViewportInfo(tabId: number): Promise<any> {
    try {
      const [viewportResult] = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          return window.__claudeAccessibilityTree?.getViewportInfo();
        }
      });

      return viewportResult.result;

    } catch (error) {
      console.error(`Failed to get viewport info for tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Auto-reconnect to debugger if disconnected
   */
  async ensureAttached(tabId: number): Promise<void> {
    if (!this.isAttached(tabId)) {
      console.log(`Auto-reconnecting debugger to tab ${tabId}`);
      await this.attachDebugger(tabId);
    }
  }

  /**
   * Insert text instantly (like paste)
   */
  async insertText(tabId: number, text: string): Promise<void> {
    try {
      await this.sendCommand(tabId, 'Input.insertText', {
        text
      });
    } catch (error) {
      console.error(`Failed to insert text "${text}" on tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Scroll to top of page
   */
  async scrollToTop(tabId: number): Promise<void> {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });

      // Wait for scroll to complete
      await this.humanDelays.wait(500);
    } catch (error) {
      console.error(`Failed to scroll to top on tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Scroll to bottom of page
   */
  async scrollToBottom(tabId: number): Promise<void> {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }
      });

      // Wait for scroll to complete
      await this.humanDelays.wait(500);
    } catch (error) {
      console.error(`Failed to scroll to bottom on tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Wait for text to appear on page
   */
  async waitForText(tabId: number, text: string, options: WaitOptions = {}): Promise<void> {
    const {
      timeout = 10000,
      interval = 500
    } = options;

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const found = await this.findText(tabId, text);
        if (found) {
          return; // Text found
        }

        await this.humanDelays.wait(interval);

      } catch (error) {
        await this.humanDelays.wait(interval);
      }
    }

    throw new Error(`Text "${text}" not found within ${timeout}ms`);
  }

  /**
   * Wait for URL to match pattern
   */
  async waitForUrl(tabId: number, pattern: string | RegExp, options: WaitOptions = {}): Promise<void> {
    const {
      timeout = 10000,
      interval = 500
    } = options;

    const startTime = Date.now();
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    while (Date.now() - startTime < timeout) {
      try {
        const [urlResult] = await chrome.scripting.executeScript({
          target: { tabId },
          func: () => window.location.href
        });

        const currentUrl = urlResult.result;
        if (regex.test(currentUrl)) {
          return; // URL matches
        }

        await this.humanDelays.wait(interval);

      } catch (error) {
        await this.humanDelays.wait(interval);
      }
    }

    throw new Error(`URL pattern "${pattern}" not matched within ${timeout}ms`);
  }

  /**
   * Set extra HTTP headers
   */
  async setExtraHeaders(tabId: number, headers: Record<string, string>): Promise<void> {
    try {
      await this.ensureAttached(tabId);
      
      await this.sendCommand(tabId, 'Network.setExtraHTTPHeaders', {
        headers
      });

    } catch (error) {
      console.error(`Failed to set extra headers on tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Set cookie
   */
  async setCookie(tabId: number, cookie: {
    name: string;
    value: string;
    domain?: string;
    path?: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
  }): Promise<void> {
    try {
      await this.ensureAttached(tabId);
      
      await this.sendCommand(tabId, 'Network.setCookie', cookie);

    } catch (error) {
      console.error(`Failed to set cookie on tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Get all cookies
   */
  async getCookies(tabId: number): Promise<any[]> {
    try {
      await this.ensureAttached(tabId);
      
      const result = await this.sendCommand(tabId, 'Network.getCookies');
      return result.cookies || [];

    } catch (error) {
      console.error(`Failed to get cookies from tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Clear all cookies
   */
  async clearCookies(tabId: number): Promise<void> {
    try {
      await this.ensureAttached(tabId);
      
      await this.sendCommand(tabId, 'Network.clearBrowserCookies');

    } catch (error) {
      console.error(`Failed to clear cookies on tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Explicit wait for specified time
   */
  async wait(tabId: number, seconds: number): Promise<void> {
    await this.humanDelays.wait(seconds * 1000);
  }

  // ===== NAVIGATION & BROWSER CONTROL =====

  /**
   * Navigate to a URL
   */
  async navigate(tabId: number, url: string): Promise<void> {
    try {
      await this.ensureAttached(tabId);
      await this.sendCommand(tabId, 'Page.navigate', { url });
    } catch (error) {
      console.error(`Failed to navigate to ${url} on tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Search using specified search engine
   */
  async search(tabId: number, query: string, engine: 'google' | 'duckduckgo' | 'bing' = 'duckduckgo'): Promise<void> {
    const searchUrls = {
      google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      duckduckgo: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
      bing: `https://www.bing.com/search?q=${encodeURIComponent(query)}`
    };

    await this.navigate(tabId, searchUrls[engine]);
  }

  /**
   * Go back in browser history
   */
  async goBack(tabId: number): Promise<void> {
    try {
      await this.ensureAttached(tabId);
      await this.sendCommand(tabId, 'Page.navigateToHistoryEntry', { entryId: -1 });
    } catch (error) {
      console.error(`Failed to go back on tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Go forward in browser history
   */
  async goForward(tabId: number): Promise<void> {
    try {
      await this.ensureAttached(tabId);
      await this.sendCommand(tabId, 'Page.navigateToHistoryEntry', { entryId: 1 });
    } catch (error) {
      console.error(`Failed to go forward on tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Reload the page
   */
  async reload(tabId: number): Promise<void> {
    try {
      await this.ensureAttached(tabId);
      await this.sendCommand(tabId, 'Page.reload');
    } catch (error) {
      console.error(`Failed to reload tab ${tabId}:`, error);
      throw error;
    }
  }

  // ===== FORM CONTROLS =====

  /**
   * Fill text input by reference
   */
  async input(tabId: number, ref: string, text: string, options: { clear?: boolean } = {}): Promise<void> {
    try {
      // Click on the input to focus it
      await this.clickElement(tabId, ref);
      
      // Clear existing text if requested
      if (options.clear) {
        await this.pressKeyChord(tabId, 'Ctrl+A');
        await this.humanDelays.wait(50);
      }

      // Type the text
      await this.type(tabId, text);

    } catch (error) {
      console.error(`Failed to input text "${text}" to element ${ref} on tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Get dropdown options
   */
  async getDropdownOptions(tabId: number, ref: string): Promise<string[]> {
    try {
      const [optionsResult] = await chrome.scripting.executeScript({
        target: { tabId },
        func: (elementRef) => {
          const element = window.__claudeAccessibilityTree?.getElementByRef(elementRef);
          if (!element || element.tagName.toLowerCase() !== 'select') {
            return [];
          }

          return Array.from(element.options).map((option: HTMLOptionElement) => ({
            value: option.value,
            text: option.text,
            selected: option.selected
          }));
        },
        args: [ref]
      });

      return optionsResult.result || [];

    } catch (error) {
      console.error(`Failed to get dropdown options for element ${ref} on tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Select dropdown option by value or text
   */
  async selectDropdown(tabId: number, ref: string, option: string | { text: string }): Promise<void> {
    try {
      const [selectResult] = await chrome.scripting.executeScript({
        target: { tabId },
        func: (elementRef, optionValue) => {
          const element = window.__claudeAccessibilityTree?.getElementByRef(elementRef);
          if (!element || element.tagName.toLowerCase() !== 'select') {
            return false;
          }

          const select = element as HTMLSelectElement;
          
          // Try to select by value first, then by text
          if (typeof optionValue === 'string') {
            // Select by value
            select.value = optionValue;
            if (select.value === optionValue) {
              select.dispatchEvent(new Event('change', { bubbles: true }));
              return true;
            }

            // Select by text
            for (const option of select.options) {
              if (option.text === optionValue) {
                select.value = option.value;
                select.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
              }
            }
          } else if (optionValue.text) {
            // Select by text
            for (const option of select.options) {
              if (option.text === optionValue.text) {
                select.value = option.value;
                select.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
              }
            }
          }

          return false;
        },
        args: [ref, option]
      });

      if (!selectResult.result) {
        throw new Error(`Failed to select option "${JSON.stringify(option)}" in dropdown ${ref}`);
      }

    } catch (error) {
      console.error(`Failed to select dropdown option for element ${ref} on tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Set checkbox state
   */
  async setCheckbox(tabId: number, ref: string, checked: boolean): Promise<void> {
    try {
      const [checkResult] = await chrome.scripting.executeScript({
        target: { tabId },
        func: (elementRef, shouldCheck) => {
          const element = window.__claudeAccessibilityTree?.getElementByRef(elementRef);
          if (!element || element.type !== 'checkbox') {
            return false;
          }

          const checkbox = element as HTMLInputElement;
          if (checkbox.checked !== shouldCheck) {
            checkbox.checked = shouldCheck;
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
          }

          return true;
        },
        args: [ref, checked]
      });

      if (!checkResult.result) {
        throw new Error(`Element ${ref} is not a checkbox`);
      }

    } catch (error) {
      console.error(`Failed to set checkbox ${ref} to ${checked} on tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Select radio button
   */
  async setRadio(tabId: number, ref: string): Promise<void> {
    try {
      const [radioResult] = await chrome.scripting.executeScript({
        target: { tabId },
        func: (elementRef) => {
          const element = window.__claudeAccessibilityTree?.getElementByRef(elementRef);
          if (!element || element.type !== 'radio') {
            return false;
          }

          const radio = element as HTMLInputElement;
          radio.checked = true;
          radio.dispatchEvent(new Event('change', { bubbles: true }));

          return true;
        },
        args: [ref]
      });

      if (!radioResult.result) {
        throw new Error(`Element ${ref} is not a radio button`);
      }

    } catch (error) {
      console.error(`Failed to select radio button ${ref} on tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Upload file to file input
   */
  async uploadFile(tabId: number, ref: string, filePath: string): Promise<void> {
    try {
      // Get the element's node ID for CDP
      const [nodeResult] = await chrome.scripting.executeScript({
        target: { tabId },
        func: (elementRef) => {
          const element = window.__claudeAccessibilityTree?.getElementByRef(elementRef);
          if (!element || element.type !== 'file') {
            return null;
          }

          // We need to get the node ID through CDP
          return element;
        },
        args: [ref]
      });

      if (!nodeResult.result) {
        throw new Error(`Element ${ref} is not a file input`);
      }

      // Use CDP to set file input files
      await this.sendCommand(tabId, 'DOM.setFileInputFiles', {
        files: [filePath],
        nodeId: nodeResult.result // This would need proper node ID resolution
      });

    } catch (error) {
      console.error(`Failed to upload file to element ${ref} on tab ${tabId}:`, error);
      throw error;
    }
  }

  // ===== TAB MANAGEMENT =====

  /**
   * Get all tabs
   */
  async getTabs(): Promise<chrome.tabs.Tab[]> {
    return new Promise((resolve) => {
      chrome.tabs.query({}, resolve);
    });
  }

  /**
   * Switch to a tab
   */
  async switchTab(tabId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.tabs.update(tabId, { active: true }, (tab) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Create a new tab
   */
  async createTab(url?: string): Promise<chrome.tabs.Tab> {
    return new Promise((resolve, reject) => {
      chrome.tabs.create({ url }, (tab) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(tab);
        }
      });
    });
  }

  /**
   * Close a tab
   */
  async closeTab(tabId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.tabs.remove(tabId, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Get active tab
   */
  async getActiveTab(): Promise<chrome.tabs.Tab | null> {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs[0] || null);
      });
    });
  }

  // ===== JAVASCRIPT EXECUTION =====

  /**
   * Evaluate JavaScript code
   */
  async evaluate(tabId: number, code: string, options: { returnByValue?: boolean } = {}): Promise<any> {
    try {
      await this.ensureAttached(tabId);
      
      const result = await this.sendCommand(tabId, 'Runtime.evaluate', {
        expression: code,
        returnByValue: options.returnByValue || false,
        awaitPromise: true
      });

      if (result.exceptionDetails) {
        throw new Error(`JavaScript execution failed: ${result.exceptionDetails.text}`);
      }

      return options.returnByValue ? result.result.value : result.result;

    } catch (error) {
      console.error(`Failed to evaluate JavaScript on tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Call function with arguments
   */
  async callFunction(tabId: number, func: Function, args: any[] = []): Promise<any> {
    try {
      const functionString = func.toString();
      const argsString = JSON.stringify(args);
      const code = `(${functionString}).apply(null, ${argsString})`;
      
      return await this.evaluate(tabId, code, { returnByValue: true });

    } catch (error) {
      console.error(`Failed to call function on tab ${tabId}:`, error);
      throw error;
    }
  }

  // ===== CONTENT EXTRACTION =====

  /**
   * Get page text content
   */
  async getText(tabId: number): Promise<string> {
    try {
      const [textResult] = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => document.body.textContent || ''
      });

      return textResult.result;

    } catch (error) {
      console.error(`Failed to get text content from tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Get page HTML
   */
  async getHtml(tabId: number): Promise<string> {
    try {
      const [htmlResult] = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => document.documentElement.outerHTML
      });

      return htmlResult.result;

    } catch (error) {
      console.error(`Failed to get HTML content from tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Extract structured data using LLM-based extraction
   */
  async extract(tabId: number, schema: any): Promise<any> {
    try {
      // This would integrate with the LLM provider to extract structured data
      // For now, return the accessibility tree as structured data
      const tree = await this.generateAccessibilityTree(tabId, {
        interactiveOnly: false,
        visibleOnly: true,
        includeText: true,
        includeBounds: true
      });

      return {
        schema,
        extractedData: tree,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error(`Failed to extract structured data from tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Find and scroll to text
   */
  async findText(tabId: number, query: string): Promise<boolean> {
    try {
      const [findResult] = await chrome.scripting.executeScript({
        target: { tabId },
        func: (searchQuery) => {
          // Simple text search and scroll
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null
          );

          let node;
          while (node = walker.nextNode()) {
            if (node.textContent && node.textContent.toLowerCase().includes(searchQuery.toLowerCase())) {
              const element = node.parentElement;
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return true;
              }
            }
          }

          return false;
        },
        args: [query]
      });

      return findResult.result;

    } catch (error) {
      console.error(`Failed to find text "${query}" on tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Get all links on page
   */
  async getLinks(tabId: number): Promise<Array<{ text: string; href: string }>> {
    try {
      const [linksResult] = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          return Array.from(document.querySelectorAll('a[href]')).map(link => ({
            text: link.textContent?.trim() || '',
            href: (link as HTMLAnchorElement).href
          }));
        }
      });

      return linksResult.result;

    } catch (error) {
      console.error(`Failed to get links from tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Get all images on page
   */
  async getImages(tabId: number): Promise<Array<{ alt: string; src: string }>> {
    try {
      const [imagesResult] = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          return Array.from(document.querySelectorAll('img')).map(img => ({
            alt: img.alt || '',
            src: img.src
          }));
        }
      });

      return imagesResult.result;

    } catch (error) {
      console.error(`Failed to get images from tab ${tabId}:`, error);
      throw error;
    }
  }

  // ===== EMULATION =====

  /**
   * Set viewport size
   */
  async setViewport(tabId: number, width: number, height: number, deviceScaleFactor: number = 1): Promise<void> {
    try {
      await this.ensureAttached(tabId);
      
      await this.sendCommand(tabId, 'Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor,
        mobile: false
      });

    } catch (error) {
      console.error(`Failed to set viewport on tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Set user agent
   */
  async setUserAgent(tabId: number, userAgent: string): Promise<void> {
    try {
      await this.ensureAttached(tabId);
      
      await this.sendCommand(tabId, 'Emulation.setUserAgentOverride', {
        userAgent
      });

    } catch (error) {
      console.error(`Failed to set user agent on tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Set geolocation
   */
  async setGeolocation(tabId: number, latitude: number, longitude: number): Promise<void> {
    try {
      await this.ensureAttached(tabId);
      
      await this.sendCommand(tabId, 'Emulation.setGeolocationOverride', {
        latitude,
        longitude,
        accuracy: 1
      });

    } catch (error) {
      console.error(`Failed to set geolocation on tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Set timezone
   */
  async setTimezone(tabId: number, timezoneId: string): Promise<void> {
    try {
      await this.ensureAttached(tabId);
      
      await this.sendCommand(tabId, 'Emulation.setTimezoneOverride', {
        timezoneId
      });

    } catch (error) {
      console.error(`Failed to set timezone on tab ${tabId}:`, error);
      throw error;
    }
  }

  /**
   * Set locale
   */
  async setLocale(tabId: number, locale: string): Promise<void> {
    try {
      await this.ensureAttached(tabId);
      
      await this.sendCommand(tabId, 'Emulation.setLocaleOverride', {
        locale
      });

    } catch (error) {
      console.error(`Failed to set locale on tab ${tabId}:`, error);
      throw error;
    }
  }

  // ===== VISUAL INDICATORS =====

  /**
   * Show click indicator at coordinates
   */
  async showClickIndicator(tabId: number, x: number, y: number): Promise<void> {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: (clickX, clickY) => {
          // Create click indicator
          const indicator = document.createElement('div');
          indicator.style.position = 'absolute';
          indicator.style.left = `${clickX - 10}px`;
          indicator.style.top = `${clickY - 10}px`;
          indicator.style.width = '20px';
          indicator.style.height = '20px';
          indicator.style.borderRadius = '50%';
          indicator.style.backgroundColor = '#ff0000';
          indicator.style.opacity = '0.8';
          indicator.style.pointerEvents = 'none';
          indicator.style.zIndex = '999999';
          indicator.style.animation = 'claude-click-pulse 0.6s ease-out';

          // Add CSS animation
          if (!document.getElementById('claude-click-styles')) {
            const style = document.createElement('style');
            style.id = 'claude-click-styles';
            style.textContent = `
              @keyframes claude-click-pulse {
                0% { transform: scale(0.5); opacity: 1; }
                100% { transform: scale(2); opacity: 0; }
              }
            `;
            document.head.appendChild(style);
          }

          document.body.appendChild(indicator);

          // Remove after animation
          setTimeout(() => {
            if (indicator.parentNode) {
              indicator.parentNode.removeChild(indicator);
            }
          }, 600);
        },
        args: [x, y]
      });

    } catch (error) {
      console.error(`Failed to show click indicator at (${x}, ${y}) on tab ${tabId}:`, error);
    }
  }

  /**
   * Show agent indicator (pulsing border)
   */
  async showAgentIndicator(tabId: number): Promise<void> {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          // Remove existing indicator
          const existing = document.getElementById('claude-agent-indicator');
          if (existing) existing.remove();

          // Create agent indicator
          const indicator = document.createElement('div');
          indicator.id = 'claude-agent-indicator';
          indicator.style.position = 'fixed';
          indicator.style.top = '0';
          indicator.style.left = '0';
          indicator.style.right = '0';
          indicator.style.bottom = '0';
          indicator.style.border = '4px solid #00ff00';
          indicator.style.pointerEvents = 'none';
          indicator.style.zIndex = '999998';
          indicator.style.animation = 'claude-agent-pulse 2s infinite';

          // Add CSS animation
          if (!document.getElementById('claude-agent-styles')) {
            const style = document.createElement('style');
            style.id = 'claude-agent-styles';
            style.textContent = `
              @keyframes claude-agent-pulse {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 0.8; }
              }
            `;
            document.head.appendChild(style);
          }

          document.body.appendChild(indicator);
        }
      });

    } catch (error) {
      console.error(`Failed to show agent indicator on tab ${tabId}:`, error);
    }
  }

  /**
   * Hide agent indicator
   */
  async hideAgentIndicator(tabId: number): Promise<void> {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const indicator = document.getElementById('claude-agent-indicator');
          if (indicator) {
            indicator.remove();
          }
        }
      });

    } catch (error) {
      console.error(`Failed to hide agent indicator on tab ${tabId}:`, error);
    }
  }

  /**
   * Hide indicators during screenshot
   */
  async hideIndicatorsDuringScreenshot(tabId: number): Promise<void> {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          // Hide all Claude indicators temporarily
          const indicators = document.querySelectorAll('[id^="claude-"]');
          indicators.forEach(indicator => {
            (indicator as HTMLElement).style.display = 'none';
          });

          // Store original display values for restoration
          (window as any).__claudeHiddenIndicators = Array.from(indicators).map(el => ({
            element: el,
            originalDisplay: (el as HTMLElement).style.display
          }));
        }
      });

    } catch (error) {
      console.error(`Failed to hide indicators on tab ${tabId}:`, error);
    }
  }

  /**
   * Restore indicators after screenshot
   */
  async restoreIndicators(tabId: number): Promise<void> {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const hiddenIndicators = (window as any).__claudeHiddenIndicators;
          if (hiddenIndicators) {
            hiddenIndicators.forEach(({ element, originalDisplay }: any) => {
              element.style.display = originalDisplay;
            });
            delete (window as any).__claudeHiddenIndicators;
          }
        }
      });

    } catch (error) {
      console.error(`Failed to restore indicators on tab ${tabId}:`, error);
    }
  }
}

// Export singleton instance
export const cdpWrapper = new CDPWrapper();