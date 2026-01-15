/**
 * Tests for Page Content Tool
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pageContentTool } from '../page-content';
import type { ToolContext } from '../types';

// Mock chrome API
const mockChrome = {
  scripting: {
    executeScript: vi.fn()
  }
};

global.chrome = mockChrome as any;

describe('Page Content Tool', () => {
  let mockContext: ToolContext;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockContext = {
      tabId: 123,
      url: 'https://example.com',
      permissionManager: {
        checkPermission: vi.fn().mockResolvedValue({ allowed: true, needsPrompt: false })
      } as any
    };
  });

  describe('Tool Definition', () => {
    it('should have correct name', () => {
      expect(pageContentTool.name).toBe('page_content');
    });

    it('should have description', () => {
      expect(pageContentTool.description).toBeTruthy();
      expect(pageContentTool.description.length).toBeGreaterThan(0);
    });

    it('should have required parameters', () => {
      expect(pageContentTool.parameters.action).toBeDefined();
      expect(pageContentTool.parameters.action.required).toBe(true);
      expect(pageContentTool.parameters.action.enum).toContain('get_text');
      expect(pageContentTool.parameters.action.enum).toContain('get_html');
      expect(pageContentTool.parameters.action.enum).toContain('screen_summary');
    });

    it('should have optional parameters', () => {
      expect(pageContentTool.parameters.selector).toBeDefined();
      expect(pageContentTool.parameters.interactiveOnly).toBeDefined();
      expect(pageContentTool.parameters.maxDepth).toBeDefined();
    });
  });

  describe('Schema Generation', () => {
    it('should generate Anthropic schema', () => {
      const schema = pageContentTool.toAnthropicSchema();
      
      expect(schema.name).toBe('page_content');
      expect(schema.description).toBeTruthy();
      expect(schema.input_schema.type).toBe('object');
      expect(schema.input_schema.properties.action).toBeDefined();
      expect(schema.input_schema.required).toContain('action');
    });

    it('should generate OpenAI schema', () => {
      const schema = pageContentTool.toOpenAISchema();
      
      expect(schema.type).toBe('function');
      expect(schema.function.name).toBe('page_content');
      expect(schema.function.description).toBeTruthy();
      expect(schema.function.parameters.type).toBe('object');
      expect(schema.function.parameters.properties.action).toBeDefined();
      expect(schema.function.parameters.required).toContain('action');
    });
  });

  describe('get_text Action', () => {
    it('should extract text from page', async () => {
      mockChrome.scripting.executeScript.mockResolvedValue([
        { result: { text: 'Hello World', error: null } }
      ]);

      const result = await pageContentTool.execute(
        { action: 'get_text' },
        mockContext
      );

      expect(result.output).toBe('Hello World');
      expect(result.error).toBeUndefined();
      expect(mockChrome.scripting.executeScript).toHaveBeenCalledWith(
        expect.objectContaining({
          target: { tabId: 123 }
        })
      );
    });

    it('should extract text from specific selector', async () => {
      mockChrome.scripting.executeScript.mockResolvedValue([
        { result: { text: 'Specific content', error: null } }
      ]);

      const result = await pageContentTool.execute(
        { action: 'get_text', selector: '#main' },
        mockContext
      );

      expect(result.output).toBe('Specific content');
      expect(mockChrome.scripting.executeScript).toHaveBeenCalledWith(
        expect.objectContaining({
          args: ['#main']
        })
      );
    });

    it('should handle selector not found', async () => {
      mockChrome.scripting.executeScript.mockResolvedValue([
        { result: { text: null, error: 'Element not found: #missing' } }
      ]);

      const result = await pageContentTool.execute(
        { action: 'get_text', selector: '#missing' },
        mockContext
      );

      expect(result.error).toBe('Element not found: #missing');
    });

    it('should handle empty text', async () => {
      mockChrome.scripting.executeScript.mockResolvedValue([
        { result: { text: '', error: null } }
      ]);

      const result = await pageContentTool.execute(
        { action: 'get_text' },
        mockContext
      );

      expect(result.output).toBe('(No visible text found)');
    });
  });

  describe('get_html Action', () => {
    it('should extract HTML from page', async () => {
      mockChrome.scripting.executeScript.mockResolvedValue([
        { result: { html: '<div>Hello</div>', error: null } }
      ]);

      const result = await pageContentTool.execute(
        { action: 'get_html' },
        mockContext
      );

      expect(result.output).toBe('<div>Hello</div>');
      expect(result.error).toBeUndefined();
    });

    it('should extract HTML from specific selector', async () => {
      mockChrome.scripting.executeScript.mockResolvedValue([
        { result: { html: '<main>Content</main>', error: null } }
      ]);

      const result = await pageContentTool.execute(
        { action: 'get_html', selector: 'main' },
        mockContext
      );

      expect(result.output).toBe('<main>Content</main>');
    });

    it('should handle selector not found', async () => {
      mockChrome.scripting.executeScript.mockResolvedValue([
        { result: { html: null, error: 'Element not found: #missing' } }
      ]);

      const result = await pageContentTool.execute(
        { action: 'get_html', selector: '#missing' },
        mockContext
      );

      expect(result.error).toBe('Element not found: #missing');
    });
  });

  describe('screen_summary Action', () => {
    it('should generate accessibility tree', async () => {
      const mockTree = {
        url: 'https://example.com',
        title: 'Example Page',
        viewport: { width: 1920, height: 1080 },
        elements: [
          {
            tagName: 'button',
            description: 'button "Click me"',
            ref: 'element_1',
            bounds: { x: 100, y: 200, width: 80, height: 40 },
            visible: true,
            interactive: true,
            children: []
          }
        ]
      };

      mockChrome.scripting.executeScript
        .mockResolvedValueOnce([]) // First call to inject script
        .mockResolvedValueOnce([{ result: mockTree }]); // Second call to generate tree

      const result = await pageContentTool.execute(
        { action: 'screen_summary' },
        mockContext
      );

      expect(result.output).toBeTruthy();
      expect(result.output).toContain('Example Page');
      expect(result.output).toContain('https://example.com');
      expect(result.output).toContain('[element_1]');
      expect(result.error).toBeUndefined();
    });

    it('should support interactiveOnly option', async () => {
      const mockTree = {
        url: 'https://example.com',
        title: 'Example Page',
        viewport: { width: 1920, height: 1080 },
        elements: []
      };

      mockChrome.scripting.executeScript
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ result: mockTree }]);

      await pageContentTool.execute(
        { action: 'screen_summary', interactiveOnly: true },
        mockContext
      );

      expect(mockChrome.scripting.executeScript).toHaveBeenCalledWith(
        expect.objectContaining({
          args: [expect.objectContaining({ interactiveOnly: true })]
        })
      );
    });

    it('should support maxDepth option', async () => {
      const mockTree = {
        url: 'https://example.com',
        title: 'Example Page',
        viewport: { width: 1920, height: 1080 },
        elements: []
      };

      mockChrome.scripting.executeScript
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ result: mockTree }]);

      await pageContentTool.execute(
        { action: 'screen_summary', maxDepth: 5 },
        mockContext
      );

      expect(mockChrome.scripting.executeScript).toHaveBeenCalledWith(
        expect.objectContaining({
          args: [expect.objectContaining({ maxDepth: 5 })]
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown action', async () => {
      const result = await pageContentTool.execute(
        { action: 'invalid_action' as any },
        mockContext
      );

      expect(result.error).toBe('Unknown action: invalid_action');
    });

    it('should handle script execution failure', async () => {
      mockChrome.scripting.executeScript.mockRejectedValue(
        new Error('Script execution failed')
      );

      const result = await pageContentTool.execute(
        { action: 'get_text' },
        mockContext
      );

      expect(result.error).toBe('Script execution failed');
    });

    it('should handle empty result', async () => {
      mockChrome.scripting.executeScript.mockResolvedValue([]);

      const result = await pageContentTool.execute(
        { action: 'get_text' },
        mockContext
      );

      expect(result.error).toBe('Failed to extract text from page');
    });
  });
});
