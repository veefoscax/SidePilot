/**
 * Shortcuts System - Core Types and Constants
 * 
 * Defines types and constants for the saved prompts/shortcuts system
 * that enables users to save and reuse common prompts via slash commands.
 */

/**
 * Saved prompt/shortcut definition
 */
export interface SavedPrompt {
  id: string;
  command: string;           // Without leading /
  name?: string;             // Display name
  prompt: string;            // Actual prompt content
  url?: string;              // Optional URL context
  usageCount: number;
  createdAt: number;
  updatedAt: number;
  // Optional scheduling
  schedule?: {
    type: 'none' | 'once' | 'daily' | 'weekly' | 'monthly';
    time?: string;           // HH:MM
    date?: string;           // YYYY-MM-DD
    dayOfWeek?: number;      // 0-6
    dayOfMonth?: number;     // 1-31
  };
  model?: string;            // Use specific model
  skipPermissions?: boolean;
}

/**
 * Regex pattern for parsing shortcut chips in text
 * Matches syntax: [[shortcut:id:name]]
 */
export const SHORTCUT_CHIP_REGEX = /\[\[shortcut:([^:]+):([^\]]+)\]\]/g;

/**
 * Default shortcuts provided by the system
 */
export const DEFAULT_SHORTCUTS: Omit<SavedPrompt, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>[] = [
  {
    command: 'screenshot',
    name: 'Take Screenshot',
    prompt: 'Take a screenshot of the current page and describe what you see.',
  },
  {
    command: 'navigate',
    name: 'Navigate to URL',
    prompt: 'Navigate to the specified URL and tell me what you find there.',
  },
  {
    command: 'summarize',
    name: 'Summarize Page',
    prompt: 'Read the current page content and provide a concise summary of the main points.',
  },
  {
    command: 'extract',
    name: 'Extract Information',
    prompt: 'Extract specific information from the current page based on the criteria I provide.',
  },
  {
    command: 'debug',
    name: 'Debug Page',
    prompt: 'Check the current page for any console errors, broken links, or accessibility issues.',
  },
  {
    command: 'analyze',
    name: 'Analyze Page',
    prompt: 'Analyze the current page structure, performance, and user experience.',
  },
];

/**
 * Slash menu item types
 */
export interface SlashMenuItem {
  id: string;
  name: string;
  icon?: React.ComponentType;
  action: 'chip' | 'submenu' | 'open-modal';
  groupId: 'system' | 'shortcuts' | 'actions';
  keywords?: string;
}

/**
 * Shortcut chip props
 */
export interface ShortcutChipProps {
  id: string;
  name: string;
}

/**
 * Storage key for saved prompts
 */
export const SAVED_PROMPTS_STORAGE_KEY = 'savedPrompts';

/**
 * Maximum number of shortcuts a user can create
 */
export const MAX_SHORTCUTS = 100;

/**
 * Maximum length for shortcut commands
 */
export const MAX_COMMAND_LENGTH = 50;

/**
 * Maximum length for shortcut prompts
 */
export const MAX_PROMPT_LENGTH = 2000;

/**
 * Validation regex for shortcut commands
 * Commands must be lowercase, no spaces, alphanumeric + hyphens/underscores
 */
export const COMMAND_VALIDATION_REGEX = /^[a-z0-9_-]+$/;

/**
 * Reserved command names that cannot be used for custom shortcuts
 */
export const RESERVED_COMMANDS = [
  'help',
  'settings',
  'clear',
  'history',
  'export',
  'import',
  'reset',
];