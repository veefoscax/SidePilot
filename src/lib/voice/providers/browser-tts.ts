/**
 * Browser Text-to-Speech Provider
 * 
 * Uses the Web Speech API (SpeechSynthesis) for browser-native
 * text-to-speech. Free and works in all modern browsers.
 * 
 * Requirements: AC2.5
 */

import type {
    TTSProvider,
    TTSOptions,
    VoiceOption,
    AudioPlayback,
    VoiceApiKeys
} from '../types';
import { registerTTSProvider } from '../registry';

/**
 * Create the browser TTS provider
 */
function createBrowserTTSProvider(_apiKeys: VoiceApiKeys): TTSProvider {
    let currentUtterance: SpeechSynthesisUtterance | null = null;
    let cachedVoices: VoiceOption[] = [];

    // Cache voices when they become available
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const loadVoices = () => {
            const synth = window.speechSynthesis;
            const voices = synth.getVoices();

            cachedVoices = voices.map(voice => ({
                id: voice.voiceURI,
                name: voice.name,
                language: voice.lang,
                gender: voice.name.toLowerCase().includes('female') ? 'female' as const :
                    voice.name.toLowerCase().includes('male') ? 'male' as const :
                        'neutral' as const
            }));
        };

        // Load voices (they may be loaded async)
        loadVoices();
        if ('onvoiceschanged' in window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }

    return {
        id: 'browser',
        name: 'Browser (Free)',
        type: 'tts',
        requiresApiKey: false,
        supportsStreaming: false,

        async isAvailable(): Promise<boolean> {
            return 'speechSynthesis' in window;
        },

        async getVoices(): Promise<VoiceOption[]> {
            if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
                return [];
            }

            const synth = window.speechSynthesis;
            let voices = synth.getVoices();

            // Voices may not be loaded yet, wait for them
            if (voices.length === 0) {
                await new Promise<void>(resolve => {
                    const checkVoices = () => {
                        voices = synth.getVoices();
                        if (voices.length > 0) {
                            resolve();
                        } else {
                            setTimeout(checkVoices, 100);
                        }
                    };
                    checkVoices();
                    // Timeout after 2 seconds
                    setTimeout(resolve, 2000);
                });
                voices = synth.getVoices();
            }

            return voices.map(voice => ({
                id: voice.voiceURI,
                name: voice.name,
                language: voice.lang,
                gender: voice.name.toLowerCase().includes('female') ? 'female' as const :
                    voice.name.toLowerCase().includes('male') ? 'male' as const :
                        'neutral' as const
            }));
        },

        async speak(text: string, options?: TTSOptions): Promise<AudioPlayback> {
            const synth = window.speechSynthesis;

            // Stop any current speech
            if (synth.speaking) {
                synth.cancel();
            }

            const utterance = new SpeechSynthesisUtterance(text);

            // Apply voice if specified
            if (options?.voice) {
                const voices = synth.getVoices();
                const selectedVoice = voices.find(v => v.voiceURI === options.voice);
                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                }
            }

            // Apply options
            if (options?.speed) utterance.rate = options.speed;
            if (options?.pitch) utterance.pitch = options.pitch;
            if (options?.volume) utterance.volume = options.volume;

            currentUtterance = utterance;

            let endCallback: (() => void) | null = null;
            let isPlaying = true;

            // Create AudioPlayback controls
            const playback: AudioPlayback = {
                play: () => {
                    if (synth.paused) {
                        synth.resume();
                        isPlaying = true;
                    } else if (!synth.speaking) {
                        synth.speak(utterance);
                        isPlaying = true;
                    }
                },
                pause: () => {
                    synth.pause();
                    isPlaying = false;
                },
                stop: () => {
                    synth.cancel();
                    isPlaying = false;
                    currentUtterance = null;
                },
                setSpeed: (speed: number) => {
                    // Can't change speed mid-speech with browser API
                    // Would need to restart with new rate
                    utterance.rate = speed;
                },
                onEnd: (callback: () => void) => {
                    endCallback = callback;
                },
                getProgress: () => {
                    // Browser API doesn't expose progress
                    return synth.speaking ? 0.5 : 0;
                },
                isPlaying: () => isPlaying
            };

            // Set up event handlers
            utterance.onend = () => {
                isPlaying = false;
                currentUtterance = null;
                endCallback?.();
            };

            utterance.onerror = (event) => {
                console.error('[BrowserTTS] Speech error:', event.error);
                isPlaying = false;
                currentUtterance = null;
            };

            // Start speaking
            synth.speak(utterance);
            console.log('[BrowserTTS] Started speaking');

            return playback;
        },

        async synthesize(text: string, options?: TTSOptions): Promise<Blob> {
            // Browser TTS doesn't support synthesizing to a blob
            // This would require Web Audio API recording of the speech output
            // For now, throw an error as this is a limitation
            throw new Error(
                'Browser TTS does not support audio synthesis to blob. ' +
                'Use speak() for playback or switch to OpenAI/ElevenLabs for audio file generation.'
            );
        }
    };
}

// Register the provider
registerTTSProvider('browser', createBrowserTTSProvider);

export { createBrowserTTSProvider };
