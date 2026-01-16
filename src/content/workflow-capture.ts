/**
 * Enhanced Workflow Action Capture
 * 
 * Comprehensive event capture for workflow recording, inspired by Claude extension.
 * Captures: clicks (single/double/right), inputs, scroll, keyboard shortcuts,
 * form submissions, select changes, and navigation events.
 */

// Track if we're capturing actions
let isCapturing = false;

// Debounce timer for input events
let inputDebounceTimer: number | null = null;

// Track click timing for double-click detection
let lastClickTime = 0;
let lastClickX = 0;
let lastClickY = 0;
let clickCount = 0;
const DOUBLE_CLICK_THRESHOLD = 300; // ms
const DOUBLE_CLICK_DISTANCE = 5; // pixels

// Track scroll for debouncing
let scrollDebounceTimer: number | null = null;
let accumulatedScrollX = 0;
let accumulatedScrollY = 0;

// Track last URL for navigation detection
let lastUrl = window.location.href;

/**
 * Enhanced element info for captured actions
 */
interface CapturedElement {
    tagName: string;
    id?: string;
    className?: string;
    name?: string;
    type?: string;
    placeholder?: string;
    innerText?: string;
    href?: string;
    value?: string;
    selector: string;
    // Enhanced fields
    ariaLabel?: string;
    role?: string;
    textContent?: string;
    rect?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

/**
 * Enhanced captured action structure
 */
interface CapturedAction {
    type:
    | 'click'
    | 'double_click'
    | 'right_click'
    | 'input'
    | 'submit'
    | 'select'
    | 'scroll'
    | 'keypress'
    | 'navigate'
    | 'focus';
    timestamp: number;
    url: string;
    element?: CapturedElement;
    value?: string;
    x?: number;
    y?: number;
    // New fields
    direction?: 'up' | 'down' | 'left' | 'right';
    deltaX?: number;
    deltaY?: number;
    key?: string;
    modifiers?: {
        ctrl?: boolean;
        alt?: boolean;
        shift?: boolean;
        meta?: boolean;
    };
    fromUrl?: string;
    toUrl?: string;
}

/**
 * Generate a robust CSS selector for an element
 * Priority: ID > data-testid > aria-label > name > role+text > nth-of-type path
 */
function generateSelector(element: Element): string {
    // 1. Try ID first (most reliable)
    if (element.id) {
        return `#${CSS.escape(element.id)}`;
    }

    // 2. Try data attributes (common in modern apps)
    const dataAttributes = ['data-testid', 'data-id', 'data-cy', 'data-test'];
    for (const attr of dataAttributes) {
        const value = element.getAttribute(attr);
        if (value) {
            return `[${attr}="${CSS.escape(value)}"]`;
        }
    }

    // 3. Try aria-label (great for accessibility)
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel && ariaLabel.length < 50) {
        return `[aria-label="${CSS.escape(ariaLabel)}"]`;
    }

    // 4. Try name attribute (for form elements)
    const name = element.getAttribute('name');
    if (name) {
        const tagName = element.tagName.toLowerCase();
        return `${tagName}[name="${CSS.escape(name)}"]`;
    }

    // 5. Try role + visible text (for buttons, links)
    const role = element.getAttribute('role');
    const text = (element.textContent || '').trim().slice(0, 30);
    if (role && text && !text.includes('\n')) {
        return `[role="${role}"]:contains("${text}")`;
    }

    // 6. For buttons/links, try text content
    const tagName = element.tagName.toLowerCase();
    if ((tagName === 'button' || tagName === 'a') && text && text.length < 30) {
        // Use XPath-like selector with text
        return `${tagName}:has-text("${text}")`;
    }

    // 7. Build path from root using nth-of-type
    const path: string[] = [];
    let current: Element | null = element;

