/**
 * Tests for Element Pointer Content Script
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PointedElement,
  ElementPointerMessageType,
  truncateText,
  getElementText,
  formatPointedElementForChat
} from '../../lib/element-pointer';

describe('Element Pointer Types and Utilities', () => {
  describe('truncateText', () => {
    it('should not truncate text shorter than max length', () => {
      const text = 'Short text';
      expect(truncateText(text, 50)).toBe('Short text');
    });

    it('should truncate text longer than max length', () => {
      const text = 'This is a very long text that should be truncated to fit within the maximum length';
      const result = truncateText(text, 50);
      expect(result).toBe('This is a very long text that should be truncated ...');
      expect(result.length).toBe(53); // 50 chars + '...'
    });

    it('should trim whitespace', () => {
      const text = '  Text with spaces  ';
      expect(truncateText(text, 50)).toBe('Text with spaces');
    });

    it('should use default max length of 50', () => {
      const text = 'a'.repeat(100);
      const result = truncateText(text);
      expect(result.length).toBe(53); // 50 + '...'
    });
  });

  describe('getElementText', () => {
    it('should extract text content from element', () => {
      const div = document.createElement('div');
      div.textContent = 'Hello World';
      expect(getElementText(div)).toBe('Hello World');
    });

    it('should exclude script tags', () => {
      const div = document.createElement('div');
      div.innerHTML = 'Text<script>alert("test")</script>More';
      const result = getElementText(div);
      expect(result).not.toContain('alert');
      expect(result).toContain('Text');
      expect(result).toContain('More');
    });

    it('should exclude style tags', () => {
      const div = document.createElement('div');
      div.innerHTML = 'Text<style>.class { color: red; }</style>More';
      const result = getElementText(div);
      expect(result).not.toContain('color');
      expect(result).toContain('Text');
      expect(result).toContain('More');
    });

    it('should truncate long text', () => {
      const div = document.createElement('div');
      div.textContent = 'a'.repeat(100);
      const result = getElementText(div);
      expect(result.length).toBeLessThanOrEqual(53); // 50 + '...'
    });

    it('should handle empty elements', () => {
      const div = document.createElement('div');
      expect(getElementText(div)).toBe('');
    });
  });

  describe('formatPointedElementForChat', () => {
    it('should format basic pointed element', () => {
      const pointed: PointedElement = {
        ref: '@e5',
        x: 245,
        y: 380,
        width: 120,
        height: 40,
        text: 'Submit'
      };

      const formatted = formatPointedElementForChat(pointed);
      expect(formatted).toContain('User pointed at element:');
      expect(formatted).toContain('- Ref: @e5');
      expect(formatted).toContain('- Position: (245, 380)');
      expect(formatted).toContain('- Size: 120x40');
      expect(formatted).toContain('- Text: "Submit"');
    });

    it('should include optional fields when present', () => {
      const pointed: PointedElement = {
        ref: '@e10',
        x: 100,
        y: 200,
        width: 80,
        height: 30,
        text: 'Click me',
        comment: 'click this button',
        tagName: 'button',
        role: 'button'
      };

      const formatted = formatPointedElementForChat(pointed);
      expect(formatted).toContain('- Comment: "click this button"');
      expect(formatted).toContain('- Tag: button');
      expect(formatted).toContain('- Role: button');
    });

    it('should omit optional fields when not present', () => {
      const pointed: PointedElement = {
        ref: '@e1',
        x: 50,
        y: 50,
        width: 100,
        height: 50,
        text: ''
      };

      const formatted = formatPointedElementForChat(pointed);
      expect(formatted).not.toContain('- Comment:');
      expect(formatted).not.toContain('- Tag:');
      expect(formatted).not.toContain('- Role:');
      expect(formatted).not.toContain('- Text: ""'); // Empty text should not be shown
    });

    it('should format all lines correctly', () => {
      const pointed: PointedElement = {
        ref: '@e5',
        x: 245,
        y: 380,
        width: 120,
        height: 40,
        text: 'Submit',
        comment: 'test comment',
        tagName: 'button',
        role: 'button'
      };

      const formatted = formatPointedElementForChat(pointed);
      const lines = formatted.split('\n');
      
      expect(lines[0]).toBe('User pointed at element:');
      expect(lines[1]).toBe('- Ref: @e5');
      expect(lines[2]).toBe('- Position: (245, 380)');
      expect(lines[3]).toBe('- Size: 120x40');
      expect(lines[4]).toBe('- Text: "Submit"');
      expect(lines[5]).toBe('- Tag: button');
      expect(lines[6]).toBe('- Role: button');
      expect(lines[7]).toBe('- Comment: "test comment"');
    });
  });

  describe('ElementPointerMessageType', () => {
    it('should have correct message types', () => {
      expect(ElementPointerMessageType.ACTIVATE).toBe('ELEMENT_POINTER_ACTIVATE');
      expect(ElementPointerMessageType.DEACTIVATE).toBe('ELEMENT_POINTER_DEACTIVATE');
      expect(ElementPointerMessageType.ELEMENT_POINTED).toBe('ELEMENT_POINTED');
      expect(ElementPointerMessageType.STATUS).toBe('ELEMENT_POINTER_STATUS');
    });
  });
});

describe('Element Pointer Integration', () => {
  beforeEach(() => {
    // Clear document body
    document.body.innerHTML = '';
  });

  it('should create valid PointedElement structure', () => {
    const pointed: PointedElement = {
      ref: '@e1',
      x: 100,
      y: 200,
      width: 50,
      height: 30,
      text: 'Test'
    };

    expect(pointed.ref).toMatch(/^@e\d+$/);
    expect(typeof pointed.x).toBe('number');
    expect(typeof pointed.y).toBe('number');
    expect(typeof pointed.width).toBe('number');
    expect(typeof pointed.height).toBe('number');
    expect(typeof pointed.text).toBe('string');
  });

  it('should handle element with all metadata', () => {
    const button = document.createElement('button');
    button.textContent = 'Click Me';
    button.setAttribute('role', 'button');
    document.body.appendChild(button);

    const text = getElementText(button);
    expect(text).toBe('Click Me');
  });
});
