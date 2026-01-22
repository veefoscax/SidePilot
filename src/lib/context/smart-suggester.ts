/**
 * Smart Suggester
 * 
 * Analyzes page structure and suggests relevant actions.
 * Detects page types (login, form, list, etc.) and recommends next steps.
 * 
 * S18 Requirements: AC5.1, AC5.2, AC5.3, AC5.4, AC5.5
 */

import type {
    PageAnalysis,
    SuggestedAction,
    RefMetadata
} from './types';
import { PAGE_PATTERNS } from './types';

/** Page type classification (mirrors PageAnalysis.type) */
type PageType = PageAnalysis['type'];

/**
 * SmartSuggester analyzes pages and generates action suggestions
 */
export class SmartSuggester {
    /**
     * Analyze page and suggest actions
     * 
     * @param refs - Map of refs to their metadata
     * @returns Page analysis with suggestions
     */
    analyze(refs: Record<string, RefMetadata>): PageAnalysis {
        const refList = Object.values(refs);
        const textContent = this.extractTextContent(refList);

        // Detect page type
        const { type, confidence } = this.detectPageType(refList, textContent);

        // Generate suggestions based on type
        const suggestedActions = this.generateSuggestions(type, refList);

        // Identify key elements
        const keyElements = this.identifyKeyElements(refList);

        return {
            type,
            confidence,
            suggestedActions,
            keyElements
        };
    }

    /**
     * Extract text content from refs for analysis
     */
    private extractTextContent(refs: RefMetadata[]): string {
        return refs
            .map(r => r.name || '')
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
    }

    /**
     * Detect page type based on elements and content
     */
    private detectPageType(
        refs: RefMetadata[],
        textContent: string
    ): { type: PageType; confidence: number } {
        const scores: Record<string, number> = {};

        for (const [type, pattern] of Object.entries(PAGE_PATTERNS)) {
            let score = 0;

            // Check keywords
            for (const keyword of pattern.keywords) {
                if (textContent.includes(keyword.toLowerCase())) {
                    score += 1;
                }
            }

            // Check required elements
            if (pattern.requiredElements) {
                const hasRequired = pattern.requiredElements.every(role =>
                    refs.some(r => r.role === role)
                );
                if (hasRequired) {
                    score += 2;
                }
            }

            if (score > 0) {
                scores[type] = score / (pattern.keywords.length + 2);
            }
        }

        // Find highest scoring type
        let bestType: PageType = 'unknown';
        let bestScore = 0;

        for (const [type, score] of Object.entries(scores)) {
            if (score > bestScore) {
                bestScore = score;
                bestType = type as PageType;
            }
        }

        return {
            type: bestType,
            confidence: Math.min(1, bestScore)
        };
    }

