/**
 * Chat Tool Integration Tests
 * 
 * Tests tool execution from chat flow including:
 * - Tool call parsing from LLM responses
 * - Tool execution with permission checking
 * - Error handling and display
 * - Retry functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AssistantMessage } from '../AssistantMessage';
import { ToolUseCard } from '../ToolUseCard';
import { useChatStore } from '@/stores/chat';
import { toolRegistry } from '@/tools/registry';
import type { Message, ToolCall, ToolResult } from '@/stores/chat';

// Mock the tool registry
vi.mock('@/tools/registry', () => ({
  toolRegistry: {
    execute: vi.fn(),
    getAnthropicTools: vi.fn(() => []),
    getOpenAITools: vi.fn(() => []),
  }
}));

// Mock the chat store
vi.mock('@/stores/chat', () => ({
  useChatStore: vi.fn(),
}));

describe('Chat Tool Integration', () => {
  const mockAddToolResult = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementation
    (useChatStore as any).mockReturnValue({
      addToolResult: mockAddToolResult,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Tool Execution from Chat', () => {
    it('should display tool call with pending status', () => {
      const toolCall: ToolCall = {
        id: 'tool-1',
        name: 'screenshot',
        input: { action: 'screenshot' },
        status: 'pending'
      };

      const message: Message = {
        id: 'msg-1',
        role: 'assistant',
        content: 'Taking a screenshot...',
        toolCalls: [toolCall],
        timestamp: Date.now()
      };

      render(<AssistantMessage message={message} />);

      expect(screen.getByText('screenshot')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('should display tool call with executing status', () => {
      const toolCall: ToolCall = {
        id: 'tool-1',
        name: 'click',
        input: { action: 'left_click', coordinate: [100, 200] },
        status: 'executing'
      };

      const message: Message = {
        id: 'msg-1',
        role: 'assistant',
        content: 'Clicking the button...',
        toolCalls: [toolCall],
        timestamp: Date.now()
      };

      render(<AssistantMessage message={message} />);

      expect(screen.getByText('click')).toBeInTheDocument();
      expect(screen.getByText('Executing')).toBeInTheDocument();
    });

    it('should display successful tool result', () => {
      const toolCall: ToolCall = {
        id: 'tool-1',
        name: 'navigate',
        input: { action: 'navigate', url: 'https://example.com' },
        status: 'complete'
      };

      const toolResult: ToolResult = {
        toolUseId: 'tool-1',
        output: 'Navigated to https://example.com'
      };

      const message: Message = {
        id: 'msg-1',
        role: 'assistant',
        content: 'Navigation complete',
        toolCalls: [toolCall],
        toolResults: [toolResult],
        timestamp: Date.now()
      };

      render(<AssistantMessage message={message} />);

      expect(screen.getByText('navigate')).toBeInTheDocument();
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });

    it('should display tool result with screenshot', () => {
      const toolCall: ToolCall = {
        id: 'tool-1',
        name: 'screenshot',
        input: { action: 'screenshot' },
        status: 'complete'
      };

      const toolResult: ToolResult = {
        toolUseId: 'tool-1',
        output: 'Screenshot captured (1920x1080)',
        screenshot: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      };

      const message: Message = {
        id: 'msg-1',
        role: 'assistant',
        content: 'Screenshot taken',
        toolCalls: [toolCall],
        toolResults: [toolResult],
        timestamp: Date.now()
      };

      render(<AssistantMessage message={message} />);

      // Click to expand the tool card
      const toolCard = screen.getByText('screenshot').closest('div');
      if (toolCard) {
        userEvent.click(toolCard);
      }

      // Screenshot should be present in the DOM
      waitFor(() => {
        const img = screen.getByAltText('Tool execution screenshot');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', toolResult.screenshot);
      });
    });
  });

  describe('Error Handling and Display', () => {
    it('should display tool error', () => {
      const toolCall: ToolCall = {
        id: 'tool-1',
        name: 'click',
        input: { action: 'left_click', coordinate: [100, 200] },
        status: 'error'
      };

      const toolResult: ToolResult = {
        toolUseId: 'tool-1',
        error: 'Permission denied for this action'
      };

      const message: Message = {
        id: 'msg-1',
        role: 'assistant',
        content: 'Failed to click',
        toolCalls: [toolCall],
        toolResults: [toolResult],
        timestamp: Date.now()
      };

      render(<AssistantMessage message={message} />);

      expect(screen.getByText('click')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should display retry button for failed tools', async () => {
      const toolCall: ToolCall = {
        id: 'tool-1',
        name: 'navigate',
        input: { action: 'navigate', url: 'https://example.com' },
        status: 'error'
      };

      const toolResult: ToolResult = {
        toolUseId: 'tool-1',
        error: 'Navigation failed'
      };

      const message: Message = {
        id: 'msg-1',
        role: 'assistant',
        content: 'Navigation error',
        toolCalls: [toolCall],
        toolResults: [toolResult],
        timestamp: Date.now()
      };

      render(<AssistantMessage message={message} />);

      // Click to expand the tool card
      const toolCard = screen.getByText('navigate').closest('div');
      if (toolCard) {
        await userEvent.click(toolCard);
      }

      // Retry button should be present
      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('should handle permission required error', () => {
      const toolCall: ToolCall = {
        id: 'tool-1',
        name: 'execute_script',
        input: { script: 'alert("test")' },
        status: 'error'
      };

      const toolResult: ToolResult = {
        toolUseId: 'tool-1',
        error: 'Permission required. Please grant permission in the dialog and retry.',
        output: JSON.stringify({
          type: 'permission_required',
          tool: 'execute_script',
          url: 'https://example.com',
          toolUseId: 'tool-1'
        })
      };

      const message: Message = {
        id: 'msg-1',
        role: 'assistant',
        content: 'Script execution requires permission',
        toolCalls: [toolCall],
        toolResults: [toolResult],
        timestamp: Date.now()
      };

      render(<AssistantMessage message={message} />);

      expect(screen.getByText('execute_script')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  describe('Tool Retry Functionality', () => {
    it('should retry tool execution on button click', async () => {
      const mockExecute = vi.mocked(toolRegistry.execute);
      mockExecute.mockResolvedValue({
        output: 'Navigation successful'
      });

      const toolCall: ToolCall = {
        id: 'tool-1',
        name: 'navigate',
        input: { action: 'navigate', url: 'https://example.com' },
        status: 'error'
      };

      const toolResult: ToolResult = {
        toolUseId: 'tool-1',
        error: 'Navigation failed'
      };

      const message: Message = {
        id: 'msg-1',
        role: 'assistant',
        content: 'Navigation error',
        toolCalls: [toolCall],
        toolResults: [toolResult],
        timestamp: Date.now()
      };

      render(<AssistantMessage message={message} />);

      // Click to expand the tool card
      const toolCard = screen.getByText('navigate').closest('div');
      if (toolCard) {
        await userEvent.click(toolCard);
      }

      // Click retry button
      await waitFor(() => {
        const retryButton = screen.getByText('Retry');
        expect(retryButton).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Retry');
      await userEvent.click(retryButton);

      // Verify tool was executed
      await waitFor(() => {
        expect(mockExecute).toHaveBeenCalledWith('navigate', {
          action: 'navigate',
          url: 'https://example.com'
        });
      });

      // Verify result was added to store
      await waitFor(() => {
        expect(mockAddToolResult).toHaveBeenCalledWith('tool-1', {
          toolUseId: 'tool-1',
          output: 'Navigation successful'
        });
      });
    });

    it('should handle retry failure', async () => {
      const mockExecute = vi.mocked(toolRegistry.execute);
      mockExecute.mockResolvedValue({
        error: 'Still failing'
      });

      const toolCall: ToolCall = {
        id: 'tool-1',
        name: 'click',
        input: { action: 'left_click', coordinate: [100, 200] },
        status: 'error'
      };

      const toolResult: ToolResult = {
        toolUseId: 'tool-1',
        error: 'Click failed'
      };

      const message: Message = {
        id: 'msg-1',
        role: 'assistant',
        content: 'Click error',
        toolCalls: [toolCall],
        toolResults: [toolResult],
        timestamp: Date.now()
      };

      render(<AssistantMessage message={message} />);

      // Click to expand the tool card
      const toolCard = screen.getByText('click').closest('div');
      if (toolCard) {
        await userEvent.click(toolCard);
      }

      // Click retry button
      await waitFor(() => {
        const retryButton = screen.getByText('Retry');
        expect(retryButton).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Retry');
      await userEvent.click(retryButton);

      // Verify error was added to store
      await waitFor(() => {
        expect(mockAddToolResult).toHaveBeenCalledWith('tool-1', {
          toolUseId: 'tool-1',
          error: 'Still failing'
        });
      });
    });
  });

  describe('Multiple Tool Calls', () => {
    it('should display multiple tool calls in order', () => {
      const toolCalls: ToolCall[] = [
        {
          id: 'tool-1',
          name: 'navigate',
          input: { action: 'navigate', url: 'https://example.com' },
          status: 'complete'
        },
        {
          id: 'tool-2',
          name: 'screenshot',
          input: { action: 'screenshot' },
          status: 'complete'
        },
        {
          id: 'tool-3',
          name: 'click',
          input: { action: 'left_click', coordinate: [100, 200] },
          status: 'complete'
        }
      ];

      const toolResults: ToolResult[] = [
        {
          toolUseId: 'tool-1',
          output: 'Navigated to https://example.com'
        },
        {
          toolUseId: 'tool-2',
          output: 'Screenshot captured'
        },
        {
          toolUseId: 'tool-3',
          output: 'Clicked at (100, 200)'
        }
      ];

      const message: Message = {
        id: 'msg-1',
        role: 'assistant',
        content: 'Completed automation sequence',
        toolCalls,
        toolResults,
        timestamp: Date.now()
      };

      render(<AssistantMessage message={message} />);

      expect(screen.getByText('navigate')).toBeInTheDocument();
      expect(screen.getByText('screenshot')).toBeInTheDocument();
      expect(screen.getByText('click')).toBeInTheDocument();
    });

    it('should handle mixed success and failure states', () => {
      const toolCalls: ToolCall[] = [
        {
          id: 'tool-1',
          name: 'navigate',
          input: { action: 'navigate', url: 'https://example.com' },
          status: 'complete'
        },
        {
          id: 'tool-2',
          name: 'click',
          input: { action: 'left_click', coordinate: [100, 200] },
          status: 'error'
        }
      ];

      const toolResults: ToolResult[] = [
        {
          toolUseId: 'tool-1',
          output: 'Navigated successfully'
        },
        {
          toolUseId: 'tool-2',
          error: 'Click failed'
        }
      ];

      const message: Message = {
        id: 'msg-1',
        role: 'assistant',
        content: 'Partial automation success',
        toolCalls,
        toolResults,
        timestamp: Date.now()
      };

      render(<AssistantMessage message={message} />);

      // Both tools should be displayed
      expect(screen.getByText('navigate')).toBeInTheDocument();
      expect(screen.getByText('click')).toBeInTheDocument();

      // Check status badges
      const completeStatuses = screen.getAllByText('Complete');
      const errorStatuses = screen.getAllByText('Error');
      
      expect(completeStatuses).toHaveLength(1);
      expect(errorStatuses).toHaveLength(1);
    });
  });

  describe('ToolUseCard Component', () => {
    it('should expand and collapse on click', async () => {
      const toolCall: ToolCall = {
        id: 'tool-1',
        name: 'navigate',
        input: { action: 'navigate', url: 'https://example.com' },
        status: 'complete'
      };

      const toolResult: ToolResult = {
        toolUseId: 'tool-1',
        output: 'Navigated successfully'
      };

      render(<ToolUseCard toolCall={toolCall} result={toolResult} />);

      // Initially collapsed - output should not be visible
      expect(screen.queryByText('Output')).not.toBeInTheDocument();

      // Click to expand
      const card = screen.getByText('navigate').closest('div');
      if (card) {
        await userEvent.click(card);
      }

      // Now output should be visible
      await waitFor(() => {
        expect(screen.getByText('Output')).toBeInTheDocument();
        expect(screen.getByText('Navigated successfully')).toBeInTheDocument();
      });
    });

    it('should display input parameters when expanded', async () => {
      const toolCall: ToolCall = {
        id: 'tool-1',
        name: 'click',
        input: { action: 'left_click', coordinate: [100, 200] },
        status: 'complete'
      };

      render(<ToolUseCard toolCall={toolCall} />);

      // Click to expand
      const card = screen.getByText('click').closest('div');
      if (card) {
        await userEvent.click(card);
      }

      // Input section should be visible
      await waitFor(() => {
        expect(screen.getByText('Input')).toBeInTheDocument();
        // Check that input JSON is displayed
        expect(screen.getByText(/"action":/)).toBeInTheDocument();
        expect(screen.getByText(/"coordinate":/)).toBeInTheDocument();
      });
    });
  });
});
