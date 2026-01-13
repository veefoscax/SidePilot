/**
 * Voice Controls Component
 * 
 * Provides speech-to-text and text-to-speech controls for the chat interface.
 * Inspired by Open WebUI's voice interaction features.
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  Mic01Icon,
  MicOff01Icon,
  VolumeHighIcon,
  StopIcon
} from '@hugeicons/core-free-icons';
import { speechRecognition, textToSpeech, checkVoiceSupport } from '@/lib/voice';

interface VoiceControlsProps {
  onTranscript?: (text: string) => void;
  onSpeakText?: () => string; // Changed to function that returns text
  disabled?: boolean;
  className?: string;
}

export function VoiceControls({ 
  onTranscript, 
  onSpeakText,
  disabled = false,
  className = '' 
}: VoiceControlsProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceSupport, setVoiceSupport] = useState({ speechRecognition: false, textToSpeech: false });
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const lastSpeechRef = useRef<string>('');

  // Check voice support on mount
  useEffect(() => {
    setVoiceSupport(checkVoiceSupport());
  }, []);

  // Setup speech recognition callbacks
  useEffect(() => {
    if (!voiceSupport.speechRecognition) return;

    speechRecognition.onResultCallback((transcript, isFinal) => {
      if (isFinal) {
        setInterimTranscript('');
        if (transcript.trim() && onTranscript) {
          onTranscript(transcript.trim());
        }
      } else {
        setInterimTranscript(transcript);
      }
    });

    speechRecognition.onErrorCallback((error) => {
      console.error('Speech recognition error:', error);
      setError(`Speech recognition error: ${error}`);
      setIsListening(false);
      setInterimTranscript('');
    });

    speechRecognition.onStartCallback(() => {
      setIsListening(true);
      setError(null);
    });

    speechRecognition.onEndCallback(() => {
      setIsListening(false);
      setInterimTranscript('');
    });
  }, [voiceSupport.speechRecognition, onTranscript]);

  // Handle speech-to-text toggle
  const handleSpeechToggle = async () => {
    if (!voiceSupport.speechRecognition || disabled) return;

    if (isListening) {
      speechRecognition.stop();
    } else {
      // Request microphone permission
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const started = speechRecognition.start({
          language: 'en-US',
          continuous: true,
          interimResults: true,
        });
        
        if (!started) {
          setError('Failed to start speech recognition');
        }
      } catch (err) {
        setError('Microphone permission denied');
        console.error('Microphone permission error:', err);
      }
    }
  };

  // Handle text-to-speech
  const handleSpeak = async () => {
    if (!voiceSupport.textToSpeech || disabled) return;

    let textToSpeak = '';
    
    // Get text from callback if provided
    if (onSpeakText) {
      textToSpeak = onSpeakText();
    } else {
      textToSpeak = lastSpeechRef.current;
    }
    
    if (!textToSpeak.trim()) return;

    if (isSpeaking) {
      textToSpeech.stop();
      setIsSpeaking(false);
    } else {
      try {
        setIsSpeaking(true);
        lastSpeechRef.current = textToSpeak; // Store for future use
        await textToSpeech.speak(textToSpeak, {
          rate: 1.0,
          pitch: 1.0,
          volume: 0.8,
        });
        setIsSpeaking(false);
      } catch (err) {
        console.error('Text-to-speech error:', err);
        setError('Text-to-speech failed');
        setIsSpeaking(false);
      }
    }
  };

  // Update last speech text when onSpeakText is called
  const hasTextToSpeak = onSpeakText ? true : lastSpeechRef.current.trim().length > 0;

  // Don't render if no voice support
  if (!voiceSupport.speechRecognition && !voiceSupport.textToSpeech) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-1 ${className}`}>
        {/* Speech-to-Text Button */}
        {voiceSupport.speechRecognition && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSpeechToggle}
                disabled={disabled}
                className={`h-8 w-8 ${isListening ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : ''}`}
              >
                <HugeiconsIcon 
                  icon={isListening ? MicOff01Icon : Mic01Icon} 
                  className="h-4 w-4" 
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isListening ? 'Stop listening' : 'Start voice input'}</p>
              {interimTranscript && (
                <p className="text-xs text-muted-foreground mt-1">
                  "{interimTranscript}"
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Text-to-Speech Button */}
        {voiceSupport.textToSpeech && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSpeak}
                disabled={disabled || !hasTextToSpeak}
                className={`h-8 w-8 ${isSpeaking ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}
              >
                <HugeiconsIcon 
                  icon={isSpeaking ? StopIcon : VolumeHighIcon} 
                  className="h-4 w-4" 
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isSpeaking ? 'Stop speaking' : 'Read last message aloud'}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Error indicator */}
        {error && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-red-500">{error}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

// Hook for using voice controls in other components
export function useVoiceControls() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceSupport] = useState(checkVoiceSupport());

  const startListening = async () => {
    if (!voiceSupport.speechRecognition) return false;
    
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return speechRecognition.start();
    } catch (error) {
      console.error('Failed to start listening:', error);
      return false;
    }
  };

  const stopListening = () => {
    speechRecognition.stop();
  };

  const speak = async (text: string) => {
    if (!voiceSupport.textToSpeech) return false;
    
    try {
      await textToSpeech.speak(text);
      return true;
    } catch (error) {
      console.error('Failed to speak:', error);
      return false;
    }
  };

  const stopSpeaking = () => {
    textToSpeech.stop();
  };

  useEffect(() => {
    setIsListening(speechRecognition.getIsListening());
    setIsSpeaking(textToSpeech.getIsSpeaking());
    
    const interval = setInterval(() => {
      setIsListening(speechRecognition.getIsListening());
      setIsSpeaking(textToSpeech.getIsSpeaking());
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return {
    isListening,
    isSpeaking,
    voiceSupport,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}