/**
 * Simple Message Integration Tests
 * 
 * Tests for shortcut chip integration in message components without UI rendering issues.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserMessage } from '../UserMessage';
import { Markdown } from '../Markdown';
import { useShortcutsStore } from '@/stores/shortcuts';
import type { Message } from '@/stores/chat';

// Mock the ShortcutChip component to avoid HugeiconsIcon issues
vi.mock('../ShortcutChip', async () => {
  const actual = await vi.importActual('../ShortcutChip');
  return {
    ...actual,
    ShortcutChip: ({ id, name }: { id: string; name: string }) => (
      <span data-testid={`shortcut-chip-${id}`} className="shortcut-chip">
        /{name}
      </span>
    ),
  };
});

// Mock chrome.storage.local
const mockStorage: Record<string, any> = {};

describe('Simple Message Integration', () => {
  beforeEach(() => {
    // Clear mock storage before each test
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    vi.clearAllMocks();
    
    // Reset store state
    useShortcutsStore.setState({ shortcuts: [], isLoaded: false });
    
    // Override chrome storage for this test
    (globalThis as any).chrome = {
      ...(globalThis as any).chrome,
      storage: {
        local: {
          get: vi.fn((keys: string | string[]) => {
            const result: Record<string, any> = {};
            if (typeof keys === 'string') {
              result[keys] = mockStorage[keys];
            } else {
              keys.forEach(key => {
                result[key] = mockStorage[key];
              });
            }
            return Promise.resolve(result);
          }),
          set: vi.fn((items: Record<string, any>) => {
            Object.assign(mockStorage, items);
            return Promise.resolve();
          }),
        },
      },
    } as any;
  });

  describe('UserMessage Integration', () => {
    it('should render shortcut chips in user messages', async () => {
      const store = useShortcutsStore.getState();
      
      // Create a test shortcut
      const shortcut = await store.createShortcut({
        command: 'test',
        name: 'Test Shortcut',
        prompt: 'This is a test prompt',
      });

      const message: Message = {
        id: '1',
        role: 'user',
        content: `Please use [[shortcut:${shortcut.id}:test]] to help me`,
        timestamp: Date.now(),
      };

      render(<UserMessage message={message} />);

      // Should render the shortcut chip
      expect(screen.getByTestId(`shortcut-chip-${shortcut.id}`)).toBeInTheDocument();
      expect(screen.getByText('/test')).toBeInTheDocument();
      expect(screen.getByText((content, element) => content.includes('Please use'))).toBeInTheDocument();
      expect(screen.getByText((content, element) => content.includes('to help me'))).toBeInTheDocument();
    });

    it('should render multiple shortcut chips in user messages', async () => {
      const store = useShortcutsStore.getState();
      
      // Create test shortcuts
      const shortcut1 = await store.createShortcut({
        command: 'first',
        prompt: 'First action',
      });
      
      const shortcut2 = await store.createShortcut({
        command: 'second',
        prompt: 'Second action',
      });

      const message: Message = {
        id: '1',
        role: 'user',
        content: `Start with [[shortcut:${shortcut1.id}:first]] then [[shortcut:${shortcut2.id}:second]]`,
        timestamp: Date.now(),
      };

      render(<UserMessage message={message} />);

      // Should render both shortcut chips
      expect(screen.getByTestId(`shortcut-chip-${shortcut1.id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`shortcut-chip-${shortcut2.id}`)).toBeInTheDocument();
      expect(screen.getByText('/first')).toBeInTheDocument();
      expect(screen.getByText('/second')).toBeInTheDocument();
      expect(screen.getByText((content, element) => content.includes('Start with'))).toBeInTheDocument();
      expect(screen.getByText((content, element) => content.includes('then'))).toBeInTheDocument();
    });

    it('should render normal text when no shortcut chips present', () => {
      const message: Message = {
        id: '1',
        role: 'user',
        content: 'This is a normal message without any shortcuts',
        timestamp: Date.now(),
      };

      render(<UserMessage message={message} />);

      expect(screen.getByText('This is a normal message without any shortcuts')).toBeInTheDocument();
      expect(screen.queryByTestId(/shortcut-chip/)).not.toBeInTheDocument();
    });
  });

  describe('Markdown Integration', () => {
    it('should render shortcut chips in markdown content', async () => {
      const store = useShortcutsStore.getState();
      
      const shortcut = await store.createShortcut({
        command: 'test',
        prompt: 'Test prompt',
      });

      const content = `Use [[shortcut:${shortcut.id}:test]] for testing`;

      render(<Markdown content={content} />);

      expect(screen.getByTestId(`shortcut-chip-${shortcut.id}`)).toBeInTheDocument();
      expect(screen.getByText('/test')).toBeInTheDocument();
      expect(screen.getByText('Use')).toBeInTheDocument();
      expect(screen.getByText('for testing')).toBeInTheDocument();
    });

    it('should render normal markdown when no shortcut chips present', () => {
      const content = `# Heading

This is **bold** text with \`code\` formatting.

- List item 1
- List item 2`;

      render(<Markdown content={content} />);

      expect(screen.getByText('Heading')).toBeInTheDocument();
      expect(screen.getByText('bold')).toBeInTheDocument();
      expect(screen.getByText('code')).toBeInTheDocument();
      expect(screen.getByText('List item 1')).toBeInTheDocument();
      expect(screen.queryByTestId(/shortcut-chip/)).not.toBeInTheDocument();
    });

    it('should handle mixed markdown and shortcut chips', async () => {
      const store = useShortcutsStore.getState();
      
      const shortcut = await store.createShortcut({
        command: 'action',
        prompt: 'Perform action',
      });

      const content = `# Instructions

First, use [[shortcut:${shortcut.id}:action]] to start.

Then follow these steps:
- Step 1: **Important** preparation
- Step 2: Run \`command\`
- Step 3: Use [[shortcut:${shortcut.id}:action]] again`;

      render(<Markdown content={content} />);

      // Should render shortcut chips
      const actionChips = screen.getAllByTestId(`shortcut-chip-${shortcut.id}`);
      expect(actionChips).toHaveLength(2);
      
      const actionTexts = screen.getAllByText('/action');
      expect(actionTexts).toHaveLength(2);
      
      // Should render markdown
      expect(screen.getByText('Instructions')).toBeInTheDocument();
      expect(screen.getByText('Important')).toBeInTheDocument();
      expect(screen.getByText('command')).toBeInTheDocument();
    });
  });

  describe('Integration Verification', () => {
    it('should demonstrate complete shortcut chip integration', async () => {
      const store = useShortcutsStore.getState();
      
      // Create shortcuts
      const screenshot = await store.createShortcut({
        command: 'screenshot',
        prompt: 'Take a screenshot of the current page',
      });
      
      const navigate = await store.createShortcut({
        command: 'navigate',
        prompt: 'Navigate to a specific URL',
      });

      // Test UserMessage integration
      const userMessage: Message = {
        id: '1',
        role: 'user',
        content: `Please [[shortcut:${screenshot.id}:screenshot]] and then [[shortcut:${navigate.id}:navigate]] to the results page`,
        timestamp: Date.now(),
      };

      const { unmount } = render(<UserMessage message={userMessage} />);

      // Verify user message rendering
      expect(screen.getByTestId(`shortcut-chip-${screenshot.id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`shortcut-chip-${navigate.id}`)).toBeInTheDocument();
      expect(screen.getByText('/screenshot')).toBeInTheDocument();
      expect(screen.getByText('/navigate')).toBeInTheDocument();

      unmount();

      // Test Markdown integration
      const markdownContent = `I'll help you with that. Here's what I'll do:

1. First, I'll [[shortcut:${screenshot.id}:screenshot]] to see the current state
2. Then I'll [[shortcut:${navigate.id}:navigate]] to the target page
3. Finally, I'll take another screenshot for comparison

This approach uses our **saved shortcuts** to streamline the process.`;

      render(<Markdown content={markdownContent} />);

      // Verify markdown rendering
      expect(screen.getByTestId(`shortcut-chip-${screenshot.id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`shortcut-chip-${navigate.id}`)).toBeInTheDocument();
      expect(screen.getByText('/screenshot')).toBeInTheDocument();
      expect(screen.getByText('/navigate')).toBeInTheDocument();
      expect(screen.getByText('saved shortcuts')).toBeInTheDocument();
    });
  });
});