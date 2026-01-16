/**
 * Model Capability System
 * 
 * Provides capability validation and feature compatibility checking
 * for different LLM models across providers.
 */

import { ModelInfo, ModelCapabilities, ContentPart } from '@/providers/types';
import { cdpWrapper } from '@/lib/cdp-wrapper';
import { 
  ViewIcon, 
  Settings02Icon, 
  FlashIcon, 
  AiBrain01Icon, 
  Clock01Icon 
} from '@hugeicons/core-free-icons';

// ============================================================================
// Types
// ============================================================================

/**
 * Capability level indicating the degree of support for a feature
 * - full: Complete support for the feature
 * - partial: Limited or degraded support
 * - none: No support for the feature
 */
export type CapabilityLevel = 'full' | 'partial' | 'none';

/**
 * Warning severity type for capability warnings
 */
export type WarningSeverity = 'error' | 'warning' | 'info';

/**
 * Badge configuration for a capability
 */
export interface CapabilityBadgeConfig {
  icon: typeof ViewIcon;
  label: string;
  color: string;
  description: string;
}

/**
 * Warning configuration for missing capabilities
 */
export interface CapabilityWarningConfig {
  type: WarningSeverity;
  title: string;
  message: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Visual badge configurations for each capability type.
 * Used to display capability indicators in the UI with consistent styling.
 * 
 * Requirements: AC1 - Display capability badges with appropriate colors and icons
 */
export const CAPABILITY_BADGES: Record<string, CapabilityBadgeConfig> = {
  vision: {
    icon: ViewIcon,
    label: 'Vision',
    color: 'bg-blue-500/20 text-blue-400',
    description: 'Can process images and screenshots'
  },
  tools: {
    icon: Settings02Icon,
    label: 'Tools',
    color: 'bg-green-500/20 text-green-400',
    description: 'Supports browser automation'
  },
  streaming: {
    icon: FlashIcon,
    label: 'Streaming',
    color: 'bg-yellow-500/20 text-yellow-400',
    description: 'Real-time response streaming'
  },
  reasoning: {
    icon: AiBrain01Icon,
    label: 'Reasoning',
    color: 'bg-purple-500/20 text-purple-400',
    description: 'Extended thinking mode'
  },
  promptCache: {
    icon: Clock01Icon,
    label: 'Cache',
    color: 'bg-orange-500/20 text-orange-400',
    description: 'Supports prompt caching for efficiency'
  }
} as const;

/**
 * Warning messages for missing capabilities.
 * Displayed when a model lacks important features.
 * 
 * Requirements: AC2 - Display prominent warning when tools not supported
 * Requirements: AC3 - Inform user of vision fallback
 * Requirements: AC4 - Inform user about streaming limitations
 */
export const CAPABILITY_WARNINGS: Record<string, CapabilityWarningConfig> = {
  noTools: {
    type: 'error' as const,
    title: 'Tool use not supported',
    message: 'This model cannot use browser automation tools. Choose a model with tool support for full functionality.'
  },
  noVision: {
    type: 'warning' as const,
    title: 'Vision not supported',
    message: 'Screenshots will be converted to text descriptions using accessibility data.'
  },
  noStreaming: {
    type: 'info' as const,
    title: 'Streaming not supported',
    message: 'Responses will appear all at once instead of streaming.'
  },
  noReasoning: {
    type: 'info' as const,
    title: 'Reasoning not available',
    message: 'This model does not provide visible reasoning/thinking process.'
  },
  smallContext: {
    type: 'warning' as const,
    title: 'Limited context window',
    message: 'This model has a small context window. Long conversations may be truncated.'
  }
} as const;

/**
 * Get the capability level for a specific feature
 */
export function getCapabilityLevel(
  capabilities: ModelCapabilities,
  feature: keyof ModelCapabilities
): CapabilityLevel {
  const value = capabilities[feature];
  
  if (typeof value === 'boolean') {
    return value ? 'full' : 'none';
  }
  
  // For numeric values like contextWindow
  if (typeof value === 'number') {
    if (feature === 'contextWindow') {
      if (value >= 100000) return 'full';
      if (value >= 16000) return 'partial';
      return 'none';
    }
    if (feature === 'maxOutputTokens') {
      if (value >= 8000) return 'full';
      if (value >= 4000) return 'partial';
      return 'none';
    }
  }
  
  return 'none';
}

/**
 * Get applicable warnings for a model based on its capabilities
 */
export function getApplicableWarnings(
  capabilities: ModelCapabilities
): CapabilityWarningConfig[] {
  const warnings: CapabilityWarningConfig[] = [];
  
  if (!capabilities.supportsTools) {
    warnings.push(CAPABILITY_WARNINGS.noTools);
  }
  
  if (!capabilities.supportsVision) {
    warnings.push(CAPABILITY_WARNINGS.noVision);
  }
  
  if (!capabilities.supportsStreaming) {
    warnings.push(CAPABILITY_WARNINGS.noStreaming);
  }
  
  if (capabilities.contextWindow < 8000) {
    warnings.push(CAPABILITY_WARNINGS.smallContext);
  }
  
  return warnings;
}

export interface CapabilityValidationResult {
  isSupported: boolean;
  warnings: string[];
  suggestions: string[];
}

export interface FeatureRequirement {
  vision?: boolean;
  tools?: boolean;
  streaming?: boolean;
  reasoning?: boolean;
  minContextWindow?: number;
  minOutputTokens?: number;
}

export class ModelCapabilitySystem {
  /**
   * Validate if a model supports the required features
   */
  static validateCapabilities(
    model: ModelInfo,
    requirements: FeatureRequirement
  ): CapabilityValidationResult {
    const warnings: string[] = [];
    const suggestions: string[] = [];
    let isSupported = true;

    // Check vision capability
    if (requirements.vision && !model.capabilities.supportsVision) {
      isSupported = false;
      warnings.push(`${model.name} does not support vision/image processing`);
      suggestions.push('Consider using GPT-4o, Claude 3.5 Sonnet, or Gemini Pro Vision for image tasks');
    }

    // Check tools capability
    if (requirements.tools && !model.capabilities.supportsTools) {
      isSupported = false;
      warnings.push(`${model.name} does not support function calling/tools`);
      suggestions.push('Consider using GPT-4o, Claude 3.5 Sonnet, or Gemini Pro for tool usage');
    }

    // Check streaming capability
    if (requirements.streaming && !model.capabilities.supportsStreaming) {
      warnings.push(`${model.name} may not support streaming responses`);
      suggestions.push('Response may appear all at once instead of streaming');
    }

    // Check reasoning capability
    if (requirements.reasoning && !model.capabilities.supportsReasoning) {
      warnings.push(`${model.name} does not provide visible reasoning/thinking process`);
      suggestions.push('Consider using O1, O3, DeepSeek Reasoner, or GLM-4.7 for reasoning tasks');
    }

    // Check context window
    if (requirements.minContextWindow && model.capabilities.contextWindow < requirements.minContextWindow) {
      isSupported = false;
      warnings.push(`${model.name} context window (${model.capabilities.contextWindow}) is smaller than required (${requirements.minContextWindow})`);
      suggestions.push('Consider using models with larger context windows like Claude 3.5 Sonnet or GPT-4 Turbo');
    }

    // Check output tokens
    if (requirements.minOutputTokens && model.capabilities.maxOutputTokens < requirements.minOutputTokens) {
      warnings.push(`${model.name} max output (${model.capabilities.maxOutputTokens}) may be insufficient for long responses`);
      suggestions.push('Consider breaking large tasks into smaller chunks');
    }

    return {
      isSupported,
      warnings,
      suggestions
    };
  }

