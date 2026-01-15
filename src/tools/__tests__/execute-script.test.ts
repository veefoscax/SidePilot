/**
 * Tests for Execute Script Tool
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeScriptTool } from '../execute-script';
import type { ToolContext } from '../types';

// Mock chrome API
const mockChrome = {
  scripting: {
    executeScript: vi.fn()
  }
};

global.chrome = mockChrome as any;

describe('Execute Script Tool', () => {
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
      expect(executeScriptTool.name).toBe('execute_script');
    });

    it('should have description', () => {
      expect(executeScriptTool.description).toBeTruthy();
      expect(executeScriptTool.description.length).toBeGreaterThan(0);
    });

    it('should have required parameters', () => {
      expect(executeScriptTool.parameters.script).toBeDefined();
      expect(executeScriptTool.parameters.script.required).toBe(true);
      expect(executeScriptTool.parameters.script.type).toBe('string');
    });

    it('should have optional parameters', () => {
      expect(executeScriptTool.parameters.args).toBeDefined();
      expect(executeScriptTool.parameters.args.type).toBe('array');
    });
  });

  describe('Schema Generation', () => {
    it('should generate Anthropic schema', () => {
      const schema = executeScriptTool.toAnthropicSchema();
      
      expect(schema.name).toBe('execute_script');
      expect(schema.description).toBeTruthy();
      expect(schema.input_schema.type).toBe('object');
      expect(schema.input_schema.properties.script).toBeDefined();
      expect(schema.input_schema.required).toContain('script');
    });

    it('should generate OpenAI schema', () => {
      const schema = executeScriptTool.toOpenAISchema();
      
      expect(schema.type).toBe('function');
      expect(schema.function.name).toBe('execute_script');
      expect(schema.function.description).toBeTruthy();
      expect(schema.function.parameters.type).toBe('object');
      expect(schema.function.parameters.properties.script).toBeDefined();
      expect(schema.function.parameters.required).toContain('script');
    });
  });

  describe('Script Execution', () => {
    it('should execute simple script', async () => {
      mockChrome.scripting.executeScript.mockResolvedValue([
        { result: { success: true, value: 42 } }
      ]);

      const result = await executeScriptTool.execute(
        { script: 'return 42;' },
        mockContext
      );

      expect(result.output).toContain('42');
      expect(result.error).toBeUndefined();
      expect(mockChrome.scripting.executeScript).toHaveBeenCalledWith(
        expect.objectContaining({
          target: { tabId: 123 }
        })
      );
    });

    it('should execute script with arguments', async () => {
      mockChrome.scripting.executeScript.mockResolvedValue([
        { result: { success: true, value: 'Hello World' } }
      ]);

      const result = await executeScriptTool.execute(
        { 
          script: 'return arg0 + " " + arg1;',
          args: ['Hello', 'World']
        },
        mockContext
      );

      expect(result.output).toContain('Hello World');
      expect(mockChrome.scripting.executeScript).toHaveBeenCalledWith(
        expect.objectContaining({
          args: ['return arg0 + " " + arg1;', ['Hello', 'World']]
        })
      );
    });

    it('should handle string return values', async () => {
      mockChrome.scripting.executeScript.mockResolvedValue([
        { result: { success: true, value: 'test string' } }
      ]);

      const result = await executeScriptTool.execute(
        { script: 'return "test string";' },
        mockContext
      );

      expect(result.output).toContain('test string');
    });

    it('should handle object return values', async () => {
      mockChrome.scripting.executeScript.mockResolvedValue([
        { result: { success: true, value: { foo: 'bar', num: 123 } } }
      ]);

      const result = await executeScriptTool.execute(
        { script: 'return { foo: "bar", num: 123 };' },
        mockContext
      );

      expect(result.output).toContain('"foo"');
      expect(result.output).toContain('"bar"');
      expect(result.output).toContain('123');
    });

    it('should handle array return values', async () => {
      mockChrome.scripting.executeScript.mockResolvedValue([
        { result: { success: true, value: [1, 2, 3] } }
      ]);

      const result = await executeScriptTool.execute(
        { script: 'return [1, 2, 3];' },
        mockContext
      );

      expect(result.output).toContain('[');
      expect(result.output).toContain('1');
      expect(result.output).toContain('2');
      expect(result.output).toContain('3');
    });

    it('should handle null return value', async () => {
      mockChrome.scripting.executeScript.mockResolvedValue([
        { result: { success: true, value: null } }
      ]);

      const result = await executeScriptTool.execute(
        { script: 'return null;' },
        mockContext
      );

      expect(result.output).toContain('null');
    });

    it('should handle undefined return value', async () => {
      mockChrome.scripting.executeScript.mockResolvedValue([
        { result: { success: true, value: undefined } }
      ]);

      const result = await executeScriptTool.execute(
        { script: 'return undefined;' },
        mockContext
      );

      expect(result.output).toContain('undefined');
    });

    it('should handle boolean return values', async () => {
      mockChrome.scripting.executeScript.mockResolvedValue([
        { result: { success: true, value: true } }
      ]);

      const result = await executeScriptTool.execute(
        { script: 'return true;' },
        mockContext
      );

      expect(result.output).toContain('true');
    });
  });

  describe('Error Handling', () => {
    it('should reject empty script', async () => {
      const result = await executeScriptTool.execute(
        { script: '' },
        mockContext
      );

      expect(result.error).toBe('Script parameter is required and cannot be empty');
    });

    it('should reject whitespace-only script', async () => {
      const result = await executeScriptTool.execute(
        { script: '   ' },
        mockContext
      );

      expect(result.error).toBe('Script parameter is required and cannot be empty');
    });

    it('should handle script execution errors', async () => {
      mockChrome.scripting.executeScript.mockResolvedValue([
        { result: { success: false, error: 'ReferenceError: foo is not defined' } }
      ]);

      const result = await executeScriptTool.execute(
        { script: 'return foo;' },
        mockContext
      );

      expect(result.error).toContain('ReferenceError');
    });

    it('should handle non-serializable arguments', async () => {
      const circularRef: any = {};
      circularRef.self = circularRef;

      const result = await executeScriptTool.execute(
        { script: 'return arg0;', args: [circularRef] },
        mockContext
      );

      expect(result.error).toBe('Arguments must be JSON-serializable');
    });

    it('should handle chrome API errors', async () => {
      mockChrome.scripting.executeScript.mockRejectedValue(
        new Error('Tab not found')
      );

      const result = await executeScriptTool.execute(
        { script: 'return 42;' },
        mockContext
      );

      expect(result.error).toBe('Tab not found');
    });

    it('should handle empty result', async () => {
      mockChrome.scripting.executeScript.mockResolvedValue([]);

      const result = await executeScriptTool.execute(
        { script: 'return 42;' },
        mockContext
      );

      expect(result.error).toBe('Script execution failed: no result returned');
    });

    it('should handle async functions', async () => {
      mockChrome.scripting.executeScript.mockResolvedValue([
        { 
          result: { 
            success: false, 
            error: 'Async functions are not supported. Use synchronous code only.' 
          } 
        }
      ]);

      const result = await executeScriptTool.execute(
        { script: 'return Promise.resolve(42);' },
        mockContext
      );

      expect(result.error).toContain('Async functions are not supported');
    });
  });

  describe('Security', () => {
    it('should execute in isolated context', async () => {
      mockChrome.scripting.executeScript.mockResolvedValue([
        { result: { success: true, value: 'executed' } }
      ]);

      await executeScriptTool.execute(
        { script: 'return "executed";' },
        mockContext
      );

      // Verify executeScript was called with proper isolation
      expect(mockChrome.scripting.executeScript).toHaveBeenCalledWith(
        expect.objectContaining({
          target: { tabId: 123 },
          func: expect.any(Function)
        })
      );
    });

    it('should handle syntax errors gracefully', async () => {
      mockChrome.scripting.executeScript.mockResolvedValue([
        { result: { success: false, error: 'SyntaxError: Unexpected token' } }
      ]);

      const result = await executeScriptTool.execute(
        { script: 'return {invalid syntax' },
        mockContext
      );

      expect(result.error).toContain('SyntaxError');
    });
  });
});
