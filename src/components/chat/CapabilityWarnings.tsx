/**
 * Capability Warnings Component
 * 
 * Displays model capability warnings and suggestions in the chat interface.
 * Helps users understand model limitations and get better results.
 */

import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Alert02Icon,
  InformationCircleIcon,
  Cancel01Icon,
  EyeIcon,
  Settings02Icon,
  AiBrainIcon
} from '@hugeicons/core-free-icons';
import { ModelInfo } from '@/providers/types';
import { ModelCapabilitySystem, FeatureRequirement } from '@/lib/model-capabilities';

interface CapabilityWarningsProps {
  model: ModelInfo;
  requirements?: FeatureRequirement;
  onDismiss?: () => void;
  className?: string;
}

export function CapabilityWarnings({
  model,
  requirements,
  onDismiss,
  className
}: CapabilityWarningsProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  // Get validation result if requirements are provided
  const validationResult = requirements
    ? ModelCapabilitySystem.validateCapabilities(model, requirements)
    : null;

  // Get general capability warnings
  const generalWarnings = ModelCapabilitySystem.getCapabilityWarnings(model);

  // Combine warnings
  const allWarnings = [
    ...(validationResult?.warnings || []),
    ...generalWarnings
  ];

  const suggestions = validationResult?.suggestions || [];

  if (allWarnings.length === 0 && suggestions.length === 0) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <div className={className}>
      {/* Capability Warnings */}
      {allWarnings.length > 0 && (
        <Alert className="mb-2">
          <HugeiconsIcon icon={Alert02Icon} className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex-1">
              <div className="font-medium mb-1">Model Limitations</div>
              <div className="space-y-1">
                {allWarnings.map((warning, index) => (
                  <div key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                    <div className="w-1 h-1 bg-yellow-500 rounded-full" />
                    {warning}
                  </div>
                ))}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0 ml-2"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="h-3 w-3" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Alert className="mb-2">
          <HugeiconsIcon icon={InformationCircleIcon} className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-1">Suggestions</div>
            <div className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full" />
                  {suggestion}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Capability Badges */}
      <div className="flex flex-wrap gap-1 mb-2">
        {model.capabilities.supportsVision && (
          <Badge variant="secondary" className="text-xs">
            <HugeiconsIcon icon={EyeIcon} className="h-3 w-3 mr-1" />
            Vision
          </Badge>
        )}
        {model.capabilities.supportsTools && (
          <Badge variant="secondary" className="text-xs">
            <HugeiconsIcon icon={Settings02Icon} className="h-3 w-3 mr-1" />
            Tools
          </Badge>
        )}
        {model.capabilities.supportsReasoning && (
          <Badge variant="secondary" className="text-xs">
            <HugeiconsIcon icon={AiBrainIcon} className="h-3 w-3 mr-1" />
            Reasoning
          </Badge>
        )}
        <Badge variant="outline" className="text-xs">
          {(model.capabilities.contextWindow / 1000).toFixed(0)}K context
        </Badge>
      </div>
    </div>
  );
}