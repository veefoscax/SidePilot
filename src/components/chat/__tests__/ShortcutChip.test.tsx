/**
 * ShortcutChip Component Tests
 * 
 * Tests for the ShortcutChip component and parseShortcutChips utility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShortcutChip, parseShortcutChips } from '../ShortcutChip';
import { useShortcutsStore } from '@/stores/shortcuts';
import type { SavedPrompt } from '@/lib/shortcuts';

// Mock the shortcuts store
vi.mock('@/stores/shortcuts', () => ({
  useShortcutsStore: vi.fn(),
}));

describe('ShortcutChip', () => {
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
      getById: (id: string) => (id === 'test-123' ? mockShortcut : undefined),
    });
  });

  it('renders chip with command name', () => {
    render(<ShortcutChip id="test-123" name="screenshot" />);
    
    expect(screen.getByText('/screenshot')).toBeInTheDocument();
  });

  it('renders chip with icon', () => {
    const { container } = render(<ShortcutChip id="test-123" name="screenshot" />);
    
    // Check for the icon wrapper
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('handles non-existent shortcut gracefully', () => {
    render(<ShortcutChip id="non-existent" name="unknown" />);
    
    expect(screen.getByText('/unknown')).toBeInTheDocument();
  });
});

describe('parseShortcutChips', () => {
  it('returns original content when no chips present', () => {
    const content = 'This is a plain message';
    const result = parseShortcutChips(content);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(content);
  });

  it('parses single shortcut chip', () => {
    const content = 'Use [[shortcut:123:screenshot]] to capture';
    const result = parseShortcutChips(content);
    
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Use ');
    expect(result[2]).toBe(' to capture');
  });

  it('parses multiple shortcut chips', () => {
    const content = 'Use [[shortcut:123:screenshot]] and [[shortcut:456:navigate]] together';
    const result = parseShortcutChips(content);
    
    expect(result).toHaveLength(5);
    expect(result[0]).toBe('Use ');
    expect(result[2]).toBe(' and ');
    expect(result[4]).toBe(' together');
  });

  it('handles consecutive chips', () => {
    const content = '[[shortcut:123:screenshot]][[shortcut:456:navigate]]';
    const result = parseShortcutChips(content);
    
    expect(result).toHaveLength(2);
  });

  it('handles chip at start of content', () => {
    const content = '[[shortcut:123:screenshot]] at the beginning';
    const result = parseShortcutChips(content);
    
    expect(result).toHaveLength(2);
    expect(result[1]).toBe(' at the beginning');
  });

  it('handles chip at end of content', () => {
    const content = 'At the end [[shortcut:123:screenshot]]';
    const result = parseShortcutChips(content);
    
    expect(result).toHaveLength(2);
    expect(result[0]).toBe('At the end ');
  });

  it('handles empty content', () => {
    const content = '';
    const result = parseShortcutChips(content);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('');
  });

  it('preserves special characters in text', () => {
    const content = 'Special chars: !@#$%^&*() [[shortcut:123:test]] more text';
    const result = parseShortcutChips(content);
    
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Special chars: !@#$%^&*() ');
    expect(result[2]).toBe(' more text');
  });

  it('handles chips with hyphens and underscores in names', () => {
    const content = '[[shortcut:123:my-test_command]]';
    const result = parseShortcutChips(content);
    
    expect(result).toHaveLength(1);
    // Should render a ShortcutChip component
  });
});
