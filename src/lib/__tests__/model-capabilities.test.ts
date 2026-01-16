
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    ModelCapabilitySystem,
    getCapabilityLevel,
    getApplicableWarnings,
    CAPABILITY_WARNINGS,
    getPageRepresentation,
    getPageRepresentationType,
    getAccessibilitySnapshot
} from '../model-capabilities';
import { ModelInfo, ModelCapabilities } from '@/providers/types';
import { cdpWrapper } from '@/lib/cdp-wrapper';

// Mock dependencies
vi.mock('@/lib/cdp-wrapper', () => ({
    cdpWrapper: {
        ensureAttached: vi.fn(),
        executeCDPCommand: vi.fn(),
        screenshot: vi.fn()
    }
}));

describe('Model Capability System', () => {
    const fullCapabilities: ModelCapabilities = {
        supportsVision: true,
        supportsTools: true,
        supportsStreaming: true,
        supportsReasoning: true,
        supportsPromptCache: true,
        contextWindow: 128000,
        maxOutputTokens: 4096
    };

    const limitedCapabilities: ModelCapabilities = {
        supportsVision: false,
        supportsTools: false,
        supportsStreaming: false,
        supportsReasoning: false,
        supportsPromptCache: false,
        contextWindow: 4000,
        maxOutputTokens: 1024
    };

    const fullModel: ModelInfo = {
        id: 'full-model',
        name: 'Full Model',
        provider: 'anthropic',
        capabilities: fullCapabilities
    };

    const limitedModel: ModelInfo = {
        id: 'limited-model',
        name: 'Limited Model',
        provider: 'anthropic',
        capabilities: limitedCapabilities
    };

    const mediumModel: ModelInfo = {
        id: 'medium-model',
        name: 'Medium Model',
        provider: 'anthropic',
        capabilities: {
            ...fullCapabilities,
            supportsVision: false,
            supportsReasoning: false,
            contextWindow: 16000
        }
    };

    describe('getCapabilityLevel', () => {
        it('should return full for supported boolean capabilities', () => {
            expect(getCapabilityLevel(fullCapabilities, 'supportsVision')).toBe('full');
            expect(getCapabilityLevel(fullCapabilities, 'supportsTools')).toBe('full');
        });

        it('should return none for unsupported boolean capabilities', () => {
            expect(getCapabilityLevel(limitedCapabilities, 'supportsVision')).toBe('none');
            expect(getCapabilityLevel(limitedCapabilities, 'supportsTools')).toBe('none');
        });

        it('should handle numeric capabilities (contextWindow)', () => {
            expect(getCapabilityLevel({ ...fullCapabilities, contextWindow: 200000 }, 'contextWindow')).toBe('full');
            expect(getCapabilityLevel({ ...fullCapabilities, contextWindow: 32000 }, 'contextWindow')).toBe('partial');
            expect(getCapabilityLevel({ ...fullCapabilities, contextWindow: 4000 }, 'contextWindow')).toBe('none');
        });
    });

    describe('getApplicableWarnings', () => {
        it('should return no warnings for capable models', () => {
            const warnings = getApplicableWarnings(fullCapabilities);
            expect(warnings).toHaveLength(0);
        });

        it('should return warnings for missing capabilities', () => {
            const warnings = getApplicableWarnings(limitedCapabilities);
            expect(warnings).toContainEqual(CAPABILITY_WARNINGS.noTools);
            expect(warnings).toContainEqual(CAPABILITY_WARNINGS.noVision);
            expect(warnings).toContainEqual(CAPABILITY_WARNINGS.noStreaming);
            expect(warnings).toContainEqual(CAPABILITY_WARNINGS.smallContext);
        });
    });

    describe('ModelCapabilitySystem', () => {
        describe('validateCapabilities', () => {
            it('should validate all requirements met', () => {
                const result = ModelCapabilitySystem.validateCapabilities(fullModel, {
                    vision: true,
                    tools: true
                });
                expect(result.isSupported).toBe(true);
                expect(result.warnings).toHaveLength(0);
            });

            it('should detect missing requirements', () => {
                const result = ModelCapabilitySystem.validateCapabilities(limitedModel, {
                    vision: true,
                    tools: true
                });
                expect(result.isSupported).toBe(false);
                expect(result.warnings).toHaveLength(2); // Vision + Tools
                expect(result.warnings[0]).toContain('does not support vision');
                expect(result.warnings[1]).toContain('does not support function calling');
            });
        });

        describe('getRecommendedModels', () => {
            it('should rank capable models higher', () => {
                const models = [mediumModel, fullModel];
                const recommended = ModelCapabilitySystem.getRecommendedModels(models, 'general');

                // Full model (score higher) should be ranked higher than medium model
                expect(recommended[0].id).toBe('full-model');
                expect(recommended[1].id).toBe('medium-model');
            });

            it('should filter out incapable models', () => {
                const models = [limitedModel, fullModel];
                const recommended = ModelCapabilitySystem.getRecommendedModels(models, 'general');

                expect(recommended).toHaveLength(1);
                expect(recommended[0].id).toBe('full-model');
            });

            it('should filter correctly for use cases', () => {
                const models = [limitedModel, fullModel];

                const visionModels = ModelCapabilitySystem.getRecommendedModels(models, 'vision');
                expect(visionModels).toHaveLength(1);
                expect(visionModels[0].id).toBe('full-model');
            });
        });
    });

    describe('Page Representation (Vision Fallback)', () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('should use vision type for capable models', () => {
            expect(getPageRepresentationType(fullModel)).toBe('vision');
        });

        it('should use text type for non-vision models', () => {
            expect(getPageRepresentationType(limitedModel)).toBe('text');
        });

        it('should attempt screenshot for vision models', async () => {
            vi.mocked(cdpWrapper.screenshot).mockResolvedValue({
                data: 'base64data',
                format: 'png',
                viewport: { width: 100, height: 100 }
            });

            const result = await getPageRepresentation(1, fullModel);

            expect(cdpWrapper.screenshot).toHaveBeenCalledWith(1);
            expect(result[0].type).toBe('image');
            if (result[0].type === 'image') {
                expect(result[0].image?.data).toBe('base64data');
            }
        });

        it('should fallback to accessibility for non-vision models', async () => {
            // Mock accessibility flow (simplified)
            vi.mocked(cdpWrapper.executeCDPCommand).mockImplementation(async (_tabId, command) => {
                if (command === 'Accessibility.getFullAXTree') {
                    return { nodes: [{ nodeId: '1', role: { value: 'root' } }] };
                }
                return {};
            });

            const result = await getPageRepresentation(1, limitedModel);

            expect(cdpWrapper.screenshot).not.toHaveBeenCalled();
            expect(result[0].type).toBe('text');
            expect(result[0].text).toContain('[Page Content - Accessibility Snapshot]');
        });
    });
});
