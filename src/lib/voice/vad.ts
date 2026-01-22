/**
 * Voice Activity Detection (VAD)
 * 
 * Detects when the user starts and stops speaking using
 * Web Audio API for real-time audio level analysis.
 * 
 * Requirements: AC3.2
 */

export interface VADOptions {
    /** Minimum volume threshold to consider as speech (0-1) */
    silenceThreshold?: number;
    /** Milliseconds of silence before triggering speech end */
    silenceDelay?: number;
    /** Minimum decibels for audio analysis */
    minDecibels?: number;
    /** FFT size for audio analysis */
    fftSize?: number;
}

export interface VADCallbacks {
    /** Called when speech starts */
    onSpeechStart?: () => void;
    /** Called when speech ends (after silence delay) */
    onSpeechEnd?: () => void;
    /** Called with current audio level (0-1) on each frame */
    onAudioLevel?: (level: number) => void;
}

const DEFAULT_OPTIONS: Required<VADOptions> = {
    silenceThreshold: 0.01,
    silenceDelay: 1500,
    minDecibels: -60,
    fftSize: 512
};

/**
 * Voice Activity Detector
 * 
 * Monitors microphone input and detects when the user is speaking.
 */
export class VoiceActivityDetector {
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private stream: MediaStream | null = null;
    private animationFrameId: number | null = null;

    private options: Required<VADOptions>;
    private callbacks: VADCallbacks = {};

    private isSpeaking = false;
    private silenceStartTime = 0;
    private isActive = false;

    constructor(options?: VADOptions) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }

    /**
     * Start voice activity detection
     */
    async start(stream?: MediaStream): Promise<void> {
        if (this.isActive) {
            console.warn('[VAD] Already active');
            return;
        }

        try {
            // Get or use provided media stream
            if (stream) {
                this.stream = stream;
            } else {
                this.stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });
            }

            // Create audio context and nodes
            this.audioContext = new AudioContext();
            this.source = this.audioContext.createMediaStreamSource(this.stream);
            this.analyser = this.audioContext.createAnalyser();

            // Configure analyser
            this.analyser.fftSize = this.options.fftSize;
            this.analyser.minDecibels = this.options.minDecibels;
            this.analyser.smoothingTimeConstant = 0.8;

            // Connect source to analyser
            this.source.connect(this.analyser);

            this.isActive = true;
            this.isSpeaking = false;
            this.silenceStartTime = 0;

            // Start detection loop
            this.detectActivity();

            console.log('[VAD] Started');
        } catch (error) {
            console.error('[VAD] Failed to start:', error);
            throw error;
        }
    }

    /**
     * Stop voice activity detection
     */
    stop(): void {
        if (!this.isActive) return;

        this.isActive = false;

        // Stop animation frame
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // Disconnect audio nodes
        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }

        // Close audio context
        if (this.audioContext) {
            this.audioContext.close().catch(console.error);
            this.audioContext = null;
        }

        // Stop stream tracks (only if we created it)
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        this.analyser = null;
        this.isSpeaking = false;

        console.log('[VAD] Stopped');
    }

    /**
     * Set callbacks for VAD events
     */
    setCallbacks(callbacks: VADCallbacks): void {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    /**
     * Check if currently detecting speech
     */
    getIsSpeaking(): boolean {
        return this.isSpeaking;
    }

    /**
     * Check if VAD is active
     */
    getIsActive(): boolean {
        return this.isActive;
    }

    /**
     * Update options
     */
    setOptions(options: Partial<VADOptions>): void {
        this.options = { ...this.options, ...options };
    }

    /**
     * Main detection loop
     */
    private detectActivity = (): void => {
        if (!this.isActive || !this.analyser) {
            return;
        }

        const bufferLength = this.analyser.fftSize;
        const dataArray = new Float32Array(bufferLength);
        this.analyser.getFloatTimeDomainData(dataArray);

        // Calculate RMS (Root Mean Square) for volume level
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / bufferLength);

        // Normalize to 0-1 range (multiply by 10 for better visibility)
        const normalizedLevel = Math.min(rms * 10, 1);

        // Report audio level
        this.callbacks.onAudioLevel?.(normalizedLevel);

        // Check if speaking
        const now = Date.now();

        if (rms > this.options.silenceThreshold) {
            // Sound detected
            if (!this.isSpeaking) {
                this.isSpeaking = true;
                this.callbacks.onSpeechStart?.();
                console.log('[VAD] Speech started');
            }
            this.silenceStartTime = 0;
        } else if (this.isSpeaking) {
            // Silence after speech
            if (this.silenceStartTime === 0) {
                this.silenceStartTime = now;
            } else if (now - this.silenceStartTime > this.options.silenceDelay) {
                // Silence long enough, speech ended
                this.isSpeaking = false;
                this.silenceStartTime = 0;
                this.callbacks.onSpeechEnd?.();
                console.log('[VAD] Speech ended');
            }
        }

        // Continue loop
        this.animationFrameId = requestAnimationFrame(this.detectActivity);
    };
}

// Singleton instance for convenience
let vadInstance: VoiceActivityDetector | null = null;

/**
 * Get or create the VAD singleton
 */
export function getVAD(options?: VADOptions): VoiceActivityDetector {
    if (!vadInstance) {
        vadInstance = new VoiceActivityDetector(options);
    }
    return vadInstance;
}

/**
 * Start VAD with callbacks
 */
export async function startVAD(
    callbacks: VADCallbacks,
    options?: VADOptions
): Promise<VoiceActivityDetector> {
    const vad = getVAD(options);
    vad.setCallbacks(callbacks);
    await vad.start();
    return vad;
}

/**
 * Stop the singleton VAD
 */
export function stopVAD(): void {
    if (vadInstance) {
        vadInstance.stop();
    }
}
