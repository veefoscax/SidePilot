/**
 * Call Mode Component
 * 
 * Full-screen overlay for continuous voice conversation mode.
 * Shows audio visualization, state indicators, and controls.
 * 
 * Requirements: AC3.1, AC3.5
 */

import { useEffect, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useVoiceStore } from '@/stores/voice';
import { VoiceActivityDetector } from '@/lib/voice/vad';
import { AudioVisualizer } from './AudioVisualizer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    Cancel01Icon,
    Mic01Icon,
    MicOff01Icon,
    VolumeHighIcon
} from '@hugeicons/core-free-icons';
import type { CallModeState } from '@/lib/voice/types';

interface CallModeProps {
    /** Callback when a transcription is complete */
    onTranscript?: (text: string) => void;
    /** Callback to send message to AI */
    onSendMessage?: (text: string) => void;
}

/**
 * State display labels
 */
const STATE_LABELS: Record<CallModeState, string> = {
    idle: 'Ready',
    listening: 'Listening...',
    processing: 'Thinking...',
    speaking: 'Speaking...'
};

export function CallMode({ onTranscript, onSendMessage }: CallModeProps) {
    const { t } = useTranslation();
    const {
        callModeActive,
        callModeState,
        audioLevel,
        interimTranscript,
        finalTranscript,
        settings,
        setAudioLevel,
        setCallModeState,
        startListening,
        stopListening,
        speak: _speak,
        stopSpeaking,
        endCallMode,
        isListening,
        isSpeaking
    } = useVoiceStore();

    const [vad] = useState(() => new VoiceActivityDetector({
        silenceThreshold: 0.015,
        silenceDelay: 1500
    }));

    const [isPushToTalk, setIsPushToTalk] = useState(false);

    // Handle VAD speech start
    const handleSpeechStart = useCallback(async () => {
        if (callModeState === 'idle' && settings.callModeVAD && !isPushToTalk) {
            setCallModeState('listening');
            await startListening();
        }
    }, [callModeState, settings.callModeVAD, isPushToTalk, setCallModeState, startListening]);

    // Handle VAD speech end
    const handleSpeechEnd = useCallback(() => {
        if (callModeState === 'listening' && settings.callModeVAD && !isPushToTalk) {
            stopListening();

            // Process the transcript
            if (finalTranscript) {
                setCallModeState('processing');
                onTranscript?.(finalTranscript);
                onSendMessage?.(finalTranscript);
            } else {
                setCallModeState('idle');
            }
        }
    }, [callModeState, settings.callModeVAD, isPushToTalk, finalTranscript, stopListening, setCallModeState, onTranscript, onSendMessage]);

    // Set up VAD when call mode is active
    useEffect(() => {
        if (!callModeActive) return;

        // Set up VAD callbacks
        vad.setCallbacks({
            onSpeechStart: handleSpeechStart,
            onSpeechEnd: handleSpeechEnd,
            onAudioLevel: setAudioLevel
        });

        // Start VAD if using voice activity detection
        if (settings.callModeVAD) {
            vad.start().catch(console.error);
        }

        return () => {
            vad.stop();
        };
    }, [callModeActive, settings.callModeVAD, vad, handleSpeechStart, handleSpeechEnd, setAudioLevel]);

    // Handle push-to-talk
    const handlePushToTalkStart = useCallback(async () => {
        if (!settings.callModeVAD) {
            setIsPushToTalk(true);
            setCallModeState('listening');
            await startListening();
        }
    }, [settings.callModeVAD, setCallModeState, startListening]);

    const handlePushToTalkEnd = useCallback(() => {
        if (!settings.callModeVAD && isPushToTalk) {
            setIsPushToTalk(false);
            stopListening();

            if (finalTranscript) {
                setCallModeState('processing');
                onTranscript?.(finalTranscript);
                onSendMessage?.(finalTranscript);
            } else {
                setCallModeState('idle');
            }
        }
    }, [settings.callModeVAD, isPushToTalk, finalTranscript, stopListening, setCallModeState, onTranscript, onSendMessage]);

    // Keyboard shortcut for push-to-talk (Space)
    useEffect(() => {
        if (!callModeActive || settings.callModeVAD) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !isPushToTalk && callModeState === 'idle') {
                e.preventDefault();
                handlePushToTalkStart();
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space' && isPushToTalk) {
                e.preventDefault();
                handlePushToTalkEnd();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [callModeActive, settings.callModeVAD, isPushToTalk, callModeState, handlePushToTalkStart, handlePushToTalkEnd]);

    // Handle end call
    const handleEndCall = useCallback(() => {
        if (isListening) stopListening();
        if (isSpeaking) stopSpeaking();
        endCallMode();
    }, [isListening, isSpeaking, stopListening, stopSpeaking, endCallMode]);

    if (!callModeActive) return null;

    return (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
            {/* State Badge */}
            <Badge
                variant={callModeState === 'idle' ? 'outline' : 'default'}
                className="absolute top-6 text-sm px-4 py-1"
            >
                {callModeState === 'listening' && (
                    <HugeiconsIcon icon={Mic01Icon} className="h-4 w-4 mr-2 animate-pulse" />
                )}
                {callModeState === 'speaking' && (
                    <HugeiconsIcon icon={VolumeHighIcon} className="h-4 w-4 mr-2 animate-pulse" />
                )}
                {t(`voice.callMode.${callModeState}`) || STATE_LABELS[callModeState]}
            </Badge>

            {/* Audio Visualizer */}
            <div className="relative">
                <AudioVisualizer
                    level={audioLevel}
                    state={callModeState}
                    mode="circle"
                    size={250}
                />

                {/* Mic/Mute indicator in center */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <HugeiconsIcon
                        icon={callModeState === 'listening' ? Mic01Icon : MicOff01Icon}
                        className={`h-12 w-12 transition-colors ${callModeState === 'listening' ? 'text-primary' : 'text-muted-foreground'
                            }`}
                    />
                </div>
            </div>

            {/* Transcript Display */}
            <div className="mt-8 max-w-md text-center min-h-[60px]">
                {interimTranscript && (
                    <p className="text-lg text-muted-foreground animate-pulse">
                        {interimTranscript}
                    </p>
                )}
                {!interimTranscript && finalTranscript && callModeState === 'processing' && (
                    <p className="text-lg">
                        {finalTranscript}
                    </p>
                )}
            </div>

            {/* Push-to-talk button (when VAD is disabled) */}
            {!settings.callModeVAD && (
                <Button
                    size="lg"
                    variant={isPushToTalk ? 'default' : 'outline'}
                    className="mt-4"
                    onMouseDown={handlePushToTalkStart}
                    onMouseUp={handlePushToTalkEnd}
                    onMouseLeave={handlePushToTalkEnd}
                    onTouchStart={handlePushToTalkStart}
                    onTouchEnd={handlePushToTalkEnd}
                >
                    <HugeiconsIcon icon={Mic01Icon} className="h-5 w-5 mr-2" />
                    {t('voice.pushToTalk') || 'Hold to Talk'}
                </Button>
            )}

            {/* VAD mode hint */}
            {settings.callModeVAD && callModeState === 'idle' && (
                <p className="mt-4 text-sm text-muted-foreground">
                    {t('voice.vadHint') || 'Start speaking when ready...'}
                </p>
            )}

            {/* End Call Button */}
            <Button
                size="lg"
                variant="destructive"
                className="mt-8"
                onClick={handleEndCall}
            >
                <HugeiconsIcon icon={Cancel01Icon} className="h-5 w-5 mr-2" />
                {t('voice.endCall') || 'End Call'}
            </Button>

            {/* Mode indicator */}
            <div className="absolute bottom-6 text-xs text-muted-foreground">
                {settings.callModeVAD
                    ? (t('voice.vadMode') || 'Voice Activity Detection Mode')
                    : (t('voice.pttMode') || 'Push-to-Talk Mode (Space)')
                }
            </div>
        </div>
    );
}

export default CallMode;
