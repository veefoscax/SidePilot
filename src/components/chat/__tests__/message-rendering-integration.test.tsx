/**
 * Message Rendering Integration Tests
 * 
 * Tests for shortcut chip integration in UserMessage and AssistantMessage components.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserMessage } from '../UserMessage';
import { AssistantMessage } from '../AssistantMessage';
import { Markdown } from '../Markdown';
import { useShortcutsStore } from '@/stores/shortcuts';
import type { Message } from '@/stores/chat';

// Mock chrome.storage.local
const mockStorage: Record<string, any> = {};

describe('Message Rendering Integration', () => {
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

  describe('UserMessage Shortcut Chip Rendering', () => {
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
      expect(screen.getByText('/test')).toBeInTheDocument();
      expect(screen.getByText('Please use')).toBeInTheDocument();
      expect(screen.getByText('to help me')).toBeInTheDocument();
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
      expect(screen.getByText('/first')).toBeInTheDocument();
      expect(screen.getByText('/second')).toBeInTheDocument();
      expect(screen.getByText('Start with')).toBeInTheDocument();
      expect(screen.getByText('then')).toBeInTheDocument();
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
    });
  });

  describe('AssistantMessage Shortcut Chip Rendering', () => {
    it('should render shortcut chips in assistant messages via Markdown', async () => {
      const store = useShortcutsStore.getState();
      
      // Create a test shortcut
      const shortcut = await store.createShortcut({
        command: 'screenshot',
        name: 'Screenshot',
        prompt: 'Take a screenshot of the current page',
      });

      const message: Message = {
        id: '1',
        role: 'assistant',
        content: `I'll use [[shortcut:${shortcut.id}:screenshot]] to capture the page for you.`,
        timestamp: Date.now(),
      };

      render(<AssistantMessage message={message} />);

      // Should render the shortcut chip
      expect(screen.getByText('/screenshot')).toBeInTheDocument();
      expect(screen.getByText("I'll use")).toBeInTheDocument();
      expect(screen.getByText('to capture the page for you.')).toBeInTheDocument();
    });

    it('should handle markdown content with shortcut chips', async () => {
      const store = useShortcutsStore.getState();
      
      const shortcut = await store.createShortcut({
        command: 'navigate',
        prompt: 'Navigate to a URL',
      });

      const message: Message = {
        id: '1',
        role: 'assistant',
        content: `Here's how to navigate:

1. Use [[shortcut:${shortcut.id}:navigate]] to go to a page
2. **Bold text** works too
3. \`code\` formatting is preserved

The shortcut [[shortcut:${shortcut.id}:navigate]] is very useful.`,
        timestamp: Date.now(),
      };

      render(<AssistantMessage message={message} />);

      // Should render shortcut chips
      const navigateChips = screen.getAllByText('/navigate');
      expect(navigateChips).toHaveLength(2);
      
      // Should render markdown formatting
      expect(screen.getByText('Bold text')).toBeInTheDocument();
      expect(screen.getByText('code')).toBeInTheDocument();
      expect(screen.getByText("Here's how to navigate:")).toBeInTheDocument();
    });
  });

  describe('Markdown Component Shortcut Integration', () => {
    it('should render shortcut chips in markdown content', async () => {
      const store = useShortcutsStore.getState();
      
      const shortcut = await store.createShortcut({
        command: 'test',
        prompt: 'Test prompt',
      });

      const content = `Use [[shortcut:${shortcut.id}:test]] for testing`;

      render(<Markdown content={content} />);

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
      const actionChips = screen.getAllByText('/action');
      expect(actionChips).toHaveLength(2);
      
      // Should render markdown
      expect(screen.getByText('Instructions')).toBeInTheDocument();
      expect(screen.getByText('Important')).toBeInTheDocument();
      expect(screen.getByText('command')).toBeInTheDocument();
    });
  });
});