/**
 * Computer Tool Tests
 * 
 * Tests for mouse and keyboard automation actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computerTool } from '../computer';
import { cdpWrapper } from '@/lib/cdp-wrapper';
import type { ToolContext } from '../types';

// Mock CDP wrapper
vi.mock('@/lib/cdp-wrapper', () => ({
  cdpWrapper: {
    ensureAttached: vi.fn(),
    screenshot: vi.fn(),
    click: vi.fn(),
    type: vi.fn(),
    pressKey: vi.fn(),
    pressKeyChord: vi.fn(),
    scroll: vi.fn(),
    leftClickDrag: vi.fn()
  }
}));

describe('Computer Tool', () => {
  let mockContext: ToolContext;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockContext = {
      tabId: 123,
      url: 'https://example.com',
      permissionManager: {} as any,
      toolUseId: 'test-tool-use-id'
    };
  });

  describe('Tool Definition', () => {
    it('should have correct name', () => {
      expect(computerTool.name).toBe('computer');
    });

    it('should have description', () => {
      expect(computerTool.description).toBeTruthy();
      expect(computerTool.description).toContain('screenshot');
      expect(computerTool.description).toContain('click');
      expect(computerTool.description).toContain('type');
    });

    it('should define all required parameters', () => {
      expect(computerTool.parameters.action).toBeDefined();
      expect(computerTool.parameters.action.required).toBe(true);
      expect(computerTool.parameters.action.enum).toContain('screenshot');
      expect(computerTool.parameters.action.enum).toContain('left_click');
      expect(computerTool.parameters.action.enum).toContain('type');
    });

    it('should have toAnthropicSchema method', () => {
      const schema = computerTool.toAnthropicSchema();
      expect(schema.name).toBe('computer');
      expect(schema.input_schema.type).toBe('object');
      expect(schema.input_schema.required).toContain('action');
    });

    it('should have toOpenAISchema method', () => {
      const schema = computerTool.toOpenAISchema();
      expect(schema.type).toBe('function');
      expect(schema.function.name).toBe('computer');
      expect(schema.function.parameters.required).toContain('action');
    });
  });

  describe('Screenshot Action', () => {
    it('should capture screenshot successfully', async () => {
      const mockScreenshot = {
        data: 'base64data',
        width: 1920,
        height: 1080,
        devicePixelRatio: 2
      };

      vi.mocked(cdpWrapper.screenshot).mockResolvedValue(mockScreenshot);

      const result = await computerTool.execute(
        { action: 'screenshot' },
        mockContext
      );

      expect(cdpWrapper.ensureAttached).toHaveBeenCalledWith(123);
      expect(cdpWrapper.screenshot).toHaveBeenCalledWith(123);
      expect(result.output).toContain('1920x1080');
      expect(result.output).toContain('DPR: 2');
      expect(result.screenshot).toBe('data:image/png;base64,base64data');
    });

    it('should handle screenshot errors', async () => {
      vi.mocked(cdpWrapper.screenshot).mockRejectedValue(new Error('Screenshot failed'));

      const result = await computerTool.execute(
        { action: 'screenshot' },
        mockContext
      );

      expect(result.error).toBe('Screenshot failed');
    });
  });

  describe('Click Actions', () => {
    it('should perform left click', async () => {
      const result = await computerTool.execute(
        { action: 'left_click', coordinate: [100, 200] },
        mockContext
      );

      expect(cdpWrapper.click).toHaveBeenCalledWith(
        123,
        100,
        200,
        expect.objectContaining({
          button: 'left',
          clickCount: 1,
          delay: 'human'
        })
      );
      expect(result.output).toBe('Left clicked at (100, 200)');
    });

    it('should perform right click', async () => {
      const result = await computerTool.execute(
        { action: 'right_click', coordinate: [150, 250] },
        mockContext
      );

      expect(cdpWrapper.click).toHaveBeenCalledWith(
        123,
        150,
        250,
        expect.objectContaining({
          button: 'right',
          clickCount: 1
        })
      );
      expect(result.output).toBe('Right clicked at (150, 250)');
    });

    it('should perform double click', async () => {
      const result = await computerTool.execute(
        { action: 'double_click', coordinate: [300, 400] },
        mockContext
      );

      expect(cdpWrapper.click).toHaveBeenCalledWith(
        123,
        300,
        400,
        expect.objectContaining({
          button: 'left',
          clickCount: 2
        })
      );
      expect(result.output).toBe('Double-Left clicked at (300, 400)');
    });

    it('should perform triple click', async () => {
      const result = await computerTool.execute(
        { action: 'triple_click', coordinate: [500, 600] },
        mockContext
      );

      expect(cdpWrapper.click).toHaveBeenCalledWith(
        123,
        500,
        600,
        expect.objectContaining({
          button: 'left',
          clickCount: 3
        })
      );
      expect(result.output).toBe('Triple-Left clicked at (500, 600)');
    });

    it('should validate coordinate format', async () => {
      const result = await computerTool.execute(
        { action: 'left_click', coordinate: [100] as any },
        mockContext
      );

      expect(result.error).toContain('Invalid coordinate format');
    });

    it('should handle click errors', async () => {
      vi.mocked(cdpWrapper.click).mockRejectedValue(new Error('Click failed'));

      const result = await computerTool.execute(
        { action: 'left_click', coordinate: [100, 200] },
        mockContext
      );

      expect(result.error).toBe('Click failed');
    });
  });

  describe('Type Action', () => {
    it('should type text with human delays', async () => {
      const result = await computerTool.execute(
        { action: 'type', text: 'Hello World' },
        mockContext
      );

      expect(cdpWrapper.type).toHaveBeenCalledWith(
        123,
        'Hello World',
        expect.objectContaining({
          delay: 'human'
        })
      );
      expect(result.output).toBe('Typed: "Hello World"');
    });

    it('should require text parameter', async () => {
      const result = await computerTool.execute(
        { action: 'type' },
        mockContext
      );

      expect(result.error).toContain('Text parameter is required');
    });

    it('should handle type errors', async () => {
      vi.mocked(cdpWrapper.type).mockRejectedValue(new Error('Type failed'));

      const result = await computerTool.execute(
        { action: 'type', text: 'test' },
        mockContext
      );

      expect(result.error).toBe('Type failed');
    });
  });

  describe('Key Action', () => {
    it('should press single key', async () => {
      const result = await computerTool.execute(
        { action: 'key', text: 'Enter' },
        mockContext
      );

      expect(cdpWrapper.pressKey).toHaveBeenCalledWith(123, 'Enter');
      expect(result.output).toBe('Pressed key: Enter');
    });

    it('should press key combination', async () => {
      const result = await computerTool.execute(
        { action: 'key', text: 'Ctrl+A' },
        mockContext
      );

      expect(cdpWrapper.pressKeyChord).toHaveBeenCalledWith(123, 'Ctrl+A');
      expect(result.output).toBe('Pressed key: Ctrl+A');
    });

    it('should require key parameter', async () => {
      const result = await computerTool.execute(
        { action: 'key' },
        mockContext
      );

      expect(result.error).toContain('Key parameter is required');
    });
  });

  describe('Scroll Action', () => {
    it('should scroll up', async () => {
      const result = await computerTool.execute(
        { action: 'scroll', coordinate: [500, 500], direction: 'up' },
        mockContext
      );

      expect(cdpWrapper.scroll).toHaveBeenCalledWith(123, 'up', 100);
      expect(result.output).toBe('Scrolled up by 100px');
    });

    it('should scroll down', async () => {
      const result = await computerTool.execute(
        { action: 'scroll', coordinate: [500, 500], direction: 'down' },
        mockContext
      );

      expect(cdpWrapper.scroll).toHaveBeenCalledWith(123, 'down', 100);
      expect(result.output).toBe('Scrolled down by 100px');
    });

    it('should scroll left', async () => {
      const result = await computerTool.execute(
        { action: 'scroll', coordinate: [500, 500], direction: 'left' },
        mockContext
      );

      expect(cdpWrapper.scroll).toHaveBeenCalledWith(123, 'left', 100);
      expect(result.output).toBe('Scrolled left by 100px');
    });

    it('should scroll right', async () => {
      const result = await computerTool.execute(
        { action: 'scroll', coordinate: [500, 500], direction: 'right' },
        mockContext
      );

      expect(cdpWrapper.scroll).toHaveBeenCalledWith(123, 'right', 100);
      expect(result.output).toBe('Scrolled right by 100px');
    });

    it('should require direction parameter', async () => {
      const result = await computerTool.execute(
        { action: 'scroll', coordinate: [500, 500] },
        mockContext
      );

      expect(result.error).toContain('Direction parameter is required');
    });
  });

  describe('Wait Action', () => {
    it('should wait for specified duration', async () => {
      const startTime = Date.now();
      
      const result = await computerTool.execute(
        { action: 'wait', duration: 0.1 },
        mockContext
      );

      const elapsed = Date.now() - startTime;
      
      expect(elapsed).toBeGreaterThanOrEqual(90); // Allow 10ms tolerance
      expect(result.output).toBe('Waited 0.1 seconds');
    });

    it('should cap duration at 30 seconds', async () => {
      const result = await computerTool.execute(
        { action: 'wait', duration: 60 },
        mockContext
      );

      expect(result.output).toBe('Waited 30 seconds');
    }, 35000); // Set timeout to 35 seconds to allow for 30 second wait

    it('should validate duration is positive', async () => {
      const result = await computerTool.execute(
        { action: 'wait', duration: -1 },
        mockContext
      );

      expect(result.error).toContain('Duration must be a positive number');
    });

    it('should require duration parameter', async () => {
      const result = await computerTool.execute(
        { action: 'wait' },
        mockContext
      );

      expect(result.error).toContain('Duration must be a positive number');
    });
  });

  describe('Drag Action', () => {
    it('should perform drag operation', async () => {
      const result = await computerTool.execute(
        {
          action: 'left_click_drag',
          start_coordinate: [100, 200],
          coordinate: [300, 400]
        },
        mockContext
      );

      expect(cdpWrapper.leftClickDrag).toHaveBeenCalledWith(
        123,
        100,
        200,
        300,
        400
      );
      expect(result.output).toBe('Dragged from (100, 200) to (300, 400)');
    });

    it('should validate start coordinate format', async () => {
      const result = await computerTool.execute(
        {
          action: 'left_click_drag',
          start_coordinate: [100] as any,
          coordinate: [300, 400]
        },
        mockContext
      );

      expect(result.error).toContain('Invalid start_coordinate format');
    });

    it('should validate end coordinate format', async () => {
      const result = await computerTool.execute(
        {
          action: 'left_click_drag',
          start_coordinate: [100, 200],
          coordinate: [300] as any
        },
        mockContext
      );

      expect(result.error).toContain('Invalid coordinate format');
    });
  });

  describe('Zoom Action', () => {
    it('should capture zoom screenshot', async () => {
      const mockScreenshot = {
        data: 'zoomdata',
        width: 800,
        height: 600,
        devicePixelRatio: 1
      };

      vi.mocked(cdpWrapper.screenshot).mockResolvedValue(mockScreenshot);

      const result = await computerTool.execute(
        {
          action: 'zoom',
          region: [100, 100, 500, 500]
        },
        mockContext
      );

      expect(cdpWrapper.screenshot).toHaveBeenCalledWith(123);
      expect(result.output).toContain('Zoom screenshot captured');
      expect(result.output).toContain('(100, 100) to (500, 500)');
      expect(result.screenshot).toBe('data:image/png;base64,zoomdata');
    });

    it('should validate region format', async () => {
      const result = await computerTool.execute(
        {
          action: 'zoom',
          region: [100, 100] as any
        },
        mockContext
      );

      expect(result.error).toContain('Invalid region format');
    });
  });

  describe('Coordinate Handling', () => {
    it('should handle integer coordinates', async () => {
      vi.mocked(cdpWrapper.click).mockResolvedValue(undefined);
      
      const result = await computerTool.execute(
        { action: 'left_click', coordinate: [100, 200] },
        mockContext
      );

      expect(cdpWrapper.click).toHaveBeenCalledWith(123, 100, 200, expect.any(Object));
      expect(result.error).toBeUndefined();
    });

    it('should handle floating point coordinates', async () => {
      vi.mocked(cdpWrapper.click).mockResolvedValue(undefined);
      
      const result = await computerTool.execute(
        { action: 'left_click', coordinate: [100.5, 200.7] },
        mockContext
      );

      expect(cdpWrapper.click).toHaveBeenCalledWith(123, 100.5, 200.7, expect.any(Object));
      expect(result.error).toBeUndefined();
    });

    it('should handle negative coordinates', async () => {
      vi.mocked(cdpWrapper.click).mockResolvedValue(undefined);
      
      const result = await computerTool.execute(
        { action: 'left_click', coordinate: [-10, -20] },
        mockContext
      );

      expect(cdpWrapper.click).toHaveBeenCalledWith(123, -10, -20, expect.any(Object));
      expect(result.error).toBeUndefined();
    });
  });

  describe('Human Delay Integration', () => {
    it('should use human delays for clicks', async () => {
      await computerTool.execute(
        { action: 'left_click', coordinate: [100, 200] },
        mockContext
      );

      expect(cdpWrapper.click).toHaveBeenCalledWith(
        123,
        100,
        200,
        expect.objectContaining({ delay: 'human' })
      );
    });

    it('should use human delays for typing', async () => {
      await computerTool.execute(
        { action: 'type', text: 'test' },
        mockContext
      );

      expect(cdpWrapper.type).toHaveBeenCalledWith(
        123,
        'test',
        expect.objectContaining({ delay: 'human' })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown action', async () => {
      const result = await computerTool.execute(
        { action: 'invalid_action' as any },
        mockContext
      );

      expect(result.error).toContain('Unknown action');
    });

    it('should handle CDP attachment errors', async () => {
      vi.mocked(cdpWrapper.ensureAttached).mockRejectedValue(
        new Error('Failed to attach debugger')
      );

      const result = await computerTool.execute(
        { action: 'screenshot' },
        mockContext
      );

      expect(result.error).toBe('Failed to attach debugger');
    });

    it('should handle generic errors gracefully', async () => {
      vi.mocked(cdpWrapper.ensureAttached).mockResolvedValue(undefined);
      vi.mocked(cdpWrapper.screenshot).mockRejectedValue('String error');

      const result = await computerTool.execute(
        { action: 'screenshot' },
        mockContext
      );

      expect(result.error).toBe('Unknown error occurred');
    });
  });
});
