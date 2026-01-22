/**
 * Message Audio Player Component
 * 
 * Play/pause button with progress for reading assistant messages aloud.
 * Integrates with the active TTS provider.
 * 
 * Requirements: AC2.1, AC2.3
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useVoiceStore } from '@/stores/voice';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from '@/components/ui/popover';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    PlayCircle02Icon,
    PauseIcon,
    StopCircleIcon,
    Settings02Icon
} from '@hugeicons/core-free-icons';
import type { AudioPlayback } from '@/lib/voice/types';

interface MessageAudioPlayerProps {
    /** Text content to read aloud */
    text: string;
    /** Optional message ID for tracking */
    messageId?: string;
    /** Size variant */
    size?: 'sm' | 'default';
    /** CSS class name */
    className?: string;
}

/** Speed presets */
const SPEED_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function MessageAudioPlayer({
    text,
    messageId: _messageId,
    size = 'sm',
    className
}: MessageAudioPlayerProps) {
    const { t } = useTranslation();
    const { activeTTSProvider, settings } = useVoiceStore();

    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(0);
    const [speed, setSpeed] = useState(settings.ttsSpeed);
    const [showSpeedControl, setShowSpeedControl] = useState(false);

    const playbackRef = useRef<AudioPlayback | null>(null);
    const progressIntervalRef = useRef<number | null>(null);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (playbackRef.current) {
                playbackRef.current.stop();
            }
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
        };
    }, []);

    // Update progress periodically
    const startProgressTracking = useCallback(() => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
        }

        progressIntervalRef.current = window.setInterval(() => {
            if (playbackRef.current) {
                setProgress(playbackRef.current.getProgress());
            }
        }, 100);
    }, []);

    const stopProgressTracking = useCallback(() => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
    }, []);

    // Handle play
    const handlePlay = useCallback(async () => {
        if (!activeTTSProvider) {
            console.warn('[MessageAudioPlayer] No TTS provider available');
            return;
        }

        if (isPaused && playbackRef.current) {
            // Resume paused playback
            playbackRef.current.play();
            setIsPlaying(true);
            setIsPaused(false);
            startProgressTracking();
            return;
        }

        try {
            // Start new playback
            const playback = await activeTTSProvider.speak(text, {
                voice: settings.selectedVoice,
                speed
            });

            playbackRef.current = playback;
            setIsPlaying(true);
            setIsPaused(false);
            setProgress(0);
            startProgressTracking();

            // Handle end
            playback.onEnd(() => {
                setIsPlaying(false);
                setIsPaused(false);
                setProgress(0);
                stopProgressTracking();
                playbackRef.current = null;
            });
        } catch (error) {
            console.error('[MessageAudioPlayer] Failed to play:', error);
            setIsPlaying(false);
        }
    }, [activeTTSProvider, text, settings.selectedVoice, speed, isPaused, startProgressTracking, stopProgressTracking]);

    // Handle pause
    const handlePause = useCallback(() => {
        if (playbackRef.current) {
            playbackRef.current.pause();
            setIsPlaying(false);
            setIsPaused(true);
            stopProgressTracking();
        }
    }, [stopProgressTracking]);

    // Handle stop
    const handleStop = useCallback(() => {
        if (playbackRef.current) {
            playbackRef.current.stop();
            playbackRef.current = null;
        }
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(0);
        stopProgressTracking();
    }, [stopProgressTracking]);

    // Handle speed change
    const handleSpeedChange = useCallback((newSpeed: number) => {
        setSpeed(newSpeed);
        if (playbackRef.current) {
            playbackRef.current.setSpeed(newSpeed);
        }
    }, []);

    // Don't render if no TTS provider
    if (!activeTTSProvider) {
        return null;
    }

    const buttonSize = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';
    const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

    return (
        <div className={`flex items-center gap-1 ${className || ''}`}>
            {/* Play/Pause Button */}
            {!isPlaying ? (
                <Button
                    variant="ghost"
                    size="icon"
                    className={buttonSize}
                    onClick={handlePlay}
                    title={t('voice.play') || 'Play'}
                >
                    <HugeiconsIcon icon={PlayCircle02Icon} className={iconSize} />
                </Button>
            ) : (
                <Button
                    variant="ghost"
                    size="icon"
                    className={buttonSize}
                    onClick={handlePause}
                    title={t('voice.pause') || 'Pause'}
                >
                    <HugeiconsIcon icon={PauseIcon} className={iconSize} />
                </Button>
            )}

            {/* Stop Button (shown when playing or paused) */}
            {(isPlaying || isPaused) && (
                <Button
                    variant="ghost"
                    size="icon"
                    className={buttonSize}
                    onClick={handleStop}
                    title={t('voice.stop') || 'Stop'}
                >
                    <HugeiconsIcon icon={StopCircleIcon} className={iconSize} />
                </Button>
            )}

            {/* Progress indicator */}
            {(isPlaying || isPaused) && (
                <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-100"
                        style={{ width: `${progress * 100}%` }}
                    />
                </div>
            )}

            {/* Speed Control */}
            <Popover open={showSpeedControl} onOpenChange={setShowSpeedControl}>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`${buttonSize} text-xs`}
                        title={t('voice.speed') || 'Speed'}
                    >
                        {speed !== 1 ? (
                            <span className="text-[10px] font-medium">{speed}x</span>
                        ) : (
                            <HugeiconsIcon icon={Settings02Icon} className={iconSize} />
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-3" align="end">
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span>{t('voice.speed') || 'Speed'}</span>
                            <span className="text-muted-foreground">{speed}x</span>
                        </div>
                        <Slider
                            value={[speed]}
                            min={0.5}
                            max={2}
                            step={0.25}
                            onValueChange={([v]: number[]) => handleSpeedChange(v)}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>0.5x</span>
                            <span>2x</span>
                        </div>
                        {/* Quick presets */}
                        <div className="flex gap-1 flex-wrap">
                            {SPEED_PRESETS.map(preset => (
                                <Button
                                    key={preset}
                                    variant={speed === preset ? 'default' : 'outline'}
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => {
                                        handleSpeedChange(preset);
                                        setShowSpeedControl(false);
                                    }}
                                >
                                    {preset}x
                                </Button>
                            ))}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}

export default MessageAudioPlayer;
