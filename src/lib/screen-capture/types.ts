/**
 * Screen Capture & Annotation Types
 * 
 * Type definitions for S19: Screen Pointer & Annotation feature.
 * Supports screen capture, annotation drawing, and coordinate export.
 */

/**
 * Type of screen capture to perform
 */
export type CaptureType = 'screen' | 'window' | 'tab';

/**
 * Options for screen capture request
 * 
 * @property type - Type of capture (screen/window/tab)
 * @property audio - Whether to capture audio (default: false)
 * @property resolution - Preferred resolution constraints
 */
export interface CaptureOptions {
  type: CaptureType;
  audio?: boolean;
  resolution?: {
    width: number;
    height: number;
  };
}

/**
 * Result from a successful screen capture
 * 
 * @property stream - MediaStream from getDisplayMedia
 * @property displaySurface - Type of surface captured (monitor/window/browser)
 * @property frameRate - Actual frame rate of the stream
 */
export interface CaptureResult {
  stream: MediaStream;
  displaySurface: string;
  frameRate: number;
}

/**
 * Type of annotation that can be drawn
 */
export type AnnotationType = 'arrow' | 'circle' | 'rectangle' | 'freehand' | 'highlight';

/**
 * Coordinate point in normalized space (0-1 range)
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Coordinates for different annotation types
 * 
 * For arrow: x, y = start point; width, height = end point offset
 * For circle/rectangle: x, y = top-left; width, height = dimensions
 * For freehand: points array contains path
 * For highlight: x, y = top-left; width, height = dimensions
 */
export interface AnnotationCoordinates {
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: Point[];
}

/**
 * Single annotation drawn on the canvas
 * 
 * Coordinates are normalized to 0-1 range relative to image dimensions.
 * This allows annotations to scale with different image sizes.
 * 
 * @property id - Unique identifier for the annotation
 * @property type - Type of annotation shape
 * @property coordinates - Position and dimensions (normalized 0-1)
 * @property color - Hex color code (e.g., "#ff0000")
 * @property label - Optional text label for the annotation
 * @property timestamp - When the annotation was created (ms since epoch)
 */
export interface Annotation {
  id: string;
  type: AnnotationType;
  coordinates: AnnotationCoordinates;
  color: string;
  label?: string;
  timestamp: number;
}

/**
 * Options for initializing the annotation canvas
 * 
 * @property width - Canvas width in pixels
 * @property height - Canvas height in pixels
 * @property backgroundImage - Optional background image URL or data URL
 */
export interface AnnotationCanvasOptions {
  width: number;
  height: number;
  backgroundImage?: string;
}

/**
 * Complete annotated screenshot ready for export
 * 
 * This is the final output that gets sent to the AI or saved.
 * 
 * @property image - Base64-encoded PNG data URL
 * @property annotations - Array of annotation metadata with coordinates
 * @property dimensions - Original image dimensions
 * @property timestamp - When the screenshot was captured
 */
export interface AnnotatedScreenshot {
  image: string; // Base64 data URL
  annotations: Annotation[];
  dimensions: {
    width: number;
    height: number;
  };
  timestamp: number;
}

/**
 * Configuration for live capture mode (advanced feature)
 * 
 * @property enabled - Whether live mode is active
 * @property frameRate - Frames per second (1-5 recommended)
 * @property deltaDetection - Only send frames when changes detected
 * @property pointerTracking - Track and send cursor position
 */
export interface LiveCaptureConfig {
  enabled: boolean;
  frameRate: number; // 1-5 fps
  deltaDetection: boolean;
  pointerTracking: boolean;
}

/**
 * Live frame data sent to AI during continuous capture
 * 
 * @property frame - Current frame as base64 data URL
 * @property pointer - Current cursor position (normalized 0-1)
 * @property timestamp - Frame capture time
 * @property deltaScore - Similarity to previous frame (0-1, 1 = identical)
 */
export interface LiveFrame {
  frame: string;
  pointer?: Point;
  timestamp: number;
  deltaScore?: number;
}

/**
 * Error types that can occur during screen capture
 */
export type CaptureError = 
  | 'permission-denied'
  | 'not-supported'
  | 'capture-failed'
  | 'stream-ended'
  | 'unknown';

/**
 * Error result from failed capture attempt
 * 
 * @property error - Type of error that occurred
 * @property message - Human-readable error message
 * @property details - Additional error details
 */
export interface CaptureErrorResult {
  error: CaptureError;
  message: string;
  details?: unknown;
}
