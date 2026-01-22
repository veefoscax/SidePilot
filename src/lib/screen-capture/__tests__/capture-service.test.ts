/**
 * Screen Capture Service Tests
 * 
 * Tests for screen capture functionality with mocked MediaStream API.
 * Requirements: Task 3 - Service Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ScreenCaptureService } from '../capture-service';
import type { CaptureOptions, CaptureErrorResult } from '../types';

describe('ScreenCaptureService', () => {
  let service: ScreenCaptureService;
  let mockStream: MediaStream;
  let mockVideoTrack: MediaStreamTrack;

  beforeEach(() => {
    service = new ScreenCaptureService();

    // Mock MediaStreamTrack
    mockVideoTrack = {
      kind: 'video',
      id: 'mock-track-id',
      label: 'Mock Video Track',
      enabled: true,
      muted: false,
      readyState: 'live',
      stop: vi.fn(),
      getSettings: vi.fn(() => ({
        displaySurface: 'monitor',
        frameRate: 30,
        width: 1920,
        height: 1080,
      })),
      onended: null,
    } as unknown as MediaStreamTrack;

    // Mock MediaStream
    mockStream = {
      id: 'mock-stream-id',
      active: true,
      getVideoTracks: vi.fn(() => [mockVideoTrack]),
      getTracks: vi.fn(() => [mockVideoTrack]),
    } as unknown as MediaStream;

    // Mock getDisplayMedia
    global.navigator.mediaDevices = {
      getDisplayMedia: vi.fn(() => Promise.resolve(mockStream)),
    } as unknown as MediaDevices;

    // Mock document.createElement for video element
    // Auto-trigger onloadedmetadata when srcObject is set
    const mockVideoElement = {
      srcObject: null,
      autoplay: false,
      muted: false,
      onloadedmetadata: null,
      onerror: null,
      remove: vi.fn(),
    } as unknown as HTMLVideoElement;

    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'video') {
        // Auto-trigger onloadedmetadata after a microtask
        setTimeout(() => {
          if (mockVideoElement.onloadedmetadata) {
            mockVideoElement.onloadedmetadata(new Event('loadedmetadata'));
          }
        }, 0);
        return mockVideoElement;
      }
      return document.createElement(tagName);
    });

    // Mock createImageBitmap
    global.createImageBitmap = vi.fn(() => 
      Promise.resolve({
        width: 1920,
        height: 1080,
        close: vi.fn(),
      } as ImageBitmap)
    );
  });

  afterEach(() => {
    service.stopCapture();
    vi.clearAllMocks();
  });

  describe('requestCapture', () => {
    it('should successfully capture screen with default options', async () => {
      const options: CaptureOptions = { type: 'screen' };
      
      const result = await service.requestCapture(options);

      expect(result).toBeDefined();
      expect(result.stream).toBe(mockStream);
      expect(result.displaySurface).toBe('monitor');
      expect(result.frameRate).toBe(30);
      expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({
            displaySurface: 'monitor',
          }),
          audio: false,
        })
      );
    });

    it('should capture window when type is window', async () => {
      const options: CaptureOptions = { type: 'window' };
      
      await service.requestCapture(options);

      expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({
            displaySurface: 'window',
          }),
        })
      );
    });

    it('should capture tab when type is tab', async () => {
      const options: CaptureOptions = { type: 'tab' };
      
      await service.requestCapture(options);

      expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({
            displaySurface: 'browser',
          }),
        })
      );
    });

    it('should include audio when requested', async () => {
      const options: CaptureOptions = { type: 'screen', audio: true };
      
      await service.requestCapture(options);

      expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          audio: true,
        })
      );
    });

    it('should apply resolution constraints', async () => {
      const options: CaptureOptions = {
        type: 'screen',
        resolution: { width: 1280, height: 720 },
      };
      
      await service.requestCapture(options);

      expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({
            width: { ideal: 1280 },
            height: { ideal: 720 },
          }),
        })
      );
    });

    it('should throw permission-denied error when user denies', async () => {
      const permissionError = new Error('Permission denied');
      permissionError.name = 'NotAllowedError';
      
      vi.mocked(navigator.mediaDevices.getDisplayMedia).mockRejectedValueOnce(
        permissionError
      );

      const options: CaptureOptions = { type: 'screen' };

      await expect(service.requestCapture(options)).rejects.toMatchObject({
        error: 'permission-denied',
        message: 'User denied screen capture permission',
      } as CaptureErrorResult);
    });

    it('should throw not-supported error when API unavailable', async () => {
      // Create a new service instance to avoid state issues
      const testService = new ScreenCaptureService();
      
      // Save original
      const originalMediaDevices = global.navigator.mediaDevices;
      
      // Remove getDisplayMedia
      Object.defineProperty(global.navigator, 'mediaDevices', {
        value: undefined,
        configurable: true,
        writable: true,
      });

      const options: CaptureOptions = { type: 'screen' };

      await expect(testService.requestCapture(options)).rejects.toMatchObject({
        error: 'not-supported',
        message: 'Screen capture is not supported in this browser',
      } as CaptureErrorResult);

      // Restore
      Object.defineProperty(global.navigator, 'mediaDevices', {
        value: originalMediaDevices,
        configurable: true,
        writable: true,
      });
    });

    it('should throw capture-failed error on generic failure', async () => {
      vi.mocked(navigator.mediaDevices.getDisplayMedia).mockRejectedValueOnce(
        new Error('Generic error')
      );

      const options: CaptureOptions = { type: 'screen' };

      await expect(service.requestCapture(options)).rejects.toMatchObject({
        error: 'capture-failed',
        message: 'Failed to capture screen',
      } as CaptureErrorResult);
    });
  });

  describe('captureFrame', () => {
    it('should capture frame from active stream', async () => {
      // Start capture first
      await service.requestCapture({ type: 'screen' });

      const frame = await service.captureFrame();

      expect(frame).toBeDefined();
      expect(frame.width).toBe(1920);
      expect(frame.height).toBe(1080);
      expect(createImageBitmap).toHaveBeenCalled();
    });

    it('should throw error when no active capture', async () => {
      await expect(service.captureFrame()).rejects.toThrow(
        'No active capture. Call requestCapture() first.'
      );
    });

    it('should throw error when stream has ended', async () => {
      await service.requestCapture({ type: 'screen' });

      // Simulate stream ending
      mockVideoTrack.readyState = 'ended';

      await expect(service.captureFrame()).rejects.toMatchObject({
        error: 'stream-ended',
        message: 'Capture stream has ended',
      } as CaptureErrorResult);
    });

    it('should throw error when frame capture fails', async () => {
      await service.requestCapture({ type: 'screen' });

      // Mock createImageBitmap to fail
      vi.mocked(createImageBitmap).mockRejectedValueOnce(
        new Error('Bitmap creation failed')
      );

      await expect(service.captureFrame()).rejects.toMatchObject({
        error: 'capture-failed',
        message: 'Failed to capture frame',
      } as CaptureErrorResult);
    });
  });

  describe('stopCapture', () => {
    it('should stop all tracks and clean up', async () => {
      await service.requestCapture({ type: 'screen' });

      service.stopCapture();

      expect(mockVideoTrack.stop).toHaveBeenCalled();
      expect(service.isCapturing()).toBe(false);
    });

    it('should be safe to call multiple times', () => {
      expect(() => {
        service.stopCapture();
        service.stopCapture();
        service.stopCapture();
      }).not.toThrow();
    });

    it('should clean up video element', async () => {
      await service.requestCapture({ type: 'screen' });
      const videoElement = document.createElement('video');

      service.stopCapture();

      expect(videoElement.remove).toHaveBeenCalled();
    });
  });

  describe('isCapturing', () => {
    it('should return false initially', () => {
      expect(service.isCapturing()).toBe(false);
    });

    it('should return true after successful capture', async () => {
      await service.requestCapture({ type: 'screen' });

      expect(service.isCapturing()).toBe(true);
    });

    it('should return false after stopping', async () => {
      await service.requestCapture({ type: 'screen' });
      service.stopCapture();

      expect(service.isCapturing()).toBe(false);
    });

    it('should return false when track is not live', async () => {
      await service.requestCapture({ type: 'screen' });
      mockVideoTrack.readyState = 'ended';

      expect(service.isCapturing()).toBe(false);
    });
  });

  describe('getStreamSettings', () => {
    it('should return null when no active capture', () => {
      expect(service.getStreamSettings()).toBeNull();
    });

    it('should return stream settings when capturing', async () => {
      await service.requestCapture({ type: 'screen' });

      const settings = service.getStreamSettings();

      expect(settings).toBeDefined();
      expect(settings?.displaySurface).toBe('monitor');
      expect(settings?.frameRate).toBe(30);
      expect(settings?.width).toBe(1920);
      expect(settings?.height).toBe(1080);
    });
  });

  describe('stream ended handling', () => {
    it('should clean up when user stops sharing', async () => {
      await service.requestCapture({ type: 'screen' });

      // Simulate user stopping share
      if (mockVideoTrack.onended) {
        mockVideoTrack.onended(new Event('ended'));
      }

      expect(service.isCapturing()).toBe(false);
    });
  });
});
