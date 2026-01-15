/**
 * Vitest setup file
 * Configures testing environment and global utilities
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Mock Chrome API for tests
global.chrome = {
  debugger: {
    onEvent: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    },
    onDetach: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    },
    attach: vi.fn(),
    detach: vi.fn(),
    sendCommand: vi.fn()
  },
  tabs: {
    query: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    remove: vi.fn(),
    goBack: vi.fn(),
    goForward: vi.fn(),
    reload: vi.fn(),
    get: vi.fn()
  },
  scripting: {
    executeScript: vi.fn()
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn()
    }
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    }
  }
} as any;

// Mock ResizeObserver for cmdk component
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock scrollIntoView for cmdk component
Element.prototype.scrollIntoView = vi.fn();

// Cleanup after each test
afterEach(() => {
  cleanup();
});
