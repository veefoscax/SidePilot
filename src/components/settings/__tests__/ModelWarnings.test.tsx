/**
 * Tests for ModelWarnings Component
 * 
 * Tests warning detection logic based on model capabilities
 * and alert rendering with appropriate severity styling.
 * 
 * Requirements: AC2 - Display prominent warning when tools not supported
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModelWarnings } from '../ModelWarnings';
import { ModelInfo, ModelCapabilities } from '@/providers/types';

/**
 * Helper to create a mock model with specified capabilities
 */
function createMockModel(
  capabilities: Partial<ModelCapabilities>,
  overrides: Partial<ModelInfo> = {}
): ModelInfo {
  return {
    id: 'test-model',
    name: 'Test Model',
    provider: 'openai',
    capabilities: {
      supportsVision: true,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: false,
      contextWindow: 128000,
      maxOutputTokens: 4096,
      ...capabilities,
    },
    ...overrides,
  };
}

describe('ModelWarnings', () => {
  describe('Warning Detection Logic', () => {
    it('should return null when model is null', () => {
      const { container } = render(<ModelWarnings model={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('should return null when model has all capabilities', () => {
      const model = createMockModel({
        supportsVision: true,
        supportsTools: true,
        supportsStreaming: true,
        contextWindow: 128000,
      });

      const { container } = render(<ModelWarnings model={model} />);
      expect(container.firstChild).toBeNull();
    });

    it('should show warning when model lacks tool support', () => {
      const model = createMockModel({
        supportsTools: false,
      });

      render(<ModelWarnings model={model} />);
      
      expect(screen.getByText('Tool use not supported')).toBeInTheDocument();
      expect(screen.getByText(/cannot use browser automation tools/i)).toBeInTheDocument();
    });

    it('should show warning when model lacks vision support', () => {
      const model = createMockModel({
        supportsVision: false,
      });

      render(<ModelWarnings model={model} />);
      
      expect(screen.getByText('Vision not supported')).toBeInTheDocument();
      expect(screen.getByText(/Screenshots will be converted to text descriptions/i)).toBeInTheDocument();
    });

    it('should show warning when model lacks streaming support', () => {
      const model = createMockModel({
        supportsStreaming: false,
      });

      render(<ModelWarnings model={model} />);
      
      expect(screen.getByText('Streaming not supported')).toBeInTheDocument();
      expect(screen.getByText(/Responses will appear all at once/i)).toBeInTheDocument();
    });

    it('should show warning when model has small context window', () => {
      const model = createMockModel({
        contextWindow: 4000, // Less than 8000 threshold
      });

      render(<ModelWarnings model={model} />);
      
      expect(screen.getByText('Limited context window')).toBeInTheDocument();
      expect(screen.getByText(/Long conversations may be truncated/i)).toBeInTheDocument();
    });

    it('should show multiple warnings when model lacks multiple capabilities', () => {
      const model = createMockModel({
        supportsTools: false,
        supportsVision: false,
        supportsStreaming: false,
      });

      render(<ModelWarnings model={model} />);
      
      expect(screen.getByText('Tool use not supported')).toBeInTheDocument();
      expect(screen.getByText('Vision not supported')).toBeInTheDocument();
      expect(screen.getByText('Streaming not supported')).toBeInTheDocument();
    });
  });

  describe('Alert Rendering', () => {
    it('should render destructive variant for tool warning (error type)', () => {
      const model = createMockModel({
        supportsTools: false,
      });

      render(<ModelWarnings model={model} />);
      
      // The alert should have the destructive variant class
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('border-destructive/50');
    });

    it('should render default variant with yellow styling for vision warning', () => {
      const model = createMockModel({
        supportsVision: false,
      });

      render(<ModelWarnings model={model} />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('border-yellow-500/50');
    });

    it('should render default variant with blue styling for streaming warning', () => {
      const model = createMockModel({
        supportsStreaming: false,
      });

      render(<ModelWarnings model={model} />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('border-blue-500/50');
    });

    it('should render alerts in correct order (error first)', () => {
      const model = createMockModel({
        supportsTools: false,
        supportsVision: false,
        supportsStreaming: false,
      });

      render(<ModelWarnings model={model} />);
      
      const alerts = screen.getAllByRole('alert');
      
      // First alert should be the tools warning (error type)
      expect(alerts[0]).toHaveTextContent('Tool use not supported');
      // Second should be vision warning
      expect(alerts[1]).toHaveTextContent('Vision not supported');
      // Third should be streaming warning
      expect(alerts[2]).toHaveTextContent('Streaming not supported');
    });

    it('should apply custom className when provided', () => {
      const model = createMockModel({
        supportsTools: false,
      });

      const { container } = render(
        <ModelWarnings model={model} className="custom-class" />
      );
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-class');
    });
  });

  describe('Edge Cases', () => {
    it('should handle model with all capabilities disabled', () => {
      const model = createMockModel({
        supportsVision: false,
        supportsTools: false,
        supportsStreaming: false,
        supportsReasoning: false,
        supportsPromptCache: false,
        contextWindow: 2000,
      });

      render(<ModelWarnings model={model} />);
      
      // Should show 4 warnings (tools, vision, streaming, small context)
      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBe(4);
    });

    it('should handle model with exactly 8000 context window (no warning)', () => {
      const model = createMockModel({
        contextWindow: 8000, // Exactly at threshold
      });

      const { container } = render(<ModelWarnings model={model} />);
      
      // Should not show context window warning
      expect(container.firstChild).toBeNull();
    });

    it('should handle model with 7999 context window (shows warning)', () => {
      const model = createMockModel({
        contextWindow: 7999, // Just below threshold
      });

      render(<ModelWarnings model={model} />);
      
      expect(screen.getByText('Limited context window')).toBeInTheDocument();
    });
  });
});
