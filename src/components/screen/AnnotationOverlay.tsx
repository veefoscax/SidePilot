/**
 * AnnotationOverlay Component
 * 
 * React wrapper for the AnnotationCanvas class.
 * Manages canvas lifecycle, handles resize events, and provides
 * a clean interface for parent components.
 * 
 * Requirements: TR3
 */

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { AnnotationCanvas } from '@/lib/screen-capture/annotation-canvas';
import type { AnnotationType, Annotation } from '@/lib/screen-capture/types';

/**
 * Props for AnnotationOverlay component
 */
interface AnnotationOverlayProps {
  /** Width of the canvas in pixels */
  width: number;
  /** Height of the canvas in pixels */
  height: number;
  /** Background image URL or data URL */
  backgroundImage?: string;
  /** Currently selected annotation tool */
  selectedTool: AnnotationType;
  /** Currently selected color */
  selectedColor: string;
  /** Callback when canvas is ready */
  onReady?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Methods exposed via ref for parent component interaction
 */
export interface AnnotationOverlayHandle {
  /** Get all annotations as structured data */
  getAnnotations: () => Annotation[];
  /** Export canvas as data URL (PNG or JPEG) */
  toDataURL: (format?: 'png' | 'jpeg') => string;
  /** Undo the last annotation */
  undo: () => void;
  /** Redo the last undone annotation */
  redo: () => void;
  /** Check if undo is available */
  canUndo: () => boolean;
  /** Check if redo is available */
  canRedo: () => boolean;
  /** Clear all annotations */
  clear: () => void;
  /** Set the background image */
  setBackground: (image: string) => Promise<void>;
  /** Get the underlying canvas instance */
  getCanvas: () => AnnotationCanvas | null;
}

/**
 * AnnotationOverlay Component
 * 
 * Wraps the AnnotationCanvas class in a React component with proper
 * lifecycle management. Handles:
 * - Canvas initialization and cleanup
 * - Automatic resize on dimension changes
 * - Tool and color synchronization
 * - Imperative methods via ref
 * 
 * Usage:
 * ```tsx
 * const overlayRef = useRef<AnnotationOverlayHandle>(null);
 * 
 * <AnnotationOverlay
 *   ref={overlayRef}
 *   width={800}
 *   height={600}
 *   backgroundImage={screenshotUrl}
 *   selectedTool="arrow"
 *   selectedColor="#ff0000"
 *   onReady={() => console.log('Canvas ready')}
 * />
 * 
 * // Later, export the annotated image
 * const dataUrl = overlayRef.current?.toDataURL('png');
 * const annotations = overlayRef.current?.getAnnotations();
 * ```
 */
export const AnnotationOverlay = forwardRef<AnnotationOverlayHandle, AnnotationOverlayProps>(
  (
    {
      width,
      height,
      backgroundImage,
      selectedTool,
      selectedColor,
      onReady,
      className = '',
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<AnnotationCanvas | null>(null);
    const [isReady, setIsReady] = useState(false);

    /**
     * Initialize the annotation canvas
     */
    useEffect(() => {
      if (!containerRef.current) return;

      // Create the annotation canvas
      const canvas = new AnnotationCanvas(containerRef.current, {
        width,
        height,
        backgroundImage,
      });

      canvasRef.current = canvas;
      setIsReady(true);

      // Notify parent that canvas is ready
      if (onReady) {
        onReady();
      }

      // Cleanup on unmount
      return () => {
        if (canvasRef.current) {
          canvasRef.current.dispose();
          canvasRef.current = null;
        }
        setIsReady(false);
      };
    }, []); // Only run once on mount

    /**
     * Handle canvas resize when dimensions change
     */
    useEffect(() => {
      if (canvasRef.current && isReady) {
        canvasRef.current.resize(width, height);
      }
    }, [width, height, isReady]);

    /**
     * Update background image when it changes
     */
    useEffect(() => {
      if (canvasRef.current && isReady && backgroundImage) {
        canvasRef.current.setBackground(backgroundImage).catch((error) => {
          console.error('Failed to set background image:', error);
        });
      }
    }, [backgroundImage, isReady]);

    /**
     * Sync selected tool with canvas
     */
    useEffect(() => {
      if (canvasRef.current && isReady) {
        canvasRef.current.setTool(selectedTool);
      }
    }, [selectedTool, isReady]);

    /**
     * Sync selected color with canvas
     */
    useEffect(() => {
      if (canvasRef.current && isReady) {
        canvasRef.current.setColor(selectedColor);
      }
    }, [selectedColor, isReady]);

    /**
     * Expose methods to parent component via ref
     */
    useImperativeHandle(
      ref,
      () => ({
        getAnnotations: () => {
          return canvasRef.current?.getAnnotations() || [];
        },
        toDataURL: (format: 'png' | 'jpeg' = 'png') => {
          return canvasRef.current?.toDataURL(format) || '';
        },
        undo: () => {
          canvasRef.current?.undo();
        },
        redo: () => {
          canvasRef.current?.redo();
        },
        canUndo: () => {
          return canvasRef.current?.canUndo() || false;
        },
        canRedo: () => {
          return canvasRef.current?.canRedo() || false;
        },
        clear: () => {
          canvasRef.current?.clear();
        },
        setBackground: async (image: string) => {
          if (canvasRef.current) {
            await canvasRef.current.setBackground(image);
          }
        },
        getCanvas: () => {
          return canvasRef.current;
        },
      }),
      [isReady]
    );

    return (
      <div
        ref={containerRef}
        className={className}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          position: 'relative',
        }}
        data-testid="annotation-overlay"
      />
    );
  }
);

AnnotationOverlay.displayName = 'AnnotationOverlay';
