/**
 * RecordingBar Component Tests
 * 
 * Tests the recording indicator bar that appears during workflow recording.
 * Validates visibility, step count display, and action button functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecordingBar } from '../RecordingBar';
import { useWorkflowStore } from '@/stores/workflow';
import type { WorkflowRecording } from '@/lib/workflow';

// Mock the workflow store
vi.mock('@/stores/workflow', () => ({
  useWorkflowStore: vi.fn()
}));

// Mock window.confirm
const mockConfirm = vi.fn();
global.confirm = mockConfirm;

describe('RecordingBar', () => {
  const mockStopRecording = vi.fn();
  const mockCancelRecording = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true); // Default to confirming
  });
  
  describe('Visibility', () => {
    it('should not render when status is idle', () => {
      vi.mocked(useWorkflowStore).mockReturnValue({
        status: 'idle',
        currentRecording: null,
        stopRecording: mockStopRecording,
        cancelRecording: mockCancelRecording,
      } as any);
      
      const { container } = render(<RecordingBar />);
      expect(container.firstChild).toBeNull();
    });
    
    it('should not render when status is recording but no current recording', () => {
      vi.mocked(useWorkflowStore).mockReturnValue({
        status: 'recording',
        currentRecording: null,
        stopRecording: mockStopRecording,
        cancelRecording: mockCancelRecording,
      } as any);
      
      const { container } = render(<RecordingBar />);
      expect(container.firstChild).toBeNull();
    });
    
    it('should render when status is recording and current recording exists', () => {
      const mockRecording: WorkflowRecording = {
        id: 'test-recording',
        steps: [],
        startTime: Date.now(),
        status: 'recording',
        tabId: 1
      };
      
      vi.mocked(useWorkflowStore).mockReturnValue({
        status: 'recording',
        currentRecording: mockRecording,
        stopRecording: mockStopRecording,
        cancelRecording: mockCancelRecording,
      } as any);
      
      render(<RecordingBar />);
      expect(screen.getByText('Recording Workflow')).toBeInTheDocument();
    });
  });
  
  describe('Recording Indicator', () => {
    it('should display pulsing recording indicator', () => {
      const mockRecording: WorkflowRecording = {
        id: 'test-recording',
        steps: [],
        startTime: Date.now(),
        status: 'recording',
        tabId: 1
      };
      
      vi.mocked(useWorkflowStore).mockReturnValue({
        status: 'recording',
        currentRecording: mockRecording,
        stopRecording: mockStopRecording,
        cancelRecording: mockCancelRecording,
      } as any);
      
      const { container } = render(<RecordingBar />);
      
      // Check for pulsing indicator elements
      const pulsingElements = container.querySelectorAll('.animate-pulse');
      expect(pulsingElements.length).toBeGreaterThan(0);
      
      const pingElements = container.querySelectorAll('.animate-ping');
      expect(pingElements.length).toBeGreaterThan(0);
    });
    
    it('should display "Recording Workflow" text', () => {
      const mockRecording: WorkflowRecording = {
        id: 'test-recording',
        steps: [],
        startTime: Date.now(),
        status: 'recording',
        tabId: 1
      };
      
      vi.mocked(useWorkflowStore).mockReturnValue({
        status: 'recording',
        currentRecording: mockRecording,
        stopRecording: mockStopRecording,
        cancelRecording: mockCancelRecording,
      } as any);
      
      render(<RecordingBar />);
      expect(screen.getByText('Recording Workflow')).toBeInTheDocument();
    });
  });
  
  describe('Step Count Display', () => {
    it('should display "0 steps" when no steps captured', () => {
      const mockRecording: WorkflowRecording = {
        id: 'test-recording',
        steps: [],
        startTime: Date.now(),
        status: 'recording',
        tabId: 1
      };
      
      vi.mocked(useWorkflowStore).mockReturnValue({
        status: 'recording',
        currentRecording: mockRecording,
        stopRecording: mockStopRecording,
        cancelRecording: mockCancelRecording,
      } as any);
      
      render(<RecordingBar />);
      expect(screen.getByText('0 steps')).toBeInTheDocument();
    });
    
    it('should display "1 step" (singular) when one step captured', () => {
      const mockRecording: WorkflowRecording = {
        id: 'test-recording',
        steps: [{
          id: 'step-1',
          stepNumber: 1,
          timestamp: Date.now(),
          screenshot: 'data:image/png;base64,test',
          action: { type: 'click', x: 100, y: 200 },
          url: 'https://example.com'
        }],
        startTime: Date.now(),
        status: 'recording',
        tabId: 1
      };
      
      vi.mocked(useWorkflowStore).mockReturnValue({
        status: 'recording',
        currentRecording: mockRecording,
        stopRecording: mockStopRecording,
        cancelRecording: mockCancelRecording,
      } as any);
      
      render(<RecordingBar />);
      expect(screen.getByText('1 step')).toBeInTheDocument();
    });
    
    it('should display "5 steps" (plural) when multiple steps captured', () => {
      const mockRecording: WorkflowRecording = {
        id: 'test-recording',
        steps: Array.from({ length: 5 }, (_, i) => ({
          id: `step-${i}`,
          stepNumber: i + 1,
          timestamp: Date.now(),
          screenshot: 'data:image/png;base64,test',
          action: { type: 'click' as const, x: 100, y: 200 },
          url: 'https://example.com'
        })),
        startTime: Date.now(),
        status: 'recording',
        tabId: 1
      };
      
      vi.mocked(useWorkflowStore).mockReturnValue({
        status: 'recording',
        currentRecording: mockRecording,
        stopRecording: mockStopRecording,
        cancelRecording: mockCancelRecording,
      } as any);
      
      render(<RecordingBar />);
      expect(screen.getByText('5 steps')).toBeInTheDocument();
    });
    
    it('should update step count when steps are added', () => {
      const mockRecording: WorkflowRecording = {
        id: 'test-recording',
        steps: [],
        startTime: Date.now(),
        status: 'recording',
        tabId: 1
      };
      
      vi.mocked(useWorkflowStore).mockReturnValue({
        status: 'recording',
        currentRecording: mockRecording,
        stopRecording: mockStopRecording,
        cancelRecording: mockCancelRecording,
      } as any);
      
      const { rerender } = render(<RecordingBar />);
      expect(screen.getByText('0 steps')).toBeInTheDocument();
      
      // Update with new steps
      const updatedRecording: WorkflowRecording = {
        ...mockRecording,
        steps: [
          {
            id: 'step-1',
            stepNumber: 1,
            timestamp: Date.now(),
            screenshot: 'data:image/png;base64,test',
            action: { type: 'click', x: 100, y: 200 },
            url: 'https://example.com'
          }
        ]
      };
      
      vi.mocked(useWorkflowStore).mockReturnValue({
        status: 'recording',
        currentRecording: updatedRecording,
        stopRecording: mockStopRecording,
        cancelRecording: mockCancelRecording,
      } as any);
      
      rerender(<RecordingBar />);
      expect(screen.getByText('1 step')).toBeInTheDocument();
    });
  });
  
  describe('Stop Recording Button', () => {
    it('should display "Stop Recording" button', () => {
      const mockRecording: WorkflowRecording = {
        id: 'test-recording',
        steps: [],
        startTime: Date.now(),
        status: 'recording',
        tabId: 1
      };
      
      vi.mocked(useWorkflowStore).mockReturnValue({
        status: 'recording',
        currentRecording: mockRecording,
        stopRecording: mockStopRecording,
        cancelRecording: mockCancelRecording,
      } as any);
      
      render(<RecordingBar />);
      expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument();
    });
    
    it('should call stopRecording when clicked', async () => {
      const user = userEvent.setup();
      const mockRecording: WorkflowRecording = {
        id: 'test-recording',
        steps: [],
        startTime: Date.now(),
        status: 'recording',
        tabId: 1
      };
      
      mockStopRecording.mockResolvedValue(mockRecording);
      
      vi.mocked(useWorkflowStore).mockReturnValue({
        status: 'recording',
        currentRecording: mockRecording,
        stopRecording: mockStopRecording,
        cancelRecording: mockCancelRecording,
      } as any);
      
      render(<RecordingBar />);
      
      const stopButton = screen.getByRole('button', { name: /stop recording/i });
      await user.click(stopButton);
      
      await waitFor(() => {
        expect(mockStopRecording).toHaveBeenCalledTimes(1);
      });
    });
    
    it('should handle stopRecording errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const mockRecording: WorkflowRecording = {
        id: 'test-recording',
        steps: [],
        startTime: Date.now(),
        status: 'recording',
        tabId: 1
      };
      
      mockStopRecording.mockRejectedValue(new Error('Failed to stop'));
      
      vi.mocked(useWorkflowStore).mockReturnValue({
        status: 'recording',
        currentRecording: mockRecording,
        stopRecording: mockStopRecording,
        cancelRecording: mockCancelRecording,
      } as any);
      
      render(<RecordingBar />);
      
      const stopButton = screen.getByRole('button', { name: /stop recording/i });
      await user.click(stopButton);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to stop recording:',
          expect.any(Error)
        );
      });
      
      consoleErrorSpy.mockRestore();
    });
  });
  
  describe('Cancel Recording Button', () => {
    it('should display "Cancel" button', () => {
      const mockRecording: WorkflowRecording = {
        id: 'test-recording',
        steps: [],
        startTime: Date.now(),
        status: 'recording',
        tabId: 1
      };
      
      vi.mocked(useWorkflowStore).mockReturnValue({
        status: 'recording',
        currentRecording: mockRecording,
        stopRecording: mockStopRecording,
        cancelRecording: mockCancelRecording,
      } as any);
      
      render(<RecordingBar />);
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
    
    it('should show confirmation dialog when cancel is clicked', async () => {
      const user = userEvent.setup();
      const mockRecording: WorkflowRecording = {
        id: 'test-recording',
        steps: [],
        startTime: Date.now(),
        status: 'recording',
        tabId: 1
      };
      
      vi.mocked(useWorkflowStore).mockReturnValue({
        status: 'recording',
        currentRecording: mockRecording,
        stopRecording: mockStopRecording,
        cancelRecording: mockCancelRecording,
      } as any);
      
      render(<RecordingBar />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(mockConfirm).toHaveBeenCalledWith(
        'Are you sure you want to cancel this recording? All captured steps will be lost.'
      );
    });
    
    it('should call cancelRecording when user confirms', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true);
      
      const mockRecording: WorkflowRecording = {
        id: 'test-recording',
        steps: [],
        startTime: Date.now(),
        status: 'recording',
        tabId: 1
      };
      
      vi.mocked(useWorkflowStore).mockReturnValue({
        status: 'recording',
        currentRecording: mockRecording,
        stopRecording: mockStopRecording,
        cancelRecording: mockCancelRecording,
      } as any);
      
      render(<RecordingBar />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(mockCancelRecording).toHaveBeenCalledTimes(1);
    });
    
    it('should not call cancelRecording when user cancels confirmation', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(false);
      
      const mockRecording: WorkflowRecording = {
        id: 'test-recording',
        steps: [],
        startTime: Date.now(),
        status: 'recording',
        tabId: 1
      };
      
      vi.mocked(useWorkflowStore).mockReturnValue({
        status: 'recording',
        currentRecording: mockRecording,
        stopRecording: mockStopRecording,
        cancelRecording: mockCancelRecording,
      } as any);
      
      render(<RecordingBar />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(mockCancelRecording).not.toHaveBeenCalled();
    });
  });
  
  describe('Styling and Layout', () => {
    it('should have fixed positioning at top of viewport', () => {
      const mockRecording: WorkflowRecording = {
        id: 'test-recording',
        steps: [],
        startTime: Date.now(),
        status: 'recording',
        tabId: 1
      };
      
      vi.mocked(useWorkflowStore).mockReturnValue({
        status: 'recording',
        currentRecording: mockRecording,
        stopRecording: mockStopRecording,
        cancelRecording: mockCancelRecording,
      } as any);
      
      const { container } = render(<RecordingBar />);
      const bar = container.firstChild as HTMLElement;
      
      expect(bar).toHaveClass('fixed');
      expect(bar).toHaveClass('top-0');
      expect(bar).toHaveClass('left-0');
      expect(bar).toHaveClass('right-0');
    });
    
    it('should have high z-index for visibility', () => {
      const mockRecording: WorkflowRecording = {
        id: 'test-recording',
        steps: [],
        startTime: Date.now(),
        status: 'recording',
        tabId: 1
      };
      
      vi.mocked(useWorkflowStore).mockReturnValue({
        status: 'recording',
        currentRecording: mockRecording,
        stopRecording: mockStopRecording,
        cancelRecording: mockCancelRecording,
      } as any);
      
      const { container } = render(<RecordingBar />);
      const bar = container.firstChild as HTMLElement;
      
      expect(bar).toHaveClass('z-50');
    });
    
    it('should use destructive color scheme', () => {
      const mockRecording: WorkflowRecording = {
        id: 'test-recording',
        steps: [],
        startTime: Date.now(),
        status: 'recording',
        tabId: 1
      };
      
      vi.mocked(useWorkflowStore).mockReturnValue({
        status: 'recording',
        currentRecording: mockRecording,
        stopRecording: mockStopRecording,
        cancelRecording: mockCancelRecording,
      } as any);
      
      const { container } = render(<RecordingBar />);
      const bar = container.firstChild as HTMLElement;
      
      expect(bar).toHaveClass('bg-destructive');
      expect(bar).toHaveClass('text-destructive-foreground');
    });
  });
  
  describe('Accessibility', () => {
    it('should have accessible button labels', () => {
      const mockRecording: WorkflowRecording = {
        id: 'test-recording',
        steps: [],
        startTime: Date.now(),
        status: 'recording',
        tabId: 1
      };
      
      vi.mocked(useWorkflowStore).mockReturnValue({
        status: 'recording',
        currentRecording: mockRecording,
        stopRecording: mockStopRecording,
        cancelRecording: mockCancelRecording,
      } as any);
      
      render(<RecordingBar />);
      
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument();
    });
    
    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      const mockRecording: WorkflowRecording = {
        id: 'test-recording',
        steps: [],
        startTime: Date.now(),
        status: 'recording',
        tabId: 1
      };
      
      mockStopRecording.mockResolvedValue(mockRecording);
      
      vi.mocked(useWorkflowStore).mockReturnValue({
        status: 'recording',
        currentRecording: mockRecording,
        stopRecording: mockStopRecording,
        cancelRecording: mockCancelRecording,
      } as any);
      
      render(<RecordingBar />);
      
      // Tab to first button (Cancel)
      await user.tab();
      expect(screen.getByRole('button', { name: /cancel/i })).toHaveFocus();
      
      // Tab to second button (Stop Recording)
      await user.tab();
      expect(screen.getByRole('button', { name: /stop recording/i })).toHaveFocus();
      
      // Press Enter to activate
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(mockStopRecording).toHaveBeenCalled();
      });
    });
  });
});
