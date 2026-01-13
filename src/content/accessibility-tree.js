/**
 * Accessibility Tree Content Script
 * 
 * Runs in the page context to parse DOM into semantic structure and assign
 * stable reference IDs to interactive elements. Inspired by browser-use patterns.
 */

// Global element map for this page
window.__claudeElementMap = window.__claudeElementMap || new Map();
window.__claudeRefCounter = window.__claudeRefCounter || 0;

/**
 * Generate accessibility tree for the current page
 */
function generateAccessibilityTree(options = {}) {
  const {
    interactiveOnly = false,
    visibleOnly = true,
    maxDepth = 10,
    includeText = true,
    includeBounds = true
  } = options;

  const tree = {
    url: window.location.href,
    title: document.title,
    timestamp: Date.now(),
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY
    },
    elements: []
  };

  // Clear existing element map
  window.__claudeElementMap.clear();
  window.__claudeRefCounter = 0;

  // Parse DOM starting from body
  const rootElements = document.body ? [document.body] : [document.documentElement];
  
  for (const root of rootElements) {
    parseElement(root, tree.elements, 0, maxDepth, {
      interactiveOnly,
      visibleOnly,
      includeText,
      includeBounds
    });
  }

  return tree;
}

/**
 * Parse a single element and its children
 */
function parseElement(element, parentArray, depth, maxDepth, options) {
  if (depth > maxDepth) return;

  // Skip script, style, and other non-visual elements
  const skipTags = ['script', 'style', 'meta', 'link', 'title', 'head'];
  if (skipTags.includes(element.tagName.toLowerCase())) {
    return;
  }

  const elementInfo = extractElementInfo(element, options);
  
  // Skip if element doesn't meet criteria
  if (options.interactiveOnly && !elementInfo.interactive) {
    // Still process children for interactive elements
    processChildren(element, parentArray, depth, maxDepth, options);
    return;
  }

  if (options.visibleOnly && !elementInfo.visible) {
    return;
  }

  // Assign reference ID if element is interactive
  if (elementInfo.interactive) {
    elementInfo.ref = generateRef();
    window.__claudeElementMap.set(elementInfo.ref, new WeakRef(element));
  }

  parentArray.push(elementInfo);

  // Process children
  processChildren(element, elementInfo.children, depth, maxDepth, options);
}

/**
 * Process child elements
 */
function processChildren(element, childrenArray, depth, maxDepth, options) {
  for (const child of element.children) {
    parseElement(child, childrenArray, depth + 1, maxDepth, options);
  }
}

/**
 * Extract information from a DOM element
 */
function extractElementInfo(element, options) {
  const rect = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);
  const tagName = element.tagName.toLowerCase();
  
  // Check if element is visible
  const visible = rect.width > 0 && 
                 rect.height > 0 && 
                 computedStyle.visibility !== 'hidden' && 
                 computedStyle.display !== 'none' &&
                 parseFloat(computedStyle.opacity) > 0;

  // Check if element is interactive
  const interactive = isInteractiveElement(element);

  // Extract text content
  let text = '';
  if (options.includeText) {
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      text = element.value;
    } else {
      // Get direct text content (not from children)
      text = Array.from(element.childNodes)
        .filter(node => node.nodeType === Node.TEXT_NODE)
        .map(node => node.textContent.trim())
        .join(' ')
        .trim();
      
      // Limit text length
      if (text.length > 200) {
        text = text.substring(0, 200) + '...';
      }
    }
  }

  const elementInfo = {
    tagName,
    type: element.type,
    role: element.getAttribute('role'),
    text,
    placeholder: element.placeholder,
    ariaLabel: element.getAttribute('aria-label'),
    className: element.className,
    id: element.id,
    href: element.href,
    src: element.src,
    value: element.value,
    checked: element.checked,
    disabled: element.disabled,
    visible,
    interactive,
    children: []
  };

  // Add bounds if requested
  if (options.includeBounds && visible) {
    elementInfo.bounds = {
      x: Math.round(rect.left + window.scrollX),
      y: Math.round(rect.top + window.scrollY),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    };
  }

  // Generate description
  elementInfo.description = generateElementDescription(element, text);

  return elementInfo;
}

