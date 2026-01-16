/**
 * ThinkingIndicator Component Tests
 * 
 * Tests for AC4: When a model doesn't support streaming, disable the thinking indicator
 * and show responses all at once with a static "Generating..." message.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThinkingIndicator } from '../ThinkingIndicator';

describe('ThinkingIndicator', () => {
  describe('Streaming Mode (default)', () => {
    it('shows animated thinking indicator when supportsStreaming is true', () => {
      render(<ThinkingIndicator supportsStreaming={true} />);
      
      expect(screen.getByText('Thinking...')).toBeInTheDocument();
    });

    it('shows animated thinking indicator by default (no props)', () => {
      render(<ThinkingIndicator />);
      
      expect(screen.getByText('Thinking...')).toBeInTheDocument();
    });

    it('renders bouncing dots for streaming models', () => {
      const { container } = render(<ThinkingIndicator supportsStreaming={true} />);
      
      // Check for animated bouncing dots (3 dots with animate-bounce class)
      const bouncingDots = container.querySelectorAll('.animate-bounce');
      expect(bouncingDots.length).toBe(3);
    });
  });

  describe('Non-Streaming Mode (AC4)', () => {
    it('shows static "Generating response..." message when supportsStreaming is false', () => {
      render(<ThinkingIndicator supportsStreaming={false} />);
      
      expect(screen.getByText('Generating response...')).toBeInTheDocument();
    });

    it('does NOT show "Thinking..." text for non-streaming models', () => {
      render(<ThinkingIndicator supportsStreaming={false} />);
      
      expect(screen.queryByText('Thinking...')).not.toBeInTheDocument();
    });

    it('does NOT render bouncing dots for non-streaming models', () => {
      const { container } = render(<ThinkingIndicator supportsStreaming={false} />);
      
      // Should not have animated bouncing dots
      const bouncingDots = container.querySelectorAll('.animate-bounce');
      expect(bouncingDots.length).toBe(0);
    });

    it('renders a static dot indicator for non-streaming models', () => {
      const { container } = render(<ThinkingIndicator supportsStreaming={false} />);
      
      // Should have a single static dot (no animation)
      const staticDots = container.querySelectorAll('.rounded-full:not(.animate-bounce)');
      expect(staticDots.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Visual Styling', () => {
    it('has consistent container styling regardless of streaming mode', () => {
      const { container: streamingContainer } = render(<ThinkingIndicator supportsStreaming={true} />);
      const { container: nonStreamingContainer } = render(<ThinkingIndicator supportsStreaming={false} />);
      
      // Both should have the same outer container structure
      const streamingOuter = streamingContainer.querySelector('.bg-muted');
      const nonStreamingOuter = nonStreamingContainer.querySelector('.bg-muted');
      
      expect(streamingOuter).toBeInTheDocument();
      expect(nonStreamingOuter).toBeInTheDocument();
    });
  });
});
