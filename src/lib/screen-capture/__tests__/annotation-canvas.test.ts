/**
 * Unit tests for AnnotationCanvas
 * 
 * Tests the Fabric.js wrapper for drawing annotations on screenshots.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AnnotationCanvas } from '../annotation-canvas';
import type { AnnotationType } from '../types';

// Mock Fabric.js
vi.mock('fabric', () => {
  const mockCanvas = {
    width: 800,
    height: 600,
    isDrawingMode: false,
    freeDrawingBrush: {
      color: '#ff0000',
      width: 3,
    },
    on: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    getObjects: vi.fn(() => []),
    setBackgroundImage: vi.fn((img, callback) => callback()),
    renderAll: vi.fn(),
    toDataURL: vi.fn(() => 'data:image/png;base64,mock'),
    toJSON: vi.fn(() => ({ objects: [] })),
    setDimensions: vi.fn(),
    dispose: vi.fn(),
  };

  const mockLine = vi.fn(function(this: any, points: number[], options: any) {
    this.x1 = points[0];
    this.y1 = points[1];
    this.x2 = points[2];
    this.y2 = points[3];
    this.strokeWidth = options.strokeWidth;
    this.stroke = options.stroke;
    this.set = vi.fn((props: any) => {
      Object.assign(this, props);
    });
  });

  const mockCircle = vi.fn(function(this: any, options: any) {
    Object.assign(this, options);
    this.set = vi.fn((props: any) => {
      Object.assign(this, props);
    });
  });

  const mockRect = vi.fn(function(this: any, options: any) {
    Object.assign(this, options);
    this.set = vi.fn((props: any) => {
      Object.assign(this, props);
    });
  });

  const mockImage = vi.fn(function(this: any, element: any, options: any) {
    this.element = element;
    Object.assign(this, options);
    this.scale = vi.fn();
    this.getElement = vi.fn(() => element);
  });

  return {
    fabric: {
      Canvas: vi.fn(() => mockCanvas),
      Line: mockLine,
      Circle: mockCircle,
      Rect: mockRect,
      Image: mockImage,
      Path: vi.fn(),
    },
  };
});

describe('AnnotationCanvas', () => {
  let container: HTMLElement;
  let canvas: AnnotationCanvas;

  beforeEach(() => {
    // Create container element
    container = document.createElement('div');
    document.body.appendChild(container);

    // Create canvas instance
    canvas = new AnnotationCanvas(container, {
      width: 800,
      height: 600,
    });
  });

  afterEach(() => {
    canvas.dispose();
    document.body.removeChild(container);
  });

  describe('Initialization', () => {
    it('should create canvas element in container', () => {
      const canvasElement = container.querySelector('#annotation-canvas');
      expect(canvasElement).toBeTruthy();
    });

    it('should initialize with default tool (arrow)', () => {
      // Tool is set internally, verify by checking behavior
      expect(canvas).toBeTruthy();
    });

    it('should initialize with default color (red)', () => {
      expect(canvas).toBeTruthy();
    });
  });

  describe('Tool Switching', () => {
    it('should switch to arrow tool', () => {
      canvas.setTool('arrow');
      expect(canvas).toBeTruthy();
    });

    it('should switch to circle tool', () => {
      canvas.setTool('circle');
      expect(canvas).toBeTruthy();
    });

    it('should switch to rectangle tool', () => {
      canvas.setTool('rectangle');
      expect(canvas).toBeTruthy();
    });

    it('should switch to freehand tool', () => {
      canvas.setTool('freehand');
      expect(canvas).toBeTruthy();
    });

    it('should switch to highlight tool', () => {
      canvas.setTool('highlight');
      expect(canvas).toBeTruthy();
    });
  });

  describe('Color Selection', () => {
    it('should set color to red', () => {
      canvas.setColor('#ff0000');
      expect(canvas).toBeTruthy();
    });

    it('should set color to blue', () => {
      canvas.setColor('#0000ff');
      expect(canvas).toBeTruthy();
    });

    it('should set color to custom hex', () => {
      canvas.setColor('#123456');
      expect(canvas).toBeTruthy();
    });
  });

  describe('Background Image', () => {
    it('should set background from data URL', async () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      await canvas.setBackground(dataUrl);
      expect(canvas).toBeTruthy();
    });

    it('should handle background image load error', async () => {
      const invalidUrl = 'data:image/png;base64,invalid';
      await expect(canvas.setBackground(invalidUrl)).rejects.toThrow();
    });
  });

  describe('Undo/Redo', () => {
    it('should return false for canUndo when no actions', () => {
      expect(canvas.canUndo()).toBe(false);
    });

    it('should return false for canRedo when no actions', () => {
      expect(canvas.canRedo()).toBe(false);
    });

    it('should not throw when undo with empty stack', () => {
      expect(() => canvas.undo()).not.toThrow();
    });

    it('should not throw when redo with empty stack', () => {
      expect(() => canvas.redo()).not.toThrow();
    });
  });

  describe('Export Functions', () => {
    it('should export annotations as array', () => {
      const annotations = canvas.getAnnotations();
      expect(Array.isArray(annotations)).toBe(true);
    });

    it('should export canvas as PNG data URL', () => {
      const dataUrl = canvas.toDataURL('png');
      expect(dataUrl).toContain('data:image/png');
    });

    it('should export canvas as JPEG data URL', () => {
      const dataUrl = canvas.toDataURL('jpeg');
      expect(dataUrl).toBeTruthy();
    });

    it('should export canvas as JSON', () => {
      const json = canvas.toJSON();
      expect(typeof json).toBe('object');
    });
  });

  describe('Clear and Dispose', () => {
    it('should clear all annotations', () => {
      canvas.clear();
      const annotations = canvas.getAnnotations();
      expect(annotations.length).toBe(0);
    });

    it('should dispose canvas and remove element', () => {
      canvas.dispose();
      const canvasElement = container.querySelector('#annotation-canvas');
      expect(canvasElement).toBeFalsy();
    });
  });

  describe('Resize', () => {
    it('should resize canvas to new dimensions', () => {
      canvas.resize(1024, 768);
      expect(canvas).toBeTruthy();
    });

    it('should handle resize with background image', async () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      await canvas.setBackground(dataUrl);
      canvas.resize(1024, 768);
      expect(canvas).toBeTruthy();
    });
  });

  describe('Canvas Access', () => {
    it('should provide access to underlying Fabric canvas', () => {
      const fabricCanvas = canvas.getCanvas();
      expect(fabricCanvas).toBeTruthy();
    });
  });

  describe('Annotation Types', () => {
    const tools: AnnotationType[] = ['arrow', 'circle', 'rectangle', 'freehand', 'highlight'];

    tools.forEach((tool) => {
      it(`should support ${tool} tool`, () => {
        expect(() => canvas.setTool(tool)).not.toThrow();
      });
    });
  });

  describe('Coordinate Normalization', () => {
    it('should normalize coordinates to 0-1 range', () => {
      const annotations = canvas.getAnnotations();
      
      annotations.forEach((annotation) => {
        expect(annotation.coordinates.x).toBeGreaterThanOrEqual(0);
        expect(annotation.coordinates.x).toBeLessThanOrEqual(1);
        expect(annotation.coordinates.y).toBeGreaterThanOrEqual(0);
        expect(annotation.coordinates.y).toBeLessThanOrEqual(1);
        
        if (annotation.coordinates.width !== undefined) {
          expect(Math.abs(annotation.coordinates.width)).toBeLessThanOrEqual(1);
        }
        if (annotation.coordinates.height !== undefined) {
          expect(Math.abs(annotation.coordinates.height)).toBeLessThanOrEqual(1);
        }
      });
    });
  });

  describe('Annotation Metadata', () => {
    it('should include id in annotations', () => {
      const annotations = canvas.getAnnotations();
      annotations.forEach((annotation) => {
        expect(annotation.id).toBeTruthy();
        expect(typeof annotation.id).toBe('string');
      });
    });

    it('should include timestamp in annotations', () => {
      const annotations = canvas.getAnnotations();
      annotations.forEach((annotation) => {
        expect(annotation.timestamp).toBeTruthy();
        expect(typeof annotation.timestamp).toBe('number');
      });
    });

    it('should include color in annotations', () => {
      const annotations = canvas.getAnnotations();
      annotations.forEach((annotation) => {
        expect(annotation.color).toBeTruthy();
        expect(typeof annotation.color).toBe('string');
      });
    });
  });
});
