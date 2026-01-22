/**
 * Browser Speech-to-Text Provider
 * 
 * Uses the Web Speech API (SpeechRecognition) for browser-native
 * speech recognition. Free and works offline in supported browsers.
 * 
 * Requirements: AC1.5
 */

import type {
    STTProvider,
    STTOptions,
    TranscriptionResult,
    RealtimeSession,
    VoiceApiKeys
} from '../types';
import { registerSTTProvider } from '../registry';

// Extend Window interface for vendor-prefixed API
declare global {
    interface Window {
        SpeechRecognition: typeof SpeechRecognition;
        webkitSpeechRecognition: typeof SpeechRecognition;
    }
}

/**
 * Supported languages for browser speech recognition
 */
const SUPPORTED_LANGUAGES = [
    'en-US', 'en-GB', 'en-AU',
    'es-ES', 'es-MX',
    'pt-BR', 'pt-PT',
    'fr-FR', 'fr-CA',
    'de-DE',
    'it-IT',
    'ja-JP',
    'ko-KR',
    'zh-CN', 'zh-TW',
    'ru-RU',
    'ar-SA',
    'hi-IN'
];

/**
 * Create the browser STT provider
 */
function createBrowserSTTProvider(_apiKeys: VoiceApiKeys): STTProvider {
    return {
        id: 'browser',
        name: 'Browser (Free)',
        type: 'stt',
        requiresApiKey: false,
        supportsRealtime: true,
        supportedLanguages: SUPPORTED_LANGUAGES,

        async isAvailable(): Promise<boolean> {
            return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
        },

        async transcribe(_audio: Blob, _options?: STTOptions): Promise<TranscriptionResult> {
            // Browser STT doesn't support one-shot transcription of audio blobs
            throw new Error('Browser STT only supports real-time transcription. Use startRealtime() instead.');
        },

        async startRealtime(
            onResult: (result: TranscriptionResult) => void,
            options?: STTOptions
        ): Promise<RealtimeSession> {
            // Get the SpeechRecognition constructor
            const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;

            if (!SpeechRecognitionConstructor) {
                throw new Error('Speech recognition is not supported in this browser');
            }

            const recognition = new SpeechRecognitionConstructor();

            // Configure recognition
            recognition.continuous = true;
            recognition.interimResults = options?.interimResults ?? true;
            recognition.lang = options?.language || 'en-US';

            let isActive = true;

            // Handle results
            recognition.onresult = (event: SpeechRecognitionEvent) => {
                const lastResult = event.results[event.results.length - 1];
                const transcript = lastResult[0].transcript;
                const confidence = lastResult[0].confidence;
                const isFinal = lastResult.isFinal;

                onResult({
                    text: transcript,
                    isFinal,
                    confidence,
                    language: recognition.lang
                });
            };

            // Handle errors
            recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
                console.error('[BrowserSTT] Recognition error:', event.error);

                // Don't stop on certain recoverable errors
                if (event.error === 'no-speech' || event.error === 'aborted') {
                    return;
                }

                // Stop on fatal errors
                isActive = false;
            };

            // Handle end - restart if still active (for continuous listening)
            recognition.onend = () => {
                if (isActive) {
                    try {
                        recognition.start();
                    } catch (e) {
                        console.error('[BrowserSTT] Failed to restart recognition:', e);
                        isActive = false;
                    }
                }
            };

            // Start recognition
            try {
                recognition.start();
                console.log('[BrowserSTT] Started real-time transcription');
            } catch (error) {
                throw new Error(`Failed to start speech recognition: ${error}`);
            }

            return {
                stop: () => {
                    isActive = false;
                    try {
                        recognition.stop();
                        console.log('[BrowserSTT] Stopped real-time transcription');
                    } catch (e) {
                        // Already stopped
                    }
                },
                isActive: () => isActive
            };
        }
    };
}

// Register the provider
registerSTTProvider('browser', createBrowserSTTProvider);

export { createBrowserSTTProvider };
