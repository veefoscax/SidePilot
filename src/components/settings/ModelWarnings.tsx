/**
 * Model Warnings Component
 * 
 * Displays capability warnings for the currently selected model in the Settings page.
 * Shows alerts with appropriate severity styling based on missing capabilities.
 * 
 * Requirements: AC2 - Display prominent warning when tools not supported
 */

import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Alert02Icon,
  InformationCircleIcon,
  Settings02Icon,
  ViewIcon,
  FlashIcon
} from '@hugeicons/core-free-icons';
import { ModelInfo } from '@/providers/types';
import { 
  CAPABILITY_WARNINGS, 
  getApplicableWarnings,
  type CapabilityWarningConfig 
} from '@/lib/model-capabilities';

interface ModelWarningsProps {
  /** The model to check capabilities for */
  model: ModelInfo | null;
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * Get the appropriate icon for a warning type
 */
function getWarningIcon(warning: CapabilityWarningConfig) {
  // Match icon to the warning type
  if (warning === CAPABILITY_WARNINGS.noTools) {
    return Settings02Icon;
  }
  if (warning === CAPABILITY_WARNINGS.noVision) {
    return ViewIcon;
  }
  if (warning === CAPABILITY_WARNINGS.noStreaming) {
    return FlashIcon;
  }
  // Default icons based on severity
  if (warning.type === 'error') {
    return Alert02Icon;
  }
  if (warning.type === 'warning') {
    return Alert02Icon;
  }
  return InformationCircleIcon;
}

/**
 * Get the appropriate styling classes for a warning type
 */
function getWarningStyles(type: 'error' | 'warning' | 'info'): {
  variant: 'destructive' | 'default';
  iconClass: string;
  borderClass: string;
} {
  switch (type) {
    case 'error':
      return {
        variant: 'destructive',
        iconClass: 'text-destructive',
        borderClass: ''
      };
    case 'warning':
      return {
        variant: 'default',
        iconClass: 'text-yellow-500',
        borderClass: 'border-yellow-500/50'
      };
    case 'info':
    default:
      return {
        variant: 'default',
        iconClass: 'text-blue-500',
        borderClass: 'border-blue-500/50'
      };
  }
}

/**
 * ModelWarnings Component
 * 
 * Displays warnings for models that lack important capabilities.
 * Uses the CAPABILITY_WARNINGS constants and getApplicableWarnings helper
 * from model-capabilities.ts.
 */
export function ModelWarnings({ model, className }: ModelWarningsProps) {
  // Return null if no model is provided
  if (!model) {
    return null;
  }

  // Get applicable warnings based on model capabilities
  const warnings = getApplicableWarnings(model.capabilities);

  // Return null if no warnings
  if (warnings.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 mt-4 ${className || ''}`}>
      {warnings.map((warning) => {
        const styles = getWarningStyles(warning.type);
        const WarningIcon = getWarningIcon(warning);

        return (
          <Alert 
            key={warning.title} 
            variant={styles.variant}
            className={styles.borderClass}
          >
            <HugeiconsIcon 
              icon={WarningIcon} 
              className={`h-4 w-4 ${styles.iconClass}`} 
            />
            <AlertTitle className="ml-2">{warning.title}</AlertTitle>
            <AlertDescription className="ml-2">
              {warning.message}
            </AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
}

export default ModelWarnings;
