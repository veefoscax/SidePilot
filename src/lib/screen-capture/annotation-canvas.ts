/**
 * Annotation Canvas
 * 
 * Wrapper around Fabric.js for drawing annotations on screenshots.
 * Supports arrow, circle, rectangle, freehand, and highlight tools.
 * 
 * Requirements: AC2.1, TR2
 */

import { fabric } from 'fabric';
import type {
  Annotation,
  AnnotationType,
  AnnotationCanvasOptions,
  Point,
} from './types';

/**
 * Custom Arrow class for Fabric.js
 * Draws an arrow with a line and triangular head
 */
class Arrow extends fabric.Line {
  declare arrowColor: string;

  constructor(points: number[], options: fabric.ILineOptions & { arrowColor?: string } = {}) {
    super(points, {
      ...options,
      strokeWidth: 3,
      stroke: options.arrowColor || '#ff0000',
      selectable: true,
      hasControls: true,
    });
    this.arrowColor = options.arrowColor || '#ff0000';
  }

  /**
   * Render the arrow with a triangular head
   */
  _render(ctx: CanvasRenderingContext2D): void {
    super._render(ctx);

    // Calculate arrow head
    const x1 = this.x1 || 0;
    const y1 = this.y1 || 0;
    const x2 = this.x2 || 0;
    const y2 = this.y2 || 0;

    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLength = 15;

    ctx.save();
    ctx.strokeStyle = this.arrowColor;
    ctx.fillStyle = this.arrowColor;
    ctx.lineWidth = this.strokeWidth || 3;

    // Draw arrow head
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - headLength * Math.cos(angle - Math.PI / 6),
      y2 - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      x2 - headLength * Math.cos(angle + Math.PI / 6),
      y2 - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

/**
 * AnnotationCanvas class
 * 
 * Manages a Fabric.js canvas for drawing annotations on screenshots.
 * Provides tools for drawing, undo/redo, and export functionality.
 */
export class AnnotationCanvas {
  private canvas: fabric.Canvas;
  private container: HTMLElement;
  private currentTool: AnnotationType = 'arrow';
  private currentColor: string = '#ff0000';
  private isDrawing: boolean = false;
  private drawingObject: fabric.Object | null = null;
  private startPoint: { x: number; y: number } | null = null;
  private undoStack: fabric.Object[] = [];
  private redoStack: fabric.Object[] = [];
  private backgroundImage: fabric.Image | null = null;

  /**
   * Initialize the annotation canvas
   * 
   * @param container - HTML element to attach canvas to
   * @param options - Canvas configuration options
   */
  constructor(container: HTMLElement, options: AnnotationCanvasOptions) {
    this.container = container;

    // Create canvas element
    const canvasElement = document.createElement('canvas');
    canvasElement.id = 'annotation-canvas';
    container.appendChild(canvasElement);

    // Initialize Fabric.js canvas
    this.canvas = new fabric.Canvas(canvasElement, {
      width: options.width,
      height: options.height,
      backgroundColor: '#ffffff',
      selection: false, // Disable group selection
      renderOnAddRemove: true,
    });

    // Set background image if provided
    if (options.backgroundImage) {
      this.setBackground(options.backgroundImage);
    }

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Setup mouse event listeners for drawing
   */
  private setupEventListeners(): void {
    this.canvas.on('mouse:down', this.handleMouseDown.bind(this));
    this.canvas.on('mouse:move', this.handleMouseMove.bind(this));
    this.canvas.on('mouse:up', this.handleMouseUp.bind(this));

    // Track object additions for undo/redo
    this.canvas.on('object:added', (e) => {
      if (e.target && !this.isDrawing) {
        this.undoStack.push(e.target);
        this.redoStack = []; // Clear redo stack on new action
      }
    });
  }

  /**
   * Handle mouse down event - start drawing
   */
  private handleMouseDown(event: fabric.IEvent<MouseEvent>): void {
    if (!event.pointer) return;

    this.isDrawing = true;
    this.startPoint = { x: event.pointer.x, y: event.pointer.y };

    switch (this.currentTool) {
      case 'arrow':
        this.startArrow(event.pointer);
        break;
      case 'circle':
        this.startCircle(event.pointer);
        break;
      case 'rectangle':
        this.startRectangle(event.pointer);
        break;
      case 'highlight':
        this.startHighlight(event.pointer);
        break;
      case 'freehand':
        this.startFreehand();
        break;
    }
  }

  /**
   * Handle mouse move event - update drawing
   */
  private handleMouseMove(event: fabric.IEvent<MouseEvent>): void {
    if (!this.isDrawing || !event.pointer || !this.startPoint) return;

    switch (this.currentTool) {
      case 'arrow':
        this.updateArrow(event.pointer);
        break;
      case 'circle':
        this.updateCircle(event.pointer);
        break;
      case 'rectangle':
      case 'highlight':
        this.updateRectangle(event.pointer);
        break;
      // Freehand is handled by Fabric's PencilBrush
    }
  }

  /**
   * Handle mouse up event - finish drawing
   */
  private handleMouseUp(): void {
    if (!this.isDrawing) return;

    this.isDrawing = false;
    this.drawingObject = null;
    this.startPoint = null;

    // Disable drawing mode for freehand
    if (this.currentTool === 'freehand') {
      this.canvas.isDrawingMode = false;
    }
  }

  /**
   * Start drawing an arrow
   */
  private startArrow(pointer: { x: number; y: number }): void {
    const arrow = new Arrow([pointer.x, pointer.y, pointer.x, pointer.y], {
      arrowColor: this.currentColor,
    });
    this.canvas.add(arrow);
    this.drawingObject = arrow;
  }

  /**
   * Update arrow as mouse moves
   */
  private updateArrow(pointer: { x: number; y: number }): void {
    if (this.drawingObject && this.drawingObject instanceof Arrow) {
      this.drawingObject.set({
        x2: pointer.x,
        y2: pointer.y,
      });
      this.canvas.renderAll();
    }
  }

  /**
   * Start drawing a circle
   */
  private startCircle(pointer: { x: number; y: number }): void {
    const circle = new fabric.Circle({
      left: pointer.x,
      top: pointer.y,
      radius: 1,
      stroke: this.currentColor,
      strokeWidth: 3,
      fill: 'transparent',
      selectable: true,
      hasControls: true,
    });
    this.canvas.add(circle);
    this.drawingObject = circle;
  }

  /**
   * Update circle as mouse moves
   */
  private updateCircle(pointer: { x: number; y: number }): void {
    if (this.drawingObject && this.startPoint) {
      const radius = Math.sqrt(
        Math.pow(pointer.x - this.startPoint.x, 2) +
        Math.pow(pointer.y - this.startPoint.y, 2)
      );
      (this.drawingObject as fabric.Circle).set({ radius });
      this.canvas.renderAll();
    }
  }

  /**
   * Start drawing a rectangle
   */
  private startRectangle(pointer: { x: number; y: number }): void {
    const rect = new fabric.Rect({
      left: pointer.x,
      top: pointer.y,
      width: 1,
      height: 1,
      stroke: this.currentColor,
      strokeWidth: 3,
      fill: 'transparent',
      selectable: true,
      hasControls: true,
    });
    this.canvas.add(rect);
    this.drawingObject = rect;
  }

  /**
   * Start drawing a highlight (semi-transparent rectangle)
   */
  private startHighlight(pointer: { x: number; y: number }): void {
    const rect = new fabric.Rect({
      left: pointer.x,
      top: pointer.y,
      width: 1,
      height: 1,
      fill: this.currentColor,
      opacity: 0.3,
      stroke: this.currentColor,
      strokeWidth: 1,
      selectable: true,
      hasControls: true,
    });
    this.canvas.add(rect);
    this.drawingObject = rect;
  }

  /**
   * Update rectangle/highlight as mouse moves
   */
  private updateRectangle(pointer: { x: number; y: number }): void {
    if (this.drawingObject && this.startPoint) {
      const width = pointer.x - this.startPoint.x;
      const height = pointer.y - this.startPoint.y;

      (this.drawingObject as fabric.Rect).set({
        width: Math.abs(width),
        height: Math.abs(height),
        left: width < 0 ? pointer.x : this.startPoint.x,
        top: height < 0 ? pointer.y : this.startPoint.y,
      });
      this.canvas.renderAll();
    }
  }

  /**
   * Start freehand drawing
   */
  private startFreehand(): void {
    this.canvas.isDrawingMode = true;
    if (this.canvas.freeDrawingBrush) {
      this.canvas.freeDrawingBrush.color = this.currentColor;
      this.canvas.freeDrawingBrush.width = 3;
    }
  }

  /**
   * Set the background image from a screenshot
   * 
   * @param image - ImageBitmap, HTMLImageElement, or data URL string
   */
  async setBackground(image: ImageBitmap | HTMLImageElement | string): Promise<void> {
    return new Promise((resolve, reject) => {
      let imgElement: HTMLImageElement;

      if (typeof image === 'string') {
        // Load from data URL
        imgElement = new Image();
        imgElement.onload = () => {
          this.applyBackgroundImage(imgElement);
          resolve();
        };
        imgElement.onerror = reject;
        imgElement.src = image;
      } else if (image instanceof ImageBitmap) {
        // Convert ImageBitmap to canvas then to data URL
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = image.width;
        tempCanvas.height = image.height;
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(image, 0, 0);
        
        imgElement = new Image();
        imgElement.onload = () => {
          this.applyBackgroundImage(imgElement);
          resolve();
        };
        imgElement.onerror = reject;
        imgElement.src = tempCanvas.toDataURL();
      } else {
        // HTMLImageElement
        this.applyBackgroundImage(image);
        resolve();
      }
    });
  }

  /**
   * Apply the background image to the canvas
   */
  private applyBackgroundImage(imgElement: HTMLImageElement): void {
    const fabricImage = new fabric.Image(imgElement, {
      selectable: false,
      evented: false,
    });

    // Scale image to fit canvas
    const scaleX = this.canvas.width! / imgElement.width;
    const scaleY = this.canvas.height! / imgElement.height;
    fabricImage.scale(Math.min(scaleX, scaleY));

    this.backgroundImage = fabricImage;
    this.canvas.setBackgroundImage(fabricImage, this.canvas.renderAll.bind(this.canvas));
  }

  /**
   * Set the current drawing tool
   * 
   * @param tool - Tool type to activate
   */
  setTool(tool: AnnotationType): void {
    this.currentTool = tool;
    
    // Disable drawing mode when switching away from freehand
    if (tool !== 'freehand') {
      this.canvas.isDrawingMode = false;
    }
  }

  /**
   * Set the current drawing color
   * 
   * @param color - Hex color code (e.g., "#ff0000")
   */
  setColor(color: string): void {
    this.currentColor = color;
  }

  /**
   * Undo the last annotation
   */
  undo(): void {
    if (this.undoStack.length === 0) return;

    const obj = this.undoStack.pop();
    if (obj) {
      this.canvas.remove(obj);
      this.redoStack.push(obj);
      this.canvas.renderAll();
    }
  }

  /**
   * Redo the last undone annotation
   */
  redo(): void {
    if (this.redoStack.length === 0) return;

    const obj = this.redoStack.pop();
    if (obj) {
      this.canvas.add(obj);
      this.undoStack.push(obj);
      this.canvas.renderAll();
    }
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Get all annotations as structured data
   * Coordinates are normalized to 0-1 range
   * 
   * @returns Array of annotation objects
   */
  getAnnotations(): Annotation[] {
    const annotations: Annotation[] = [];
    const canvasWidth = this.canvas.width || 1;
    const canvasHeight = this.canvas.height || 1;

    this.canvas.getObjects().forEach((obj, index) => {
      // Skip background image
      if (obj === this.backgroundImage) return;

      const annotation: Annotation = {
        id: `annotation-${index}-${Date.now()}`,
        type: this.getObjectType(obj),
        coordinates: this.normalizeCoordinates(obj, canvasWidth, canvasHeight),
        color: this.getObjectColor(obj),
        timestamp: Date.now(),
      };

      annotations.push(annotation);
    });

    return annotations;
  }

  /**
   * Determine the annotation type from a Fabric object
   */
  private getObjectType(obj: fabric.Object): AnnotationType {
    if (obj instanceof Arrow) return 'arrow';
    if (obj instanceof fabric.Circle) return 'circle';
    if (obj instanceof fabric.Rect) {
      // Distinguish between rectangle and highlight by opacity
      return obj.opacity && obj.opacity < 1 ? 'highlight' : 'rectangle';
    }
    if (obj instanceof fabric.Path) return 'freehand';
    return 'rectangle'; // Default
  }

  /**
   * Get the color of a Fabric object
   */
  private getObjectColor(obj: fabric.Object): string {
    if (obj instanceof Arrow) {
      return obj.arrowColor || '#ff0000';
    }
    return (obj.stroke as string) || (obj.fill as string) || '#ff0000';
  }

  /**
   * Normalize object coordinates to 0-1 range
   */
  private normalizeCoordinates(
    obj: fabric.Object,
    canvasWidth: number,
    canvasHeight: number
  ): Annotation['coordinates'] {
    if (obj instanceof Arrow) {
      return {
        x: (obj.x1 || 0) / canvasWidth,
        y: (obj.y1 || 0) / canvasHeight,
        width: ((obj.x2 || 0) - (obj.x1 || 0)) / canvasWidth,
        height: ((obj.y2 || 0) - (obj.y1 || 0)) / canvasHeight,
      };
    }

    if (obj instanceof fabric.Circle) {
      const left = obj.left || 0;
      const top = obj.top || 0;
      const radius = obj.radius || 0;
      return {
        x: left / canvasWidth,
        y: top / canvasHeight,
        width: (radius * 2) / canvasWidth,
        height: (radius * 2) / canvasHeight,
      };
    }

    if (obj instanceof fabric.Path) {
      // For freehand, extract path points
      const path = obj.path;
      if (path) {
        const points: Point[] = [];
        path.forEach((segment) => {
          if (Array.isArray(segment) && segment.length >= 3) {
            points.push({
              x: segment[1] / canvasWidth,
              y: segment[2] / canvasHeight,
            });
          }
        });
        return {
          x: (obj.left || 0) / canvasWidth,
          y: (obj.top || 0) / canvasHeight,
          points,
        };
      }
    }

    // Default for rectangles and other shapes
    return {
      x: (obj.left || 0) / canvasWidth,
      y: (obj.top || 0) / canvasHeight,
      width: ((obj.width || 0) * (obj.scaleX || 1)) / canvasWidth,
      height: ((obj.height || 0) * (obj.scaleY || 1)) / canvasHeight,
    };
  }

  /**
   * Export canvas as data URL (PNG or JPEG)
   * 
   * @param format - Image format ('png' or 'jpeg')
   * @returns Base64 data URL
   */
  toDataURL(format: 'png' | 'jpeg' = 'png'): string {
    return this.canvas.toDataURL({
      format,
      quality: 0.9,
    });
  }

  /**
   * Export canvas as JSON (Fabric.js format)
   * 
   * @returns Canvas state as JSON object
   */
  toJSON(): object {
    return this.canvas.toJSON();
  }

  /**
   * Clear all annotations (keep background)
   */
  clear(): void {
    const objects = this.canvas.getObjects();
    objects.forEach((obj) => {
      if (obj !== this.backgroundImage) {
        this.canvas.remove(obj);
      }
    });
    this.undoStack = [];
    this.redoStack = [];
    this.canvas.renderAll();
  }

  /**
   * Dispose of the canvas and cleanup resources
   */
  dispose(): void {
    this.canvas.dispose();
    const canvasElement = this.container.querySelector('#annotation-canvas');
    if (canvasElement) {
      this.container.removeChild(canvasElement);
    }
  }

  /**
   * Get the underlying Fabric.js canvas instance
   * Useful for advanced customization
   */
  getCanvas(): fabric.Canvas {
    return this.canvas;
  }

  /**
   * Resize the canvas
   * 
   * @param width - New width in pixels
   * @param height - New height in pixels
   */
  resize(width: number, height: number): void {
    this.canvas.setDimensions({ width, height });
    
    // Rescale background image if present
    if (this.backgroundImage) {
      const imgElement = this.backgroundImage.getElement() as HTMLImageElement;
      const scaleX = width / imgElement.width;
      const scaleY = height / imgElement.height;
      this.backgroundImage.scale(Math.min(scaleX, scaleY));
      this.canvas.renderAll();
    }
  }
}
