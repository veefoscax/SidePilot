/**
 * Budget Manager
 * 
 * Tracks context token usage and triggers automatic compression.
 * Provides progressive detail reduction to stay within limits.
 * 
 * S18 Requirements: AC4.1, AC4.2, AC4.3, AC4.4, TR4
 */

import type {
    BudgetOptions,
    BudgetUsage,
    CompressionLevel,
    TokenEntry
} from './types';
import { TOKEN_ESTIMATION } from './types';

/**
 * Default budget options
 */
const DEFAULT_OPTIONS: Partial<BudgetOptions> = {
    warningThreshold: 70,
    compressionThreshold: 85
};

/**
 * BudgetManager tracks token usage and manages context compression
 */
export class BudgetManager {
    private options: BudgetOptions;
    private entries: TokenEntry[] = [];
    private breakdown = {
        systemPrompt: 0,
        conversation: 0,
        toolResults: 0,
        other: 0
    };

    constructor(options: BudgetOptions) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }

    /**
     * Estimate tokens in text
     * Uses ~4 chars per token heuristic for English
     * 
     * @param text - Text to estimate
     * @returns Estimated token count
     */
    estimateTokens(text: string): number {
        if (!text) return 0;
        return Math.ceil(text.length / TOKEN_ESTIMATION.CHARS_PER_TOKEN);
    }

    /**
     * Track token usage
     * 
     * @param category - Category (systemPrompt, conversation, toolResults, other)
     * @param tokens - Number of tokens
     * @param description - Optional description
     */
    track(category: keyof typeof this.breakdown, tokens: number, description?: string): void {
        this.breakdown[category] += tokens;

        this.entries.push({
            category,
            tokens,
            timestamp: Date.now(),
            description
        });

        // Check thresholds and fire callbacks
        const usage = this.getUsage();

        if (usage.compressionNeeded && this.options.onCompressionNeeded) {
            this.options.onCompressionNeeded(usage);
        } else if (usage.warningExceeded && this.options.onWarning) {
            this.options.onWarning(usage);
        }
    }

    /**
     * Track text and return token count
     */
    trackText(category: keyof typeof this.breakdown, text: string, description?: string): number {
        const tokens = this.estimateTokens(text);
        this.track(category, tokens, description);
        return tokens;
    }

    /**
     * Get current usage information
     */
    getUsage(): BudgetUsage {
        const used = Object.values(this.breakdown).reduce((a, b) => a + b, 0);
        const remaining = Math.max(0, this.options.maxTokens - used);
        const percentage = Math.round((used / this.options.maxTokens) * 100);

        return {
            used,
            remaining,
            percentage,
            breakdown: { ...this.breakdown },
            warningExceeded: percentage >= (this.options.warningThreshold || 70),
            compressionNeeded: percentage >= (this.options.compressionThreshold || 85)
        };
    }

    /**
     * Determine required compression level based on usage
     */
    getCompressionLevel(): CompressionLevel {
        const usage = this.getUsage();

        if (usage.percentage >= 95) {
            return 'summary';
        } else if (usage.percentage >= 85) {
            return 'clickable';
        } else if (usage.percentage >= 70) {
            return 'interactive';
        }

        return 'none';
    }

    /**
     * Check if budget allows additional tokens
     */
    canAfford(tokens: number): boolean {
        const usage = this.getUsage();
        return usage.remaining >= tokens;
    }

    /**
     * Get remaining budget for a category
     */
    getRemainingForCategory(category: keyof typeof this.breakdown, maxPercent: number = 50): number {
        const categoryMax = Math.floor(this.options.maxTokens * (maxPercent / 100));
        const categoryUsed = this.breakdown[category];
        return Math.max(0, categoryMax - categoryUsed);
    }

    /**
     * Reset tracking (new conversation)
     */
    reset(): void {
        this.breakdown = {
            systemPrompt: 0,
            conversation: 0,
            toolResults: 0,
            other: 0
        };
        this.entries = [];
    }

    /**
     * Reset a specific category
     */
    resetCategory(category: keyof typeof this.breakdown): void {
        this.breakdown[category] = 0;
        this.entries = this.entries.filter(e => e.category !== category);
    }

    /**
     * Get recent entries
     */
    getRecentEntries(count: number = 10): TokenEntry[] {
        return this.entries.slice(-count);
    }

    /**
     * Get all entries for a category
     */
    getCategoryEntries(category: string): TokenEntry[] {
        return this.entries.filter(e => e.category === category);
    }

    /**
     * Suggest text truncation to fit budget
     * 
     * @param text - Text to potentially truncate
     * @param maxTokens - Maximum tokens to use (defaults to remaining)
     * @returns Truncated text
     */
    suggestTruncation(text: string, maxTokens?: number): string {
        const max = maxTokens || this.getUsage().remaining;
        const currentTokens = this.estimateTokens(text);

        if (currentTokens <= max) {
            return text;
        }

        // Truncate to fit
        const maxChars = max * TOKEN_ESTIMATION.CHARS_PER_TOKEN;
        return text.substring(0, maxChars - 10) + '... [truncated]';
    }

    /**
     * Get budget summary as string
     */
    getSummary(): string {
        const usage = this.getUsage();
        return `Budget: ${usage.used}/${this.options.maxTokens} tokens (${usage.percentage}%)`;
    }
}

/**
 * Create a budget manager with common model limits
 */
export function createBudgetManager(
    modelTokenLimit: number,
    options?: Partial<BudgetOptions>
): BudgetManager {
    return new BudgetManager({
        maxTokens: modelTokenLimit,
        ...options
    });
}

/**
 * Common model token limits
 */
export const MODEL_TOKEN_LIMITS = {
    'gpt-4': 8192,
    'gpt-4-32k': 32768,
    'gpt-4-turbo': 128000,
    'gpt-4o': 128000,
    'claude-3-opus': 200000,
    'claude-3-sonnet': 200000,
    'claude-3-haiku': 200000,
    'claude-3.5-sonnet': 200000,
    'gemini-pro': 32768,
    'gemini-1.5-pro': 1000000,
    'deepseek-chat': 32768,
    'default': 16000
} as const;

export default BudgetManager;
