/**
 * ErrorCard Component
 * 
 * Displays error messages with retry and dismiss functionality.
 * Provides clear error feedback and recovery options for users.
 */

import { useChatStore } from '@/stores/chat';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  Alert01Icon, 
  Refresh01Icon, 
  Cancel01Icon 
} from '@hugeicons/core-free-icons';

interface ErrorCardProps {
  error: string;
}

export function ErrorCard({ error }: ErrorCardProps) {
  const { setError, retryLast } = useChatStore();

  const handleRetry = () => {
    setError(null);
    retryLast();
  };

  const handleDismiss = () => {
    setError(null);
  };

  return (
    <div className="flex justify-center mb-4">
      <Card className="bg-destructive/5 border-destructive/20 max-w-md w-full">
        <div className="p-4">
          {/* Error header */}
          <div className="flex items-center gap-2 mb-3">
            <HugeiconsIcon 
              icon={Alert01Icon} 
              className="h-5 w-5 text-destructive" 
            />
            <h3 className="font-medium text-destructive">
              Something went wrong
            </h3>
          </div>

          {/* Error message */}
          <p className="text-sm text-muted-foreground mb-4">
            {error}
          </p>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetry}
              className="flex items-center gap-2"
            >
              <HugeiconsIcon icon={Refresh01Icon} className="h-3 w-3" />
              Retry
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="flex items-center gap-2"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="h-3 w-3" />
              Dismiss
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}