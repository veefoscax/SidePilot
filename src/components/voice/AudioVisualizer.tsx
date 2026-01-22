/**
 * Audio Visualizer Component
 * 
 * Canvas-based visualization for audio input levels.
 * Supports different visualization modes: waveform, bars, circle.
 * 
 * Requirements: AC6
 */

import { useRef, useEffect, memo } from 'react';
import type { CallModeState } from '@/lib/voice/types';

interface AudioVisualizerProps {
    /** Audio level (0-1) */
    level: number;
    /** Current state for styling */
    state?: CallModeState;
    /** Visualization mode */
    mode?: 'circle' | 'bars' | 'waveform';
    /** Size in pixels */
    size?: number;
    /** Primary color */
    color?: string;
    /** Background color */
    backgroundColor?: string;
    /** CSS class name */
    className?: string;
}

/**
 * Color palette for different states
 */
const STATE_COLORS: Record<CallModeState, string> = {
    idle: 'hsl(var(--muted-foreground))',
    listening: 'hsl(var(--primary))',
    processing: 'hsl(var(--warning))',
    speaking: 'hsl(var(--success))'
};

/**
 * Audio Visualizer - Circle Mode
 */
function CircleVisualizer({
    level,
    size,
    color,
    backgroundColor
}: {
    level: number;
    size: number;
    color: string;
    backgroundColor: string;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();
    const smoothLevelRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const centerX = size / 2;
        const centerY = size / 2;
        const baseRadius = size * 0.3;
        const maxExpansion = size * 0.15;

        const draw = () => {
            // Smooth the level
            smoothLevelRef.current += (level - smoothLevelRef.current) * 0.15;
            const smoothLevel = smoothLevelRef.current;

            // Clear canvas
            ctx.clearRect(0, 0, size, size);

            // Draw outer glow
            const glowRadius = baseRadius + maxExpansion * smoothLevel * 1.5;
            const gradient = ctx.createRadialGradient(
                centerX, centerY, baseRadius,
                centerX, centerY, glowRadius
            );
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, 'transparent');

            ctx.beginPath();
            ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.globalAlpha = 0.3 + smoothLevel * 0.3;
            ctx.fill();
            ctx.globalAlpha = 1;

            // Draw main circle
            const radius = baseRadius + maxExpansion * smoothLevel;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();

            // Draw inner circle
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = backgroundColor;
            ctx.fill();

            animationRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [level, size, color, backgroundColor]);

    return (
        <canvas
            ref={canvasRef}
            width={size}
            height={size}
            style={{ width: size, height: size }}
        />
    );
}

/**
 * Audio Visualizer - Bars Mode
 */
function BarsVisualizer({
    level,
    size,
    color,
    backgroundColor
}: {
    level: number;
    size: number;
    color: string;
    backgroundColor: string;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();
    const barsRef = useRef<number[]>(new Array(7).fill(0));

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const barCount = 7;
        const barWidth = size / (barCount * 2);
        const maxHeight = size * 0.8;
        const gap = barWidth;

        const draw = () => {
            // Update bars with some randomness based on level
            for (let i = 0; i < barCount; i++) {
                const targetHeight = level * (0.5 + Math.random() * 0.5);
                barsRef.current[i] += (targetHeight - barsRef.current[i]) * 0.2;
            }

            // Clear canvas
            ctx.clearRect(0, 0, size, size);

            // Draw background
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, size, size);

            // Draw bars
            ctx.fillStyle = color;
            for (let i = 0; i < barCount; i++) {
                const barHeight = barsRef.current[i] * maxHeight;
                const x = (gap + barWidth) * i + gap;
                const y = (size - barHeight) / 2;

                ctx.beginPath();
                ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
                ctx.fill();
            }

            animationRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [level, size, color, backgroundColor]);

    return (
        <canvas
            ref={canvasRef}
            width={size}
            height={size}
            style={{ width: size, height: size }}
        />
    );
}

/**
 * Audio Visualizer Component
 */
function AudioVisualizerComponent({
    level,
    state = 'idle',
    mode = 'circle',
    size = 200,
    color,
    backgroundColor = 'transparent',
    className
}: AudioVisualizerProps) {
    const activeColor = color || STATE_COLORS[state];

    const visualizer = mode === 'bars' ? (
        <BarsVisualizer
            level={level}
            size={size}
            color={activeColor}
            backgroundColor={backgroundColor}
        />
    ) : (
        <CircleVisualizer
            level={level}
            size={size}
            color={activeColor}
            backgroundColor={backgroundColor}
        />
    );

    return (
        <div
            className={className}
            style={{
                width: size,
                height: size,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            {visualizer}
        </div>
    );
}

export const AudioVisualizer = memo(AudioVisualizerComponent);
export default AudioVisualizer;
