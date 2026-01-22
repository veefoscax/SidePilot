/**
 * Voice Provider Registry
 * 
 * Manages registration and retrieval of STT and TTS providers.
 * Supports dynamic provider addition/removal and active provider management.
 * 
 * Requirements: TR1
 */

import type {
    STTProvider,
    TTSProvider,
    STTProviderId,
    TTSProviderId,
    VoiceApiKeys
} from './types';

// ============================================================================
// Registry Types
// ============================================================================

type STTProviderFactory = (apiKeys: VoiceApiKeys) => STTProvider;
type TTSProviderFactory = (apiKeys: VoiceApiKeys) => TTSProvider;

interface ProviderRegistry {
    stt: Map<STTProviderId, STTProviderFactory>;
    tts: Map<TTSProviderId, TTSProviderFactory>;
}

// ============================================================================
// Registry Implementation
// ============================================================================

/**
 * Global provider registry
 */
const registry: ProviderRegistry = {
    stt: new Map(),
    tts: new Map()
};

/**
 * Register an STT provider factory
 * @param id - Provider identifier
 * @param factory - Factory function that creates the provider
 */
export function registerSTTProvider(id: STTProviderId, factory: STTProviderFactory): void {
    registry.stt.set(id, factory);
    console.log(`[VoiceRegistry] Registered STT provider: ${id}`);
}

/**
 * Register a TTS provider factory
 * @param id - Provider identifier
 * @param factory - Factory function that creates the provider
 */
export function registerTTSProvider(id: TTSProviderId, factory: TTSProviderFactory): void {
    registry.tts.set(id, factory);
    console.log(`[VoiceRegistry] Registered TTS provider: ${id}`);
}

/**
 * Unregister an STT provider
 * @param id - Provider identifier
 */
export function unregisterSTTProvider(id: STTProviderId): void {
    registry.stt.delete(id);
    console.log(`[VoiceRegistry] Unregistered STT provider: ${id}`);
}

/**
 * Unregister a TTS provider
 * @param id - Provider identifier
 */
export function unregisterTTSProvider(id: TTSProviderId): void {
    registry.tts.delete(id);
    console.log(`[VoiceRegistry] Unregistered TTS provider: ${id}`);
}

/**
 * Get an STT provider instance
 * @param id - Provider identifier
 * @param apiKeys - API keys for providers that require them
 * @returns STT provider instance or null if not registered
 */
export function getSTTProvider(id: STTProviderId, apiKeys: VoiceApiKeys = {}): STTProvider | null {
    const factory = registry.stt.get(id);
    if (!factory) {
        console.warn(`[VoiceRegistry] STT provider not found: ${id}`);
        return null;
    }
    return factory(apiKeys);
}

/**
 * Get a TTS provider instance
 * @param id - Provider identifier
 * @param apiKeys - API keys for providers that require them
 * @returns TTS provider instance or null if not registered
 */
export function getTTSProvider(id: TTSProviderId, apiKeys: VoiceApiKeys = {}): TTSProvider | null {
    const factory = registry.tts.get(id);
    if (!factory) {
        console.warn(`[VoiceRegistry] TTS provider not found: ${id}`);
        return null;
    }
    return factory(apiKeys);
}

/**
 * Get list of registered STT provider IDs
 */
export function getRegisteredSTTProviders(): STTProviderId[] {
    return Array.from(registry.stt.keys());
}

/**
 * Get list of registered TTS provider IDs
 */
export function getRegisteredTTSProviders(): TTSProviderId[] {
    return Array.from(registry.tts.keys());
}

/**
 * Check if an STT provider is registered
 */
export function isSTTProviderRegistered(id: STTProviderId): boolean {
    return registry.stt.has(id);
}

/**
 * Check if a TTS provider is registered
 */
export function isTTSProviderRegistered(id: TTSProviderId): boolean {
    return registry.tts.has(id);
}

// ============================================================================
// Provider Info
// ============================================================================

export interface ProviderInfo {
    id: string;
    name: string;
    requiresApiKey: boolean;
    description: string;
}

/** Information about available STT providers */
export const STT_PROVIDER_INFO: Record<STTProviderId, ProviderInfo> = {
    browser: {
        id: 'browser',
        name: 'Browser (Free)',
        requiresApiKey: false,
        description: 'Built-in browser speech recognition using Web Speech API'
    },
    openai: {
        id: 'openai',
        name: 'OpenAI Whisper',
        requiresApiKey: true,
        description: 'High-quality transcription with language auto-detection'
    }
};

/** Information about available TTS providers */
export const TTS_PROVIDER_INFO: Record<TTSProviderId, ProviderInfo> = {
    browser: {
        id: 'browser',
        name: 'Browser (Free)',
        requiresApiKey: false,
        description: 'Built-in browser text-to-speech using SpeechSynthesis API'
    },
    openai: {
        id: 'openai',
        name: 'OpenAI TTS',
        requiresApiKey: true,
        description: 'Natural-sounding voices with multiple options'
    },
    elevenlabs: {
        id: 'elevenlabs',
        name: 'ElevenLabs',
        requiresApiKey: true,
        description: 'Ultra-realistic AI voices with emotion control'
    }
};

/**
 * Get display info for an STT provider
 */
export function getSTTProviderInfo(id: STTProviderId): ProviderInfo {
    return STT_PROVIDER_INFO[id];
}

/**
 * Get display info for a TTS provider
 */
export function getTTSProviderInfo(id: TTSProviderId): ProviderInfo {
    return TTS_PROVIDER_INFO[id];
}
