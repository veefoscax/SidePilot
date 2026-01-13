/**
 * Voice Utilities
 * 
 * Provides speech-to-text and text-to-speech functionality
 * for enhanced chat interaction similar to Open WebUI.
 */

export interface VoiceConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export interface SpeechSynthesisConfig {
  voice?: SpeechSynthesisVoice;
  rate?: number;
  pitch?: number;
  volume?: number;
}

/**
 * Speech Recognition Wrapper
 */
export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private onResult?: (transcript: string, isFinal: boolean) => void;
  private onError?: (error: string) => void;
  private onStart?: () => void;
  private onEnd?: () => void;

  constructor() {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
      this.onStart?.();
    };

    this.recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        this.onResult?.(finalTranscript, true);
      } else if (interimTranscript) {
        this.onResult?.(interimTranscript, false);
      }
    };

    this.recognition.onerror = (event) => {
      this.onError?.(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onEnd?.();
    };
  }

  public isSupported(): boolean {
    return this.recognition !== null;
  }

  public start(config?: VoiceConfig): boolean {
    if (!this.recognition || this.isListening) return false;

    if (config) {
      this.recognition.lang = config.language || 'en-US';
      this.recognition.continuous = config.continuous ?? true;
      this.recognition.interimResults = config.interimResults ?? true;
    }

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      return false;
    }
  }

  public stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public onResultCallback(callback: (transcript: string, isFinal: boolean) => void): void {
    this.onResult = callback;
  }

  public onErrorCallback(callback: (error: string) => void): void {
    this.onError = callback;
  }

  public onStartCallback(callback: () => void): void {
    this.onStart = callback;
  }

  public onEndCallback(callback: () => void): void {
    this.onEnd = callback;
  }
}

/**
 * Text-to-Speech Service
 */
export class TextToSpeechService {
  private synth: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;

  constructor() {
    this.synth = window.speechSynthesis;
  }

  public isSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  public getVoices(): SpeechSynthesisVoice[] {
    return this.synth.getVoices();
  }

  public speak(text: string, config?: SpeechSynthesisConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Stop any current speech
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Apply configuration
      if (config?.voice) utterance.voice = config.voice;
      if (config?.rate) utterance.rate = config.rate;
      if (config?.pitch) utterance.pitch = config.pitch;
      if (config?.volume) utterance.volume = config.volume;

      utterance.onstart = () => {
        this.isSpeaking = true;
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    });
  }

  public stop(): void {
    if (this.synth.speaking) {
      this.synth.cancel();
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
  }

  public pause(): void {
    if (this.synth.speaking) {
      this.synth.pause();
    }
  }

  public resume(): void {
    if (this.synth.paused) {
      this.synth.resume();
    }
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}

// Global instances
export const speechRecognition = new SpeechRecognitionService();
export const textToSpeech = new TextToSpeechService();

// Utility functions
export function checkVoiceSupport() {
  return {
    speechRecognition: speechRecognition.isSupported(),
    textToSpeech: textToSpeech.isSupported(),
  };
}