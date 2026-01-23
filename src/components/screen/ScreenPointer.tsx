/**
 * ScreenPointer Component
 * 
 * Main orchestrator for screen capture and annotation workflow.
 * Provides fullscreen overlay with capture flow, annotation tools,
 * and export functionality.
 * 
 * Requirements: AC4.1, AC4.4
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { ScreenCaptureService } from '@/lib/screen-capture/capture-service';
import { ToolPalette } from './ToolPalette';
import { AnnotationOverlay, type AnnotationOverlayHandle } from './AnnotationOverlay';
import type { AnnotationType, Annotation, AnnotatedScreenshot } from '@/lib/screen-capture/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, Loading01Icon } from '@hugeicons/core-free-icons';

/**
 * Props for ScreenPointer component
 */
interface ScreenPointerProps {
  /** Callback when user completes annotation and sends to AI */
  onCapture: (result: AnnotatedScreenshot) => void;
  /** Callback when user cancels the capture flow */
  onCancel: () => void;
  /** Optional initial capture type (default: 'screen') */
  initialCaptureType?: 'screen' | 'window' | 'tab';
}

/**
 * Capture flow states
 */
type CaptureState = 
  | 'requesting'    // Requesting screen capture permission
  | 'capturing'     // Capturing frame from stream
  | 'annotating'    // User is annotating the screenshot
  | 'exporting'     // Exporting annotated result
  | 'error';        // Error occurred

/**
 * ScreenPointer Component
 * 
 * Orchestrates the complete screen capture and annotation workflow:
 * 1. Request screen capture permission (getDisplayMedia)
 * 2. Capture a single frame from the stream
 * 3. Display frame in annotation canvas
 * 4. Allow user to draw annotations
 * 5. Export annotated image + coordinates
 * 6. Send to AI or cancel
 * 
 * Features:
 * - Fullscreen overlay mode
 * - Tool palette for annotation selection
 * - Color picker
 * - Undo/redo support
 * - Clear all annotations
 * - Export as PNG with normalized coordinates
 * 
 * Usage:
 * ```tsx
 * <ScreenPointer
 *   onCapture={(result) => {
 *     // result.image: base64 PNG data URL
 *     // result.annotations: array of annotation coordinates
 *     sendToAI(result);
 *   }}
 *   onCancel={() => closeOverlay()}
 * />
 * ```
 */
