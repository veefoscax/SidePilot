/**
 * ScreenPointer Component Tests
 * 
 * Tests for the main screen capture and annotation orchestrator component.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScreenPointer } from '../ScreenPointer';
import { ScreenCaptureService } from '@/lib/screen-capture/capture-service';
import type { CaptureResult } from '@/lib/screen-capture/types';

// Mock the capture service
vi.mock('@/lib/screen-capture/capture-service', () => {
  const mockCaptureService = {
    requestCapture: vi.fn(),
    captureFrame: vi.fn(),
    stopCapture: vi.fn(),
    isCapturing: vi.fn().mockReturnValue(false),
  };
  
  return {
    ScreenCaptureService: vi.fn(function() {
      return mockCaptureService;
    }),
    screenCaptureService: mockCaptureService,
  };
});

// Mock the child components
vi.mock('../ToolPalette', () => ({
  ToolPalette: ({ onDone, onCancel }: any) => (
    <div data-testid="tool-palette">
      <button onClick={onDone}>Send to AI</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

vi.mock('../AnnotationOverlay', () => ({
  AnnotationOverlay: vi.fn().mockImplementation(({ backgroundImage }: any) => (
    <div data-testid="annotation-overlay">
      {backgroundImage && <img src={backgroundImage} alt="screenshot" />}
    </div>
  )),
}));

describe('ScreenPointer', () => {
  let mockOnCapture: ReturnType<typeof vi.fn>;
  let mockOnCancel: ReturnType<typeof vi.fn>;
  let mockCaptureService: any;

  beforeEach(async () => {
    // Reset mocks
    mockOnCapture = vi.fn();
    mockOnCancel = vi.fn();

    // Get the mocked service from the module
    const module = await import('@/lib/screen-capture/capture-service');
    mockCaptureService = (module.ScreenCaptureService as any).mock.results[0]?.value || {
      requestCapture: vi.fn(),
      captureFrame: vi.fn(),
      stopCapture: vi.fn(),
      isCapturing: vi.fn().mockReturnValue(false),
    };

    // Reset all mock functions
    mockCaptureService.requestCapture.mockReset();
    mockCaptureService.captureFrame.mockReset();
    mockCaptureService.stopCapture.mockReset();
    mockCaptureService.isCapturing.mockReset().mockReturnValue(false);

    // Mock canvas operations
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      drawImage: vi.fn(),
    });
    HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,mock');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Capture Flow', () => {
    it('should show requesting state initially', () => {
      // Setup: Mock capture to never resolve (stay in requesting state)
      mockCaptureService.requestCapture.mockImplementation(() => new Promise(() => {}));

      render(
        <ScreenPointer
          onCapture={mockOnCapture}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Requesting Screen Capture')).toBeInTheDocument();
      expect(screen.getByText(/Please select a screen, window, or tab/)).toBeInTheDocument();
    });

    it('should request screen capture on mount', async () => {
      // Setup: Mock successful capture
      const mockFrame = {
        width: 1920,
        height: 1080,
      } as ImageBitmap;

      mockCaptureService.requestCapture.mockResolvedValue({
        stream: {} as MediaStream,
        displaySurface: 'monitor',
        frameRate: 30,
      } as CaptureResult);

      mockCaptureService.captureFrame.mockResolvedValue(mockFrame);

      render(
        <ScreenPointer
          onCapture={mockOnCapture}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(mockCaptureService.requestCapture).toHaveBeenCalledWith({
          type: 'screen',
          audio: false,
        });
      });
    });

    it('should capture frame after requesting capture', async () => {
      // Setup: Mock successful capture
      const mockFrame = {
        width: 1920,
        height: 1080,
      } as ImageBitmap;

      mockCaptureService.requestCapture.mockResolvedValue({
        stream: {} as MediaStream,
        displaySurface: 'monitor',
        frameRate: 30,
      } as CaptureResult);

      mockCaptureService.captureFrame.mockResolvedValue(mockFrame);

      render(
        <ScreenPointer
          onCapture={mockOnCapture}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(mockCaptureService.captureFrame).toHaveBeenCalled();
      });
    });

    it('should stop capture after getting frame', async () => {
      // Setup: Mock successful capture
      const mockFrame = {
        width: 1920,
        height: 1080,
      } as ImageBitmap;

      mockCaptureService.requestCapture.mockResolvedValue({
        stream: {} as MediaStream,
        displaySurface: 'monitor',
        frameRate: 30,
      } as CaptureResult);

      mockCaptureService.captureFrame.mockResolvedValue(mockFrame);

      render(
        <ScreenPointer
          onCapture={mockOnCapture}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(mockCaptureService.stopCapture).toHaveBeenCalled();
      });
    });

    it('should show annotation UI after successful capture', async () => {
      // Setup: Mock successful capture
      const mockFrame = {
        width: 1920,
        height: 1080,
      } as ImageBitmap;

      mockCaptureService.requestCapture.mockResolvedValue({
        stream: {} as MediaStream,
        displaySurface: 'monitor',
        frameRate: 30,
      } as CaptureResult);

      mockCaptureService.captureFrame.mockResolvedValue(mockFrame);

      render(
        <ScreenPointer
          onCapture={mockOnCapture}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('tool-palette')).toBeInTheDocument();
        expect(screen.getByTestId('annotation-overlay')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error when permission is denied', async () => {
      // Setup: Mock permission denied error
      mockCaptureService.requestCapture.mockRejectedValue({
        error: 'permission-denied',
        message: 'User denied permission',
      });

      render(
        <ScreenPointer
          onCapture={mockOnCapture}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/permission was denied/i)).toBeInTheDocument();
      });
    });

    it('should show error when capture is not supported', async () => {
      // Setup: Mock not supported error
      mockCaptureService.requestCapture.mockRejectedValue({
        error: 'not-supported',
        message: 'Not supported',
      });

      render(
        <ScreenPointer
          onCapture={mockOnCapture}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/not supported/i)).toBeInTheDocument();
      });
    });

    it('should show generic error for unknown failures', async () => {
      // Setup: Mock generic error
      mockCaptureService.requestCapture.mockRejectedValue(
        new Error('Unknown error')
      );

      render(
        <ScreenPointer
          onCapture={mockOnCapture}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Unknown error/i)).toBeInTheDocument();
      });
    });

    it('should allow retry after error', async () => {
      const user = userEvent.setup();

      // Setup: Mock error then success
      mockCaptureService.requestCapture
        .mockRejectedValueOnce({
          error: 'permission-denied',
          message: 'Denied',
        })
        .mockResolvedValueOnce({
          stream: {} as MediaStream,
          displaySurface: 'monitor',
          frameRate: 30,
        });

      mockCaptureService.captureFrame.mockResolvedValue({
        width: 1920,
        height: 1080,
      } as ImageBitmap);

      render(
        <ScreenPointer
          onCapture={mockOnCapture}
          onCancel={mockOnCancel}
        />
      );

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText(/permission was denied/i)).toBeInTheDocument();
      });

      // Click retry
      const retryButton = screen.getByText('Try Again');
      await user.click(retryButton);

      // Should show annotation UI after retry
      await waitFor(() => {
        expect(screen.getByTestId('tool-palette')).toBeInTheDocument();
      });
    });
  });

  describe('User Actions', () => {
    beforeEach(async () => {
      // Setup: Mock successful capture for all tests
      const mockFrame = {
        width: 1920,
        height: 1080,
      } as ImageBitmap;

      mockCaptureService.requestCapture.mockResolvedValue({
        stream: {} as MediaStream,
        displaySurface: 'monitor',
        frameRate: 30,
      } as CaptureResult);

      mockCaptureService.captureFrame.mockResolvedValue(mockFrame);
    });

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ScreenPointer
          onCapture={mockOnCapture}
          onCancel={mockOnCancel}
        />
      );

      // Wait for annotation UI
      await waitFor(() => {
        expect(screen.getByTestId('tool-palette')).toBeInTheDocument();
      });

      // Click cancel
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should stop capture when cancelled', async () => {
      const user = userEvent.setup();

      render(
        <ScreenPointer
          onCapture={mockOnCapture}
          onCancel={mockOnCancel}
        />
      );

      // Wait for annotation UI
      await waitFor(() => {
        expect(screen.getByTestId('tool-palette')).toBeInTheDocument();
      });

      // Reset mock to track new calls
      mockCaptureService.stopCapture.mockClear();

      // Click cancel
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(mockCaptureService.stopCapture).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should stop capture on unmount', async () => {
      // Setup: Mock successful capture
      const mockFrame = {
        width: 1920,
        height: 1080,
      } as ImageBitmap;

      mockCaptureService.requestCapture.mockResolvedValue({
        stream: {} as MediaStream,
        displaySurface: 'monitor',
        frameRate: 30,
      } as CaptureResult);

      mockCaptureService.captureFrame.mockResolvedValue(mockFrame);

      const { unmount } = render(
        <ScreenPointer
          onCapture={mockOnCapture}
          onCancel={mockOnCancel}
        />
      );

      // Wait for component to be ready
      await waitFor(() => {
        expect(screen.getByTestId('tool-palette')).toBeInTheDocument();
      });

      // Reset mock to track cleanup call
      mockCaptureService.stopCapture.mockClear();

      // Unmount
      unmount();

      expect(mockCaptureService.stopCapture).toHaveBeenCalled();
    });
  });

  describe('Initial Capture Type', () => {
    it('should use default capture type of screen', async () => {
      // Setup: Mock successful capture
      const mockFrame = {
        width: 1920,
        height: 1080,
      } as ImageBitmap;

      mockCaptureService.requestCapture.mockResolvedValue({
        stream: {} as MediaStream,
        displaySurface: 'monitor',
        frameRate: 30,
      } as CaptureResult);

      mockCaptureService.captureFrame.mockResolvedValue(mockFrame);

      render(
        <ScreenPointer
          onCapture={mockOnCapture}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(mockCaptureService.requestCapture).toHaveBeenCalledWith({
          type: 'screen',
          audio: false,
        });
      });
    });

    it('should use custom initial capture type', async () => {
      // Setup: Mock successful capture
      const mockFrame = {
        width: 1920,
        height: 1080,
      } as ImageBitmap;

      mockCaptureService.requestCapture.mockResolvedValue({
        stream: {} as MediaStream,
        displaySurface: 'window',
        frameRate: 30,
      } as CaptureResult);

      mockCaptureService.captureFrame.mockResolvedValue(mockFrame);

      render(
        <ScreenPointer
          onCapture={mockOnCapture}
          onCancel={mockOnCancel}
          initialCaptureType="window"
        />
      );

      await waitFor(() => {
        expect(mockCaptureService.requestCapture).toHaveBeenCalledWith({
          type: 'window',
          audio: false,
        });
      });
    });
  });
});
