/**
 * ShortcutEditor Component Tests
 * 
 * Tests for the ShortcutEditor modal component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShortcutEditor } from '../ShortcutEditor';
import { useShortcutsStore } from '@/stores/shortcuts';
import type { SavedPrompt } from '@/lib/shortcuts';

// Mock the shortcuts store
vi.mock('@/stores/shortcuts', () => ({
  useShortcutsStore: vi.fn(),
  ShortcutValidationError: class ShortcutValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ShortcutValidationError';
    }
  },
}));

describe('ShortcutEditor', () => {
  const mockCreateShortcut = vi.fn();
  const mockUpdateShortcut = vi.fn();
  const mockOnOpenChange = vi.fn();
  const mockOnSuccess = vi.fn();

  const mockShortcut: SavedPrompt = {
    id: 'test-123',
    command: 'screenshot',
    name: 'Take Screenshot',
    prompt: 'Take a screenshot of the current page',
    usageCount: 5,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useShortcutsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      createShortcut: mockCreateShortcut,
      updateShortcut: mockUpdateShortcut,
    });
  });

  describe('Create Mode', () => {
    it('renders create mode dialog with correct title', () => {
      render(
        <ShortcutEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      expect(screen.getByText('Create Shortcut')).toBeInTheDocument();
      expect(screen.getByText('Create a new shortcut to quickly access common prompts.')).toBeInTheDocument();
    });

    it('renders all form fields', () => {
      render(
        <ShortcutEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      expect(screen.getByLabelText(/Command/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Display Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Prompt/)).toBeInTheDocument();
      expect(screen.getByLabelText(/URL/)).toBeInTheDocument();
    });

    it('enforces lowercase and no spaces in command field', () => {
      render(
        <ShortcutEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      const commandInput = screen.getByLabelText(/Command/) as HTMLInputElement;
      
      fireEvent.change(commandInput, { target: { value: 'My Command' } });
      
      expect(commandInput.value).toBe('my-command');
    });

    it('disables submit button when required fields are empty', () => {
      render(
        <ShortcutEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      const submitButton = screen.getByRole('button', { name: /Create/ });
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when required fields are filled', () => {
      render(
        <ShortcutEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      const commandInput = screen.getByLabelText(/Command/);
      const promptInput = screen.getByLabelText(/Prompt/);

      fireEvent.change(commandInput, { target: { value: 'test' } });
      fireEvent.change(promptInput, { target: { value: 'Test prompt' } });

      const submitButton = screen.getByRole('button', { name: /Create/ });
      expect(submitButton).not.toBeDisabled();
    });

    it('calls createShortcut on form submission', async () => {
      mockCreateShortcut.mockResolvedValue(mockShortcut);

      render(
        <ShortcutEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
          onSuccess={mockOnSuccess}
        />
      );

      const commandInput = screen.getByLabelText(/Command/);
      const promptInput = screen.getByLabelText(/Prompt/);

      fireEvent.change(commandInput, { target: { value: 'test' } });
      fireEvent.change(promptInput, { target: { value: 'Test prompt' } });

      const submitButton = screen.getByRole('button', { name: /Create/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCreateShortcut).toHaveBeenCalledWith({
          command: 'test',
          name: undefined,
          prompt: 'Test prompt',
          url: undefined,
        });
      });

      expect(mockOnSuccess).toHaveBeenCalledWith(mockShortcut);
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('handles validation errors', async () => {
      const { ShortcutValidationError } = await import('@/stores/shortcuts');
      mockCreateShortcut.mockRejectedValue(
        new ShortcutValidationError('Command already exists')
      );

      render(
        <ShortcutEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      const commandInput = screen.getByLabelText(/Command/);
      const promptInput = screen.getByLabelText(/Prompt/);

      fireEvent.change(commandInput, { target: { value: 'test' } });
      fireEvent.change(promptInput, { target: { value: 'Test prompt' } });

      const submitButton = screen.getByRole('button', { name: /Create/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Command already exists')).toBeInTheDocument();
      });
    });
  });

  describe('Edit Mode', () => {
    it('renders edit mode dialog with correct title', () => {
      render(
        <ShortcutEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="edit"
          shortcut={mockShortcut}
        />
      );

      expect(screen.getByText('Edit Shortcut')).toBeInTheDocument();
      expect(screen.getByText('Update your shortcut details.')).toBeInTheDocument();
    });

    it('pre-fills form with shortcut data', () => {
      render(
        <ShortcutEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="edit"
          shortcut={mockShortcut}
        />
      );

      const commandInput = screen.getByLabelText(/Command/) as HTMLInputElement;
      const nameInput = screen.getByLabelText(/Display Name/) as HTMLInputElement;
      const promptInput = screen.getByLabelText(/Prompt/) as HTMLTextAreaElement;

      expect(commandInput.value).toBe('screenshot');
      expect(nameInput.value).toBe('Take Screenshot');
      expect(promptInput.value).toBe('Take a screenshot of the current page');
    });

    it('calls updateShortcut on form submission', async () => {
      mockUpdateShortcut.mockResolvedValue(undefined);

      render(
        <ShortcutEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="edit"
          shortcut={mockShortcut}
          onSuccess={mockOnSuccess}
        />
      );

      const promptInput = screen.getByLabelText(/Prompt/);
      fireEvent.change(promptInput, { target: { value: 'Updated prompt' } });

      const submitButton = screen.getByRole('button', { name: /Save/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateShortcut).toHaveBeenCalledWith('test-123', {
          command: 'screenshot',
          name: 'Take Screenshot',
          prompt: 'Updated prompt',
          url: undefined,
        });
      });

      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Cancel Button', () => {
    it('closes dialog when cancel is clicked', () => {
      render(
        <ShortcutEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      const cancelButton = screen.getByRole('button', { name: /Cancel/ });
      fireEvent.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Optional Fields', () => {
    it('includes optional name and url in submission', async () => {
      mockCreateShortcut.mockResolvedValue(mockShortcut);

      render(
        <ShortcutEditor
          open={true}
          onOpenChange={mockOnOpenChange}
          mode="create"
        />
      );

      const commandInput = screen.getByLabelText(/Command/);
      const nameInput = screen.getByLabelText(/Display Name/);
      const promptInput = screen.getByLabelText(/Prompt/);
      const urlInput = screen.getByLabelText(/URL/);

      fireEvent.change(commandInput, { target: { value: 'test' } });
      fireEvent.change(nameInput, { target: { value: 'Test Name' } });
      fireEvent.change(promptInput, { target: { value: 'Test prompt' } });
      fireEvent.change(urlInput, { target: { value: 'https://example.com' } });

      const submitButton = screen.getByRole('button', { name: /Create/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCreateShortcut).toHaveBeenCalledWith({
          command: 'test',
          name: 'Test Name',
          prompt: 'Test prompt',
          url: 'https://example.com',
        });
      });
    });
  });
});
