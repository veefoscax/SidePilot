/**
 * SlashMenu Component Tests
 * 
 * Tests filtering behavior, keyboard navigation, and item selection
 * for the slash menu component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SlashMenu } from '../SlashMenu';
import { useShortcutsStore } from '@/stores/shortcuts';
import { SavedPrompt } from '@/lib/shortcuts';

// Mock the shortcuts store
vi.mock('@/stores/shortcuts', () => ({
  useShortcutsStore: vi.fn(),
}));

describe('SlashMenu', () => {
  const mockOnSelect = vi.fn();
  const mockOnClose = vi.fn();
  
  const mockShortcuts: SavedPrompt[] = [
    {
      id: '1',
      command: 'test',
      name: 'Test Shortcut',
      prompt: 'This is a test prompt',
      usageCount: 5,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: '2',
      command: 'demo',
      name: 'Demo Shortcut',
      prompt: 'This is a demo prompt',
      usageCount: 10,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];
  
  beforeEach(() => {
    vi.clearAllMocks();
    (useShortcutsStore as any).mockReturnValue({
      shortcuts: mockShortcuts,
    });
  });
  
  describe('Filtering Behavior', () => {
    it('should display all items when query is empty', () => {
      render(
        <SlashMenu
          query=""
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );
      
      // Should show system commands
      expect(screen.getByText('/screenshot')).toBeInTheDocument();
      expect(screen.getByText('/navigate')).toBeInTheDocument();
      
      // Should show user shortcuts
      expect(screen.getByText('/test')).toBeInTheDocument();
      expect(screen.getByText('/demo')).toBeInTheDocument();
      
      // Should show actions
      expect(screen.getByText('Record workflow')).toBeInTheDocument();
      expect(screen.getByText('Create shortcut')).toBeInTheDocument();
    });
    
    it('should filter items by name', () => {
      render(
        <SlashMenu
          query="screen"
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );
      
      // Should show matching system command
      expect(screen.getByText('/screenshot')).toBeInTheDocument();
      
      // Should not show non-matching items
      expect(screen.queryByText('/navigate')).not.toBeInTheDocument();
      expect(screen.queryByText('/test')).not.toBeInTheDocument();
    });
    
    it('should filter items by keywords', () => {
      render(
        <SlashMenu
          query="capture"
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );
      
      // Should show screenshot (has "capture" in keywords)
      expect(screen.getByText('/screenshot')).toBeInTheDocument();
    });
    
    it('should filter user shortcuts by command', () => {
      render(
        <SlashMenu
          query="test"
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );
      
      // Should show matching shortcut
      expect(screen.getByText('/test')).toBeInTheDocument();
      
      // Should not show non-matching shortcut
      expect(screen.queryByText('/demo')).not.toBeInTheDocument();
    });
    
    it('should show "No commands found" when no items match', () => {
      render(
        <SlashMenu
          query="nonexistent"
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );
      
      expect(screen.getByText('No commands found.')).toBeInTheDocument();
    });
    
    it('should be case-insensitive when filtering', () => {
      render(
        <SlashMenu
          query="SCREEN"
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );
      
      expect(screen.getByText('/screenshot')).toBeInTheDocument();
    });
  });
  
  describe('Keyboard Navigation', () => {
    it('should handle ArrowDown to move selection down', async () => {
      render(
        <SlashMenu
          query=""
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );
      
      // Press ArrowDown to move to second item
      fireEvent.keyDown(window, { key: 'ArrowDown' });
      
      // Press Enter to select the current item
      fireEvent.keyDown(window, { key: 'Enter' });
      
      await waitFor(() => {
        // Should have selected the second item (navigate)
        expect(mockOnSelect).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'navigate',
            name: 'Navigate',
          })
        );
      });
    });
    
    it('should handle ArrowUp to move selection up', async () => {
      render(
        <SlashMenu
          query=""
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );
      
      // Move down twice (to third item)
      fireEvent.keyDown(window, { key: 'ArrowDown' });
      fireEvent.keyDown(window, { key: 'ArrowDown' });
      
      // Move up once (back to second item)
      fireEvent.keyDown(window, { key: 'ArrowUp' });
      
      // Press Enter to select
      fireEvent.keyDown(window, { key: 'Enter' });
      
      await waitFor(() => {
        // Should have selected the second item (navigate)
        expect(mockOnSelect).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'navigate',
            name: 'Navigate',
          })
        );
      });
    });
    
    it('should not move selection below last item', async () => {
      render(
        <SlashMenu
          query="screenshot"
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );
      
      // Try to move down when only one item exists
      fireEvent.keyDown(window, { key: 'ArrowDown' });
      fireEvent.keyDown(window, { key: 'ArrowDown' });
      
      await waitFor(() => {
        const items = screen.getAllByRole('option');
        // Should stay on first (and only) item
        expect(items[0]).toHaveAttribute('data-selected', 'true');
      });
    });
    
    it('should not move selection above first item', async () => {
      render(
        <SlashMenu
          query=""
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );
      
      // Try to move up from first item
      fireEvent.keyDown(window, { key: 'ArrowUp' });
      
      await waitFor(() => {
        const items = screen.getAllByRole('option');
        expect(items[0]).toHaveAttribute('data-selected', 'true');
      });
    });
    
    it('should handle Enter to select current item', async () => {
      render(
        <SlashMenu
          query=""
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );
      
      // Press Enter (should select first item)
      fireEvent.keyDown(window, { key: 'Enter' });
      
      await waitFor(() => {
        expect(mockOnSelect).toHaveBeenCalledTimes(1);
        expect(mockOnSelect).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'screenshot',
            name: 'Screenshot',
          })
        );
      });
    });
    
    it('should handle Escape to close menu', async () => {
      render(
        <SlashMenu
          query=""
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );
      
      fireEvent.keyDown(window, { key: 'Escape' });
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });
    
    it('should reset selection when filtered items change', async () => {
      const { rerender } = render(
        <SlashMenu
          query=""
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );
      
      // Move down a few times
      fireEvent.keyDown(window, { key: 'ArrowDown' });
      fireEvent.keyDown(window, { key: 'ArrowDown' });
      
      // Change query to filter items
      rerender(
        <SlashMenu
          query="screenshot"
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );
      
      await waitFor(() => {
        // Selection should reset to first item
        const items = screen.getAllByRole('option');
        expect(items[0]).toHaveAttribute('data-selected', 'true');
      });
    });
  });
  
  describe('Item Selection', () => {
    it('should call onSelect when clicking an item', async () => {
      render(
        <SlashMenu
          query=""
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );
      
      const screenshotItem = screen.getByText('/screenshot');
      fireEvent.click(screenshotItem);
      
      await waitFor(() => {
        expect(mockOnSelect).toHaveBeenCalledTimes(1);
        expect(mockOnSelect).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'screenshot',
            name: 'Screenshot',
            action: 'chip',
            groupId: 'system',
          })
        );
      });
    });
    
    it('should call onSelect with correct shortcut data', async () => {
      render(
        <SlashMenu
          query=""
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );
      
      const testItem = screen.getByText('/test');
      fireEvent.click(testItem);
      
      await waitFor(() => {
        expect(mockOnSelect).toHaveBeenCalledTimes(1);
        expect(mockOnSelect).toHaveBeenCalledWith(
          expect.objectContaining({
            id: '1',
            name: 'Test Shortcut',
            action: 'chip',
            groupId: 'shortcuts',
          })
        );
      });
    });
    
    it('should call onSelect with action item data', async () => {
      render(
        <SlashMenu
          query=""
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );
      
      const createItem = screen.getByText('Create shortcut');
      fireEvent.click(createItem);
      
      await waitFor(() => {
        expect(mockOnSelect).toHaveBeenCalledTimes(1);
        expect(mockOnSelect).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'create-shortcut',
            name: 'Create shortcut',
            action: 'open-modal',
            groupId: 'actions',
          })
        );
      });
    });
  });
  
  describe('Grouping', () => {
    it('should display items in correct groups', () => {
      render(
        <SlashMenu
          query=""
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );
      
      // Check group headings exist
      expect(screen.getByText('System')).toBeInTheDocument();
      expect(screen.getByText('Shortcuts')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
    
    it('should show usage count for shortcuts', () => {
      render(
        <SlashMenu
          query=""
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );
      
      // Check usage counts are displayed
      expect(screen.getByText('5 uses')).toBeInTheDocument();
      expect(screen.getByText('10 uses')).toBeInTheDocument();
    });
    
    it('should not show empty groups', () => {
      // Mock empty shortcuts
      (useShortcutsStore as any).mockReturnValue({
        shortcuts: [],
      });
      
      render(
        <SlashMenu
          query="screenshot"
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );
      
      // System group should exist
      expect(screen.getByText('System')).toBeInTheDocument();
      
      // Shortcuts group should not exist (no shortcuts)
      expect(screen.queryByText('Shortcuts')).not.toBeInTheDocument();
      
      // Actions group should not exist (filtered out)
      expect(screen.queryByText('Actions')).not.toBeInTheDocument();
    });
  });
});
