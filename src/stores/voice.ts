/**
 * Voice Store
 * 
 * Zustand store for managing voice settings and runtime state.
 * Persists settings to Chrome storage for cross-session persistence.
 * 
 * Requirements: AC4.1
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
    VoiceStore,
    VoiceSettings,
    VoiceState,
    CallModeState
} from '@/lib/voice/types';
import { DEFAULT_VOICE_SETTINGS } from '@/lib/voice/types';
import { getSTTProvider, getTTSProvider } from '@/lib/voice/registry';

// Import providers to register them
import '@/lib/voice/providers/browser-stt';
import '@/lib/voice/providers/browser-tts';

// ============================================================================
// Chrome Storage Adapter
// ============================================================================

const chromeStorage = createJSONStorage<{ settings: VoiceSettings }>(() => ({
    getItem: async (name: string) => {
        try {
            const result = await chrome.storage.local.get(name);
            return result[name] ?? null;
        } catch (error) {
            console.error('[VoiceStore] Failed to get from Chrome storage:', error);
            return null;
        }
    },
    setItem: async (name: string, value: string) => {
        try {
            await chrome.storage.local.set({ [name]: value });
        } catch (error) {
            console.error('[VoiceStore] Failed to set Chrome storage:', error);
        }
    },
    removeItem: async (name: string) => {
        try {
            await chrome.storage.local.remove(name);
        } catch (error) {
            console.error('[VoiceStore] Failed to remove from Chrome storage:', error);
        }
    },
}));

// ============================================================================
// Initial State
// ============================================================================

const initialState: VoiceState = {
    // Settings
    settings: DEFAULT_VOICE_SETTINGS,

    // Runtime state
    isListening: false,
    isSpeaking: false,
    callModeActive: false,
    callModeState: 'idle',
    audioLevel: 0,
    interimTranscript: '',
    finalTranscript: '',

    // Providers
    activeSTTProvider: null,
    activeTTSProvider: null,
    availableVoices: [],

    // Sessions
    currentSession: null,
    currentPlayback: null
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useVoiceStore = create<VoiceStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            // ========================================
            // Settings Actions
            // ========================================

            setSettings: (newSettings: Partial<VoiceSettings>) => {
                set(state => ({
                    settings: { ...state.settings, ...newSettings }
                }));

                // Re-initialize providers if provider selection changed
                if (newSettings.sttProvider || newSettings.ttsProvider) {
                    get().initializeProviders();
                }
            },

            // ========================================
            // STT Actions
            // ========================================

            startListening: async () => {
                const { activeSTTProvider, settings, isListening } = get();

                if (isListening) {
                    console.warn('[VoiceStore] Already listening');
                    return;
                }

                if (!activeSTTProvider) {
                    console.error('[VoiceStore] No active STT provider');
                    return;
                }

                try {
                    const session = await activeSTTProvider.startRealtime(
                        (result) => {
                            if (result.isFinal) {
                                set({
                                    finalTranscript: result.text,
                                    interimTranscript: ''
                                });
                            } else {
                                set({ interimTranscript: result.text });
                            }
                        },
                        {
                            language: settings.language,
                            interimResults: true
                        }
                    );

                    set({
                        isListening: true,
                        currentSession: session,
                        interimTranscript: '',
                        finalTranscript: ''
                    });

                    console.log('[VoiceStore] Started listening');
                } catch (error) {
                    console.error('[VoiceStore] Failed to start listening:', error);
                    throw error;
                }
            },

            stopListening: () => {
                const { currentSession, isListening } = get();

                if (!isListening || !currentSession) {
                    return;
                }

                currentSession.stop();
                set({
                    isListening: false,
                    currentSession: null
                });

                console.log('[VoiceStore] Stopped listening');
            },

            // ========================================
            // TTS Actions
            // ========================================

            speak: async (text: string) => {
                const { activeTTSProvider, settings, isSpeaking } = get();

                if (isSpeaking) {
                    // Stop current speech first
                    get().stopSpeaking();
                }

                if (!activeTTSProvider) {
                    console.error('[VoiceStore] No active TTS provider');
                    return;
                }

                try {
                    const playback = await activeTTSProvider.speak(text, {
                        voice: settings.selectedVoice,
                        speed: settings.ttsSpeed
                    });

                    set({
                        isSpeaking: true,
                        currentPlayback: playback
                    });

                    playback.onEnd(() => {
                        set({
                            isSpeaking: false,
                            currentPlayback: null
                        });
                    });

                    console.log('[VoiceStore] Started speaking');
                } catch (error) {
                    console.error('[VoiceStore] Failed to speak:', error);
                    throw error;
                }
            },

            stopSpeaking: () => {
                const { currentPlayback, isSpeaking } = get();

                if (!isSpeaking || !currentPlayback) {
                    return;
                }

                currentPlayback.stop();
                set({
                    isSpeaking: false,
                    currentPlayback: null
                });

                console.log('[VoiceStore] Stopped speaking');
            },

            // ========================================
            // Call Mode Actions
            // ========================================

            startCallMode: () => {
                set({
                    callModeActive: true,
                    callModeState: 'idle'
                });
                console.log('[VoiceStore] Call mode started');
            },

            endCallMode: () => {
                const { isListening, isSpeaking } = get();

                // Stop any active listening or speaking
                if (isListening) get().stopListening();
                if (isSpeaking) get().stopSpeaking();

                set({
                    callModeActive: false,
                    callModeState: 'idle'
                });
                console.log('[VoiceStore] Call mode ended');
            },

            // ========================================
            // Provider Actions
            // ========================================

            initializeProviders: async () => {
                const { settings } = get();

                // Initialize STT provider
                const sttProvider = getSTTProvider(settings.sttProvider, settings.apiKeys);
                if (sttProvider) {
                    const available = await sttProvider.isAvailable();
                    if (available) {
                        set({ activeSTTProvider: sttProvider });
                        console.log(`[VoiceStore] Initialized STT provider: ${settings.sttProvider}`);
                    } else {
                        console.warn(`[VoiceStore] STT provider not available: ${settings.sttProvider}`);
                        // Fallback to browser if cloud provider not available
                        if (settings.sttProvider !== 'browser') {
                            const browserSTT = getSTTProvider('browser', {});
                            if (browserSTT && await browserSTT.isAvailable()) {
                                set({ activeSTTProvider: browserSTT });
                                console.log('[VoiceStore] Fell back to browser STT');
                            }
                        }
                    }
                }

                // Initialize TTS provider
                const ttsProvider = getTTSProvider(settings.ttsProvider, settings.apiKeys);
                if (ttsProvider) {
                    const available = await ttsProvider.isAvailable();
                    if (available) {
                        set({ activeTTSProvider: ttsProvider });
                        console.log(`[VoiceStore] Initialized TTS provider: ${settings.ttsProvider}`);

                        // Load voices
                        await get().refreshVoices();
                    } else {
                        console.warn(`[VoiceStore] TTS provider not available: ${settings.ttsProvider}`);
                        // Fallback to browser if cloud provider not available
                        if (settings.ttsProvider !== 'browser') {
                            const browserTTS = getTTSProvider('browser', {});
                            if (browserTTS && await browserTTS.isAvailable()) {
                                set({ activeTTSProvider: browserTTS });
                                console.log('[VoiceStore] Fell back to browser TTS');
                                await get().refreshVoices();
                            }
                        }
                    }
                }
            },

            refreshVoices: async () => {
                const { activeTTSProvider } = get();

                if (!activeTTSProvider) {
                    set({ availableVoices: [] });
                    return;
                }

                try {
                    const voices = await activeTTSProvider.getVoices();
                    set({ availableVoices: voices });
                    console.log(`[VoiceStore] Loaded ${voices.length} voices`);
                } catch (error) {
                    console.error('[VoiceStore] Failed to load voices:', error);
                    set({ availableVoices: [] });
                }
            },

            testSTTProvider: async (providerId) => {
                const { settings } = get();
                const provider = getSTTProvider(providerId, settings.apiKeys);

                if (!provider) {
                    console.error(`[VoiceStore] STT provider not found: ${providerId}`);
                    return false;
                }

                try {
                    const available = await provider.isAvailable();
                    console.log(`[VoiceStore] STT provider ${providerId} test: ${available ? 'OK' : 'FAIL'}`);
                    return available;
                } catch (error) {
                    console.error(`[VoiceStore] STT provider ${providerId} test error:`, error);
                    return false;
                }
            },

            testTTSProvider: async (providerId) => {
                const { settings } = get();
                const provider = getTTSProvider(providerId, settings.apiKeys);

                if (!provider) {
                    console.error(`[VoiceStore] TTS provider not found: ${providerId}`);
                    return false;
                }

                try {
                    const available = await provider.isAvailable();
                    console.log(`[VoiceStore] TTS provider ${providerId} test: ${available ? 'OK' : 'FAIL'}`);
                    return available;
                } catch (error) {
                    console.error(`[VoiceStore] TTS provider ${providerId} test error:`, error);
                    return false;
                }
            },

            // ========================================
            // State Setters
            // ========================================

            setAudioLevel: (level: number) => {
                set({ audioLevel: level });
            },

            setInterimTranscript: (text: string) => {
                set({ interimTranscript: text });
            },

            setCallModeState: (state: CallModeState) => {
                set({ callModeState: state });
            }
        }),
        {
            name: 'sidepilot-voice',
            storage: chromeStorage,
            partialize: (state) => ({
                settings: state.settings
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    console.log('[VoiceStore] Rehydrated settings');
                    // Initialize providers after rehydration
                    state.initializeProviders();
                }
            }
        }
    )
);

// Export convenience hook
export function useVoice() {
    return useVoiceStore();
}
