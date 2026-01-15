/**
 * RecordingBar Integration Tests
 * 
 * Tests the RecordingBar component integration with the workflow store
 * and its behavior in a real recording scenario.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecordingBar } from '../RecordingBar';
import { useWorkflowStore } from '@/stores/workflow';
import { act } from 'react';

// Mock chrome API
const mockChrome = {
  tabs: {
    get: vi.fn().mockResolvedValue({
      id: 1,
      url: 'https://example.com',
      title: 'Example'
    }),
    executeScript: vi.fn().mockResolvedValue([{ result: [] }])
  },
  debugger: {
    attach: vi.fn().mockResolvedValue(undefined),
    detach: vi.fn().mockResolvedValue(undefined),
    sendCommand: vi.fn().mockResolvedValue({
      data: 'base64screenshot'
    })
  },
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined)
    }
  },
  scripting: {
    executeScript: vi.fn().mockResolvedValue([{ result: [] }])
  }
};

(global as any).chrome = mockChrome;

// Mock window.confirm
const mockConfirm = vi.fn();
global.confirm = mockConfirm;

describe('RecordingBar Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true);
    
    // Reset the store to initial state
    useWorkflowStore.setState({
      currentRecording: null,
      status: 'idle',
      savedWorkflows: [],
      isLoaded: false
    });
  });
  
  afterEach(() => {
    // Clean up any active recordings
    const { status, cancelRecording } = useWorkflowStore.getState();
    if (status === 'recording') {
      cancelRecording();
    }
  });
  
  describe('Recording Lifecycle', () => {
    it('should show RecordingBar when recording starts', async () => {
      const { container } = render(<RecordingBar />);
      
      // Initially not visible
      expect(container.firstChild).toBeNull();
      
      // Start recording
      await act(async () => {
        await useWorkflowStore.getState().startRecording(1);
      });
      
      // Should now be visible
      expect(screen.getByText('Recording Workflow')).toBeInTheDocument();
      expect(screen.getByText('0 steps')).toBeInTheDocument();
    });
    
    it('should hide RecordingBar when recording stops', async () => {
      render(<RecordingBar />);
      
      // Start recording
      await act(async () => {
        await useWorkflowStore.getState().startRecording(1);
      });
      
      expect(screen.getByText('Recording Workflow')).toBeInTheDocument();
      
      // Stop recording
      await act(async () => {
        await useWorkflowStore.getState().stopRecording();
      });
      
      // Should be hidden
      await waitFor(() => {
        expect(screen.queryByText('Recording Workflow')).not.toBeInTheDocument();
      });
    });
    
    it('should hide RecordingBar when recording is cancelled', async () => {
      render(<RecordingBar />);
      
      // Start recording
      await act(async () => {
        await useWorkflowStore.getState().startRecording(1);
      });
      
      expect(screen.getByText('Recording Workflow')).toBeInTheDocument();
      
      // Cancel recording
      act(() => {
        useWorkflowStore.getState().cancelRecording();
      });
      
      // Should be hidden
      await waitFor(() => {
        expect(screen.queryByText('Recording Workflow')).not.toBeInTheDocument();
      });
    });
  });
  
  describe('Step Count Updates', () => {
    it('should update step count when steps are captured', async () => {
      render(<RecordingBar />);
      
      // Start recording
      await act(async () => {
        await useWorkflowStore.getState().startRecording(1);
      });
      
      expect(screen.getByText('0 steps')).toBeInTheDocument();
      
      // Capture a step
      await act(async () => {
        await useWorkflowStore.getState().captureStep({
          type: 'click',
          x: 100,
          y: 200
        });
      });
      
      // Step count should update
      await waitFor(() => {
        expect(screen.getByText('1 step')).toBeInTheDocument();
      });
      
      // Capture another step
      await act(async () => {
        await useWorkflowStore.getState().captureStep({
          type: 'type',
          text: 'Hello'
        });
      });
      
      // Step count should update again
      await waitFor(() => {
        expect(screen.getByText('2 steps')).toBeInTheDocument();
      });
    });
    
    it('should handle rapid step captures', async () => {
      render(<RecordingBar />);
      
      // Start recording
      await act(async () => {
        await useWorkflowStore.getState().startRecording(1);
      });
      
      // Capture multiple steps rapidly
      await act(async () => {
        const capturePromises = [
          useWorkflowStore.getState().captureStep({ type: 'click', x: 100, y: 200 }),
          useWorkflowStore.getState().captureStep({ type: 'type', text: 'Hello' }),
          useWorkflowStore.getState().captureStep({ type: 'navigate', url: 'https://example.com' })
        ];
        await Promise.all(capturePromises);
      });
      
      // Should show correct count
      await waitFor(() => {
        expect(screen.getByText('3 steps')).toBeInTheDocument();
      });
    });
  });
  
  describe('User Interactions', () => {
    it('should stop recording when Stop button is clicked', async () => {
      const user = userEvent.setup();
      render(<RecordingBar />);
      
      // Start recording
      await act(async () => {
        await useWorkflowStore.getState().startRecording(1);
      });
      
      // Capture a step
      await act(async () => {
        await useWorkflowStore.getState().captureStep({
          type: 'click',
          x: 100,
          y: 200
        });
      });
      
      expect(screen.getByText('1 step')).toBeInTheDocument();
      
      // Click stop button
      const stopButton = screen.getByRole('button', { name: /stop recording/i });
      await user.click(stopButton);
      
      // Recording should be stopped
      await waitFor(() => {
        expect(useWorkflowStore.getState().status).toBe('idle');
        expect(useWorkflowStore.getState().currentRecording).toBeNull();
      });
    });
    
    it('should cancel recording when Cancel button is clicked and confirmed', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true);
      
      render(<RecordingBar />);
      
      // Start recording
      await act(async () => {
        await useWorkflowStore.getState().startRecording(1);
      });
      
      // Capture a step
      await act(async () => {
        await useWorkflowStore.getState().captureStep({
          type: 'click',
          x: 100,
          y: 200
        });
      });
      
      // Click cancel button
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      // Should show confirmation
      expect(mockConfirm).toHaveBeenCalled();
      
      // Recording should be cancelled
      await waitFor(() => {
        expect(useWorkflowStore.getState().status).toBe('idle');
        expect(useWorkflowStore.getState().currentRecording).toBeNull();
      });
    });
    
    it('should not cancel recording when user declines confirmation', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(false);
      
      render(<RecordingBar />);
      
      // Start recording
      await act(async () => {
        await useWorkflowStore.getState().startRecording(1);
      });
      
      // Click cancel button
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      // Should show confirmation
      expect(mockConfirm).toHaveBeenCalled();
      
      // Recording should still be active
      expect(useWorkflowStore.getState().status).toBe('recording');
      expect(useWorkflowStore.getState().currentRecording).not.toBeNull();
    });
  });
  
  describe('Multiple Recording Sessions', () => {
    it('should handle starting a new recording after stopping', async () => {
      render(<RecordingBar />);
      
      // First recording session
      await act(async () => {
        await useWorkflowStore.getState().startRecording(1);
      });
      
      await act(async () => {
        await useWorkflowStore.getState().captureStep({
          type: 'click',
          x: 100,
          y: 200
        });
      });
      
      expect(screen.getByText('1 step')).toBeInTheDocument();
      
      // Stop recording
      await act(async () => {
        await useWorkflowStore.getState().stopRecording();
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Recording Workflow')).not.toBeInTheDocument();
      });
      
      // Start new recording session
      await act(async () => {
        await useWorkflowStore.getState().startRecording(2);
      });
      
      // Should show new recording with 0 steps
      expect(screen.getByText('Recording Workflow')).toBeInTheDocument();
      expect(screen.getByText('0 steps')).toBeInTheDocument();
    });
    
    it('should handle starting a new recording after cancelling', async () => {
      render(<RecordingBar />);
      
      // First recording session
      await act(async () => {
        await useWorkflowStore.getState().startRecording(1);
      });
      
      await act(async () => {
        await useWorkflowStore.getState().captureStep({
          type: 'click',
          x: 100,
          y: 200
        });
      });
      
      // Cancel recording
      act(() => {
        useWorkflowStore.getState().cancelRecording();
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Recording Workflow')).not.toBeInTheDocument();
      });
      
      // Start new recording session
      await act(async () => {
        await useWorkflowStore.getState().startRecording(2);
      });
      
      // Should show new recording with 0 steps
      expect(screen.getByText('Recording Workflow')).toBeInTheDocument();
      expect(screen.getByText('0 steps')).toBeInTheDocument();
    });
  });
  
  describe('Error Handling', () => {
    it('should handle CDP errors during step capture gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock CDP to fail
      mockChrome.debugger.sendCommand.mockRejectedValueOnce(new Error('CDP error'));
      
      render(<RecordingBar />);
      
      // Start recording
      await act(async () => {
        await useWorkflowStore.getState().startRecording(1);
      });
      
      // Try to capture a step (should fail but not crash)
      await act(async () => {
        await useWorkflowStore.getState().captureStep({
          type: 'click',
          x: 100,
          y: 200
        });
      });
      
      // Should still show recording bar with 0 steps (step wasn't captured)
      expect(screen.getByText('Recording Workflow')).toBeInTheDocument();
      expect(screen.getByText('0 steps')).toBeInTheDocument();
      
      consoleErrorSpy.mockRestore();
    });
  });
});
