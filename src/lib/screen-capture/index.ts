/**
 * Screen Capture & Annotation Module
 * 
 * Exports types and utilities for screen capture with annotation support.
 */

export type {
  // Capture types
  CaptureType,
  CaptureOptions,
  CaptureResult,
  CaptureError,
  CaptureErrorResult,
  
  // Annotation types
  AnnotationType,
  Point,
  AnnotationCoordinates,
  Annotation,
  AnnotationCanvasOptions,
  AnnotatedScreenshot,
  
  // Live mode types
  LiveCaptureConfig,
  LiveFrame,
} from './types';

// Services
export { ScreenCaptureService, screenCaptureService } from './capture-service';
