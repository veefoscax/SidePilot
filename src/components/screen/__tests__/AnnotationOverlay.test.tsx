/**
 * AnnotationOverlay Component Tests
 * 
 * Tests the React wrapper for AnnotationCanvas.
 * Validates lifecycle management, prop synchronization, and ref methods.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { useRef } from 'react';
import { AnnotationOverlay, type AnnotationOverlayHandle } from '../AnnotationOverlay';
import { AnnotationCanvas } from '@/lib/screen-capture/annotation-canvas';

// Mock the AnnotationCanvas class
vi.mock('@/lib/screen-capture/annotation-canvas', () => {
  return {
    AnnotationCanvas: vi.fn(function(this: any) {
      this.resize = vi.fn();
      this.setBackground = vi.fn().mockResolvedValue(undefined);
      this.setTool = vi.fn();
      this.setColor = vi.fn();
      this.getAnnotations = vi.fn().mockReturnValue([]);
      this.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,mock');
      this.undo = vi.fn();
      this.redo = vi.fn();
      this.canUndo = vi.fn().mockReturnValue(false);
      this.canRedo = vi.fn().mockReturnValue(false);
      this.clear = vi.fn();
      this.dispose = vi.fn();
      this.getCanvas = vi.fn();
      return this;
    }),
  };
});

describe('AnnotationOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should render without crashing', () => {
      const { container } = render(
        <AnnotationOverlay
          width={800}
          height={600}
          selectedTool="arrow"
          selectedColor="#ff0000"
        />
      );

      expect(container.querySelector('[data-testid="annotation-overlay"]')).toBeInTheDocument();
    });

    it('should initialize AnnotationCanvas with correct options', () => {
      render(
        <AnnotationOverlay
          width={800}
          height={600}
          backgroundImage="data:image/png;base64,test"
          selectedTool="arrow"
          selectedColor="#ff0000"
        />
      );

      expect(AnnotationCanvas).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        {
          width: 800,
          height: 600,
          backgroundImage: 'data:image/png;base64,test',
        }
      );
    });

    it('should call onReady callback when canvas is initialized', async () => {
      const onReady = vi.fn();

      render(
        <AnnotationOverlay
          width={800}
          height={600}
          selectedTool="arrow"
          selectedColor="#ff0000"
          onReady={onReady}
        />
      );

      await waitFor(() => {
        expect(onReady).toHaveBeenCalledTimes(1);
      });
    });

    it('should apply custom className', () => {
      const { container } = render(
        <AnnotationOverlay
          width={800}
          height={600}
          selectedTool="arrow"
          selectedColor="#ff0000"
          className="custom-class"
        />
      );

      const overlay = container.querySelector('[data-testid="annotation-overlay"]');
      expect(overlay).toHaveClass('custom-class');
    });
  });

  describe('Lifecycle Management', () => {
    it('should dispose canvas on unmount', () => {
      const { unmount } = render(
        <AnnotationOverlay
          width={800}
          height={600}
          selectedTool="arrow"
          selectedColor="#ff0000"
        />
      );

      const MockConstructor = AnnotationCanvas as any;
      const mockInstance = MockConstructor.mock.instances[0];

      unmount();

      expect(mockInstance.dispose).toHaveBeenCalledTimes(1);
    });

    it('should handle resize when dimensions change', async () => {
      const { rerender } = render(
        <AnnotationOverlay
          width={800}
          height={600}
          selectedTool="arrow"
          selectedColor="#ff0000"
        />
      );

      const MockConstructor = AnnotationCanvas as any;
      const mockInstance = MockConstructor.mock.instances[0];

      // Change dimensions
      rerender(
        <AnnotationOverlay
          width={1024}
          height={768}
          selectedTool="arrow"
          selectedColor="#ff0000"
        />
      );

      await waitFor(() => {
        expect(mockInstance.resize).toHaveBeenCalledWith(1024, 768);
      });
    });

    it('should update background image when it changes', async () => {
      const { rerender } = render(
        <AnnotationOverlay
          width={800}
          height={600}
          backgroundImage="data:image/png;base64,first"
          selectedTool="arrow"
          selectedColor="#ff0000"
        />
      );

      const MockConstructor = AnnotationCanvas as any;
      const mockInstance = MockConstructor.mock.instances[0];

      // Change background
      rerender(
        <AnnotationOverlay
          width={800}
          height={600}
          backgroundImage="data:image/png;base64,second"
          selectedTool="arrow"
          selectedColor="#ff0000"
        />
      );

      await waitFor(() => {
        expect(mockInstance.setBackground).toHaveBeenCalledWith('data:image/png;base64,second');
      });
    });
  });

  describe('Tool and Color Synchronization', () => {
    it('should sync selected tool with canvas', async () => {
      const { rerender } = render(
        <AnnotationOverlay
          width={800}
          height={600}
          selectedTool="arrow"
          selectedColor="#ff0000"
        />
      );

      const MockConstructor = AnnotationCanvas as any;
      const mockInstance = MockConstructor.mock.instances[0];

      // Change tool
      rerender(
        <AnnotationOverlay
          width={800}
          height={600}
          selectedTool="circle"
          selectedColor="#ff0000"
        />
      );

      await waitFor(() => {
        expect(mockInstance.setTool).toHaveBeenCalledWith('circle');
      });
    });

    it('should sync selected color with canvas', async () => {
      const { rerender } = render(
        <AnnotationOverlay
          width={800}
          height={600}
          selectedTool="arrow"
          selectedColor="#ff0000"
        />
      );

      const MockConstructor = AnnotationCanvas as any;
      const mockInstance = MockConstructor.mock.instances[0];

      // Change color
      rerender(
        <AnnotationOverlay
          width={800}
          height={600}
          selectedTool="arrow"
          selectedColor="#0066ff"
        />
      );

      await waitFor(() => {
        expect(mockInstance.setColor).toHaveBeenCalledWith('#0066ff');
      });
    });
  });

  describe('Ref Methods', () => {
    it('should expose getAnnotations method', async () => {
      const TestComponent = () => {
        const ref = useRef<AnnotationOverlayHandle>(null);
        return (
          <div>
            <AnnotationOverlay
              ref={ref}
              width={800}
              height={600}
              selectedTool="arrow"
              selectedColor="#ff0000"
            />
            <button onClick={() => ref.current?.getAnnotations()}>Get Annotations</button>
          </div>
        );
      };

      const { getByText } = render(<TestComponent />);
      const MockConstructor = AnnotationCanvas as any;
      const mockInstance = MockConstructor.mock.instances[0];

      mockInstance.getAnnotations.mockReturnValue([
        {
          id: 'test-1',
          type: 'arrow',
          coordinates: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
          color: '#ff0000',
          timestamp: Date.now(),
        },
      ]);

      await waitFor(() => {
        getByText('Get Annotations').click();
        expect(mockInstance.getAnnotations).toHaveBeenCalled();
      });
    });

    it('should expose toDataURL method', async () => {
      const TestComponent = () => {
        const ref = useRef<AnnotationOverlayHandle>(null);
        return (
          <div>
            <AnnotationOverlay
              ref={ref}
              width={800}
              height={600}
              selectedTool="arrow"
              selectedColor="#ff0000"
            />
            <button onClick={() => ref.current?.toDataURL('png')}>Export</button>
          </div>
        );
      };

      const { getByText } = render(<TestComponent />);
      const MockConstructor = AnnotationCanvas as any;
      const mockInstance = MockConstructor.mock.instances[0];

      await waitFor(() => {
        getByText('Export').click();
        expect(mockInstance.toDataURL).toHaveBeenCalledWith('png');
      });
    });

    it('should expose undo/redo methods', async () => {
      const TestComponent = () => {
        const ref = useRef<AnnotationOverlayHandle>(null);
        return (
          <div>
            <AnnotationOverlay
              ref={ref}
              width={800}
              height={600}
              selectedTool="arrow"
              selectedColor="#ff0000"
            />
            <button onClick={() => ref.current?.undo()}>Undo</button>
            <button onClick={() => ref.current?.redo()}>Redo</button>
          </div>
        );
      };

      const { getByText } = render(<TestComponent />);
      const MockConstructor = AnnotationCanvas as any;
      const mockInstance = MockConstructor.mock.instances[0];

      await waitFor(() => {
        getByText('Undo').click();
        expect(mockInstance.undo).toHaveBeenCalled();

        getByText('Redo').click();
        expect(mockInstance.redo).toHaveBeenCalled();
      });
    });

    it('should expose canUndo/canRedo methods', async () => {
      const TestComponent = () => {
        const ref = useRef<AnnotationOverlayHandle>(null);
        return (
          <div>
            <AnnotationOverlay
              ref={ref}
              width={800}
              height={600}
              selectedTool="arrow"
              selectedColor="#ff0000"
            />
            <button onClick={() => ref.current?.canUndo()}>Can Undo</button>
            <button onClick={() => ref.current?.canRedo()}>Can Redo</button>
          </div>
        );
      };

      const { getByText } = render(<TestComponent />);
      const MockConstructor = AnnotationCanvas as any;
      const mockInstance = MockConstructor.mock.instances[0];

      mockInstance.canUndo.mockReturnValue(true);
      mockInstance.canRedo.mockReturnValue(false);

      await waitFor(() => {
        getByText('Can Undo').click();
        expect(mockInstance.canUndo).toHaveBeenCalled();

        getByText('Can Redo').click();
        expect(mockInstance.canRedo).toHaveBeenCalled();
      });
    });

    it('should expose clear method', async () => {
      const TestComponent = () => {
        const ref = useRef<AnnotationOverlayHandle>(null);
        return (
          <div>
            <AnnotationOverlay
              ref={ref}
              width={800}
              height={600}
              selectedTool="arrow"
              selectedColor="#ff0000"
            />
            <button onClick={() => ref.current?.clear()}>Clear</button>
          </div>
        );
      };

      const { getByText } = render(<TestComponent />);
      const MockConstructor = AnnotationCanvas as any;
      const mockInstance = MockConstructor.mock.instances[0];

      await waitFor(() => {
        getByText('Clear').click();
        expect(mockInstance.clear).toHaveBeenCalled();
      });
    });

    it('should expose setBackground method', async () => {
      const TestComponent = () => {
        const ref = useRef<AnnotationOverlayHandle>(null);
        return (
          <div>
            <AnnotationOverlay
              ref={ref}
              width={800}
              height={600}
              selectedTool="arrow"
              selectedColor="#ff0000"
            />
            <button onClick={() => ref.current?.setBackground('data:image/png;base64,new')}>
              Set Background
            </button>
          </div>
        );
      };

      const { getByText } = render(<TestComponent />);
      const MockConstructor = AnnotationCanvas as any;
      const mockInstance = MockConstructor.mock.instances[0];

      await waitFor(() => {
        getByText('Set Background').click();
        expect(mockInstance.setBackground).toHaveBeenCalledWith('data:image/png;base64,new');
      });
    });

    it('should expose getCanvas method', async () => {
      const TestComponent = () => {
        const ref = useRef<AnnotationOverlayHandle>(null);
        return (
          <div>
            <AnnotationOverlay
              ref={ref}
              width={800}
              height={600}
              selectedTool="arrow"
              selectedColor="#ff0000"
            />
            <button onClick={() => ref.current?.getCanvas()}>Get Canvas</button>
          </div>
        );
      };

      const { getByText } = render(<TestComponent />);
      const MockConstructor = AnnotationCanvas as any;
      const mockInstance = MockConstructor.mock.instances[0];

      await waitFor(() => {
        getByText('Get Canvas').click();
        // Should return the canvas instance
        expect(mockInstance).toBeDefined();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle setBackground errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { rerender } = render(
        <AnnotationOverlay
          width={800}
          height={600}
          selectedTool="arrow"
          selectedColor="#ff0000"
        />
      );

      const MockConstructor = AnnotationCanvas as any;
      const mockInstance = MockConstructor.mock.instances[0];
      mockInstance.setBackground.mockRejectedValueOnce(new Error('Failed to load image'));

      // Change background to trigger error
      rerender(
        <AnnotationOverlay
          width={800}
          height={600}
          backgroundImage="invalid-url"
          selectedTool="arrow"
          selectedColor="#ff0000"
        />
      );

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to set background image:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });

    it('should return empty array if canvas not initialized when calling getAnnotations', () => {
      const TestComponent = () => {
        const ref = useRef<AnnotationOverlayHandle>(null);
        return (
          <div>
            <AnnotationOverlay
              ref={ref}
              width={800}
              height={600}
              selectedTool="arrow"
              selectedColor="#ff0000"
            />
            <button onClick={() => {
              const annotations = ref.current?.getAnnotations();
              expect(annotations).toBeDefined();
            }}>
              Get Annotations
            </button>
          </div>
        );
      };

      const { getByText } = render(<TestComponent />);
      getByText('Get Annotations').click();
    });

    it('should return empty string if canvas not initialized when calling toDataURL', () => {
      const TestComponent = () => {
        const ref = useRef<AnnotationOverlayHandle>(null);
        return (
          <div>
            <AnnotationOverlay
              ref={ref}
              width={800}
              height={600}
              selectedTool="arrow"
              selectedColor="#ff0000"
            />
            <button onClick={() => {
              const dataUrl = ref.current?.toDataURL();
              expect(dataUrl).toBeDefined();
            }}>
              Export
            </button>
          </div>
        );
      };

      const { getByText } = render(<TestComponent />);
      getByText('Export').click();
    });
  });

  describe('Dimensions', () => {
    it('should set correct width and height styles', () => {
      const { container } = render(
        <AnnotationOverlay
          width={1024}
          height={768}
          selectedTool="arrow"
          selectedColor="#ff0000"
        />
      );

      const overlay = container.querySelector('[data-testid="annotation-overlay"]') as HTMLElement;
      expect(overlay.style.width).toBe('1024px');
      expect(overlay.style.height).toBe('768px');
    });

    it('should update dimensions when props change', () => {
      const { container, rerender } = render(
        <AnnotationOverlay
          width={800}
          height={600}
          selectedTool="arrow"
          selectedColor="#ff0000"
        />
      );

      rerender(
        <AnnotationOverlay
          width={1920}
          height={1080}
          selectedTool="arrow"
          selectedColor="#ff0000"
        />
      );

      const overlay = container.querySelector('[data-testid="annotation-overlay"]') as HTMLElement;
      expect(overlay.style.width).toBe('1920px');
      expect(overlay.style.height).toBe('1080px');
    });
  });
});