    while (current && current !== document.body && path.length < 5) {
        let selector = current.tagName.toLowerCase();

        // Add meaningful classes (skip dynamic ones starting with _ or containing numbers)
        if (current.className && typeof current.className === 'string') {
            const classes = current.className
                .split(/\s+/)
                .filter(c => c && !c.startsWith('_') && !/\d{4}/.test(c) && c.length < 30);
            if (classes.length > 0) {
                selector += '.' + classes.slice(0, 2).map(c => CSS.escape(c)).join('.');
            }
        }

        // Add nth-of-type if there are siblings with same tag
        const parent = current.parentElement;
        if (parent) {
            const siblings = Array.from(parent.children).filter(
                c => c.tagName === current!.tagName
            );
            if (siblings.length > 1) {
                const index = siblings.indexOf(current) + 1;
                selector += `:nth-of-type(${index})`;
            }
        }

        path.unshift(selector);
        current = current.parentElement;
    }

    return path.join(' > ');
}

/**
 * Extract comprehensive element info
 */
function extractElementInfo(element: Element): CapturedElement {
    const el = element as HTMLElement;
    const rect = el.getBoundingClientRect();

    return {
        tagName: el.tagName.toLowerCase(),
        id: el.id || undefined,
        className: el.className && typeof el.className === 'string' ? el.className : undefined,
        name: (el as HTMLInputElement).name || undefined,
        type: (el as HTMLInputElement).type || undefined,
        placeholder: (el as HTMLInputElement).placeholder || undefined,
        innerText: el.innerText?.slice(0, 100) || undefined,
        href: (el as HTMLAnchorElement).href || undefined,
        value: (el as HTMLInputElement).value || undefined,
        selector: generateSelector(element),
        // Enhanced fields
        ariaLabel: el.getAttribute('aria-label') || undefined,
        role: el.getAttribute('role') || undefined,
        textContent: (el.textContent || '').trim().slice(0, 50) || undefined,
        rect: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
        }
    };
}

/**
 * Send captured action to extension
 */
function sendAction(action: CapturedAction) {
    console.log('[Workflow Capture] Action:', action.type, action);

    chrome.runtime.sendMessage({
        type: 'WORKFLOW_ACTION_CAPTURED',
        action,
    }).catch(err => {
        console.warn('[Workflow Capture] Failed to send action:', err);
    });
}

/**
 * Handle click events with double-click detection
 */
function handleClick(event: MouseEvent) {
    if (!isCapturing) return;

    const target = event.target as Element;
    if (!target) return;

    // Ignore clicks on our own UI elements
    if (target.closest('#sidepilot-indicator, #workflow-capture-indicator')) return;

    const now = Date.now();
    const dx = Math.abs(event.clientX - lastClickX);
    const dy = Math.abs(event.clientY - lastClickY);

    // Check for double-click
    if (now - lastClickTime < DOUBLE_CLICK_THRESHOLD && dx < DOUBLE_CLICK_DISTANCE && dy < DOUBLE_CLICK_DISTANCE) {
        clickCount++;
    } else {
        clickCount = 1;
    }

    lastClickTime = now;
    lastClickX = event.clientX;
    lastClickY = event.clientY;

    const action: CapturedAction = {
        type: clickCount >= 2 ? 'double_click' : 'click',
        timestamp: now,
        url: window.location.href,
        element: extractElementInfo(target),
        x: event.clientX,
        y: event.clientY,
    };

    sendAction(action);
}

/**
 * Handle right-click / context menu
 */
function handleContextMenu(event: MouseEvent) {
    if (!isCapturing) return;

    const target = event.target as Element;
    if (!target) return;

    const action: CapturedAction = {
        type: 'right_click',
        timestamp: Date.now(),
        url: window.location.href,
        element: extractElementInfo(target),
        x: event.clientX,
        y: event.clientY,
    };

    sendAction(action);
}

/**
 * Handle input events (with debounce)
 */
