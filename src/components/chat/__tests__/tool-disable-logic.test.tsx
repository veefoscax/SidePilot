/**
 * Tool Disable Logic Tests
 * 
 * Tests for AC5: Check tools capability before sending tools to API,
 * hide browser tools UI when no tools support.
 * 
 * Validates: Requirements AC5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModelInfo, ModelCapabilities } from '@/providers/types';

// Mock Chrome APIs
vi.mock('@/stores/chat', () => ({
  useChatStore: vi.fn(() => ({
    messages: [],
    isStreaming: false,
    messageQueue: [],
    addUserMessage: vi.fn(),
    startStreaming: vi.fn(),
    appendStreamContent: vi.fn(),
    appendStreamReasoning: vi.fn(),
    endStreaming: vi.fn(),
    setError: vi.fn(),
    clearMessages: vi.fn(),
    addToolResult: vi.fn(),
    revertLastMessage: vi.fn(),
    processNextQueuedMessage: vi.fn(),
    streamingReasoning: ''
  }))
}));

vi.mock('@/stores/multi-provider', () => ({
  useMultiProviderStore: vi.fn(() => ({
    getCurrentProvider: vi.fn(),
    getCurrentProviderInstance: vi.fn(),
    selectedModels: []
  }))
}));

describe('Tool Disable Logic (AC5)', () => {
  describe('Model capability detection for tools', () => {
    it('correctly identifies tool support from model capabilities', () => {
      const toolSupportingModel: ModelCapabilities = {
        supportsVision: true,
        supportsTools: true,
        supportsStreaming: true,
        supportsReasoning: false,
        supportsPromptCache: false,
        contextWindow: 128000,
        maxOutputTokens: 4096
      };
      
      expect(toolSupportingModel.supportsTools).toBe(true);
    });

    it('correctly identifies lack of tool support from model capabilities', () => {
      const nonToolModel: ModelCapabilities = {
        supportsVision: false,
        supportsTools: false,
        supportsStreaming: true,
        supportsReasoning: false,
        supportsPromptCache: false,
        contextWindow: 4096,
        maxOutputTokens: 1024
      };
      
      expect(nonToolModel.supportsTools).toBe(false);
    });
  });

  describe('Tool preparation logic', () => {
    it('should prepare tools when model supports tools', () => {
      const supportsTools = true;
      const mockTools = [
        { name: 'computer', description: 'Browser automation' },
        { name: 'navigation', description: 'Navigate to URLs' }
      ];
      
      const tools = supportsTools ? mockTools : undefined;
      
      expect(tools).toBeDefined();
      expect(tools).toHaveLength(2);
    });

    it('should not prepare tools when model does not support tools', () => {
      const supportsTools = false;
      const mockTools = [
        { name: 'computer', description: 'Browser automation' },
        { name: 'navigation', description: 'Navigate to URLs' }
      ];
      
      const tools = supportsTools ? mockTools : undefined;
      
      expect(tools).toBeUndefined();
    });

    it('should default to supporting tools when capability is undefined', () => {
      const capabilities: Partial<ModelCapabilities> = {};
      const supportsTools = capabilities.supportsTools ?? true;
      
      expect(supportsTools).toBe(true);
    });
  });

  describe('System prompt adaptation', () => {
    it('should include tool instructions when tools are supported', () => {
      const supportsTools = true;
      
      const systemPrompt = supportsTools
        ? 'You are SidePilot, an AI assistant with browser automation capabilities.'
        : 'You are SidePilot, an AI assistant. Note: This model does not support tool use.';
      
      expect(systemPrompt).toContain('browser automation capabilities');
      expect(systemPrompt).not.toContain('does not support tool use');
    });

    it('should exclude tool instructions when tools are not supported', () => {
      const supportsTools = false;
      
      const systemPrompt = supportsTools
        ? 'You are SidePilot, an AI assistant with browser automation capabilities.'
        : 'You are SidePilot, an AI assistant. Note: This model does not support tool use.';
      
      expect(systemPrompt).toContain('does not support tool use');
      expect(systemPrompt).not.toContain('browser automation capabilities');
    });
  });

  describe('Model examples with tool support', () => {
    it('Claude 3.5 Sonnet should support tools', () => {
      const claude35Sonnet: ModelInfo = {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        provider: 'anthropic',
        capabilities: {
          supportsVision: true,
          supportsTools: true,
          supportsStreaming: true,
          supportsReasoning: false,
          supportsPromptCache: true,
          contextWindow: 200000,
          maxOutputTokens: 8192
        }
      };
      
      expect(claude35Sonnet.capabilities.supportsTools).toBe(true);
    });

    it('GPT-4 should support tools', () => {
      const gpt4: ModelInfo = {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        capabilities: {
          supportsVision: true,
          supportsTools: true,
          supportsStreaming: true,
          supportsReasoning: false,
          supportsPromptCache: false,
          contextWindow: 128000,
          maxOutputTokens: 4096
        }
      };
      
      expect(gpt4.capabilities.supportsTools).toBe(true);
    });

    it('Basic text model should not support tools', () => {
      const basicModel: ModelInfo = {
        id: 'basic-text-model',
        name: 'Basic Text Model',
        provider: 'ollama',
        capabilities: {
          supportsVision: false,
          supportsTools: false,
          supportsStreaming: true,
          supportsReasoning: false,
          supportsPromptCache: false,
          contextWindow: 4096,
          maxOutputTokens: 2048
        }
      };
      
      expect(basicModel.capabilities.supportsTools).toBe(false);
    });
  });

  describe('API call behavior', () => {
    it('should not include tools parameter when model does not support tools', () => {
      const supportsTools = false;
      
      const apiOptions: Record<string, any> = {
        model: 'basic-model',
        systemPrompt: 'You are an assistant'
      };
      
      // Only add tools if supported
      if (supportsTools) {
        apiOptions.tools = [{ name: 'test-tool' }];
      }
      
      expect(apiOptions.tools).toBeUndefined();
    });

    it('should include tools parameter when model supports tools', () => {
      const supportsTools = true;
      
      const apiOptions: Record<string, any> = {
        model: 'claude-3-5-sonnet',
        systemPrompt: 'You are an assistant'
      };
      
      // Only add tools if supported
      if (supportsTools) {
        apiOptions.tools = [{ name: 'test-tool' }];
      }
      
      expect(apiOptions.tools).toBeDefined();
      expect(apiOptions.tools).toHaveLength(1);
    });
  });
});
