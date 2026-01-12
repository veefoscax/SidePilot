/**
 * Capability Badges Component
 * 
 * Visual indicators for model capabilities: Vision, Tools, Streaming, Reasoning.
 * Uses color-coded badges with icons to show what features are supported.
 */

import { Badge } from '@/components/ui/badge';
import { HugeiconsIcon } from '@hugeicons/react';
import { ViewIcon, Settings02Icon, FlashIcon, AiBrain01Icon, Clock01Icon } from '@hugeicons/core-free-icons';
import { ModelCapabilities } from '@/providers/types';

interface CapabilityBadgesProps {
  capabilities: ModelCapabilities;
  className?: string;
}

export function CapabilityBadges({ capabilities, className = '' }: CapabilityBadgesProps) {
  return (
    <div className={`flex gap-2 flex-wrap ${className}`}>
      {/* Vision Support */}
      {capabilities.supportsVision && (
        <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          <HugeiconsIcon icon={ViewIcon} className="w-3 h-3 mr-1" />
          Vision
        </Badge>
      )}
      
      {/* Tool/Function Calling */}
      {capabilities.supportsTools && (
        <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
          <HugeiconsIcon icon={Settings02Icon} className="w-3 h-3 mr-1" />
          Tools
        </Badge>
      )}
      
      {/* Streaming Support */}
      {capabilities.supportsStreaming && (
        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
          <HugeiconsIcon icon={FlashIcon} className="w-3 h-3 mr-1" />
          Streaming
        </Badge>
      )}
      
      {/* Reasoning Models (like o1) */}
      {capabilities.supportsReasoning && (
        <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
          <HugeiconsIcon icon={AiBrain01Icon} className="w-3 h-3 mr-1" />
          Reasoning
        </Badge>
      )}
      
      {/* Prompt Caching */}
      {capabilities.supportsPromptCache && (
        <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
          <HugeiconsIcon icon={Clock01Icon} className="w-3 h-3 mr-1" />
          Cache
        </Badge>
      )}
      
      {/* Context Window Display */}
      <Badge variant="outline" className="text-muted-foreground">
        {(capabilities.contextWindow / 1000).toFixed(0)}K context
      </Badge>
      
      {/* Max Output Tokens */}
      {capabilities.maxOutputTokens > 0 && (
        <Badge variant="outline" className="text-muted-foreground">
          {(capabilities.maxOutputTokens / 1000).toFixed(0)}K max output
        </Badge>
      )}
    </div>
  );
}

/**
 * Capability Summary Component
 * 
 * Shows a summary of capabilities in a more compact format
 */
interface CapabilitySummaryProps {
  capabilities: ModelCapabilities;
}

export function CapabilitySummary({ capabilities }: CapabilitySummaryProps) {
  const features = [];
  
  if (capabilities.supportsVision) features.push('Vision');
  if (capabilities.supportsTools) features.push('Tools');
  if (capabilities.supportsStreaming) features.push('Streaming');
  if (capabilities.supportsReasoning) features.push('Reasoning');
  if (capabilities.supportsPromptCache) features.push('Caching');
  
  return (
    <div className="text-xs text-muted-foreground">
      <div>
        {features.length > 0 ? features.join(' • ') : 'Basic text generation'}
      </div>
      <div>
        {(capabilities.contextWindow / 1000).toFixed(0)}K context
        {capabilities.maxOutputTokens > 0 && 
          ` • ${(capabilities.maxOutputTokens / 1000).toFixed(0)}K max output`
        }
      </div>
    </div>
  );
}