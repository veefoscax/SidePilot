/**
 * OpenAI Text-to-Speech Provider
 * 
 * Uses OpenAI's TTS API for high-quality speech synthesis
 * with multiple voice options.
 * 
 * Requirements: AC2.5, AC4.3
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
 * Available OpenAI TTS voices
 */
const OPENAI_VOICES: VoiceOption[] = [
    { id: 'alloy', name: 'Alloy', language: 'en', gender: 'neutral' },
    { id: 'echo', name: 'Echo', language: 'en', gender: 'male' },
    { id: 'fable', name: 'Fable', language: 'en', gender: 'neutral' },
    { id: 'onyx', name: 'Onyx', language: 'en', gender: 'male' },
    { id: 'nova', name: 'Nova', language: 'en', gender: 'female' },
    { id: 'shimmer', name: 'Shimmer', language: 'en', gender: 'female' }
];

/**
 * Create the OpenAI TTS provider
 */
function createOpenAITTSProvider(apiKeys: VoiceApiKeys): TTSProvider {
    const apiKey = apiKeys.openai || '';

    return {
        id: 'openai',
        name: 'OpenAI TTS',
        type: 'tts',
        requiresApiKey: true,
        supportsStreaming: false, // OpenAI TTS returns complete audio

        async isAvailable(): Promise<boolean> {
            if (!apiKey) {
                console.warn('[OpenAITTS] No API key provided');
                return false;
            }

            try {
                // Test API key by checking model access
                const response = await fetch('https://api.openai.com/v1/models/tts-1', {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`
                    }
                });

                return response.ok;
            } catch (error) {
                console.error('[OpenAITTS] API key validation error:', error);
                return false;
            }
        },

        async getVoices(): Promise<VoiceOption[]> {
            // OpenAI voices are static, no API call needed
            return OPENAI_VOICES;
        },

        async speak(text: string, options?: TTSOptions): Promise<AudioPlayback> {
            const audioBlob = await this.synthesize(text, options);
            const audioUrl = URL.createObjectURL(audioBlob);
            const audioElement = new Audio(audioUrl);

            let isPlaying = false;
            let endCallback: (() => void) | null = null;

            // Apply speed
            if (options?.speed) {
                audioElement.playbackRate = options.speed;
            }

            // Apply volume
            if (options?.volume !== undefined) {
                audioElement.volume = options.volume;
            }

            // Set up event handlers
            audioElement.onplay = () => {
                isPlaying = true;
            };

            audioElement.onpause = () => {
                isPlaying = false;
            };

            audioElement.onended = () => {
                isPlaying = false;
                URL.revokeObjectURL(audioUrl);
                endCallback?.();
            };

            audioElement.onerror = (event) => {
                console.error('[OpenAITTS] Audio playback error:', event);
                isPlaying = false;
                URL.revokeObjectURL(audioUrl);
            };

            // Start playback
            try {
                await audioElement.play();
                isPlaying = true;
                console.log('[OpenAITTS] Started speaking');
            } catch (error) {
                console.error('[OpenAITTS] Failed to play audio:', error);
                throw error;
            }

            return {
                play: () => {
                    audioElement.play().catch(console.error);
                },
                pause: () => {
                    audioElement.pause();
                },
                stop: () => {
                    audioElement.pause();
                    audioElement.currentTime = 0;
                    isPlaying = false;
                    URL.revokeObjectURL(audioUrl);
                },
                setSpeed: (speed: number) => {
                    audioElement.playbackRate = speed;
                },
                onEnd: (callback: () => void) => {
                    endCallback = callback;
                },
                getProgress: () => {
                    if (audioElement.duration > 0) {
                        return audioElement.currentTime / audioElement.duration;
                    }
                    return 0;
                },
                isPlaying: () => isPlaying
            };
        },

        async synthesize(text: string, options?: TTSOptions): Promise<Blob> {
            if (!apiKey) {
                throw new Error('OpenAI API key not configured');
            }

            const voice = options?.voice || 'alloy';

            // Use tts-1-hd for higher quality, or tts-1 for faster generation
            const model = 'tts-1';

            try {
                const response = await fetch('https://api.openai.com/v1/audio/speech', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model,
                        input: text,
                        voice,
                        response_format: 'mp3'
                    })
                });

                if (!response.ok) {
                    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
                    throw new Error(`OpenAI TTS API error: ${error.error?.message || response.statusText}`);
                }

                const audioBlob = await response.blob();
                console.log('[OpenAITTS] Synthesized audio:', audioBlob.size, 'bytes');

                return audioBlob;
            } catch (error) {
                console.error('[OpenAITTS] Synthesis error:', error);
                throw error;
            }
        }
    };
}

// Register the provider
registerTTSProvider('openai', createOpenAITTSProvider);

export { createOpenAITTSProvider, OPENAI_VOICES };
