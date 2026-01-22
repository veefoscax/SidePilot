/**
 * Voice System Types
 * 
 * Type definitions for multi-provider Speech-to-Text (STT) and 
 * Text-to-Speech (TTS) functionality.
 * 
 * Requirements: TR1, AC4
 */

// ============================================================================
// Base Provider Types
// ============================================================================

/**
 * Base voice provider interface shared by STT and TTS providers
 */
export interface VoiceProvider {
    id: string;
    name: string;
    type: 'stt' | 'tts';
    requiresApiKey: boolean;
    isAvailable: () => Promise<boolean>;
}

// ============================================================================
// Speech-to-Text (STT) Types
// ============================================================================

/**
 * Options for speech-to-text transcription
 */
export interface STTOptions {
    /** Language code (e.g., 'en-US', 'pt-BR', 'auto') */
    language?: string;
    /** Whether to return interim (partial) results */
    interimResults?: boolean;
    /** Whether to add punctuation automatically */
    punctuate?: boolean;
}

/**
 * Result from speech transcription
 */
export interface TranscriptionResult {
    /** The transcribed text */
    text: string;
    /** Whether this is a final result (vs interim) */
    isFinal: boolean;
    /** Confidence score (0-1), if available */
    confidence?: number;
    /** Detected language, if auto-detect was used */
    language?: string;
}

/**
 * Handle for controlling a real-time transcription session
 */
export interface RealtimeSession {
    /** Stop the transcription session */
    stop: () => void;
    /** Check if the session is still active */
    isActive: () => boolean;
}

/**
 * Speech-to-Text provider interface
 */
export interface STTProvider extends VoiceProvider {
    type: 'stt';
    /** Whether this provider supports real-time streaming transcription */
    supportsRealtime: boolean;
    /** List of supported language codes */
    supportedLanguages: string[];

    /**
     * One-shot transcription of an audio blob
     * @param audio - Audio data (WebM, MP3, etc.)
     * @param options - Transcription options
     */
    transcribe(audio: Blob, options?: STTOptions): Promise<TranscriptionResult>;

    /**
     * Start real-time transcription from microphone
     * @param onResult - Callback for transcription results
     * @param options - Transcription options
     */
    startRealtime(
        onResult: (result: TranscriptionResult) => void,
        options?: STTOptions
    ): Promise<RealtimeSession>;
}

// ============================================================================
// Text-to-Speech (TTS) Types
// ============================================================================

/**
 * Options for text-to-speech synthesis
 */
export interface TTSOptions {
    /** Voice ID to use */
    voice?: string;
    /** Playback speed (0.5 - 2.0) */
    speed?: number;
    /** Voice pitch (0.5 - 2.0) */
    pitch?: number;
    /** Volume level (0.0 - 1.0) */
    volume?: number;
}

/**
 * Available voice option from a TTS provider
 */
export interface VoiceOption {
    /** Unique voice identifier */
    id: string;
    /** Human-readable voice name */
    name: string;
    /** Language code (e.g., 'en-US') */
    language: string;
    /** Voice gender, if available */
    gender?: 'male' | 'female' | 'neutral';
    /** URL to preview audio sample */
    preview?: string;
}

/**
 * Controls for audio playback
 */
export interface AudioPlayback {
    /** Start or resume playback */
    play: () => void;
    /** Pause playback */
    pause: () => void;
    /** Stop playback and reset to beginning */
    stop: () => void;
    /** Set playback speed (0.5 - 2.0) */
    setSpeed: (speed: number) => void;
    /** Register callback for when playback ends */
    onEnd: (callback: () => void) => void;
    /** Get current playback progress (0.0 - 1.0) */
    getProgress: () => number;
    /** Check if currently playing */
    isPlaying: () => boolean;
}

/**
 * Text-to-Speech provider interface
 */
export interface TTSProvider extends VoiceProvider {
    type: 'tts';
    /** Whether this provider supports streaming audio */
    supportsStreaming: boolean;

    /**
     * Get list of available voices
     */
    getVoices(): Promise<VoiceOption[]>;