function handleInput(event: Event) {
    if (!isCapturing) return;

    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    if (!target) return;

    // Debounce input events to capture final value
    if (inputDebounceTimer) {
        clearTimeout(inputDebounceTimer);
    }

    inputDebounceTimer = window.setTimeout(() => {
        const action: CapturedAction = {
            type: 'input',
            timestamp: Date.now(),
            url: window.location.href,
            element: extractElementInfo(target),
            value: target.value,
        };

        sendAction(action);
    }, 500);
}

/**
 * Handle form submissions
 */
function handleSubmit(event: Event) {
    if (!isCapturing) return;

    const form = event.target as HTMLFormElement;
    if (!form) return;

    const action: CapturedAction = {
        type: 'submit',
        timestamp: Date.now(),
        url: window.location.href,
        element: extractElementInfo(form),
    };

    sendAction(action);
}

/**
 * Handle select changes
 */
function handleChange(event: Event) {
    if (!isCapturing) return;

    const target = event.target as HTMLSelectElement;
    if (!target || target.tagName !== 'SELECT') return;

    const action: CapturedAction = {
        type: 'select',
        timestamp: Date.now(),
        url: window.location.href,
        element: extractElementInfo(target),
        value: target.value,
    };

    sendAction(action);
}

/**
 * Handle scroll/wheel events with debounce
 */
function handleWheel(event: WheelEvent) {
    if (!isCapturing) return;

    // Accumulate scroll amounts
    accumulatedScrollX += event.deltaX;
    accumulatedScrollY += event.deltaY;

    // Debounce scroll events
    if (scrollDebounceTimer) {
        clearTimeout(scrollDebounceTimer);
    }

    scrollDebounceTimer = window.setTimeout(() => {
        // Determine dominant direction
        let direction: 'up' | 'down' | 'left' | 'right';
        if (Math.abs(accumulatedScrollY) >= Math.abs(accumulatedScrollX)) {
            direction = accumulatedScrollY > 0 ? 'down' : 'up';
        } else {
            direction = accumulatedScrollX > 0 ? 'right' : 'left';
        }

        const action: CapturedAction = {
            type: 'scroll',
            timestamp: Date.now(),
            url: window.location.href,
            direction,
            deltaX: Math.round(accumulatedScrollX),
            deltaY: Math.round(accumulatedScrollY),
            x: event.clientX,
            y: event.clientY,
        };

        sendAction(action);

        // Reset accumulators
        accumulatedScrollX = 0;
        accumulatedScrollY = 0;
    }, 300);
}

/**
 * Handle keyboard shortcuts (Ctrl+X, Ctrl+V, etc.)
 */
function handleKeyDown(event: KeyboardEvent) {
    if (!isCapturing) return;

    // Only capture if modifier keys are pressed (shortcuts)
    // or if it's a special key like Enter, Escape, Tab
    const isModifierPressed = event.ctrlKey || event.altKey || event.metaKey;
    const isSpecialKey = ['Enter', 'Escape', 'Tab', 'Backspace', 'Delete', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);

    if (!isModifierPressed && !isSpecialKey) return;

    // Ignore repeated key events (held down)
    if (event.repeat) return;

    // Don't capture basic typing in inputs
    const target = event.target as HTMLElement;
    if (['INPUT', 'TEXTAREA'].includes(target.tagName) && !isModifierPressed) return;

    const action: CapturedAction = {
        type: 'keypress',
        timestamp: Date.now(),
        url: window.location.href,
        key: event.key,
        modifiers: {
            ctrl: event.ctrlKey,
            alt: event.altKey,
            shift: event.shiftKey,
            meta: event.metaKey,
        },
        element: target ? extractElementInfo(target) : undefined,
    };

    sendAction(action);
}

/**
 * Handle focus events
 */