/**
 * Check if an element is interactive
 */
function isInteractiveElement(element) {
  const tagName = element.tagName.toLowerCase();
  const type = element.type;
  const role = element.getAttribute('role');
  const tabIndex = element.tabIndex;

  // Standard interactive elements
  const interactiveTags = [
    'a', 'button', 'input', 'textarea', 'select', 'option',
    'details', 'summary', 'label'
  ];

  if (interactiveTags.includes(tagName)) {
    return true;
  }

  // Elements with interactive roles
  const interactiveRoles = [
    'button', 'link', 'checkbox', 'radio', 'textbox', 'combobox',
    'listbox', 'option', 'tab', 'tabpanel', 'menuitem', 'menuitemcheckbox',
    'menuitemradio', 'treeitem', 'gridcell', 'slider', 'spinbutton'
  ];

  if (role && interactiveRoles.includes(role)) {
    return true;
  }

  // Elements with click handlers or tabindex
  if (tabIndex >= 0) {
    return true;
  }

  // Check for click event listeners (basic detection)
  if (element.onclick || element.getAttribute('onclick')) {
    return true;
  }

  // Elements that are contenteditable
  if (element.contentEditable === 'true') {
    return true;
  }

  return false;
}

/**
 * Generate natural language description for an element
 */
function generateElementDescription(element, text) {
  const tagName = element.tagName.toLowerCase();
  const type = element.type;
  const role = element.getAttribute('role');
  const ariaLabel = element.getAttribute('aria-label');
  const placeholder = element.placeholder;

  // Start with aria-label if available
  if (ariaLabel) {
    return `${tagName} "${ariaLabel}"`;
  }

  // Handle different element types
  switch (tagName) {
    case 'button':
      return `button "${text || 'button'}"`;
    
    case 'a':
      return `link "${text || element.href || 'link'}"`;
    
    case 'input':
      if (type === 'submit') return `submit button "${element.value || 'Submit'}"`;
      if (type === 'button') return `button "${element.value || 'button'}"`;
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

/**
 * Generate a new reference ID
 */
function generateRef() {
  window.__claudeRefCounter = (window.__claudeRefCounter || 0) + 1;
  return `element_${window.__claudeRefCounter}`;
}

/**
 * Find element by reference ID
 */
function getElementByRef(ref) {
  const weakRef = window.__claudeElementMap.get(ref);
  return weakRef ? weakRef.deref() : null;
}

/**
 * Find elements by description (natural language)
 */
function findElementsByDescription(description, options = {}) {
  const { limit = 10, threshold = 0.3 } = options;
  const results = [];
  
  // Simple text matching for now (could be enhanced with fuzzy matching)
  const searchTerms = description.toLowerCase().split(' ');
  
  for (const [ref, weakRef] of window.__claudeElementMap.entries()) {
    const element = weakRef.deref();
    if (!element) continue;
    
    const elementInfo = extractElementInfo(element, { includeText: true, includeBounds: true });
    const elementText = `${elementInfo.description} ${elementInfo.text || ''}`.toLowerCase();
    
    // Calculate simple match score
    let score = 0;
    for (const term of searchTerms) {
      if (elementText.includes(term)) {
        score += 1 / searchTerms.length;
      }
    }
    
    if (score >= threshold) {
      results.push({
        ref,
        element: elementInfo,
        score
      });
    }
  }
  
  // Sort by score and limit results
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get viewport information
 */
function getViewportInfo() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    devicePixelRatio: window.devicePixelRatio || 1,
    url: window.location.href,
    title: document.title
  };
}

// Export functions for use by CDP wrapper
window.__claudeAccessibilityTree = {
  generateAccessibilityTree,
  getElementByRef,
  findElementsByDescription,
  getViewportInfo
};