    /**
     * Generate action suggestions based on page type
     */
    private generateSuggestions(
        type: PageType,
        refs: RefMetadata[]
    ): SuggestedAction[] {
        const suggestions: SuggestedAction[] = [];

        switch (type) {
            case 'login':
                suggestions.push(...this.getLoginSuggestions(refs));
                break;
            case 'form':
                suggestions.push(...this.getFormSuggestions(refs));
                break;
            case 'search':
                suggestions.push(...this.getSearchSuggestions(refs));
                break;
            case 'list':
                suggestions.push(...this.getListSuggestions(refs));
                break;
            case 'navigation':
                suggestions.push(...this.getNavigationSuggestions(refs));
                break;
            default:
                suggestions.push(...this.getGenericSuggestions(refs));
        }

        // Sort by priority
        return suggestions.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Get login page suggestions
     */
    private getLoginSuggestions(refs: RefMetadata[]): SuggestedAction[] {
        const suggestions: SuggestedAction[] = [];

        // Find email/username field
        const emailField = refs.find(r =>
            r.role === 'textbox' &&
            (r.name?.toLowerCase().includes('email') || r.name?.toLowerCase().includes('username'))
        );
        if (emailField) {
            suggestions.push({
                action: 'fill',
                target: `@${emailField.ref}`,
                description: `Fill ${emailField.name || 'email/username'} field`,
                priority: 10,
                reason: 'Login requires credentials'
            });
        }

        // Find password field
        const passwordField = refs.find(r => r.type === 'password');
        if (passwordField) {
            suggestions.push({
                action: 'fill',
                target: `@${passwordField.ref}`,
                description: 'Fill password field',
                priority: 9,
                reason: 'Login requires password'
            });
        }

        // Find submit button
        const submitBtn = refs.find(r =>
            r.role === 'button' &&
            (r.name?.toLowerCase().includes('sign in') ||
                r.name?.toLowerCase().includes('log in') ||
                r.name?.toLowerCase().includes('login'))
        );
        if (submitBtn) {
            suggestions.push({
                action: 'click',
                target: `@${submitBtn.ref}`,
                description: `Click ${submitBtn.name || 'login button'}`,
                priority: 8,
                reason: 'Complete login flow'
            });
        }

        return suggestions;
    }

    /**
     * Get form page suggestions
     */
    private getFormSuggestions(refs: RefMetadata[]): SuggestedAction[] {
        const suggestions: SuggestedAction[] = [];

        // Find all empty text fields
        const textFields = refs.filter(r =>
            r.role === 'textbox' && !r.value
        );
        for (const field of textFields.slice(0, 3)) {
            suggestions.push({
                action: 'fill',
                target: `@${field.ref}`,
                description: `Fill ${field.name || 'text field'}`,
                priority: 7
            });
        }

        // Find submit button
        const submitBtn = refs.find(r =>
            r.role === 'button' &&
            (r.name?.toLowerCase().includes('submit') ||
                r.name?.toLowerCase().includes('save') ||
                r.name?.toLowerCase().includes('continue'))
        );
        if (submitBtn) {
            suggestions.push({
                action: 'click',
                target: `@${submitBtn.ref}`,
                description: `Click ${submitBtn.name}`,
                priority: 6,
                reason: 'Submit form'
            });
        }

        return suggestions;
    }

    /**
     * Get search page suggestions
     */
    private getSearchSuggestions(refs: RefMetadata[]): SuggestedAction[] {
        const suggestions: SuggestedAction[] = [];

        const searchInput = refs.find(r =>
            r.role === 'searchbox' ||
            (r.role === 'textbox' && r.name?.toLowerCase().includes('search'))
        );
        if (searchInput) {
            suggestions.push({
                action: 'fill',
                target: `@${searchInput.ref}`,
                description: 'Enter search query',
                priority: 10
            });
        }

        return suggestions;
    }

    /**
     * Get list page suggestions
     */
    private getListSuggestions(refs: RefMetadata[]): SuggestedAction[] {
        const suggestions: SuggestedAction[] = [];

        // Pagination
        const nextBtn = refs.find(r =>
            r.name?.toLowerCase().includes('next')
        );
        if (nextBtn) {
            suggestions.push({
                action: 'click',
                target: `@${nextBtn.ref}`,
                description: 'Go to next page',
                priority: 5
            });
        }

        suggestions.push({
            action: 'scroll',
            description: 'Scroll to load more items',
            priority: 4
        });

        return suggestions;
    }

    /**
     * Get navigation suggestions
     */
    private getNavigationSuggestions(refs: RefMetadata[]): SuggestedAction[] {
        const suggestions: SuggestedAction[] = [];

        const links = refs.filter(r => r.role === 'link').slice(0, 5);
        for (const link of links) {
            suggestions.push({
                action: 'click',
                target: `@${link.ref}`,
                description: `Navigate to ${link.name || 'link'}`,
                priority: 3
            });
        }

        return suggestions;
    }

    /**
     * Get generic suggestions when page type is unknown
     */
    private getGenericSuggestions(refs: RefMetadata[]): SuggestedAction[] {
        const suggestions: SuggestedAction[] = [];

        // First interactive element
        const firstInteractive = refs.find(r => r.interactable);
        if (firstInteractive) {
            suggestions.push({
                action: firstInteractive.role === 'textbox' ? 'fill' : 'click',
                target: `@${firstInteractive.ref}`,
                description: `Interact with ${firstInteractive.name || firstInteractive.role}`,
                priority: 5
            });
        }

        return suggestions;
    }

    /**
     * Identify key elements on the page
     */
    private identifyKeyElements(refs: RefMetadata[]): PageAnalysis['keyElements'] {
        return {
            primaryAction: refs.find(r =>
                r.role === 'button' && r.name
            )?.ref,
            mainForm: refs.find(r =>
                r.role === 'textbox'
            )?.ref,
            searchInput: refs.find(r =>
                r.role === 'searchbox'
            )?.ref,
            navigation: refs
                .filter(r => r.role === 'link')
                .slice(0, 5)
                .map(r => r.ref)
        };
    }
}

/**
 * Singleton instance
 */
let globalSuggester: SmartSuggester | null = null;

export function getSmartSuggester(): SmartSuggester {
    if (!globalSuggester) {
        globalSuggester = new SmartSuggester();
    }
    return globalSuggester;
}

export default SmartSuggester;
