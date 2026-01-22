/**
 * OpenAI Whisper Speech-to-Text Provider
 * 
 * Uses OpenAI's Whisper model for high-quality transcription
 * with language auto-detection support.
 * 
 * Requirements: AC1.5, AC4.2
 */

import type {
    STTProvider,
    STTOptions,
    TranscriptionResult,
    RealtimeSession,
    VoiceApiKeys
} from '../types';
import { registerSTTProvider } from '../registry';

/**
 * OpenAI Whisper supported languages (subset - Whisper supports many more)
 */
const SUPPORTED_LANGUAGES = [
    'auto', // Auto-detect
    'en', 'es', 'pt', 'fr', 'de', 'it', 'ja', 'ko', 'zh', 'ru', 'ar', 'hi',
    'nl', 'pl', 'sv', 'tr', 'uk', 'vi', 'th', 'id', 'ms', 'fi', 'no', 'da'
];

/**
 * Create the OpenAI Whisper STT provider
 */
function createOpenAISTTProvider(apiKeys: VoiceApiKeys): STTProvider {
    const apiKey = apiKeys.openai || '';

    return {
        id: 'openai',
        name: 'OpenAI Whisper',
        type: 'stt',
        requiresApiKey: true,
        supportsRealtime: true, // Via chunked recording
        supportedLanguages: SUPPORTED_LANGUAGES,

        async isAvailable(): Promise<boolean> {
            if (!apiKey) {
                console.warn('[OpenAISTT] No API key provided');
                return false;
            }

            try {
                // Test API key by checking model access
                const response = await fetch('https://api.openai.com/v1/models/whisper-1', {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`
                    }
                });

                if (!response.ok) {
                    const error = await response.json().catch(() => ({}));
                    console.warn('[OpenAISTT] API key validation failed:', error);
                    return false;
                }

                return true;
            } catch (error) {
                console.error('[OpenAISTT] API key validation error:', error);
                return false;
            }
        },

        async transcribe(audio: Blob, options?: STTOptions): Promise<TranscriptionResult> {
            if (!apiKey) {
                throw new Error('OpenAI API key not configured');
            }

            const formData = new FormData();

            // Determine file extension from blob type
            const mimeType = audio.type || 'audio/webm';
            const extension = mimeType.includes('mp3') ? 'mp3' :
                mimeType.includes('wav') ? 'wav' :
                    mimeType.includes('mp4') ? 'mp4' : 'webm';

            formData.append('file', audio, `audio.${extension}`);
            formData.append('model', 'whisper-1');

            // Add language if specified (not 'auto')
            if (options?.language && options.language !== 'auto') {
                formData.append('language', options.language);
            }

            try {
                const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: formData
                });

                if (!response.ok) {
                    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
                    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
                }

                const data = await response.json();

                return {
                    text: data.text,
                    isFinal: true,
                    language: data.language || options?.language
                };
            } catch (error) {
                console.error('[OpenAISTT] Transcription error:', error);
                throw error;
            }
        },

        async startRealtime(
            onResult: (result: TranscriptionResult) => void,
            options?: STTOptions
        ): Promise<RealtimeSession> {
            if (!apiKey) {
                throw new Error('OpenAI API key not configured');
            }

            // Request microphone access
            let stream: MediaStream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        channelCount: 1,
                        sampleRate: 16000, // Whisper prefers 16kHz
                        echoCancellation: true,
                        noiseSuppression: true
                    }
                });
            } catch (error) {
                throw new Error(`Microphone access denied: ${error}`);
            }

            // Set up MediaRecorder
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : 'audio/webm';

            const recorder = new MediaRecorder(stream, { mimeType });
            let isActive = true;
            let chunks: Blob[] = [];

            // Process audio chunks
            recorder.ondataavailable = async (event) => {
                if (event.data.size > 0 && isActive) {
                    chunks.push(event.data);

                    // Combine chunks and transcribe
                    const audioBlob = new Blob(chunks, { type: mimeType });

                    // Only transcribe if we have enough audio (at least 0.5 seconds worth)
                    if (audioBlob.size > 8000) {
                        try {
                            const result = await this.transcribe(audioBlob, options);
                            onResult(result);
                            // Clear chunks after successful transcription
                            chunks = [];
                        } catch (error) {
                            console.error('[OpenAISTT] Chunk transcription error:', error);
                            // Keep chunks for next attempt
                        }
                    }
                }
            };

            recorder.onerror = (event) => {
                console.error('[OpenAISTT] Recorder error:', event);
            };

            // Start recording with 3-second chunks
            recorder.start(3000);
            console.log('[OpenAISTT] Started real-time transcription');

            return {
                stop: () => {
                    isActive = false;

                    if (recorder.state !== 'inactive') {
                        recorder.stop();
                    }

                    // Stop all tracks
                    stream.getTracks().forEach(track => track.stop());

                    // Transcribe any remaining chunks
                    if (chunks.length > 0) {
                        const finalBlob = new Blob(chunks, { type: mimeType });
                        if (finalBlob.size > 4000) {
                            this.transcribe(finalBlob, options)
                                .then(result => onResult(result))
                                .catch(error => console.error('[OpenAISTT] Final transcription error:', error));
                        }
                    }

                    console.log('[OpenAISTT] Stopped real-time transcription');
                },
                isActive: () => isActive
            };
        }
    };
}

// Register the provider
registerSTTProvider('openai', createOpenAISTTProvider);

export { createOpenAISTTProvider };
