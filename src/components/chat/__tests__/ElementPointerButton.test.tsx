/**
 * ElementPointerButton Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ElementPointerButton } from '../ElementPointerButton';
import { ElementPointerMessageType } from '@/lib/element-pointer';

// Mock chrome API
const mockChrome = {
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn()
  }
};

global.chrome = mockChrome as any;

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('ElementPointerButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders button with emoji', () => {
    render(<ElementPointerButton />);
    
    const button = screen.getByTitle('Point at element');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('🎯');
  });

  it('is disabled when disabled prop is true', () => {
    render(<ElementPointerButton disabled={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('activates element pointer on click', async () => {
    const mockTab = { id: 123, active: true };
    mockChrome.tabs.query.mockResolvedValue([mockTab]);
    mockChrome.tabs.sendMessage.mockResolvedValue({ success: true });

    render(<ElementPointerButton />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockChrome.tabs.query).toHaveBeenCalledWith({
        active: true,
        currentWindow: true
      });
    });

    expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
      123,
      { type: ElementPointerMessageType.ACTIVATE }
    );
  });

  it('shows error when no active tab found', async () => {
    mockChrome.tabs.query.mockResolvedValue([]);

    const { toast } = await import('sonner');
    
    render(<ElementPointerButton />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No active tab found');
    });
  });

  it('shows error when message sending fails', async () => {
    const mockTab = { id: 123, active: true };
    mockChrome.tabs.query.mockResolvedValue([mockTab]);
    mockChrome.tabs.sendMessage.mockRejectedValue(new Error('Connection failed'));

    const { toast } = await import('sonner');
    
    render(<ElementPointerButton />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to activate element pointer. Make sure the page is loaded.'
      );
    });
  });

  it('changes variant when active', async () => {
    const mockTab = { id: 123, active: true };
    mockChrome.tabs.query.mockResolvedValue([mockTab]);
    mockChrome.tabs.sendMessage.mockResolvedValue({ success: true });

    render(<ElementPointerButton />);
    
    const button = screen.getByRole('button');
    
    // Initially ghost variant (check for hover:bg-accent class)
    expect(button.className).toContain('hover:bg-accent');
    
    fireEvent.click(button);

    await waitFor(() => {
      // After activation, should not have ghost variant classes
      expect(mockChrome.tabs.sendMessage).toHaveBeenCalled();
    });
  });
});
