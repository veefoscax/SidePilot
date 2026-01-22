/**
 * ElevenLabs Text-to-Speech Provider
 * 
 * Uses ElevenLabs API for ultra-realistic AI voices with
 * emotion control and voice cloning support.
 * 
 * Requirements: AC2.5, AC4.3, AC5.2
 */

import type {
    TTSProvider,
    TTSOptions,
    VoiceOption,
    AudioPlayback,
    VoiceApiKeys
} from '../types';
import { registerTTSProvider } from '../registry';

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

/**
 * Create the ElevenLabs TTS provider
 */
function createElevenLabsTTSProvider(apiKeys: VoiceApiKeys): TTSProvider {
    const apiKey = apiKeys.elevenlabs || '';

    // Cache voices to avoid repeated API calls
    let cachedVoices: VoiceOption[] | null = null;

    return {
        id: 'elevenlabs',
        name: 'ElevenLabs',
        type: 'tts',
        requiresApiKey: true,
        supportsStreaming: true,

        async isAvailable(): Promise<boolean> {
            if (!apiKey) {
                console.warn('[ElevenLabsTTS] No API key provided');
                return false;
            }

            try {
                const response = await fetch(`${ELEVENLABS_API_BASE}/voices`, {
                    headers: {
                        'xi-api-key': apiKey
                    }
                });

                return response.ok;
            } catch (error) {
                console.error('[ElevenLabsTTS] API key validation error:', error);
                return false;
            }
        },

        async getVoices(): Promise<VoiceOption[]> {
            if (!apiKey) {
                return [];
            }

            // Return cached voices if available
            if (cachedVoices) {
                return cachedVoices;
            }

            try {
                const response = await fetch(`${ELEVENLABS_API_BASE}/voices`, {
                    headers: {
                        'xi-api-key': apiKey
                    }
                });

                if (!response.ok) {
                    console.error('[ElevenLabsTTS] Failed to fetch voices');
                    return [];
                }

                const data = await response.json();

                cachedVoices = data.voices.map((voice: any) => ({
                    id: voice.voice_id,
                    name: voice.name,
                    language: voice.labels?.language || 'en',
                    gender: voice.labels?.gender === 'female' ? 'female' as const :
                        voice.labels?.gender === 'male' ? 'male' as const :
                            'neutral' as const,
                    preview: voice.preview_url
                }));

                console.log(`[ElevenLabsTTS] Loaded ${cachedVoices.length} voices`);
                return cachedVoices;
            } catch (error) {
                console.error('[ElevenLabsTTS] Error fetching voices:', error);
                return [];
            }
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
                console.error('[ElevenLabsTTS] Audio playback error:', event);
                isPlaying = false;
                URL.revokeObjectURL(audioUrl);
            };

            // Start playback
            try {
                await audioElement.play();
                isPlaying = true;
                console.log('[ElevenLabsTTS] Started speaking');
            } catch (error) {
                console.error('[ElevenLabsTTS] Failed to play audio:', error);
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
                throw new Error('ElevenLabs API key not configured');
            }

            // Default voice: Rachel (ElevenLabs default voice)
            const voiceId = options?.voice || '21m00Tcm4TlvDq8ikWAM';

            try {
                const response = await fetch(
                    `${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}`,
                    {
                        method: 'POST',
                        headers: {
                            'xi-api-key': apiKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            text,
                            model_id: 'eleven_monolingual_v1',
                            voice_settings: {
                                stability: 0.5,
                                similarity_boost: 0.75,
                                style: 0,
                                use_speaker_boost: true
                            }
                        })
                    }
                );

                if (!response.ok) {
                    const error = await response.json().catch(() => ({ detail: { message: 'Unknown error' } }));
                    throw new Error(
                        `ElevenLabs API error: ${error.detail?.message || error.message || response.statusText}`
                    );
                }

                const audioBlob = await response.blob();
                console.log('[ElevenLabsTTS] Synthesized audio:', audioBlob.size, 'bytes');

                return audioBlob;
            } catch (error) {
                console.error('[ElevenLabsTTS] Synthesis error:', error);
                throw error;
            }
        }
    };
}

// Register the provider
registerTTSProvider('elevenlabs', createElevenLabsTTSProvider);

export { createElevenLabsTTSProvider };
