# S05: CDP Wrapper - Design

## CDPWrapper Class

```typescript
// src/lib/cdp-wrapper.ts

interface ScreenshotResult {
  base64: string;
  width: number;
  height: number;
  format: 'png' | 'jpeg';
  viewportWidth: number;
  viewportHeight: number;
}

interface MouseEventParams {
  type: 'mousePressed' | 'mouseReleased' | 'mouseMoved' | 'mouseWheel';
  x: number;
  y: number;
  button?: 'none' | 'left' | 'right' | 'middle';
  buttons?: number;
  clickCount?: number;
  modifiers?: number;
  deltaX?: number;
  deltaY?: number;
}

interface KeyEventParams {
  type: 'keyDown' | 'keyUp' | 'rawKeyDown' | 'char';
  key: string;
  code?: string;
  windowsVirtualKeyCode?: number;
  modifiers?: number;
  text?: string;
}

interface NetworkRequest {
  requestId: string;
  url: string;
  method: string;
  status?: number;
  timestamp: number;
}

interface ConsoleLog {
  type: 'log' | 'warn' | 'error' | 'info' | 'exception';
  text: string;
  timestamp: number;
  stackTrace?: string;
}

export class CDPWrapper {
  private static CDP_VERSION = '1.3';
  private static MAX_REQUESTS = 100;
  private static MAX_LOGS = 100;
  
  private attachedTabs = new Set<number>();
  private networkRequests = new Map<number, NetworkRequest[]>();
  private consoleLogs = new Map<number, ConsoleLog[]>();
  private networkEnabled = new Set<number>();
  private consoleEnabled = new Set<number>();

  // === Debugger Management ===
  
  async attachDebugger(tabId: number): Promise<void> {
    if (this.attachedTabs.has(tabId)) return;
    
    await new Promise<void>((resolve, reject) => {
      chrome.debugger.attach({ tabId }, CDPWrapper.CDP_VERSION, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          this.attachedTabs.add(tabId);
          resolve();
        }
      });
    });
    
    this.registerEventHandler();
  }
  
  async detachDebugger(tabId: number): Promise<void> {
    return new Promise(resolve => {
      chrome.debugger.detach({ tabId }, () => {
        this.attachedTabs.delete(tabId);
        resolve();
      });
    });
  }
  
  async sendCommand(tabId: number, method: string, params?: object): Promise<any> {
    // Auto-attach if needed
    if (!this.attachedTabs.has(tabId)) {
      await this.attachDebugger(tabId);
    }
    
    return new Promise((resolve, reject) => {
      chrome.debugger.sendCommand({ tabId }, method, params, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });
  }

  // === Mouse Events ===
  
  private async dispatchMouseEvent(tabId: number, params: MouseEventParams): Promise<void> {
    await this.sendCommand(tabId, 'Input.dispatchMouseEvent', {
      type: params.type,
      x: Math.round(params.x),
      y: Math.round(params.y),
      button: params.button || 'none',
      buttons: params.buttons || 0,
      clickCount: params.clickCount || 1,
      modifiers: params.modifiers || 0,
      deltaX: params.deltaX,
      deltaY: params.deltaY,
    });
  }
  
  async click(
    tabId: number,
    x: number,
    y: number,
    button: 'left' | 'right' | 'middle' = 'left',
    clickCount: number = 1,
    modifiers: number = 0
  ): Promise<void> {
    const buttonMask = button === 'left' ? 1 : button === 'right' ? 2 : 4;
    
    // Move to position
    await this.dispatchMouseEvent(tabId, {
      type: 'mouseMoved', x, y, button: 'none', buttons: 0, modifiers
    });
    await this.delay(100);
    
    // Click(s)
    for (let i = 1; i <= clickCount; i++) {
      await this.dispatchMouseEvent(tabId, {
        type: 'mousePressed', x, y, button, buttons: buttonMask, clickCount: i, modifiers
      });
      await this.delay(12);
      await this.dispatchMouseEvent(tabId, {
        type: 'mouseReleased', x, y, button, buttons: 0, clickCount: i, modifiers
      });
      if (i < clickCount) await this.delay(100);
    }
  }
  
  async leftClickDrag(
    tabId: number,
    startX: number, startY: number,
    endX: number, endY: number
  ): Promise<void> {
    await this.dispatchMouseEvent(tabId, { type: 'mouseMoved', x: startX, y: startY });
    await this.dispatchMouseEvent(tabId, { type: 'mousePressed', x: startX, y: startY, button: 'left', buttons: 1, clickCount: 1 });
    await this.dispatchMouseEvent(tabId, { type: 'mouseMoved', x: endX, y: endY, button: 'left', buttons: 1 });
    await this.dispatchMouseEvent(tabId, { type: 'mouseReleased', x: endX, y: endY, button: 'left', buttons: 0, clickCount: 1 });
  }
  
  async scroll(tabId: number, x: number, y: number, direction: 'up' | 'down' | 'left' | 'right', amount: number = 500): Promise<void> {
    const deltaX = direction === 'left' ? -amount : direction === 'right' ? amount : 0;
    const deltaY = direction === 'up' ? -amount : direction === 'down' ? amount : 0;
    
    await this.dispatchMouseEvent(tabId, {
      type: 'mouseWheel', x, y, deltaX, deltaY
    });
  }

  // === Keyboard Events ===
  
  async type(tabId: number, text: string): Promise<void> {
    for (const char of text) {
      if (char === '\n' || char === '\r') {
        await this.pressKey(tabId, 'Enter');
      } else {
        await this.sendCommand(tabId, 'Input.insertText', { text: char });
      }
      await this.delay(10);
    }
  }
  
  async insertText(tabId: number, text: string): Promise<void> {
    await this.sendCommand(tabId, 'Input.insertText', { text });
  }
  
  async pressKey(tabId: number, key: string, modifiers: number = 0): Promise<void> {
    const keyDef = this.getKeyDefinition(key);
    await this.sendCommand(tabId, 'Input.dispatchKeyEvent', {
      type: 'keyDown', ...keyDef, modifiers
    });
    await this.sendCommand(tabId, 'Input.dispatchKeyEvent', {
      type: 'keyUp', ...keyDef, modifiers
    });
  }
  
  async pressKeyChord(tabId: number, chord: string): Promise<void> {
    // Parse "Ctrl+Shift+A" into modifiers + key
    const parts = chord.toLowerCase().split('+');
    let modifiers = 0;
    let mainKey = '';
    
    for (const part of parts) {
      if (['ctrl', 'control'].includes(part)) modifiers |= 2;
      else if (part === 'alt') modifiers |= 1;
      else if (part === 'shift') modifiers |= 8;
      else if (['meta', 'cmd', 'command'].includes(part)) modifiers |= 4;
      else mainKey = part;
    }
    
    await this.pressKey(tabId, mainKey, modifiers);
  }

  // === Screenshot ===
  
  async screenshot(tabId: number): Promise<ScreenshotResult> {
    // Get viewport info
    const [{ result: viewport }] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => ({
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio
      })
    });
    
    // Capture
    const result = await this.sendCommand(tabId, 'Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
      fromSurface: true
    });
    
    return {
      base64: result.data,
      width: Math.round(viewport.width * viewport.devicePixelRatio),
      height: Math.round(viewport.height * viewport.devicePixelRatio),
      format: 'png',
      viewportWidth: viewport.width,
      viewportHeight: viewport.height
    };
  }

  // === Tracking ===
  
  async enableNetworkTracking(tabId: number): Promise<void> {
    await this.sendCommand(tabId, 'Network.enable', { maxPostDataSize: 65536 });
    this.networkEnabled.add(tabId);
    this.networkRequests.set(tabId, []);
  }
  
  async enableConsoleTracking(tabId: number): Promise<void> {
    await this.sendCommand(tabId, 'Runtime.enable');
    this.consoleEnabled.add(tabId);
    this.consoleLogs.set(tabId, []);
  }
  
  getNetworkRequests(tabId: number): NetworkRequest[] {
    return this.networkRequests.get(tabId) || [];
  }
  
  getConsoleLogs(tabId: number): ConsoleLog[] {
    return this.consoleLogs.get(tabId) || [];
  }

  // === Helpers ===
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private getKeyDefinition(key: string): object {
    // Maps key names to CDP definitions
    const KEYS: Record<string, object> = {
      'Enter': { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 },
      'Tab': { key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 },
      'Escape': { key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 },
      'Backspace': { key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8 },
      // ... more keys
    };
    return KEYS[key] || { key, code: `Key${key.toUpperCase()}`, windowsVirtualKeyCode: key.charCodeAt(0) };
  }
  
  private registerEventHandler(): void {
    // Single global handler for all CDP events
    if (!globalThis.__cdpEventHandler) {
      globalThis.__cdpEventHandler = true;
      chrome.debugger.onEvent.addListener((source, method, params) => {
        const tabId = source.tabId!;
        // Handle network events
        if (method === 'Network.requestWillBeSent') {
          const requests = this.networkRequests.get(tabId) || [];
          requests.push({
            requestId: params.requestId,
            url: params.request.url,
            method: params.request.method,
            timestamp: Date.now()
          });
          if (requests.length > CDPWrapper.MAX_REQUESTS) requests.shift();
          this.networkRequests.set(tabId, requests);
        }
        // Handle console events
        if (method === 'Runtime.consoleAPICalled') {
          const logs = this.consoleLogs.get(tabId) || [];
          logs.push({
            type: params.type,
            text: params.args.map((a: any) => a.value || a.description).join(' '),
            timestamp: Date.now()
          });
          if (logs.length > CDPWrapper.MAX_LOGS) logs.shift();
          this.consoleLogs.set(tabId, logs);
        }
      });
    }
  }
}

export const cdpWrapper = new CDPWrapper();
```

## Files to Create
- src/lib/cdp-wrapper.ts
