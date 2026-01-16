/**
 * Vision Fallback Tests
 * 
 * Tests for the getPageRepresentation utility that provides
 * vision or text fallback based on model capabilities.
 * 
 * Requirements: AC3 - Use accessibility snapshot instead of screenshots for non-vision models
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ModelInfo } from '@/providers/types';

// Mock chrome.scripting API before imports
const mockExecuteScript = vi.fn();
(global as any).chrome = {
  scripting: {
    executeScript: mockExecuteScript
  }
};

// Mock the CDP wrapper module - use inline factory to avoid hoisting issues
vi.mock('@/lib/cdp-wrapper', () => ({
  cdpWrapper: {
    ensureAttached: vi.fn(),
    screenshot: vi.fn(),
    executeCDPCommand: vi.fn()
  }
}));

// Import after mocks are set up
import { 
  getPageRepresentation, 
  getAccessibilitySnapshot,
  getPageRepresentationType 
} from '../model-capabilities';
import { cdpWrapper } from '@/lib/cdp-wrapper';

describe('Vision Fallback', () => {
  // Helper to create model info
  const createModelInfo = (supportsVision: boolean): ModelInfo => ({
    id: 'test-model',
    name: 'Test Model',
    provider: 'openai',
    capabilities: {
      supportsVision,
      supportsTools: true,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsPromptCache: false,
      contextWindow: 128000,
      maxOutputTokens: 4096
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    vi.mocked(cdpWrapper.ensureAttached).mockResolvedValue(undefined);
    vi.mocked(cdpWrapper.screenshot).mockResolvedValue({
      data: 'base64-screenshot-data',
      width: 1920,
      height: 1080,
      devicePixelRatio: 1
    });
    vi.mocked(cdpWrapper.executeCDPCommand).mockResolvedValue({
      nodes: [
        {
          nodeId: '1',
          role: { value: 'WebArea' },
          name: { value: 'Test Page' },
          childIds: ['2', '3']
        },
        {
          nodeId: '2',
          parentId: '1',
          role: { value: 'heading' },
          name: { value: 'Welcome' }
        },
        {
          nodeId: '3',
          parentId: '1',
          role: { value: 'button' },
          name: { value: 'Click Me' }
        }
      ]
    });
    
    mockExecuteScript.mockResolvedValue([{
      result: {
        url: 'https://example.com',
        title: 'Example Page',
        elements: [
          {
            tagName: 'button',
            role: 'button',
            text: 'Submit',
            description: 'Submit button',
            interactive: true,
            ref: 'element_1',
            children: []
          }
        ]
      }
    }]);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getPageRepresentationType', () => {
    it('should return "vision" for vision-capable models', () => {
      const model = createModelInfo(true);
      expect(getPageRepresentationType(model)).toBe('vision');
    });

    it('should return "text" for text-only models', () => {
      const model = createModelInfo(false);
      expect(getPageRepresentationType(model)).toBe('text');
    });
  });

  describe('getPageRepresentation', () => {
    it('should return image content for vision-capable models', async () => {
      const model = createModelInfo(true);
      const tabId = 123;

      const result = await getPageRepresentation(tabId, model);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('image');
      expect(result[0].image).toBeDefined();
      expect(result[0].image?.data).toBe('base64-screenshot-data');
      expect(result[0].image?.mediaType).toBe('image/png');
    });

    it('should return text content for text-only models', async () => {
      const model = createModelInfo(false);
      const tabId = 123;

      const result = await getPageRepresentation(tabId, model);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('text');
      expect(result[0].text).toBeDefined();
      expect(result[0].text).toContain('[Page Content - Accessibility Snapshot]');
    });

    it('should fall back to accessibility when screenshot fails for vision models', async () => {
      vi.mocked(cdpWrapper.screenshot).mockRejectedValueOnce(new Error('Screenshot failed'));

      const model = createModelInfo(true);
      const tabId = 123;

      const result = await getPageRepresentation(tabId, model);

      // Should fall back to text
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('text');
      expect(result[0].text).toContain('[Page Content - Accessibility Snapshot]');
    });

    it('should ensure CDP is attached before capturing', async () => {
      const model = createModelInfo(true);
      const tabId = 456;

      await getPageRepresentation(tabId, model);

      expect(cdpWrapper.ensureAttached).toHaveBeenCalledWith(tabId);
    });
  });

  describe('getAccessibilitySnapshot', () => {
    it('should format accessibility tree nodes correctly', async () => {
      const tabId = 123;

      const result = await getAccessibilitySnapshot(tabId);

      // Should contain formatted accessibility data
      expect(result).toContain('[WebArea]');
      expect(result).toContain('[heading]');
      expect(result).toContain('[button]');
      expect(result).toContain('Welcome');
      expect(result).toContain('Click Me');
    });

    it('should use content script fallback when CDP returns empty nodes', async () => {
      // First call is Accessibility.enable, second is getFullAXTree
      vi.mocked(cdpWrapper.executeCDPCommand)
        .mockResolvedValueOnce(undefined) // Accessibility.enable
        .mockResolvedValueOnce({ nodes: [] }); // getFullAXTree returns empty

      const tabId = 123;

      const result = await getAccessibilitySnapshot(tabId);

      // Should use content script fallback
      expect(mockExecuteScript).toHaveBeenCalled();
      expect(result).toContain('URL: https://example.com');
      expect(result).toContain('Title: Example Page');
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(cdpWrapper.ensureAttached).mockRejectedValueOnce(new Error('CDP error'));

      const tabId = 123;

      const result = await getAccessibilitySnapshot(tabId);

      expect(result).toContain('Error retrieving accessibility data');
      expect(result).toContain('CDP error');
    });

    it('should enable accessibility domain before getting tree', async () => {
      const tabId = 789;

      await getAccessibilitySnapshot(tabId);

      expect(cdpWrapper.executeCDPCommand).toHaveBeenCalledWith(tabId, 'Accessibility.enable');
      expect(cdpWrapper.executeCDPCommand).toHaveBeenCalledWith(tabId, 'Accessibility.getFullAXTree');
    });
  });

  describe('Capability-based routing', () => {
    /**
     * Validates: Requirements AC3
     * When a model doesn't support vision, the system should use accessibility snapshot
     */
    it('should route to correct representation based on model capabilities', async () => {
      const tabId = 123;

      // Vision model should use screenshot
      const visionModel = createModelInfo(true);
      const visionResult = await getPageRepresentation(tabId, visionModel);
      expect(visionResult[0].type).toBe('image');
      expect(cdpWrapper.screenshot).toHaveBeenCalled();

      vi.clearAllMocks();
      
      // Reset mocks for text model test
      vi.mocked(cdpWrapper.ensureAttached).mockResolvedValue(undefined);
      vi.mocked(cdpWrapper.executeCDPCommand).mockResolvedValue({
        nodes: [
          { nodeId: '1', role: { value: 'WebArea' }, name: { value: 'Test' } }
        ]
      });

      // Text-only model should use accessibility
      const textModel = createModelInfo(false);
      const textResult = await getPageRepresentation(tabId, textModel);
      expect(textResult[0].type).toBe('text');
      expect(cdpWrapper.screenshot).not.toHaveBeenCalled();
    });

    it('should include accessibility snapshot header for text fallback', async () => {
      const model = createModelInfo(false);
      const tabId = 123;

      const result = await getPageRepresentation(tabId, model);

      expect(result[0].text).toMatch(/^\[Page Content - Accessibility Snapshot\]/);
    });
  });
});