export function ScreenPointer({
  onCapture,
  onCancel,
  initialCaptureType = 'screen',
}: ScreenPointerProps) {
  // State management
  const [state, setState] = useState<CaptureState>('requesting');
  const [error, setError] = useState<string | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [selectedTool, setSelectedTool] = useState<AnnotationType>('arrow');
  const [selectedColor, setSelectedColor] = useState('#ff0000');

  // Refs
  const captureServiceRef = useRef<ScreenCaptureService>(new ScreenCaptureService());
  const overlayRef = useRef<AnnotationOverlayHandle>(null);

  /**
   * Initialize capture flow on mount
   */
  useEffect(() => {
    startCaptureFlow();

    // Cleanup on unmount
    return () => {
      captureServiceRef.current.stopCapture();
    };
  }, []);

  /**
   * Start the screen capture flow
   * 
   * 1. Request capture permission
   * 2. Capture single frame
   * 3. Stop stream
   * 4. Display in annotation canvas
   */
  const startCaptureFlow = async () => {
    try {
      setState('requesting');
      setError(null);

      // Step 1: Request capture permission
      const result = await captureServiceRef.current.requestCapture({
        type: initialCaptureType,
        audio: false,
      });

      // Step 2: Capture a single frame
      setState('capturing');
      const frame = await captureServiceRef.current.captureFrame();

      // Step 3: Stop the stream (we only need one frame)
      captureServiceRef.current.stopCapture();

      // Step 4: Convert frame to data URL
      const canvas = document.createElement('canvas');
      canvas.width = frame.width;
      canvas.height = frame.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      ctx.drawImage(frame, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');

      // Update state with screenshot
      setScreenshot(dataUrl);
      setCanvasSize({
        width: frame.width,
        height: frame.height,
      });

      // Move to annotation state
      setState('annotating');
    } catch (err: any) {
      console.error('Screen capture failed:', err);
      
      // Handle specific error types
      let errorMessage = 'Failed to capture screen';
      
      if (err.error === 'permission-denied') {
        errorMessage = 'Screen capture permission was denied. Please try again and allow access.';
      } else if (err.error === 'not-supported') {
        errorMessage = 'Screen capture is not supported in this browser.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setState('error');
    }
  };

  /**
   * Handle "Send to AI" button click
   * 
   * Exports the annotated screenshot and calls onCapture callback
   */
  const handleDone = useCallback(async () => {
    if (!overlayRef.current) {
      console.error('Annotation overlay not ready');
      return;
    }

    try {
      setState('exporting');

      // Get annotations with normalized coordinates
      const annotations = overlayRef.current.getAnnotations();

      // Export annotated image as data URL (AC4.1, AC4.2)
      // toDataURL automatically resizes to max 1920x1080
      const imageDataUrl = overlayRef.current.toDataURL('png');

      // Create result object (AC4.3, AC4.4)
      const result: AnnotatedScreenshot = {
        image: imageDataUrl,
        annotations,
        dimensions: canvasSize,
        timestamp: Date.now(),
      };

      // Call parent callback
      onCapture(result);
    } catch (err) {
      console.error('Failed to export annotated screenshot:', err);
      setError('Failed to export screenshot. Please try again.');
      setState('annotating');
    }
  }, [onCapture, canvasSize]);

  /**
   * Handle "Cancel" button click
   */
  const handleCancel = useCallback(() => {
    captureServiceRef.current.stopCapture();
    onCancel();
  }, [onCancel]);

  /**
   * Handle undo action
   */
  const handleUndo = useCallback(() => {
    overlayRef.current?.undo();
  }, []);

  /**
   * Handle redo action
   */
  const handleRedo = useCallback(() => {
    overlayRef.current?.redo();
  }, []);

  /**
   * Handle clear all annotations
   */
  const handleClear = useCallback(() => {
    overlayRef.current?.clear();
  }, []);

  /**
   * Check if undo is available
   */
  const canUndo = overlayRef.current?.canUndo() ?? false;

  /**
   * Check if redo is available
   */
  const canRedo = overlayRef.current?.canRedo() ?? false;

  /**
   * Calculate optimal canvas size for viewport
   * Maintains aspect ratio while fitting in viewport
   */
  const getOptimalCanvasSize = () => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight - 100; // Leave space for toolbar

    const scaleX = viewportWidth / canvasSize.width;
    const scaleY = viewportHeight / canvasSize.height;
    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up

    return {
      width: Math.floor(canvasSize.width * scale),
      height: Math.floor(canvasSize.height * scale),
    };
  };

  const displaySize = state === 'annotating' ? getOptimalCanvasSize() : canvasSize;

  /**
   * Render loading state
   */
  if (state === 'requesting' || state === 'capturing') {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center space-y-4">
          <HugeiconsIcon 
            icon={Loading01Icon} 
            className="h-12 w-12 animate-spin text-primary mx-auto" 
          />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">
              {state === 'requesting' ? 'Requesting Screen Capture' : 'Capturing Screen'}
            </h2>
            <p className="text-muted-foreground">
              {state === 'requesting' 
                ? 'Please select a screen, window, or tab to capture...'
                : 'Capturing your screen...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render error state
   */
  if (state === 'error') {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <HugeiconsIcon icon={Alert02Icon} className="h-4 w-4" />
            <AlertDescription className="ml-2">
              {error || 'An error occurred during screen capture'}
            </AlertDescription>
          </Alert>
          <div className="flex justify-center gap-2">
            <button
              onClick={startCaptureFlow}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Try Again
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render exporting state
   */
  if (state === 'exporting') {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center space-y-4">
          <HugeiconsIcon 
            icon={Loading01Icon} 
            className="h-12 w-12 animate-spin text-primary mx-auto" 
          />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Exporting Screenshot</h2>
            <p className="text-muted-foreground">
              Preparing your annotated screenshot...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render annotation state (main UI)
   */
  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
      {/* Tool Palette */}
      <ToolPalette
        selectedTool={selectedTool}
        onToolChange={setSelectedTool}
        selectedColor={selectedColor}
        onColorChange={setSelectedColor}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onClear={handleClear}
        onDone={handleDone}
        onCancel={handleCancel}
      />

      {/* Annotation Canvas */}
      <div className="flex items-center justify-center h-full p-4">
        {screenshot && (
          <div className="relative shadow-2xl rounded-lg overflow-hidden">
            <AnnotationOverlay
              ref={overlayRef}
              width={displaySize.width}
              height={displaySize.height}
              backgroundImage={screenshot}
              selectedTool={selectedTool}
              selectedColor={selectedColor}
              className="border border-border"
            />
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg px-4 py-2">
        <p className="text-sm text-muted-foreground text-center">
          Draw annotations to guide the AI. Click <strong>Send to AI</strong> when ready.
        </p>
      </div>
    </div>
  );
}
