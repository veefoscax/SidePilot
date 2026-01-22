/**
 * Tests for RefManager - Ref assignment and resolution system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RefManager, resolveSelector, getElementDescription } from '../ref-manager';
import { RefResolutionError } from '../types';

// Mock DOM environment
const mockDocument = {
  body: null,
  contains: vi.fn(),
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(),
  getElementById: vi.fn()
};

const mockWindow = {
  location: { href: 'https://example.com' },
  addEventListener: vi.fn(),
  getComputedStyle: vi.fn(() => ({
    display: 'block',
    visibility: 'visible',
    opacity: '1'
  }))
};

// Mock global objects
Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true
});

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true
});

// Helper to create mock elements
function createMockElement(tagName: string, attributes: Record<string, string> = {}): Element {
  const element = {
    tagName: tagName.toUpperCase(),
    getAttribute: vi.fn((name: string) => attributes[name] || null),
    hasAttribute: vi.fn((name: string) => name in attributes),
    setAttribute: vi.fn(),
    textContent: attributes.textContent || '',
    children: [],
    closest: vi.fn(),
    querySelector: vi.fn(),
    getBoundingClientRect: vi.fn(() => ({ width: 100, height: 30, x: 0, y: 0 }))
  } as any;

  // Mock specific element types
  if (tagName === 'input') {
    (element as any).type = attributes.type || 'text';
    (element as any).value = attributes.value || '';
  }

  return element;
}

describe('RefManager', () => {
  let refManager: RefManager;

  beforeEach(() => {
    refManager = new RefManager();
    mockDocument.contains.mockReturnValue(true);
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create with default options', () => {
      const manager = new RefManager();
      expect(manager.getPageId()).toBeTruthy();
    });

    it('should accept custom options', () => {
      const manager = new RefManager({
        prefix: 'x',
        maxRefs: 500,
        persistAcrossNavigation: true
      });
      expect(manager.getPageId()).toBeTruthy();
    });
  });

  describe('assignRefs', () => {
    it('should assign refs to interactive elements in deterministic order', () => {
      const button1 = createMockElement('button', { textContent: 'Click me' });
      const button2 = createMockElement('button', { textContent: 'Submit' });
      const input = createMockElement('input', { type: 'text', placeholder: 'Enter text' });
      
      const root = createMockElement('div');
      root.children = [button1, input, button2];

      // Mock traversal
      const assignments = refManager.assignRefs(root);

      expect(assignments).toHaveLength(3);
      expect(assignments[0].ref).toBe('e1');
      expect(assignments[1].ref).toBe('e2');
      expect(assignments[2].ref).toBe('e3');
    });

    it('should respect interactive filter', () => {
      const button = createMockElement('button', { textContent: 'Click' });
      const div = createMockElement('div', { textContent: 'Just text' });
      const input = createMockElement('input', { type: 'text' });
      
      const root = createMockElement('div');
      root.children = [button, div, input];

      const assignments = refManager.assignRefs(root, { interactive: true });

      expect(assignments).toHaveLength(2); // Only button and input
      expect(assignments[0].metadata.interactable).toBe(true);
      expect(assignments[1].metadata.interactable).toBe(true);
    });

    it('should respect depth limit', () => {
      const button = createMockElement('button', { textContent: 'Click' });
      const deepDiv = createMockElement('div');
      deepDiv.children = [button];
      
      const middleDiv = createMockElement('div');
      middleDiv.children = [deepDiv];
      
      const root = createMockElement('div');
      root.children = [middleDiv];

      const assignments = refManager.assignRefs(root, { depth: 1 });

      // Should not reach the button at depth 2
      expect(assignments).toHaveLength(0);
    });

    it('should respect maxElements limit', () => {
      const buttons = Array.from({ length: 5 }, (_, i) => 
        createMockElement('button', { textContent: `Button ${i}` })
      );
      
      const root = createMockElement('div');
      root.children = buttons;

      const assignments = refManager.assignRefs(root, { maxElements: 3 });

      expect(assignments).toHaveLength(3);
    });

    it('should skip elements in compact mode', () => {
      const emptyDiv = createMockElement('div', { textContent: '' });
      const button = createMockElement('button', { textContent: 'Click' });
      const textDiv = createMockElement('div', { textContent: 'Some text' });
      
      const root = createMockElement('div');
      root.children = [emptyDiv, button, textDiv];

      const assignments = refManager.assignRefs(root, { compact: true });

      // Should skip empty div but include button and text div
      expect(assignments.length).toBeGreaterThan(0);
    });
  });

  describe('resolve', () => {
    it('should resolve valid refs to elements', () => {
      const button = createMockElement('button', { textContent: 'Click' });
      const root = createMockElement('div');
      root.children = [button];

      const assignments = refManager.assignRefs(root);
      const ref = assignments[0].ref;

      const resolved = refManager.resolve(ref);
      expect(resolved).toBe(button);
    });

    it('should return null for invalid refs', () => {
      const resolved = refManager.resolve('invalid');
      expect(resolved).toBeNull();
    });

    it('should clean up stale refs', () => {
      const button = createMockElement('button', { textContent: 'Click' });
      const root = createMockElement('div');
      root.children = [button];

      const assignments = refManager.assignRefs(root);
      const ref = assignments[0].ref;

      // Simulate element removed from DOM
      mockDocument.contains.mockReturnValue(false);

      const resolved = refManager.resolve(ref);
      expect(resolved).toBeNull();
    });
  });

  describe('getOrCreateRef', () => {
    it('should return existing ref for element', () => {
      const button = createMockElement('button', { textContent: 'Click' });
      const root = createMockElement('div');
      root.children = [button];

      refManager.assignRefs(root);
      const ref1 = refManager.getOrCreateRef(button);
      const ref2 = refManager.getOrCreateRef(button);

      expect(ref1).toBe(ref2);
      expect(ref1).toBe('e1');
    });

    it('should create new ref for new element', () => {
      const button = createMockElement('button', { textContent: 'Click' });
      const ref = refManager.getOrCreateRef(button);

      expect(ref).toBe('e1');
      expect(refManager.resolve(ref)).toBe(button);
    });
  });

  describe('clear', () => {
    it('should clear all refs and reset counter', () => {
      const button = createMockElement('button', { textContent: 'Click' });
      const root = createMockElement('div');
      root.children = [button];

      const assignments = refManager.assignRefs(root);
      expect(assignments).toHaveLength(1);

      refManager.clear();

      const resolved = refManager.resolve('e1');
      expect(resolved).toBeNull();

      // New assignments should start from e1 again
      const newAssignments = refManager.assignRefs(root);
      expect(newAssignments[0].ref).toBe('e1');
    });
  });

  describe('getRefMap', () => {
    it('should return all current refs with metadata', () => {
      const button = createMockElement('button', { textContent: 'Click me' });
      const input = createMockElement('input', { type: 'email', placeholder: 'Email' });
      const root = createMockElement('div');
      root.children = [button, input];

      refManager.assignRefs(root);
      const refMap = refManager.getRefMap();

      expect(Object.keys(refMap)).toHaveLength(2);
      expect(refMap.e1).toEqual({
        ref: 'e1',
        role: 'button',
        tagName: 'button',
        interactable: true,
        name: 'Click me'
      });
      expect(refMap.e2).toEqual({
        ref: 'e2',
        role: 'textbox',
        tagName: 'input',
        interactable: true,
        type: 'email',
        value: '',
        name: 'Email'
      });
    });

    it('should exclude stale refs', () => {
      const button = createMockElement('button', { textContent: 'Click' });
      const root = createMockElement('div');
      root.children = [button];

      refManager.assignRefs(root);
      
      // Simulate element removed from DOM
      mockDocument.contains.mockReturnValue(false);

      const refMap = refManager.getRefMap();
      expect(Object.keys(refMap)).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    it('should return accurate statistics', () => {
      const button = createMockElement('button', { textContent: 'Click' });
      const div = createMockElement('div', { textContent: 'Text' });
      const root = createMockElement('div');
      root.children = [button, div];

      refManager.assignRefs(root);
      const stats = refManager.getStats();

      expect(stats.totalRefs).toBe(2);
      expect(stats.interactiveRefs).toBe(1); // Only button
      expect(stats.staleRefs).toBe(0);
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });
  });

  describe('cleanupStaleRefs', () => {
    it('should remove stale refs and return count', () => {
      const button = createMockElement('button', { textContent: 'Click' });
      const root = createMockElement('div');
      root.children = [button];

      refManager.assignRefs(root);
      
      // Simulate element removed from DOM
      mockDocument.contains.mockReturnValue(false);

      const cleaned = refManager.cleanupStaleRefs();
      expect(cleaned).toBe(1);

      const stats = refManager.getStats();
      expect(stats.totalRefs).toBe(0);
    });
  });

  describe('static methods', () => {
    describe('isValidRef', () => {
      it('should validate ref format', () => {
        expect(RefManager.isValidRef('e1')).toBe(true);
        expect(RefManager.isValidRef('x123')).toBe(true);
        expect(RefManager.isValidRef('invalid')).toBe(false);
        expect(RefManager.isValidRef('1e')).toBe(false);
        expect(RefManager.isValidRef('')).toBe(false);
      });
    });

    describe('extractRef', () => {
      it('should extract ref from @ref format', () => {
        expect(RefManager.extractRef('@e1')).toBe('e1');
        expect(RefManager.extractRef('@x123')).toBe('x123');
        expect(RefManager.extractRef('button')).toBeNull();
        expect(RefManager.extractRef('@invalid')).toBeNull();
      });
    });
  });

  describe('element role detection', () => {
    it('should detect explicit roles', () => {
      const div = createMockElement('div', { role: 'button', textContent: 'Click' });
      const root = createMockElement('div');
      root.children = [div];

      const assignments = refManager.assignRefs(root);
      expect(assignments[0].metadata.role).toBe('button');
    });

    it('should detect implicit roles from tags', () => {
      const button = createMockElement('button', { textContent: 'Click' });
      const link = createMockElement('a', { href: '#', textContent: 'Link' });
      const input = createMockElement('input', { type: 'text' });
      const root = createMockElement('div');
      root.children = [button, link, input];

      const assignments = refManager.assignRefs(root);
      expect(assignments[0].metadata.role).toBe('button');
      expect(assignments[1].metadata.role).toBe('link');
      expect(assignments[2].metadata.role).toBe('textbox');
    });

    it('should detect input roles by type', () => {
      const checkbox = createMockElement('input', { type: 'checkbox' });
      const radio = createMockElement('input', { type: 'radio' });
      const search = createMockElement('input', { type: 'search' });
      const root = createMockElement('div');
      root.children = [checkbox, radio, search];

      const assignments = refManager.assignRefs(root);
      expect(assignments[0].metadata.role).toBe('checkbox');
      expect(assignments[1].metadata.role).toBe('radio');
      expect(assignments[2].metadata.role).toBe('searchbox');
    });
  });

  describe('element name detection', () => {
    it('should use aria-label as primary name', () => {
      const button = createMockElement('button', { 
        'aria-label': 'Close dialog',
        textContent: 'X'
      });
      const root = createMockElement('div');
      root.children = [button];

      const assignments = refManager.assignRefs(root);
      expect(assignments[0].metadata.name).toBe('Close dialog');
    });

    it('should use text content for buttons', () => {
      const button = createMockElement('button', { textContent: 'Submit Form' });
      const root = createMockElement('div');
      root.children = [button];

      const assignments = refManager.assignRefs(root);
      expect(assignments[0].metadata.name).toBe('Submit Form');
    });

    it('should use placeholder for inputs', () => {
      const input = createMockElement('input', { 
        type: 'text',
        placeholder: 'Enter your name'
      });
      const root = createMockElement('div');
      root.children = [input];

      const assignments = refManager.assignRefs(root);
      expect(assignments[0].metadata.name).toBe('Enter your name');
    });

    it('should use alt text for images', () => {
      const img = createMockElement('img', { alt: 'Company logo' });
      const root = createMockElement('div');
      root.children = [img];

      const assignments = refManager.assignRefs(root);
      expect(assignments[0].metadata.name).toBe('Company logo');
    });
  });
});

describe('resolveSelector', () => {
  let refManager: RefManager;

  beforeEach(() => {
    refManager = new RefManager();
    mockDocument.contains.mockReturnValue(true);
    mockDocument.querySelector.mockReturnValue(null);
    vi.clearAllMocks();
  });

  it('should resolve @ref format', () => {
    const button = createMockElement('button', { textContent: 'Click' });
    const root = createMockElement('div');
    root.children = [button];

    refManager.assignRefs(root);
    
    const resolved = resolveSelector('@e1', refManager);
    expect(resolved).toBe(button);
  });

  it('should throw error for invalid refs', () => {
    expect(() => resolveSelector('@invalid')).toThrow(RefResolutionError);
  });

  it('should fall back to CSS selector', () => {
    const mockElement = createMockElement('button');
    mockDocument.querySelector.mockReturnValue(mockElement);

    const resolved = resolveSelector('button.primary');
    expect(resolved).toBe(mockElement);
    expect(mockDocument.querySelector).toHaveBeenCalledWith('button.primary');
  });
});

describe('getElementDescription', () => {
  let refManager: RefManager;

  beforeEach(() => {
    refManager = new RefManager();
    vi.clearAllMocks();
  });

  it('should include ref in description', () => {
    const button = createMockElement('button', { textContent: 'Click me' });
    const root = createMockElement('div');
    root.children = [button];

    refManager.assignRefs(root);
    
    const description = getElementDescription(button, refManager);
    expect(description).toBe('button[e1] "Click me"');
  });

  it('should work without ref', () => {
    const button = createMockElement('button', { textContent: 'Click me' });
    
    const description = getElementDescription(button);
    expect(description).toBe('button "Click me"');
  });

  it('should handle elements without text', () => {
    const div = createMockElement('div');
    
    const description = getElementDescription(div);
    expect(description).toBe('div');
  });
});