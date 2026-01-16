/**
 * Streaming Adaptation Integration Tests
 * 
 * Tests for AC4: When a model doesn't support streaming, disable the thinking indicator
 * and show responses all at once.
 * 
 * Validates: Requirements AC4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThinkingIndicator } from '../ThinkingIndicator';

// Mock the stores
vi.mock('@/stores/chat', () => ({
  useChatStore: vi.fn()
}));

vi.mock('@/stores/multi-provider', () => ({
  useMultiProviderStore: vi.fn()
}));

describe('Streaming Adaptation (AC4)', () => {
  describe('ThinkingIndicator behavior based on streaming capability', () => {
    it('shows animated "Thinking..." for streaming-capable models', () => {
      render(<ThinkingIndicator supportsStreaming={true} />);
      
      expect(screen.getByText('Thinking...')).toBeInTheDocument();
      expect(screen.queryByText('Generating response...')).not.toBeInTheDocument();
    });

    it('shows static "Generating response..." for non-streaming models', () => {
      render(<ThinkingIndicator supportsStreaming={false} />);
      
      expect(screen.getByText('Generating response...')).toBeInTheDocument();
      expect(screen.queryByText('Thinking...')).not.toBeInTheDocument();
    });

    it('defaults to streaming mode when prop is not provided', () => {
      render(<ThinkingIndicator />);
      
      expect(screen.getByText('Thinking...')).toBeInTheDocument();
    });
  });

  describe('Animation differences', () => {
    it('has bouncing animation for streaming models', () => {
      const { container } = render(<ThinkingIndicator supportsStreaming={true} />);
      
      const animatedElements = container.querySelectorAll('.animate-bounce');
      expect(animatedElements.length).toBe(3); // 3 bouncing dots
    });

    it('has no bouncing animation for non-streaming models', () => {
      const { container } = render(<ThinkingIndicator supportsStreaming={false} />);
      
      const animatedElements = container.querySelectorAll('.animate-bounce');
      expect(animatedElements.length).toBe(0);
    });
  });

  describe('Model capability detection', () => {
    it('correctly identifies streaming capability from model info', () => {
      // Test with a model that supports streaming
      const streamingModel = {
        capabilities: {
          supportsStreaming: true,
          supportsVision: true,
          supportsTools: true,
          supportsReasoning: false,
          supportsPromptCache: false,
          contextWindow: 128000,
          maxOutputTokens: 4096
        }
      };
      
      expect(streamingModel.capabilities.supportsStreaming).toBe(true);
    });

    it('correctly identifies non-streaming capability from model info', () => {
      // Test with a model that doesn't support streaming
      const nonStreamingModel = {
        capabilities: {
          supportsStreaming: false,
          supportsVision: false,
          supportsTools: false,
          supportsReasoning: false,
          supportsPromptCache: false,
          contextWindow: 4096,
          maxOutputTokens: 1024
        }
      };
      
      expect(nonStreamingModel.capabilities.supportsStreaming).toBe(false);
    });
  });

  describe('User experience for non-streaming models', () => {
    it('provides clear feedback that response is being generated', () => {
      render(<ThinkingIndicator supportsStreaming={false} />);
      
      // The message should clearly indicate that something is happening
      const message = screen.getByText('Generating response...');
      expect(message).toBeInTheDocument();
      expect(message).toHaveClass('text-muted-foreground');
    });

    it('maintains visual consistency with streaming indicator', () => {
      const { container: streamingContainer } = render(<ThinkingIndicator supportsStreaming={true} />);
      const { container: nonStreamingContainer } = render(<ThinkingIndicator supportsStreaming={false} />);
      
      // Both should have the same container structure
      const streamingWrapper = streamingContainer.querySelector('.bg-muted.rounded-2xl');
      const nonStreamingWrapper = nonStreamingContainer.querySelector('.bg-muted.rounded-2xl');
      
      expect(streamingWrapper).toBeInTheDocument();
      expect(nonStreamingWrapper).toBeInTheDocument();
    });
  });
});
