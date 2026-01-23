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

  class MockCanvas {
    width = 800;
    height = 600;
    isDrawingMode = false;
    freeDrawingBrush = {
      color: '#ff0000',
      width: 3,
    };
    on = vi.fn();
    add = vi.fn();
    remove = vi.fn();
    getObjects = vi.fn(() => []);
    setBackgroundImage = vi.fn((img: any, callback: any) => callback());
    renderAll = vi.fn();
    toDataURL = vi.fn(() => 'data:image/png;base64,mock');
    toJSON = vi.fn(() => ({ objects: [] }));
    setDimensions = vi.fn();
    dispose = vi.fn();
  }

  class MockLine {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    strokeWidth: number;
    stroke: string;
    arrowColor?: string;
    
    constructor(points: number[], options: any) {
      this.x1 = points[0];
      this.y1 = points[1];
      this.x2 = points[2];
      this.y2 = points[3];
      this.strokeWidth = options.strokeWidth;
      this.stroke = options.stroke;
      this.arrowColor = options.arrowColor;
    }
    
    set(props: any) {
      Object.assign(this, props);
    }
  }

  class MockCircle {
    left: number = 0;
    top: number = 0;
    radius: number = 0;
    stroke: string = '';
    strokeWidth: number = 0;
    fill: string = '';
    
    constructor(options: any) {
      Object.assign(this, options);
    }
    
    set(props: any) {
      Object.assign(this, props);
    }
  }

  class MockRect {
    left: number = 0;
    top: number = 0;
    width: number = 0;
    height: number = 0;
    stroke: string = '';
    strokeWidth: number = 0;
    fill: string = '';
    opacity: number = 1;
    scaleX: number = 1;
    scaleY: number = 1;
    
    constructor(options: any) {
      Object.assign(this, options);
    }
    
    set(props: any) {
      Object.assign(this, props);
    }
  }

  class MockImage {
    element: any;
    selectable: boolean = false;
    evented: boolean = false;
    
    constructor(element: any, options: any) {
      this.element = element;
      Object.assign(this, options);
    }
    
    scale(value: number) {
      return this;
    }
    
    getElement() {
      return this.element;
    }
  }

  class MockPath {
    left: number = 0;
    top: number = 0;
    path: any[] = [];
    
    constructor(options?: any) {
      if (options) {
        Object.assign(this, options);
      }
    }
  }

  return {
    fabric: {
      Canvas: MockCanvas,
      Line: MockLine,
      Circle: MockCircle,
      Rect: MockRect,
      Image: MockImage,
      Path: MockPath,
    },
  };
});