  /**
   * Get capability warnings for UI display
   */
  static getCapabilityWarnings(model: ModelInfo): string[] {
    const warnings: string[] = [];

    // Warn about models without tool support
    if (!model.capabilities.supportsTools) {
      warnings.push('No function calling support');
    }

    // Warn about models without vision
    if (!model.capabilities.supportsVision) {
      warnings.push('No image processing support');
    }

    // Warn about small context windows
    if (model.capabilities.contextWindow < 8000) {
      warnings.push('Limited context window');
    }

    // Warn about reasoning models without tools
    if (model.capabilities.supportsReasoning && !model.capabilities.supportsTools) {
      warnings.push('Reasoning model without tool support');
    }

    return warnings;
  }

  /**
   * Get recommended models for specific use cases
   */
  static getRecommendedModels(
    availableModels: ModelInfo[],
    useCase: 'general' | 'vision' | 'reasoning' | 'coding' | 'long-context'
  ): ModelInfo[] {
    const filtered = availableModels.filter(model => {
      switch (useCase) {
        case 'vision':
          return model.capabilities.supportsVision && model.capabilities.supportsTools;
        case 'reasoning':
          return model.capabilities.supportsReasoning;
        case 'coding':
          return model.capabilities.supportsTools && model.capabilities.contextWindow >= 16000;
        case 'long-context':
          return model.capabilities.contextWindow >= 100000;
        case 'general':
        default:
          return model.capabilities.supportsTools && model.capabilities.supportsStreaming;
      }
    });

    // Sort by capability score (more capabilities = higher score)
    return filtered.sort((a, b) => {
      const scoreA = this.calculateCapabilityScore(a.capabilities);
      const scoreB = this.calculateCapabilityScore(b.capabilities);
      return scoreB - scoreA;
    });
  }

