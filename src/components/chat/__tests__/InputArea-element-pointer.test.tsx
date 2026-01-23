/**
 * InputArea Element Pointer Integration Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InputArea } from '../InputArea';
import { 
  ElementPointerMessageType, 
  formatPointedElementForChat,
  type PointedElement 
} from '@/lib/element-pointer';

// Mock chrome API
const mockChrome = {
  runtime: {
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    }
  }
};

global.chrome = mockChrome as any;

// Mock stores
vi.mock('@/stores/chat', () => ({
  useChatStore: () => ({
    messageQueue: [],
    queueMessage: vi.fn(),
    isStreaming: false
  })
}));

vi.mock('@/stores/shortcuts', () => ({
  useShortcutsStore: () => ({
    recordUsage: vi.fn(),
    getById: vi.fn(),
    getByCommand: vi.fn()
  })
}));

vi.mock('@/stores/workflow', () => ({
  useWorkflowStore: () => ({
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    status: 'idle',
    currentRecording: null
  })
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}));

describe('InputArea - Element Pointer Integration', () => {
  let messageListener: ((message: any) => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    messageListener = null;

    // Capture the message listener
    mockChrome.runtime.onMessage.addListener.mockImplementation((listener) => {
      messageListener = listener;
    });
  });

  it('renders element pointer button', () => {
    render(<InputArea onSend={vi.fn()} />);
    
    const button = screen.getByTitle('Point at element');
    expect(button).toBeInTheDocument();
  });

  it('receives pointed element message and updates placeholder', async () => {
    const onSend = vi.fn();
    render(<InputArea onSend={onSend} />);

    // Simulate element pointed message
    const pointedElement: PointedElement = {
      ref: '@e5',
      x: 245,
      y: 380,
      width: 120,
      height: 40,
      text: 'Submit',
      comment: 'click this button',
      tagName: 'button',
      role: 'button'
    };

    const message = {
      type: ElementPointerMessageType.ELEMENT_POINTED,
      data: pointedElement
    };

    // Trigger the message listener
    if (messageListener) {
      messageListener(message);
    }

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(/element selected/i);
      expect(textarea).toBeInTheDocument();
    });
  });

  it('includes element context in sent message', async () => {
    const onSend = vi.fn();
    render(<InputArea onSend={onSend} />);

    // Simulate element pointed message
    const pointedElement: PointedElement = {
      ref: '@e5',
      x: 245,
      y: 380,
      width: 120,
      height: 40,
      text: 'Submit',
      tagName: 'button'
    };

    const message = {
      type: ElementPointerMessageType.ELEMENT_POINTED,
      data: pointedElement
    };

    // Trigger the message listener
    if (messageListener) {
      messageListener(message);
    }

    // Wait for state update
    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(/element selected/i);
      expect(textarea).toBeInTheDocument();
    });

    // Type a message
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Click this element' } });

    // Send the message
    const sendButton = screen.getByRole('button', { name: '' }); // Send button
    fireEvent.click(sendButton);

    // Verify the message includes element context
    await waitFor(() => {
      expect(onSend).toHaveBeenCalled();
      const sentMessage = onSend.mock.calls[0][0];
      expect(sentMessage).toContain('User pointed at element:');
      expect(sentMessage).toContain('- Ref: @e5');
      expect(sentMessage).toContain('- Position: (245, 380)');
      expect(sentMessage).toContain('- Size: 120x40');
      expect(sentMessage).toContain('Click this element');
    });
  });

  it('clears element context after sending', async () => {
    const onSend = vi.fn();
    render(<InputArea onSend={onSend} />);

    // Simulate element pointed message
    const pointedElement: PointedElement = {
      ref: '@e5',
      x: 245,
      y: 380,
      width: 120,
      height: 40,
      text: 'Submit',
      tagName: 'button'
    };

    const message = {
      type: ElementPointerMessageType.ELEMENT_POINTED,
      data: pointedElement
    };

    // Trigger the message listener
    if (messageListener) {
      messageListener(message);
    }

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(/element selected/i);
      expect(textarea).toBeInTheDocument();
    });

    // Type and send a message
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Test message' } });
    
    const sendButton = screen.getByRole('button', { name: '' });
    fireEvent.click(sendButton);

    // Wait for send to complete
    await waitFor(() => {
      expect(onSend).toHaveBeenCalled();
    });

    // Placeholder should revert to default
    await waitFor(() => {
      const textareaAfter = screen.getByRole('textbox');
      expect(textareaAfter.placeholder).not.toContain('element selected');
    });
  });

  it('formats element context correctly', () => {
    const pointedElement: PointedElement = {
      ref: '@e5',
      x: 245,
      y: 380,
      width: 120,
      height: 40,
      text: 'Submit',
      comment: 'click this button',
      tagName: 'button',
      role: 'button'
    };

    const formatted = formatPointedElementForChat(pointedElement);

    expect(formatted).toContain('User pointed at element:');
    expect(formatted).toContain('- Ref: @e5');
    expect(formatted).toContain('- Position: (245, 380)');
    expect(formatted).toContain('- Size: 120x40');
    expect(formatted).toContain('- Text: "Submit"');
    expect(formatted).toContain('- Tag: button');
    expect(formatted).toContain('- Role: button');
    expect(formatted).toContain('- Comment: "click this button"');
  });

  it('shows toast notification when element is selected', async () => {
    const { toast } = await import('sonner');
    
    render(<InputArea onSend={vi.fn()} />);

    const pointedElement: PointedElement = {
      ref: '@e5',
      x: 245,
      y: 380,
      width: 120,
      height: 40,
      text: 'Submit',
      tagName: 'button'
    };

    const message = {
      type: ElementPointerMessageType.ELEMENT_POINTED,
      data: pointedElement
    };

    if (messageListener) {
      messageListener(message);
    }

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Element @e5 selected');
    });
  });
});
