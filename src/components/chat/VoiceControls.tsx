/**
 * Voice Controls Component
 * 
 * Provides speech-to-text controls for the chat input area.
 * Uses the new voice provider system for multi-provider support.
 * 
 * Requirements: AC1.2, AC1.4
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Mic01Icon,
  MicOff01Icon,
  Call02Icon,
  Loading03Icon
} from '@hugeicons/core-free-icons';
import { useVoiceStore } from '@/stores/voice';

interface VoiceControlsProps {
  /** Callback when a final transcript is ready */
  onTranscript?: (text: string) => void;
  /** Callback to start call mode */
  onStartCallMode?: () => void;
  /** Whether controls are disabled */
  disabled?: boolean;
  /** CSS class name */
  className?: string;
  /** Whether to show call mode button */
  showCallModeButton?: boolean;
  /** Whether to show language selector */
  showLanguageSelector?: boolean;
}

/** Available languages for STT */
const AVAILABLE_LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'pt-BR', name: 'Português (BR)' },
  { code: 'es-ES', name: 'Español' },
  { code: 'fr-FR', name: 'Français' },
  { code: 'de-DE', name: 'Deutsch' },
  { code: 'ja-JP', name: '日本語' },
  { code: 'zh-CN', name: '中文' }
];

export function VoiceControls({
  onTranscript,
  onStartCallMode,
  disabled = false,
  className = '',
  showCallModeButton = true,
  showLanguageSelector = false
}: VoiceControlsProps) {
  const { t } = useTranslation();
  const {
    isListening,
    interimTranscript,
    finalTranscript,
    activeSTTProvider,
    settings,
    setSettings,
    startListening: storeStartListening,
    stopListening: storeStopListening,
    startCallMode,
    initializeProviders
  } = useVoiceStore();

  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Initialize providers on mount
  useEffect(() => {
    const init = async () => {
      if (!activeSTTProvider) {
        setIsInitializing(true);
        await initializeProviders();
        setIsInitializing(false);
      }
    };
    init();
  }, [activeSTTProvider, initializeProviders]);

  // Handle final transcript
  useEffect(() => {
    if (finalTranscript && onTranscript) {
      onTranscript(finalTranscript);
    }
  }, [finalTranscript, onTranscript]);

  // Handle speech toggle
  const handleSpeechToggle = useCallback(async () => {
    if (disabled || isInitializing || !activeSTTProvider) return;

    setError(null);

    if (isListening) {
      storeStopListening();
    } else {
      try {
        await storeStartListening();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to start listening';
        setError(errorMessage);
        console.error('[VoiceControls] Start listening error:', err);
      }
    }
  }, [disabled, isInitializing, activeSTTProvider, isListening, storeStartListening, storeStopListening]);

  // Handle call mode start
  const handleCallMode = useCallback(() => {
    if (disabled || isInitializing) return;

    startCallMode();
    onStartCallMode?.();
  }, [disabled, isInitializing, startCallMode, onStartCallMode]);

  // Handle language change
  const handleLanguageChange = useCallback((language: string) => {
    setSettings({ language });
  }, [setSettings]);

  // Check if voice is available
  const isVoiceAvailable = !!activeSTTProvider;

  // Don't render if no voice support
  if (!isVoiceAvailable && !isInitializing) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-1 ${className}`}>
        {/* Language Selector (optional) */}
        {showLanguageSelector && isVoiceAvailable && (
          <Select
            value={settings.language}
            onValueChange={handleLanguageChange}
            disabled={isListening}
          >
            <SelectTrigger className="w-[100px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_LANGUAGES.map(lang => (
                <SelectItem key={lang.code} value={lang.code} className="text-xs">
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Speech-to-Text Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSpeechToggle}
              disabled={disabled || isInitializing || !isVoiceAvailable}
              className={`h-8 w-8 relative ${isListening
                ? 'text-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse'
                : ''
                }`}
            >
              {isInitializing ? (
                <HugeiconsIcon icon={Loading03Icon} className="h-4 w-4 animate-spin" />
              ) : (
                <HugeiconsIcon
                  icon={isListening ? MicOff01Icon : Mic01Icon}
                  className="h-4 w-4"
                />
              )}

              {/* Recording indicator */}
              {isListening && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px]">
            <p>
              {isListening
                ? (t('chat.voice.stop') || 'Stop voice input')
                : (t('chat.voice.start') || 'Start voice input')
              }
            </p>
            {interimTranscript && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                "{interimTranscript}"
              </p>
            )}
            {!isVoiceAvailable && !isInitializing && (
              <p className="text-xs text-destructive mt-1">
                {t('chat.voice.notSupported') || 'Voice not supported'}
              </p>
            )}
          </TooltipContent>
        </Tooltip>

        {/* Call Mode Button (optional) */}
        {showCallModeButton && isVoiceAvailable && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCallMode}
                disabled={disabled || isInitializing || isListening}
                className="h-8 w-8"
              >
                <HugeiconsIcon icon={Call02Icon} className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('voice.callMode.start') || 'Start Call Mode'}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Provider Badge */}
        {isListening && activeSTTProvider && (
          <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
            {activeSTTProvider.name}
          </Badge>
        )}

        {/* Error indicator */}
        {error && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-red-500 text-xs">{error}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

/**
 * Hook for using voice controls programmatically
 */
export function useVoiceControls() {
  const {
    isListening,
    isSpeaking,
    activeSTTProvider,
    activeTTSProvider,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    initializeProviders
  } = useVoiceStore();

  useEffect(() => {
    // Ensure providers are initialized
    if (!activeSTTProvider && !activeTTSProvider) {
      initializeProviders();
    }
  }, [activeSTTProvider, activeTTSProvider, initializeProviders]);

  return {
    isListening,
    isSpeaking,
    voiceSupport: {
      speechRecognition: !!activeSTTProvider,
      textToSpeech: !!activeTTSProvider
    },
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}

export default VoiceControls;