  /**
   * Calculate a capability score for ranking models
   */
  private static calculateCapabilityScore(capabilities: ModelCapabilities): number {
    let score = 0;
    
    if (capabilities.supportsVision) score += 10;
    if (capabilities.supportsTools) score += 8;
    if (capabilities.supportsReasoning) score += 6;
    if (capabilities.supportsStreaming) score += 4;
    if (capabilities.supportsPromptCache) score += 2;
    
    // Context window bonus
    if (capabilities.contextWindow >= 100000) score += 5;
    else if (capabilities.contextWindow >= 32000) score += 3;
    else if (capabilities.contextWindow >= 16000) score += 1;
    
    return score;
  }

  /**
   * Check if a feature is compatible with the current model selection
   */
  static isFeatureCompatible(
    models: ModelInfo[],
    feature: keyof ModelCapabilities
  ): boolean {
    return models.some(model => model.capabilities[feature]);
  }

  /**
   * Get feature compatibility status for UI indicators
   */
  static getFeatureCompatibility(models: ModelInfo[]) {
    return {
      vision: this.isFeatureCompatible(models, 'supportsVision'),
      tools: this.isFeatureCompatible(models, 'supportsTools'),
      streaming: this.isFeatureCompatible(models, 'supportsStreaming'),
      reasoning: this.isFeatureCompatible(models, 'supportsReasoning'),
      promptCache: this.isFeatureCompatible(models, 'supportsPromptCache'),
    };
  }
}


// ============================================================================
// Vision Fallback - Page Representation
// ============================================================================

/**
 * Get accessibility snapshot from a tab using CDP
 * 
 * This function retrieves the accessibility tree from the page and formats it
 * as a text representation that can be used by text-only models.
 * 
 * @param tabId - The Chrome tab ID to get accessibility data from
 * @returns Formatted accessibility tree as a string
 */
export async function getAccessibilitySnapshot(tabId: number): Promise<string> {
  try {
    // Ensure CDP is attached
    await cdpWrapper.ensureAttached(tabId);
    
    // Enable accessibility domain
    await cdpWrapper.executeCDPCommand(tabId, 'Accessibility.enable');
    
    // Get full accessibility tree
    const result = await cdpWrapper.executeCDPCommand(tabId, 'Accessibility.getFullAXTree');
    
    if (!result || !result.nodes || result.nodes.length === 0) {
      // Fallback: try to get basic page info via content script
      try {
        const [pageInfo] = await chrome.scripting.executeScript({
          target: { tabId },
          func: () => {
            const tree = (window as any).__claudeAccessibilityTree?.generateAccessibilityTree({
              interactiveOnly: false,
              visibleOnly: true,
              maxDepth: 5,
              includeText: true,
              includeBounds: false
            });
            
            if (tree) {
              return {
                url: tree.url,
                title: tree.title,
                elements: tree.elements
              };
            }
            
            // Basic fallback
            return {
              url: window.location.href,
              title: document.title,
              text: document.body?.innerText?.substring(0, 5000) || ''
            };
          }
        });
        
        if (pageInfo.result) {
          const info = pageInfo.result;
          let output = `URL: ${info.url}\nTitle: ${info.title}\n\n`;
          
          if (info.elements) {
            output += formatElementTree(info.elements, 0, 5);
          } else if (info.text) {
            output += `Page Content:\n${info.text}`;
          }
          
          return output;
        }
      } catch (scriptError) {
        console.warn('Content script fallback failed:', scriptError);
      }
      
      return 'Unable to retrieve page accessibility information. The page may not be fully loaded.';
    }
    
    // Format the accessibility tree
    return formatAccessibilityNodes(result.nodes, 5);
  } catch (error) {
    console.error('Failed to get accessibility snapshot:', error);
    return `Error retrieving accessibility data: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * Format accessibility nodes into a readable text representation
 */
function formatAccessibilityNodes(nodes: any[], maxDepth: number): string {
  const lines: string[] = [];
  const processedIds = new Set<string>();
  
  // Build a map of node IDs to nodes for quick lookup
  const nodeMap = new Map<string, any>();
  for (const node of nodes) {
    if (node.nodeId) {
      nodeMap.set(node.nodeId, node);
    }
  }
  
  // Find root nodes (nodes without parents or with parent not in our set)
  const rootNodes = nodes.filter(node => {
    if (!node.parentId) return true;
    return !nodeMap.has(node.parentId);
  });
  
  // Process each root node
  for (const node of rootNodes) {
    formatNode(node, nodes, nodeMap, processedIds, lines, 0, maxDepth);
  }
  
  return lines.join('\n');
}

/**
 * Format a single accessibility node and its children
 */
function formatNode(
  node: any,
  allNodes: any[],
  nodeMap: Map<string, any>,
  processedIds: Set<string>,
  lines: string[],
  depth: number,
  maxDepth: number
): void {
  if (depth > maxDepth) return;
  if (processedIds.has(node.nodeId)) return;
  processedIds.add(node.nodeId);
  
  const indent = '  '.repeat(depth);
  const role = node.role?.value || 'unknown';
  const name = node.name?.value || '';
  const value = node.value?.value || '';
  
  // Skip generic/container roles without meaningful content
  const skipRoles = ['generic', 'none', 'presentation'];
  if (skipRoles.includes(role) && !name && !value) {
    // Still process children
    if (node.childIds) {
      for (const childId of node.childIds) {
        const childNode = nodeMap.get(childId);
        if (childNode) {
          formatNode(childNode, allNodes, nodeMap, processedIds, lines, depth, maxDepth);
        }
      }
    }
    return;
  }
  
  // Build the line
  let line = `${indent}[${role}]`;
  if (name) line += ` "${name}"`;
  if (value && value !== name) line += ` = "${value}"`;
  
  // Add relevant properties
  const relevantProps = ['checked', 'selected', 'expanded', 'disabled', 'required'];
  if (node.properties) {
    const propStrings: string[] = [];
    for (const prop of node.properties) {
      if (relevantProps.includes(prop.name) && prop.value?.value) {
        propStrings.push(`${prop.name}=${prop.value.value}`);
      }
    }
    if (propStrings.length > 0) {
      line += ` (${propStrings.join(', ')})`;
    }
  }
  
  lines.push(line);
  
  // Process children
  if (node.childIds) {
    for (const childId of node.childIds) {
      const childNode = nodeMap.get(childId);
      if (childNode) {
        formatNode(childNode, allNodes, nodeMap, processedIds, lines, depth + 1, maxDepth);
      }
    }
  }
}

/**
 * Format element tree from content script into readable text
 */
function formatElementTree(elements: any[], depth: number, maxDepth: number): string {
  if (depth > maxDepth || !elements || elements.length === 0) {
    return '';
  }
  
  const lines: string[] = [];
  const indent = '  '.repeat(depth);
  
  for (const element of elements) {
    const { tagName, role, text, description, interactive, ref, children } = element;
    
    // Build element description
    let line = `${indent}`;
    
    if (interactive && ref) {
      line += `[${ref}] `;
    }
    
    if (role) {
      line += `<${role}>`;
    } else {
      line += `<${tagName}>`;
    }
    
    if (description) {
      line += ` ${description}`;
    } else if (text) {
      const truncatedText = text.length > 100 ? text.substring(0, 100) + '...' : text;
      line += ` "${truncatedText}"`;
    }
    
    lines.push(line);
    
    // Process children
    if (children && children.length > 0) {
      const childOutput = formatElementTree(children, depth + 1, maxDepth);
      if (childOutput) {
        lines.push(childOutput);
      }
    }
  }
  
  return lines.join('\n');
}

/**
 * Get page representation based on model capabilities
 * 
 * This function provides the appropriate page content representation based on
 * whether the model supports vision (images) or not.
 * 
 * - For vision-capable models: Returns a screenshot as an image content part
 * - For text-only models: Returns an accessibility tree snapshot as text
 * 
 * Requirements: AC3 - Use accessibility snapshot instead of screenshots for non-vision models
 * 
 * @param tabId - The Chrome tab ID to capture
 * @param model - The model info with capabilities
 * @returns Array of content parts suitable for the model
 */
export async function getPageRepresentation(
  tabId: number,
  model: ModelInfo
): Promise<ContentPart[]> {
  if (model.capabilities.supportsVision) {
    // Vision path: capture screenshot
    try {
      await cdpWrapper.ensureAttached(tabId);
      const screenshot = await cdpWrapper.screenshot(tabId);
      
      return [{
        type: 'image',
        image: {
          data: screenshot.data,
          mediaType: 'image/png'
        }
      }];
    } catch (error) {
      console.error('Failed to capture screenshot, falling back to accessibility:', error);
      // Fall through to accessibility fallback
    }
  }
  
  // Text path: use accessibility tree
  const accessibilitySnapshot = await getAccessibilitySnapshot(tabId);
  
  return [{
    type: 'text',
    text: `[Page Content - Accessibility Snapshot]\n${accessibilitySnapshot}`
  }];
}

/**
 * Check if page representation should use vision or text fallback
 * 
 * @param model - The model info with capabilities
 * @returns 'vision' if model supports vision, 'text' otherwise
 */
export function getPageRepresentationType(model: ModelInfo): 'vision' | 'text' {
  return model.capabilities.supportsVision ? 'vision' : 'text';
}
