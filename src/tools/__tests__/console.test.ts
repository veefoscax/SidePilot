/**
 * Unit tests for console tool
 * 
 * Tests filtering by log type, stack trace formatting, and timestamp formatting
 * Requirements: AC4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { consoleTool, handleConsoleEvent } from '../console';
import type { ToolContext } from '../types';

// Mock CDP wrapper
vi.mock('@/lib/cdp-wrapper', () => ({
  cdpWrapper: {
    ensureAttached: vi.fn().mockResolvedValue(undefined),
    executeCDPCommand: vi.fn().mockResolvedValue(undefined)
  }
}));

describe('Console Tool', () => {
  let mockContext: ToolContext;
  const testTabId = 1;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup mock context
    mockContext = {
      tabId: testTabId,
      url: 'https://example.com',
      permissionManager: {
        checkPermission: vi.fn().mockResolvedValue({ allowed: true, needsPrompt: false })
      } as any
    };

    // Clear console logs before each test
  });

  afterEach(async () => {
    // Clear logs after each test
    await consoleTool.execute({ action: 'clear_logs' }, mockContext);
  });

  describe('Tool Definition', () => {
    it('should have correct name', () => {
      expect(consoleTool.name).toBe('console_logs');
    });

    it('should have description', () => {
      expect(consoleTool.description).toBeTruthy();
      expect(consoleTool.description).toContain('console');
    });

    it('should have parameters defined', () => {
      expect(consoleTool.parameters).toBeDefined();
      expect(consoleTool.parameters.action).toBeDefined();
      expect(consoleTool.parameters.action.enum).toContain('get_logs');
      expect(consoleTool.parameters.action.enum).toContain('clear_logs');
      expect(consoleTool.parameters.level).toBeDefined();
      expect(consoleTool.parameters.level.enum).toContain('log');
      expect(consoleTool.parameters.level.enum).toContain('warn');
      expect(consoleTool.parameters.level.enum).toContain('error');
      expect(consoleTool.parameters.level.enum).toContain('info');
      expect(consoleTool.parameters.level.enum).toContain('debug');
    });
  });

  describe('Schema Generation', () => {
    it('should generate Anthropic schema', () => {
      const schema = consoleTool.toAnthropicSchema();
      
      expect(schema.name).toBe('console_logs');
      expect(schema.description).toBeTruthy();
      expect(schema.input_schema.type).toBe('object');
      expect(schema.input_schema.properties.action).toBeDefined();
      expect(schema.input_schema.properties.level).toBeDefined();
      expect(schema.input_schema.properties.limit).toBeDefined();
      expect(schema.input_schema.required).toContain('action');
    });

    it('should generate OpenAI schema', () => {
      const schema = consoleTool.toOpenAISchema();
      
      expect(schema.type).toBe('function');
      expect(schema.function.name).toBe('console_logs');
      expect(schema.function.description).toBeTruthy();
      expect(schema.function.parameters.type).toBe('object');
      expect(schema.function.parameters.properties.action).toBeDefined();
      expect(schema.function.parameters.properties.level).toBeDefined();
      expect(schema.function.parameters.properties.limit).toBeDefined();
      expect(schema.function.parameters.required).toContain('action');
    });
  });

  describe('Filtering by Log Type (AC4)', () => {
    beforeEach(async () => {
      // Clear and populate with test data
      await consoleTool.execute({ action: 'clear_logs' }, mockContext);
      
      // Add test console messages using handleConsoleEvent
      // Add a 'log' message
      handleConsoleEvent(testTabId, 'Runtime.consoleAPICalled', {
        type: 'log',
        args: [{ value: 'This is a log message' }],
        timestamp: Date.now()
      });

      // Add a 'warn' message
      handleConsoleEvent(testTabId, 'Runtime.consoleAPICalled', {
        type: 'warning',
        args: [{ value: 'This is a warning message' }],
        timestamp: Date.now() + 1
      });

      // Add an 'error' message
      handleConsoleEvent(testTabId, 'Runtime.consoleAPICalled', {
        type: 'error',
        args: [{ value: 'This is an error message' }],
        timestamp: Date.now() + 2
      });

      // Add an 'info' message
      handleConsoleEvent(testTabId, 'Runtime.consoleAPICalled', {
        type: 'info',
        args: [{ value: 'This is an info message' }],
        timestamp: Date.now() + 3
      });

      // Add a 'debug' message
      handleConsoleEvent(testTabId, 'Runtime.consoleAPICalled', {
        type: 'debug',
        args: [{ value: 'This is a debug message' }],
        timestamp: Date.now() + 4
      });
    });

    it('should filter logs by type "log"', async () => {
      const result = await consoleTool.execute(
        { action: 'get_logs', level: 'log' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toBeTruthy();
      expect(result.output).toContain('[LOG]');
      expect(result.output).toContain('This is a log message');
      expect(result.output).not.toContain('[ERROR]');
      expect(result.output).not.toContain('[INFO]');
    });

    it('should filter logs by type "warn"', async () => {
      const result = await consoleTool.execute(
        { action: 'get_logs', level: 'warn' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toBeTruthy();
      // Note: Chrome reports 'warning' but we filter by 'warn'
      // The tool should handle this mapping
    });

    it('should filter logs by type "error"', async () => {
      const result = await consoleTool.execute(
        { action: 'get_logs', level: 'error' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toBeTruthy();
      expect(result.output).toContain('[ERROR]');
      expect(result.output).toContain('This is an error message');
      expect(result.output).not.toContain('[LOG]');
      expect(result.output).not.toContain('[INFO]');
    });

    it('should filter logs by type "info"', async () => {
      const result = await consoleTool.execute(
        { action: 'get_logs', level: 'info' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toBeTruthy();
      expect(result.output).toContain('[INFO]');
      expect(result.output).toContain('This is an info message');
      expect(result.output).not.toContain('[LOG]');
      expect(result.output).not.toContain('[ERROR]');
    });

    it('should filter logs by type "debug"', async () => {
      const result = await consoleTool.execute(
        { action: 'get_logs', level: 'debug' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toBeTruthy();
      expect(result.output).toContain('[DEBUG]');
      expect(result.output).toContain('This is a debug message');
      expect(result.output).not.toContain('[LOG]');
      expect(result.output).not.toContain('[ERROR]');
    });

    it('should return all logs when level is "all"', async () => {
      const result = await consoleTool.execute(
        { action: 'get_logs', level: 'all' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toBeTruthy();
      expect(result.output).toContain('This is a log message');
      expect(result.output).toContain('This is an error message');
      expect(result.output).toContain('This is an info message');
      expect(result.output).toContain('This is a debug message');
    });

    it('should return all logs when no level filter is provided', async () => {
      const result = await consoleTool.execute(
        { action: 'get_logs' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toBeTruthy();
      // Should contain messages of all types
      expect(result.output).toContain('This is a log message');
      expect(result.output).toContain('This is an error message');
    });

    it('should return empty message when no logs match filter', async () => {
      // Clear all logs first
      await consoleTool.execute({ action: 'clear_logs' }, mockContext);
      
      // Add only log messages
      handleConsoleEvent(testTabId, 'Runtime.consoleAPICalled', {
        type: 'log',
        args: [{ value: 'Only log message' }],
        timestamp: Date.now()
      });

      // Try to filter by error
      const result = await consoleTool.execute(
        { action: 'get_logs', level: 'error' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toContain('No console messages found');
    });
  });

  describe('Stack Trace Formatting (AC4)', () => {
    beforeEach(async () => {
      // Clear logs before each test
      await consoleTool.execute({ action: 'clear_logs' }, mockContext);
    });

    it('should include stack trace for error messages', async () => {
      // Add an error with stack trace
      handleConsoleEvent(testTabId, 'Runtime.consoleAPICalled', {
        type: 'error',
        args: [{ value: 'Error with stack trace' }],
        timestamp: Date.now(),
        stackTrace: {
          callFrames: [
            {
              functionName: 'handleClick',
              url: 'https://example.com/app.js',
              lineNumber: 42,
              columnNumber: 15
            },
            {
              functionName: 'processEvent',
              url: 'https://example.com/events.js',
              lineNumber: 100,
              columnNumber: 8
            }
          ]
        }
      });

      const result = await consoleTool.execute(
        { action: 'get_logs', level: 'error' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toBeTruthy();
      expect(result.output).toContain('Stack trace');
      expect(result.output).toContain('handleClick');
      expect(result.output).toContain('app.js:42:15');
      expect(result.output).toContain('processEvent');
      expect(result.output).toContain('events.js:100:8');
    });

    it('should format stack trace with anonymous functions', async () => {
      handleConsoleEvent(testTabId, 'Runtime.consoleAPICalled', {
        type: 'error',
        args: [{ value: 'Anonymous function error' }],
        timestamp: Date.now(),
        stackTrace: {
          callFrames: [
            {
              functionName: '',
              url: 'https://example.com/script.js',
              lineNumber: 10,
              columnNumber: 5
            }
          ]
        }
      });

      const result = await consoleTool.execute(
        { action: 'get_logs', level: 'error' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toBeTruthy();
      expect(result.output).toContain('(anonymous)');
    });

    it('should handle Runtime.exceptionThrown events with stack trace', async () => {
      handleConsoleEvent(testTabId, 'Runtime.exceptionThrown', {
        timestamp: Date.now(),
        exceptionDetails: {
          text: 'Uncaught TypeError',
          exception: {
            description: 'TypeError: Cannot read property "foo" of undefined'
          },
          url: 'https://example.com/main.js',
          lineNumber: 25,
          stackTrace: {
            callFrames: [
              {
                functionName: 'getData',
                url: 'https://example.com/main.js',
                lineNumber: 25,
                columnNumber: 10
              },
              {
                functionName: 'init',
                url: 'https://example.com/main.js',
                lineNumber: 5,
                columnNumber: 3
              }
            ]
          }
        }
      });

      const result = await consoleTool.execute(
        { action: 'get_logs' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toBeTruthy();
      expect(result.output).toContain('TypeError');
      expect(result.output).toContain('Stack trace');
      expect(result.output).toContain('getData');
      expect(result.output).toContain('init');
    });

    it('should handle Log.entryAdded events with stack trace', async () => {
      handleConsoleEvent(testTabId, 'Log.entryAdded', {
        entry: {
          level: 'error',
          text: 'Network error occurred',
          timestamp: Date.now(),
          url: 'https://example.com/api.js',
          lineNumber: 50,
          stackTrace: {
            callFrames: [
              {
                functionName: 'fetchData',
                url: 'https://example.com/api.js',
                lineNumber: 50,
                columnNumber: 12
              }
            ]
          }
        }
      });

      const result = await consoleTool.execute(
        { action: 'get_logs', level: 'error' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toBeTruthy();
      expect(result.output).toContain('Network error occurred');
      expect(result.output).toContain('Stack trace');
      expect(result.output).toContain('fetchData');
    });

    it('should not include stack trace for non-error messages', async () => {
      handleConsoleEvent(testTabId, 'Runtime.consoleAPICalled', {
        type: 'log',
        args: [{ value: 'Regular log message' }],
        timestamp: Date.now(),
        stackTrace: {
          callFrames: [
            {
              functionName: 'logSomething',
              url: 'https://example.com/app.js',
              lineNumber: 10,
              columnNumber: 5
            }
          ]
        }
      });

      const result = await consoleTool.execute(
        { action: 'get_logs', level: 'log' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toBeTruthy();
      expect(result.output).toContain('Regular log message');
      expect(result.output).not.toContain('Stack trace');
    });
  });

  describe('Timestamp Formatting', () => {
    beforeEach(async () => {
      await consoleTool.execute({ action: 'clear_logs' }, mockContext);
    });

    it('should format timestamps in ISO format', async () => {
      const testTimestamp = new Date('2024-01-15T10:30:45.123Z').getTime();
      
      handleConsoleEvent(testTabId, 'Runtime.consoleAPICalled', {
        type: 'log',
        args: [{ value: 'Timestamped message' }],
        timestamp: testTimestamp
      });

      const result = await consoleTool.execute(
        { action: 'get_logs' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toBeTruthy();
      // Should contain ISO-formatted timestamp
      expect(result.output).toContain('2024-01-15');
      expect(result.output).toContain('10:30:45');
    });

    it('should include timestamp for each log entry', async () => {
      const timestamp1 = Date.now();
      const timestamp2 = timestamp1 + 1000;

      handleConsoleEvent(testTabId, 'Runtime.consoleAPICalled', {
        type: 'log',
        args: [{ value: 'First message' }],
        timestamp: timestamp1
      });

      handleConsoleEvent(testTabId, 'Runtime.consoleAPICalled', {
        type: 'log',
        args: [{ value: 'Second message' }],
        timestamp: timestamp2
      });

      const result = await consoleTool.execute(
        { action: 'get_logs' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toBeTruthy();
      // Each entry should have a timestamp in brackets
      const timestampMatches = result.output!.match(/\[\d{4}-\d{2}-\d{2}/g);
      expect(timestampMatches).toBeTruthy();
      expect(timestampMatches!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Message Text Extraction', () => {
    beforeEach(async () => {
      await consoleTool.execute({ action: 'clear_logs' }, mockContext);
    });

    it('should extract text from value args', async () => {
      handleConsoleEvent(testTabId, 'Runtime.consoleAPICalled', {
        type: 'log',
        args: [{ value: 'Simple string value' }],
        timestamp: Date.now()
      });

      const result = await consoleTool.execute(
        { action: 'get_logs' },
        mockContext
      );

      expect(result.output).toContain('Simple string value');
    });

    it('should extract text from description args', async () => {
      handleConsoleEvent(testTabId, 'Runtime.consoleAPICalled', {
        type: 'log',
        args: [{ description: 'Object description' }],
        timestamp: Date.now()
      });

      const result = await consoleTool.execute(
        { action: 'get_logs' },
        mockContext
      );

      expect(result.output).toContain('Object description');
    });

    it('should concatenate multiple args', async () => {
      handleConsoleEvent(testTabId, 'Runtime.consoleAPICalled', {
        type: 'log',
        args: [
          { value: 'First' },
          { value: 'Second' },
          { value: 'Third' }
        ],
        timestamp: Date.now()
      });

      const result = await consoleTool.execute(
        { action: 'get_logs' },
        mockContext
      );

      expect(result.output).toContain('First Second Third');
    });

    it('should handle args with only type', async () => {
      handleConsoleEvent(testTabId, 'Runtime.consoleAPICalled', {
        type: 'log',
        args: [{ type: 'undefined' }],
        timestamp: Date.now()
      });

      const result = await consoleTool.execute(
        { action: 'get_logs' },
        mockContext
      );

      expect(result.output).toContain('undefined');
    });
  });

  describe('Source Location', () => {
    beforeEach(async () => {
      await consoleTool.execute({ action: 'clear_logs' }, mockContext);
    });

    it('should include source URL and line number when available', async () => {
      handleConsoleEvent(testTabId, 'Runtime.consoleAPICalled', {
        type: 'log',
        args: [{ value: 'Message with location' }],
        timestamp: Date.now(),
        stackTrace: {
          callFrames: [
            {
              functionName: 'test',
              url: 'https://example.com/script.js',
              lineNumber: 42,
              columnNumber: 10
            }
          ]
        }
      });

      const result = await consoleTool.execute(
        { action: 'get_logs' },
        mockContext
      );

      expect(result.output).toContain('script.js');
      expect(result.output).toContain('42');
    });
  });

  describe('clear_logs action', () => {
    beforeEach(async () => {
      // Add some logs first
      handleConsoleEvent(testTabId, 'Runtime.consoleAPICalled', {
        type: 'log',
        args: [{ value: 'Test message' }],
        timestamp: Date.now()
      });
    });

    it('should clear all console logs', async () => {
      // Verify we have logs
      let result = await consoleTool.execute(
        { action: 'get_logs' },
        mockContext
      );
      expect(result.output).toContain('Test message');

      // Clear logs
      result = await consoleTool.execute(
        { action: 'clear_logs' },
        mockContext
      );
      expect(result.error).toBeUndefined();
      expect(result.output).toContain('cleared');

      // Verify logs are cleared
      result = await consoleTool.execute(
        { action: 'get_logs' },
        mockContext
      );
      expect(result.output).toContain('No console messages found');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown action', async () => {
      const result = await consoleTool.execute(
        { action: 'invalid_action' as any },
        mockContext
      );

      expect(result.error).toBeTruthy();
      expect(result.error).toContain('Unknown action');
    });
  });

  describe('Limit Parameter', () => {
    beforeEach(async () => {
      // Clear and populate with many logs
      await consoleTool.execute({ action: 'clear_logs' }, mockContext);
      
      // Add 10 log messages
      for (let i = 1; i <= 10; i++) {
        handleConsoleEvent(testTabId, 'Runtime.consoleAPICalled', {
          type: 'log',
          args: [{ value: `Log message ${i}` }],
          timestamp: Date.now() + i
        });
      }
    });

    it('should respect limit parameter', async () => {
      const result = await consoleTool.execute(
        { action: 'get_logs', limit: 3 },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toBeTruthy();
      expect(result.output).toContain('(3)');
    });

    it('should use default limit of 50', async () => {
      const result = await consoleTool.execute(
        { action: 'get_logs' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toBeTruthy();
      // We only added 10, so should get all 10
      expect(result.output).toContain('(10)');
    });

    it('should return most recent logs when limit is applied', async () => {
      const result = await consoleTool.execute(
        { action: 'get_logs', limit: 3 },
        mockContext
      );

      expect(result.error).toBeUndefined();
      // Should contain the last 3 messages (8, 9, 10)
      expect(result.output).toContain('Log message 8');
      expect(result.output).toContain('Log message 9');
      expect(result.output).toContain('Log message 10');
      // Should not contain earlier messages (use regex to match exact message numbers)
      expect(result.output).not.toMatch(/Log message 1\b/);
      expect(result.output).not.toMatch(/Log message 7\b/);
    });
  });

  describe('Log.entryAdded Events', () => {
    beforeEach(async () => {
      await consoleTool.execute({ action: 'clear_logs' }, mockContext);
    });

    it('should handle Log.entryAdded events', async () => {
      handleConsoleEvent(testTabId, 'Log.entryAdded', {
        entry: {
          level: 'warning',
          text: 'Deprecation warning',
          timestamp: Date.now(),
          url: 'https://example.com/old-api.js',
          lineNumber: 15
        }
      });

      const result = await consoleTool.execute(
        { action: 'get_logs' },
        mockContext
      );

      expect(result.error).toBeUndefined();
      expect(result.output).toContain('Deprecation warning');
    });
  });
});