function handleFocus(event: FocusEvent) {
    if (!isCapturing) return;

    const target = event.target as Element;
    if (!target) return;

    // Only capture focus on interactive elements
    const tagName = target.tagName;
    if (!['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(tagName)) return;

    const action: CapturedAction = {
        type: 'focus',
        timestamp: Date.now(),
        url: window.location.href,
        element: extractElementInfo(target),
    };

    sendAction(action);
}

/**
 * Handle navigation events (popstate, hashchange)
 */
function handleNavigation() {
    if (!isCapturing) return;

    const newUrl = window.location.href;
    if (newUrl === lastUrl) return;

    const action: CapturedAction = {
        type: 'navigate',
        timestamp: Date.now(),
        url: newUrl,
        fromUrl: lastUrl,
        toUrl: newUrl,
    };

    lastUrl = newUrl;
    sendAction(action);
}

/**
 * Start capturing actions
 */
function startCapturing() {
    if (isCapturing) return;

    isCapturing = true;
    lastUrl = window.location.href;
    console.log('[Workflow Capture] Started capturing (enhanced mode)');

    // Add visual indicator
    const indicator = document.createElement('div');
    indicator.id = 'workflow-capture-indicator';
    indicator.style.cssText = `
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-family: system-ui, sans-serif;
    z-index: 999999;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
    backdrop-filter: blur(4px);
  `;
    indicator.innerHTML = `
    <div style="width: 8px; height: 8px; background: white; border-radius: 50%; animation: pulse 1s infinite;"></div>
    <span><strong>Recording</strong> workflow</span>
  `;

    // Add pulse animation
    const style = document.createElement('style');
    style.id = 'workflow-capture-style';
    style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.7; transform: scale(1.1); }
    }
  `;
    document.head.appendChild(style);
    document.body.appendChild(indicator);

    // Add event listeners
    document.addEventListener('click', handleClick, true);
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('input', handleInput, true);
    document.addEventListener('submit', handleSubmit, true);
    document.addEventListener('change', handleChange, true);
    document.addEventListener('wheel', handleWheel, { capture: true, passive: true });
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('focusin', handleFocus, true);

    // Navigation listeners
    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('hashchange', handleNavigation);

    // Also intercept pushState/replaceState for SPA navigation
    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);

    history.pushState = function (...args) {
        originalPushState(...args);
        setTimeout(handleNavigation, 0);
    };

    history.replaceState = function (...args) {
        originalReplaceState(...args);
        setTimeout(handleNavigation, 0);
    };
}

/**
 * Stop capturing actions
 */
function stopCapturing() {
    if (!isCapturing) return;

    isCapturing = false;
    console.log('[Workflow Capture] Stopped capturing');

    // Clear any pending timers
    if (inputDebounceTimer) clearTimeout(inputDebounceTimer);
    if (scrollDebounceTimer) clearTimeout(scrollDebounceTimer);

    // Remove visual indicator
    document.getElementById('workflow-capture-indicator')?.remove();
    document.getElementById('workflow-capture-style')?.remove();

    // Remove event listeners
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('contextmenu', handleContextMenu, true);
    document.removeEventListener('input', handleInput, true);
    document.removeEventListener('submit', handleSubmit, true);
    document.removeEventListener('change', handleChange, true);
    document.removeEventListener('wheel', handleWheel, true);
    document.removeEventListener('keydown', handleKeyDown, true);
    document.removeEventListener('focusin', handleFocus, true);

    // Navigation listeners
    window.removeEventListener('popstate', handleNavigation);
    window.removeEventListener('hashchange', handleNavigation);
}

/**
 * Listen for messages from extension
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    console.log('[Workflow Capture] Received message:', message);

    if (message.type === 'START_WORKFLOW_CAPTURE') {
        startCapturing();
        sendResponse({ success: true });
    } else if (message.type === 'STOP_WORKFLOW_CAPTURE') {
        stopCapturing();
        sendResponse({ success: true });
    }

    return true;
});

// Log that module is loaded
console.log('[Workflow Capture] Enhanced module loaded (v2.0)');

export { startCapturing, stopCapturing };
export type { CapturedAction };
