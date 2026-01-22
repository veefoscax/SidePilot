/**
 * Voice Module - Main Export
 * 
 * Exports all voice-related types, providers, and utilities.
 */

// Types
export * from './types';

// Registry
export * from './registry';

// Providers (import to register)
import './providers/browser-stt';
import './providers/browser-tts';
import './providers/openai-stt';
import './providers/openai-tts';
import './providers/elevenlabs-tts';

// Re-export provider factories for manual use
export { createBrowserSTTProvider } from './providers/browser-stt';
export { createBrowserTTSProvider } from './providers/browser-tts';
export { createOpenAISTTProvider } from './providers/openai-stt';
export { createOpenAITTSProvider, OPENAI_VOICES } from './providers/openai-tts';
export { createElevenLabsTTSProvider } from './providers/elevenlabs-tts';