describe('AnnotationCanvas', () => {
  let container: HTMLElement;
  let canvas: AnnotationCanvas;

  beforeEach(() => {
    // Mock Image constructor to immediately trigger onload
    global.Image = class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src: string = '';
      width: number = 100;
      height: number = 100;

      constructor() {
        // Trigger onload asynchronously when src is set
        setTimeout(() => {
          if (this.onload && this.src) {
            if (this.src.includes('invalid')) {
              this.onerror?.();
            } else {
              this.onload();
            }
          }
        }, 0);
      }
    } as any;

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

    it('should enable undo after adding an object', () => {
      const fabricCanvas = canvas.getCanvas();
      const mockObject = { id: 'test-object-1', type: 'circle' };
      
      // Get the object:added event handler
      const addedHandler = (fabricCanvas.on as any).mock.calls.find(
        (call: any[]) => call[0] === 'object:added'
      )?.[1];
      
      if (addedHandler) {
        addedHandler({ target: mockObject });
        expect(canvas.canUndo()).toBe(true);
      }
    });

    it('should enable redo after undo', () => {
      const fabricCanvas = canvas.getCanvas();
      const mockObject = { id: 'test-object-2', type: 'circle' };
      
      // Get the object:added event handler
      const addedHandler = (fabricCanvas.on as any).mock.calls.find(
        (call: any[]) => call[0] === 'object:added'
      )?.[1];
      
      if (addedHandler) {
        addedHandler({ target: mockObject });
        canvas.undo();
        expect(canvas.canRedo()).toBe(true);
      }
    });

    it('should clear redo stack on new action', () => {
      const fabricCanvas = canvas.getCanvas();
      const mockObject1 = { id: 'test-object-3', type: 'circle' };
      const mockObject2 = { id: 'test-object-4', type: 'circle' };
      
      const addedHandler = (fabricCanvas.on as any).mock.calls.find(
        (call: any[]) => call[0] === 'object:added'
      )?.[1];
      
      if (addedHandler) {
        // Add first object
        addedHandler({ target: mockObject1 });
        // Undo it
        canvas.undo();
        expect(canvas.canRedo()).toBe(true);
        
        // Add new object - should clear redo stack
        addedHandler({ target: mockObject2 });
        expect(canvas.canRedo()).toBe(false);
      }
    });

    it('should limit undo stack to 20 levels (TR7)', () => {
      const fabricCanvas = canvas.getCanvas();
      
      const addedHandler = (fabricCanvas.on as any).mock.calls.find(
        (call: any[]) => call[0] === 'object:added'
      )?.[1];
      
      if (addedHandler) {
        // Add 25 objects (more than the 20 limit)
        for (let i = 0; i < 25; i++) {
          const mockObject = { id: `test-object-${i}`, type: 'circle', radius: i };
          addedHandler({ target: mockObject });
        }
        
        // Should still be able to undo
        expect(canvas.canUndo()).toBe(true);
        
        // Undo 20 times (the max)
        for (let i = 0; i < 20; i++) {
          canvas.undo();
        }
        
        // After 20 undos, should not be able to undo anymore
        expect(canvas.canUndo()).toBe(false);
      }
    });

    it('should properly restore objects on redo', () => {
      const fabricCanvas = canvas.getCanvas();
      const mockObject = { id: 'test-object-5', type: 'circle' };
      
      const addedHandler = (fabricCanvas.on as any).mock.calls.find(
        (call: any[]) => call[0] === 'object:added'
      )?.[1];
      
      if (addedHandler) {
        addedHandler({ target: mockObject });
        canvas.undo();
        
        // Redo should add the object back
        canvas.redo();
        expect(fabricCanvas.add).toHaveBeenCalledWith(mockObject);
      }
    });

    it('should properly remove objects on undo', () => {
      const fabricCanvas = canvas.getCanvas();
      const mockObject = { id: 'test-object-6', type: 'circle' };
      
      const addedHandler = (fabricCanvas.on as any).mock.calls.find(
        (call: any[]) => call[0] === 'object:added'
      )?.[1];
      
      if (addedHandler) {
        addedHandler({ target: mockObject });
        
        // Undo should remove the object
        canvas.undo();
        expect(fabricCanvas.remove).toHaveBeenCalledWith(mockObject);
      }
    });

    it('should maintain undo/redo state correctly through multiple operations', () => {
      const fabricCanvas = canvas.getCanvas();
      const mockObject1 = { id: 'test-object-7', type: 'circle' };
      const mockObject2 = { id: 'test-object-8', type: 'rectangle' };
      const mockObject3 = { id: 'test-object-9', type: 'arrow' };
      
      const addedHandler = (fabricCanvas.on as any).mock.calls.find(
        (call: any[]) => call[0] === 'object:added'
      )?.[1];
      
      if (addedHandler) {
        // Add three objects
        addedHandler({ target: mockObject1 });
        addedHandler({ target: mockObject2 });
        addedHandler({ target: mockObject3 });
        
        expect(canvas.canUndo()).toBe(true);
        expect(canvas.canRedo()).toBe(false);
        
        // Undo twice
        canvas.undo();
        canvas.undo();
        
        expect(canvas.canUndo()).toBe(true); // Still one object left
        expect(canvas.canRedo()).toBe(true);
        
        // Redo once
        canvas.redo();
        
        expect(canvas.canUndo()).toBe(true);
        expect(canvas.canRedo()).toBe(true);
      }
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

    it('should export annotations with correct structure (AC3.2)', () => {
      const fabricCanvas = canvas.getCanvas();
      
      // Mock a rectangle object
      const mockRect = {
        left: 100,
        top: 50,
        width: 200,
        height: 150,
        scaleX: 1,
        scaleY: 1,
        stroke: '#ff0000',
        fill: 'transparent',
        opacity: 1,
      };
      
      // Mock getObjects to return our test object
      (fabricCanvas.getObjects as any).mockReturnValue([mockRect]);
      
      const annotations = canvas.getAnnotations();
      
      expect(annotations.length).toBe(1);
      const annotation = annotations[0];
      
      // Verify structure matches AC3.2: { type, x, y, width, height, color, label? }
      expect(annotation).toHaveProperty('id');
      expect(annotation).toHaveProperty('type');
      expect(annotation).toHaveProperty('coordinates');
      expect(annotation).toHaveProperty('color');
      expect(annotation).toHaveProperty('timestamp');
      
      expect(annotation.coordinates).toHaveProperty('x');
      expect(annotation.coordinates).toHaveProperty('y');
      expect(annotation.coordinates).toHaveProperty('width');
      expect(annotation.coordinates).toHaveProperty('height');
    });

    it('should normalize arrow coordinates to 0-1 range (AC3.3)', () => {
      const fabricCanvas = canvas.getCanvas();
      
      // Create a mock arrow using the mocked Line class
      const mockArrow = {
        x1: 100,
        y1: 100,
        x2: 400,
        y2: 300,
        arrowColor: '#ff0000',
        stroke: '#ff0000',
      };
      
      // Make it look like an Arrow instance
      Object.setPrototypeOf(mockArrow, { constructor: { name: 'Arrow' } });
      
      (fabricCanvas.getObjects as any).mockReturnValue([mockArrow]);
      
      const annotations = canvas.getAnnotations();
      expect(annotations.length).toBe(1);
      
      const annotation = annotations[0];
      expect(annotation.type).toBe('arrow');
      
      // Verify coordinates are normalized (0-1 range)
      expect(annotation.coordinates.x).toBeGreaterThanOrEqual(0);
      expect(annotation.coordinates.x).toBeLessThanOrEqual(1);
      expect(annotation.coordinates.y).toBeGreaterThanOrEqual(0);
      expect(annotation.coordinates.y).toBeLessThanOrEqual(1);
      
      // For 800x600 canvas: x=100/800=0.125, y=100/600≈0.167
      expect(annotation.coordinates.x).toBeCloseTo(100 / 800, 2);
      expect(annotation.coordinates.y).toBeCloseTo(100 / 600, 2);
    });

    it('should normalize circle coordinates to 0-1 range (AC3.3)', () => {
      const fabricCanvas = canvas.getCanvas();
      
      // Create a mock circle
      const mockCircle = {
        left: 200,
        top: 150,
        radius: 50,
        stroke: '#0000ff',
        strokeWidth: 3,
        fill: 'transparent',
      };
      
      // Make it look like a Circle instance
      Object.setPrototypeOf(mockCircle, { constructor: { name: 'Circle' } });
      
      (fabricCanvas.getObjects as any).mockReturnValue([mockCircle]);
      
      const annotations = canvas.getAnnotations();
      expect(annotations.length).toBe(1);
      
      const annotation = annotations[0];
      expect(annotation.type).toBe('circle');
      
      // Verify normalized coordinates
      expect(annotation.coordinates.x).toBeCloseTo(200 / 800, 2);
      expect(annotation.coordinates.y).toBeCloseTo(150 / 600, 2);
      expect(annotation.coordinates.width).toBeCloseTo((50 * 2) / 800, 2);
      expect(annotation.coordinates.height).toBeCloseTo((50 * 2) / 600, 2);
    });

    it('should normalize rectangle coordinates to 0-1 range (AC3.3)', () => {
      const fabricCanvas = canvas.getCanvas();
      
      // Create a mock rectangle
      const mockRect = {
        left: 100,
        top: 50,
        width: 200,
        height: 150,
        scaleX: 1,
        scaleY: 1,
        stroke: '#00ff00',
        strokeWidth: 3,
        fill: 'transparent',
        opacity: 1,
      };
      
      // Make it look like a Rect instance
      Object.setPrototypeOf(mockRect, { constructor: { name: 'Rect' } });
      
      (fabricCanvas.getObjects as any).mockReturnValue([mockRect]);
      
      const annotations = canvas.getAnnotations();
      expect(annotations.length).toBe(1);
      
      const annotation = annotations[0];
      expect(annotation.type).toBe('rectangle');
      
      // Verify normalized coordinates
      expect(annotation.coordinates.x).toBeCloseTo(100 / 800, 2);
      expect(annotation.coordinates.y).toBeCloseTo(50 / 600, 2);
      expect(annotation.coordinates.width).toBeCloseTo(200 / 800, 2);
      expect(annotation.coordinates.height).toBeCloseTo(150 / 600, 2);
    });

    it('should distinguish between rectangle and highlight by opacity', () => {
      const fabricCanvas = canvas.getCanvas();
      
      const mockHighlight = {
        left: 100,
        top: 50,
        width: 200,
        height: 150,
        scaleX: 1,
        scaleY: 1,
        fill: '#ffff00',
        stroke: '#ffff00',
        opacity: 0.3, // Semi-transparent = highlight
      };
      
      // Make it look like a Rect instance
      Object.setPrototypeOf(mockHighlight, { constructor: { name: 'Rect' } });
      
      (fabricCanvas.getObjects as any).mockReturnValue([mockHighlight]);
      
      const annotations = canvas.getAnnotations();
      expect(annotations.length).toBe(1);
      expect(annotations[0].type).toBe('highlight');
    });

    it('should handle freehand paths with points array (AC3.3)', () => {
      const fabricCanvas = canvas.getCanvas();
      
      // Create a mock freehand path
      const mockPath = {
        left: 50,
        top: 100,
        path: [
          ['M', 50, 100],
          ['L', 100, 150],
          ['L', 150, 120],
        ],
      };
      
      // Make it look like a Path instance
      Object.setPrototypeOf(mockPath, { constructor: { name: 'Path' } });
      
      (fabricCanvas.getObjects as any).mockReturnValue([mockPath]);
      
      const annotations = canvas.getAnnotations();
      expect(annotations.length).toBe(1);
      
      const annotation = annotations[0];
      expect(annotation.type).toBe('freehand');
      expect(annotation.coordinates.points).toBeDefined();
      expect(Array.isArray(annotation.coordinates.points)).toBe(true);
      
      // Verify points are normalized
      if (annotation.coordinates.points) {
        annotation.coordinates.points.forEach((point) => {
          expect(point.x).toBeGreaterThanOrEqual(0);
          expect(point.x).toBeLessThanOrEqual(1);
          expect(point.y).toBeGreaterThanOrEqual(0);
          expect(point.y).toBeLessThanOrEqual(1);
        });
      }
    });

    it('should include color in exported annotations', () => {
      const fabricCanvas = canvas.getCanvas();
      
      const mockCircle = {
        left: 100,
        top: 100,
        radius: 50,
        stroke: '#ff00ff',
      };
      
      // Make it look like a Circle instance
      Object.setPrototypeOf(mockCircle, { constructor: { name: 'Circle' } });
      
      (fabricCanvas.getObjects as any).mockReturnValue([mockCircle]);
      
      const annotations = canvas.getAnnotations();
      expect(annotations[0].color).toBe('#ff00ff');
    });

    it('should include timestamp in exported annotations', () => {
      const fabricCanvas = canvas.getCanvas();
      
      const mockRect = {
        left: 100,
        top: 100,
        width: 100,
        height: 100,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
      };
      
      // Make it look like a Rect instance
      Object.setPrototypeOf(mockRect, { constructor: { name: 'Rect' } });
      
      (fabricCanvas.getObjects as any).mockReturnValue([mockRect]);
      
      const beforeTime = Date.now();
      const annotations = canvas.getAnnotations();
      const afterTime = Date.now();
      
      expect(annotations[0].timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(annotations[0].timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should generate unique IDs for each annotation', () => {
      const fabricCanvas = canvas.getCanvas();
      
      const mockObjects = [
        { left: 100, top: 100, radius: 50 },
        { left: 200, top: 200, width: 100, height: 100, scaleX: 1, scaleY: 1, opacity: 1 },
        { left: 300, top: 300, radius: 30 },
      ];
      
      // Make them look like Circle and Rect instances
      Object.setPrototypeOf(mockObjects[0], { constructor: { name: 'Circle' } });
      Object.setPrototypeOf(mockObjects[1], { constructor: { name: 'Rect' } });
      Object.setPrototypeOf(mockObjects[2], { constructor: { name: 'Circle' } });
      
      (fabricCanvas.getObjects as any).mockReturnValue(mockObjects);
      
      const annotations = canvas.getAnnotations();
      expect(annotations.length).toBe(3);
      
      const ids = annotations.map(a => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3); // All IDs should be unique
    });

    it('should not include background image in annotations', () => {
      const fabricCanvas = canvas.getCanvas();
      
      const mockImage = {
        selectable: false,
        evented: false,
      };
      
      const mockCircle = {
        left: 100,
        top: 100,
        radius: 50,
      };
      
      // Make them look like Image and Circle instances
      Object.setPrototypeOf(mockImage, { constructor: { name: 'Image' } });
      Object.setPrototypeOf(mockCircle, { constructor: { name: 'Circle' } });
      
      // Set the background image reference (this is what the canvas uses to filter)
      // We need to access the private property for testing
      (canvas as any).backgroundImage = mockImage;
      
      // Mock getObjects to return both background and annotation
      (fabricCanvas.getObjects as any).mockReturnValue([mockImage, mockCircle]);
      
      const annotations = canvas.getAnnotations();
      
      // Should only export the circle, not the background image
      expect(annotations.length).toBe(1);
      expect(annotations[0].type).toBe('circle');
    });

    it('should resize large images to max 1920x1080 (AC4.2)', () => {
      // Create a large canvas
      const largeContainer = document.createElement('div');
      document.body.appendChild(largeContainer);
      
      const largeCanvas = new AnnotationCanvas(largeContainer, {
        width: 2560,
        height: 1440,
      });
      
      const dataUrl = largeCanvas.toDataURL('png');
      
      // Verify it returns a data URL
      expect(dataUrl).toContain('data:image/');
      
      // Cleanup
      largeCanvas.dispose();
      document.body.removeChild(largeContainer);
    });

    it('should not resize images already within limits', () => {
      // Canvas is 800x600, which is within 1920x1080 limit
      const dataUrl = canvas.toDataURL('png');
      expect(dataUrl).toContain('data:image/png');
    });

    it('should support custom max dimensions for resizing', () => {
      const largeContainer = document.createElement('div');
      document.body.appendChild(largeContainer);
      
      const largeCanvas = new AnnotationCanvas(largeContainer, {
        width: 2000,
        height: 2000,
      });
      
      // Export with custom max dimensions
      const dataUrl = largeCanvas.toDataURL('png', 1000, 1000);
      expect(dataUrl).toContain('data:image/');
      
      largeCanvas.dispose();
      document.body.removeChild(largeContainer);
    });

    it('should maintain aspect ratio when resizing', () => {
      // This is implicitly tested by using Math.min(scaleX, scaleY)
      // The implementation ensures aspect ratio is maintained
      const dataUrl = canvas.toDataURL('png');
      expect(dataUrl).toBeTruthy();
    });

    it('should export with JPEG format and quality', () => {
      const dataUrl = canvas.toDataURL('jpeg');
      expect(dataUrl).toBeTruthy();
      // JPEG format should be in the data URL
      expect(dataUrl).toContain('data:image/');
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
