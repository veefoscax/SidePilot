/**
 * Type definition tests for screen capture module
 * 
 * These tests verify that the type definitions are correctly structured
 * and can be used as expected.
 */

import { describe, it, expect } from 'vitest';
import type {
  CaptureType,
  CaptureOptions,
  CaptureResult,
  AnnotationType,
  Point,
  AnnotationCoordinates,
  Annotation,
  AnnotationCanvasOptions,
  AnnotatedScreenshot,
  LiveCaptureConfig,
  LiveFrame,
  CaptureError,
  CaptureErrorResult,
} from '../types';

describe('Screen Capture Types', () => {
  describe('CaptureOptions', () => {
    it('should accept valid capture options', () => {
      const options: CaptureOptions = {
        type: 'screen',
        audio: false,
        resolution: {
          width: 1920,
          height: 1080,
        },
      };

      expect(options.type).toBe('screen');
      expect(options.audio).toBe(false);
      expect(options.resolution?.width).toBe(1920);
    });

    it('should accept minimal capture options', () => {
      const options: CaptureOptions = {
        type: 'tab',
      };

      expect(options.type).toBe('tab');
      expect(options.audio).toBeUndefined();
    });

    it('should accept all capture types', () => {
      const types: CaptureType[] = ['screen', 'window', 'tab'];
      
      types.forEach(type => {
        const options: CaptureOptions = { type };
        expect(options.type).toBe(type);
      });
    });
  });

  describe('Annotation', () => {
    it('should accept valid annotation with all properties', () => {
      const annotation: Annotation = {
        id: 'anno-1',
        type: 'arrow',
        coordinates: {
          x: 0.2,
          y: 0.3,
          width: 0.1,
          height: 0.1,
        },
        color: '#ff0000',
        label: 'Click here',
        timestamp: Date.now(),
      };

      expect(annotation.id).toBe('anno-1');
      expect(annotation.type).toBe('arrow');
      expect(annotation.color).toBe('#ff0000');
    });

    it('should accept annotation without optional properties', () => {
      const annotation: Annotation = {
        id: 'anno-2',
        type: 'circle',
        coordinates: {
          x: 0.5,
          y: 0.5,
        },
        color: '#00ff00',
        timestamp: Date.now(),
      };

      expect(annotation.label).toBeUndefined();
      expect(annotation.coordinates.width).toBeUndefined();
    });

    it('should accept all annotation types', () => {
      const types: AnnotationType[] = ['arrow', 'circle', 'rectangle', 'freehand', 'highlight'];
      
      types.forEach(type => {
        const annotation: Annotation = {
          id: `anno-${type}`,
          type,
          coordinates: { x: 0, y: 0 },
          color: '#000000',
          timestamp: Date.now(),
        };
        expect(annotation.type).toBe(type);
      });
    });

    it('should accept freehand annotation with points', () => {
      const points: Point[] = [
        { x: 0.1, y: 0.1 },
        { x: 0.2, y: 0.15 },
        { x: 0.3, y: 0.2 },
      ];

      const annotation: Annotation = {
        id: 'freehand-1',
        type: 'freehand',
        coordinates: {
          x: 0.1,
          y: 0.1,
          points,
        },
        color: '#0000ff',
        timestamp: Date.now(),
      };

      expect(annotation.coordinates.points).toHaveLength(3);
      expect(annotation.coordinates.points?.[0].x).toBe(0.1);
    });
  });

  describe('AnnotatedScreenshot', () => {
    it('should accept valid annotated screenshot', () => {
      const screenshot: AnnotatedScreenshot = {
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        annotations: [
          {
            id: 'anno-1',
            type: 'arrow',
            coordinates: { x: 0.5, y: 0.5, width: 0.1, height: 0.1 },
            color: '#ff0000',
            timestamp: Date.now(),
          },
        ],
        dimensions: {
          width: 1920,
          height: 1080,
        },
        timestamp: Date.now(),
      };

      expect(screenshot.image).toContain('data:image/png');
      expect(screenshot.annotations).toHaveLength(1);
      expect(screenshot.dimensions.width).toBe(1920);
    });

    it('should accept screenshot with no annotations', () => {
      const screenshot: AnnotatedScreenshot = {
        image: 'data:image/png;base64,test',
        annotations: [],
        dimensions: {
          width: 1280,
          height: 720,
        },
        timestamp: Date.now(),
      };

      expect(screenshot.annotations).toHaveLength(0);
    });
  });

  describe('LiveCaptureConfig', () => {
    it('should accept valid live capture config', () => {
      const config: LiveCaptureConfig = {
        enabled: true,
        frameRate: 3,
        deltaDetection: true,
        pointerTracking: true,
      };

      expect(config.enabled).toBe(true);
      expect(config.frameRate).toBe(3);
      expect(config.deltaDetection).toBe(true);
    });

    it('should accept disabled live capture config', () => {
      const config: LiveCaptureConfig = {
        enabled: false,
        frameRate: 1,
        deltaDetection: false,
        pointerTracking: false,
      };

      expect(config.enabled).toBe(false);
    });
  });

  describe('LiveFrame', () => {
    it('should accept live frame with all properties', () => {
      const frame: LiveFrame = {
        frame: 'data:image/png;base64,test',
        pointer: { x: 0.5, y: 0.5 },
        timestamp: Date.now(),
        deltaScore: 0.95,
      };

      expect(frame.frame).toContain('data:image/png');
      expect(frame.pointer?.x).toBe(0.5);
      expect(frame.deltaScore).toBe(0.95);
    });

    it('should accept live frame without optional properties', () => {
      const frame: LiveFrame = {
        frame: 'data:image/png;base64,test',
        timestamp: Date.now(),
      };

      expect(frame.pointer).toBeUndefined();
      expect(frame.deltaScore).toBeUndefined();
    });
  });

  describe('CaptureErrorResult', () => {
    it('should accept all error types', () => {
      const errorTypes: CaptureError[] = [
        'permission-denied',
        'not-supported',
        'capture-failed',
        'stream-ended',
        'unknown',
      ];

      errorTypes.forEach(error => {
        const result: CaptureErrorResult = {
          error,
          message: `Error: ${error}`,
        };
        expect(result.error).toBe(error);
      });
    });

    it('should accept error with details', () => {
      const result: CaptureErrorResult = {
        error: 'capture-failed',
        message: 'Failed to capture screen',
        details: { code: 'ERR_CAPTURE', stack: 'Error stack trace' },
      };

      expect(result.details).toBeDefined();
      expect((result.details as any).code).toBe('ERR_CAPTURE');
    });
  });

  describe('AnnotationCanvasOptions', () => {
    it('should accept canvas options with background', () => {
      const options: AnnotationCanvasOptions = {
        width: 1920,
        height: 1080,
        backgroundImage: 'data:image/png;base64,test',
      };

      expect(options.width).toBe(1920);
      expect(options.backgroundImage).toContain('data:image/png');
    });

    it('should accept canvas options without background', () => {
      const options: AnnotationCanvasOptions = {
        width: 800,
        height: 600,
      };

      expect(options.backgroundImage).toBeUndefined();
    });
  });

  describe('Coordinate Normalization', () => {
    it('should accept normalized coordinates (0-1 range)', () => {
      const coords: AnnotationCoordinates = {
        x: 0.25,
        y: 0.5,
        width: 0.1,
        height: 0.15,
      };

      expect(coords.x).toBeGreaterThanOrEqual(0);
      expect(coords.x).toBeLessThanOrEqual(1);
      expect(coords.y).toBeGreaterThanOrEqual(0);
      expect(coords.y).toBeLessThanOrEqual(1);
    });

    it('should accept edge coordinates', () => {
      const coords: AnnotationCoordinates = {
        x: 0,
        y: 0,
        width: 1,
        height: 1,
      };

      expect(coords.x).toBe(0);
      expect(coords.y).toBe(0);
      expect(coords.width).toBe(1);
      expect(coords.height).toBe(1);
    });
  });
});
