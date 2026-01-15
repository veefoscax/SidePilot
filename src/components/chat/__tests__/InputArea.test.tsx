/**
 * InputArea Component Tests
 * 
 * Tests for chat input integration with slash menu and shortcut chips.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InputArea } from '../InputArea';
import { useShortcutsStore } from '@/stores/shortcuts';
import { useChatStore } from '@/stores/chat';

// Mock stores
vi.mock('@/stores/shortcuts');
vi.mock('@/stores/chat');

// Mock VoiceControls component
vi.mock('../VoiceControls', () => ({
  VoiceControls: () => <div data-testid="voice-controls">Voice Controls</div>,
}));

// Mock SlashMenu component
vi.mock('../SlashMenu', () => ({
  SlashMenu: ({ query, onSelect, onClose }: any) => (
    <div data-testid="slash-menu">
      <div data-testid="slash-query">{query}</div>
      <button onClick={() => onSelect({ id: 'test', name: 'test', action: 'chip', groupId: 'system' })}>
        Select Item
      </button>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

// Mock ShortcutEditor component
vi.mock('../ShortcutEditor', () => ({
  ShortcutEditor: ({ open }: any) => (
    open ? <div data-testid="shortcut-editor">Shortcut Editor</div> : null
  ),
}));

describe('InputArea - Slash Menu Integration', () => {
  const mockOnSend = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default store mocks
    vi.mocked(useChatStore).mockReturnValue({
      messageQueue: [],
      queueMessage: vi.fn(),
      isStreaming: false,
    } as any);
    
    vi.mocked(useShortcutsStore).mockReturnValue({
      shortcuts: [],
      recordUsage: vi.fn(),
      getById: vi.fn(),
    } as any);
  });
  
  it('should render input area', () => {
    render(<InputArea onSend={mockOnSend} />);
    
    expect(screen.getByPlaceholderText('Message...')).toBeInTheDocument();
  });
  
  it('should show slash menu when "/" is typed', async () => {
    const user = userEvent.setup();
    render(<InputArea onSend={mockOnSend} />);
    
    const textarea = screen.getByPlaceholderText('Message...');
    await user.type(textarea, '/');
    
    await waitFor(() => {
      expect(screen.getByTestId('slash-menu')).toBeInTheDocument();
    });
  });
  
  it('should update slash query as user types', async () => {
    const user = userEvent.setup();
    render(<InputArea onSend={mockOnSend} />);
    
    const textarea = screen.getByPlaceholderText('Message...');
    await user.type(textarea, '/scr');
    
    await waitFor(() => {
      expect(screen.getByTestId('slash-query')).toHaveTextContent('scr');
    });
  });
  
  it('should close slash menu on escape', async () => {
    const user = userEvent.setup();
    render(<InputArea onSend={mockOnSend} />);
    
    const textarea = screen.getByPlaceholderText('Message...');
    await user.type(textarea, '/');
    
    await waitFor(() => {
      expect(screen.getByTestId('slash-menu')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Close'));
    
    await waitFor(() => {
      expect(screen.queryByTestId('slash-menu')).not.toBeInTheDocument();
    });
  });
  
  it('should insert chip when slash menu item is selected', async () => {
    const user = userEvent.setup();
    render(<InputArea onSend={mockOnSend} />);
    
    const textarea = screen.getByPlaceholderText('Message...') as HTMLTextAreaElement;
    await user.type(textarea, '/');
    
    await waitFor(() => {
      expect(screen.getByTestId('slash-menu')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Select Item'));
    
    await waitFor(() => {
      expect(textarea.value).toContain('[[shortcut:test:test]]');
    });
  });
  
  it('should expand shortcut chips on send', async () => {
    const mockGetById = vi.fn().mockReturnValue({
      id: 'test-id',
      command: 'test',
      prompt: 'Test prompt content',
      usageCount: 0,
    });
    
    vi.mocked(useShortcutsStore).mockReturnValue({
      shortcuts: [],
      recordUsage: vi.fn(),
      getById: mockGetById,
    } as any);
    
    const user = userEvent.setup();
    render(<InputArea onSend={mockOnSend} />);
    
    const textarea = screen.getByPlaceholderText('Message...') as HTMLTextAreaElement;
    
    // Manually set the value with a chip
    fireEvent.change(textarea, { target: { value: '[[shortcut:test-id:test]]' } });
    
    // Send the message
    await user.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(mockOnSend).toHaveBeenCalledWith('Test prompt content');
    });
  });
  
  it('should record usage when shortcut is expanded', async () => {
    const mockRecordUsage = vi.fn();
    const mockGetById = vi.fn().mockReturnValue({
      id: 'test-id',
      command: 'test',
      prompt: 'Test prompt content',
      usageCount: 0,
    });
    
    vi.mocked(useShortcutsStore).mockReturnValue({
      shortcuts: [],
      recordUsage: mockRecordUsage,
      getById: mockGetById,
    } as any);
    
    const user = userEvent.setup();
    render(<InputArea onSend={mockOnSend} />);
    
    const textarea = screen.getByPlaceholderText('Message...') as HTMLTextAreaElement;
    
    // Manually set the value with a chip
    fireEvent.change(textarea, { target: { value: '[[shortcut:test-id:test]]' } });
    
    // Send the message
    await user.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(mockRecordUsage).toHaveBeenCalledWith('test-id');
    });
  });
  
  it('should not show slash menu after space', async () => {
    const user = userEvent.setup();
    render(<InputArea onSend={mockOnSend} />);
    
    const textarea = screen.getByPlaceholderText('Message...');
    await user.type(textarea, '/test ');
    
    await waitFor(() => {
      expect(screen.queryByTestId('slash-menu')).not.toBeInTheDocument();
    });
  });
  
  it('should show slash menu after space when "/" is typed again', async () => {
    const user = userEvent.setup();
    render(<InputArea onSend={mockOnSend} />);
    
    const textarea = screen.getByPlaceholderText('Message...');
    await user.type(textarea, 'hello /');
    
    await waitFor(() => {
      expect(screen.getByTestId('slash-menu')).toBeInTheDocument();
    });
  });
});