    /**
     * Speak text with playback controls
     * @param text - Text to speak
     * @param options - Speech options
     */
    speak(text: string, options?: TTSOptions): Promise<AudioPlayback>;

    /**
     * Synthesize text to audio blob without playing
     * @param text - Text to synthesize
     * @param options - Speech options
     */
    synthesize(text: string, options?: TTSOptions): Promise<Blob>;
}

// ============================================================================
// Voice Settings Types
// ============================================================================

/** STT provider identifiers */
export type STTProviderId = 'browser' | 'openai';

/** TTS provider identifiers */
export type TTSProviderId = 'browser' | 'openai' | 'elevenlabs';

/**
 * API keys for voice providers
 */
export interface VoiceApiKeys {
    openai?: string;
    elevenlabs?: string;
}

/**
 * Voice settings configuration
 */
export interface VoiceSettings {
    /** Selected STT provider */
    sttProvider: STTProviderId;
    /** Selected TTS provider */
    ttsProvider: TTSProviderId;
    /** Selected voice ID for TTS */
    selectedVoice: string;
    /** Whether to auto-play AI responses */
    autoPlayResponses: boolean;
    /** Whether to use VAD (Voice Activity Detection) in call mode */
    callModeVAD: boolean;
    /** Preferred language for STT */
    language: string;
    /** TTS playback speed (0.5 - 2.0) */
    ttsSpeed: number;
    /** API keys for providers */
    apiKeys: VoiceApiKeys;
}

/** Default voice settings */
export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
    sttProvider: 'browser',
    ttsProvider: 'browser',
    selectedVoice: '',
    autoPlayResponses: false,
    callModeVAD: true,
    language: 'en-US',
    ttsSpeed: 1.0,
    apiKeys: {}
};

// ============================================================================
// Voice State Types
// ============================================================================

/** Call mode states */
export type CallModeState = 'idle' | 'listening' | 'processing' | 'speaking';

/**
 * Voice store state
 */
export interface VoiceState {
    // === Settings ===
    settings: VoiceSettings;

    // === Runtime State ===
    /** Whether STT is currently active */
    isListening: boolean;
    /** Whether TTS is currently playing */
    isSpeaking: boolean;
    /** Whether call mode is active */
    callModeActive: boolean;
    /** Current state within call mode */
    callModeState: CallModeState;
    /** Current audio input level (0.0 - 1.0) */
    audioLevel: number;
    /** Interim (partial) transcript while listening */
    interimTranscript: string;
    /** Final transcript from last recording */
    finalTranscript: string;

    // === Providers ===
    /** Currently active STT provider instance */
    activeSTTProvider: STTProvider | null;
    /** Currently active TTS provider instance */
    activeTTSProvider: TTSProvider | null;
    /** Available voices from current TTS provider */
    availableVoices: VoiceOption[];

    // === Current Session ===
    /** Current realtime session handle */
    currentSession: RealtimeSession | null;
    /** Current audio playback handle */
    currentPlayback: AudioPlayback | null;
}

/**
 * Voice store actions
 */
export interface VoiceActions {
    // === Settings Actions ===
    setSettings: (settings: Partial<VoiceSettings>) => void;

    // === STT Actions ===
    startListening: () => Promise<void>;
    stopListening: () => void;

    // === TTS Actions ===
    speak: (text: string) => Promise<void>;
    stopSpeaking: () => void;

    // === Call Mode Actions ===
    startCallMode: () => void;
    endCallMode: () => void;

    // === Provider Actions ===
    initializeProviders: () => Promise<void>;
    refreshVoices: () => Promise<void>;
    testSTTProvider: (providerId: STTProviderId) => Promise<boolean>;
    testTTSProvider: (providerId: TTSProviderId) => Promise<boolean>;

    // === State Setters ===
    setAudioLevel: (level: number) => void;
    setInterimTranscript: (text: string) => void;
    setCallModeState: (state: CallModeState) => void;
}

/** Combined voice store type */
export type VoiceStore = VoiceState & VoiceActions;
