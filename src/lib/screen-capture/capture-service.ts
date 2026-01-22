/**
 * Screen Capture Service
 * 
 * Handles screen/window/tab capture using getDisplayMedia API.
 * Provides methods to request capture, extract frames, and manage streams.
 * 
 * Requirements: AC1.1, AC1.2, AC1.3, TR1
 */

import type {
  CaptureOptions,
  CaptureResult,
  CaptureError,
  CaptureErrorResult,
} from './types';

/**
 * Service for capturing screen content using getDisplayMedia API
 * 
 * Usage:
 * ```typescript
 * const service = new ScreenCaptureService();
 * const result = await service.requestCapture({ type: 'screen' });
 * const frame = await service.captureFrame();
 * service.stopCapture();
 * ```
 */
export class ScreenCaptureService {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;

  /**
   * Request screen capture permission and start capture
   * 
   * Opens browser's native picker for screen/window/tab selection.
   * User must explicitly grant permission.
   * 
   * @param options - Capture configuration
   * @returns Promise with MediaStream and metadata
   * @throws CaptureErrorResult if permission denied or capture fails
   * 
   * Requirements: AC1.1, AC1.2, TR1
   */
  async requestCapture(options: CaptureOptions): Promise<CaptureResult> {
    // Check if getDisplayMedia is supported (before try-catch)
    if (!navigator.mediaDevices?.getDisplayMedia) {
      throw this.createError(
        'not-supported',
        'Screen capture is not supported in this browser'
      );
    }

    try {
      // Build constraints based on options
      const constraints: DisplayMediaStreamOptions = {
        video: {
          displaySurface: options.type === 'tab' ? 'browser' : 
                         options.type === 'window' ? 'window' : 
                         'monitor',
          ...(options.resolution && {
            width: { ideal: options.resolution.width },
            height: { ideal: options.resolution.height },
          }),
        },
        audio: options.audio ?? false,
      };

      // Request capture - this triggers browser's permission dialog
      this.stream = await navigator.mediaDevices.getDisplayMedia(constraints);

      // Extract metadata from stream
      const videoTrack = this.stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();

      // Set up video element for frame extraction
      this.videoElement = document.createElement('video');
      this.videoElement.srcObject = this.stream;
      this.videoElement.autoplay = true;
      this.videoElement.muted = true;

      // Wait for video to be ready
      await new Promise<void>((resolve, reject) => {
        if (!this.videoElement) {
          reject(new Error('Video element not initialized'));
          return;
        }

        this.videoElement.onloadedmetadata = () => resolve();
        this.videoElement.onerror = () => reject(new Error('Video load failed'));

        // Timeout after 5 seconds
        setTimeout(() => reject(new Error('Video load timeout')), 5000);
      });

      // Listen for stream end (user stops sharing)
      videoTrack.onended = () => {
        this.handleStreamEnded();
      };

      return {
        stream: this.stream,
        displaySurface: settings.displaySurface || 'unknown',
        frameRate: settings.frameRate || 30,
      };
    } catch (error) {
      // Handle specific error types
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          throw this.createError(
            'permission-denied',
            'User denied screen capture permission',
            error
          );
        }
        if (error.name === 'NotSupportedError') {
          throw this.createError(
            'not-supported',
            'Screen capture is not supported',
            error
          );
        }
      }

      // Generic capture failure
      throw this.createError(
        'capture-failed',
        'Failed to capture screen',
        error
      );
    }
  }

  /**
   * Capture a single frame from the active stream
   * 
   * Extracts current video frame as ImageBitmap for efficient processing.
   * Stream must be active (call requestCapture first).
   * 
   * @returns Promise with ImageBitmap of current frame
   * @throws Error if no active capture
   * 
   * Requirements: AC1.3
   */
  async captureFrame(): Promise<ImageBitmap> {
    if (!this.videoElement || !this.stream) {
      throw new Error('No active capture. Call requestCapture() first.');
    }

    // Check if stream is still active
    const videoTrack = this.stream.getVideoTracks()[0];
    if (!videoTrack || videoTrack.readyState !== 'live') {
      throw this.createError(
        'stream-ended',
        'Capture stream has ended'
      );
    }

    try {
      // Create ImageBitmap from current video frame
      // This is more efficient than canvas.drawImage for large images
      const bitmap = await createImageBitmap(this.videoElement);
      return bitmap;
    } catch (error) {
      throw this.createError(
        'capture-failed',
        'Failed to capture frame',
        error
      );
    }
  }

  /**
   * Stop the active capture and clean up resources
   * 
   * Stops all tracks in the MediaStream and removes video element.
   * Safe to call multiple times.
   * 
   * Requirements: AC1.3
   */
  stopCapture(): void {
    // Stop all tracks in the stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
      });
      this.stream = null;
    }

    // Clean up video element
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement.remove();
      this.videoElement = null;
    }
  }

  /**
   * Check if capture is currently active
   * 
   * @returns true if stream is active and ready for frame capture
   */
  isCapturing(): boolean {
    if (!this.stream) {
      return false;
    }

    const videoTrack = this.stream.getVideoTracks()[0];
    return videoTrack?.readyState === 'live';
  }

  /**
   * Get current stream metadata
   * 
   * @returns Stream settings or null if no active capture
   */
  getStreamSettings(): MediaTrackSettings | null {
    if (!this.stream) {
      return null;
    }

    const videoTrack = this.stream.getVideoTracks()[0];
    return videoTrack?.getSettings() || null;
  }

  /**
   * Handle stream ended event (user stopped sharing)
   * 
   * @private
   */
  private handleStreamEnded(): void {
    // Clean up resources when user stops sharing
    this.stopCapture();

    // Could emit event here for UI to react
    // For now, just clean up silently
  }

  /**
   * Create a standardized error result
   * 
   * @private
   */
  private createError(
    error: CaptureError,
    message: string,
    details?: unknown
  ): CaptureErrorResult {
    return {
      error,
      message,
      details,
    };
  }
}

/**
 * Singleton instance for convenience
 * 
 * Usage:
 * ```typescript
 * import { screenCaptureService } from './capture-service';
 * await screenCaptureService.requestCapture({ type: 'screen' });
 * ```
 */
export const screenCaptureService = new ScreenCaptureService();
