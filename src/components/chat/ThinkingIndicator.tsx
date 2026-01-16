/**
 * ThinkingIndicator Component
 * 
 * Animated thinking indicator with bouncing dots for streaming models,
 * or static "Generating..." message for non-streaming models.
 * Displayed while the AI is processing but hasn't started streaming content yet.
 * 
 * AC4: When a model doesn't support streaming, disable the thinking indicator
 * and show responses all at once with a static "Generating..." message.
 */

interface ThinkingIndicatorProps {
  /**
   * Whether the current model supports streaming.
   * When false, shows a static "Generating..." message instead of animated dots.
   */
  supportsStreaming?: boolean;
}

export function ThinkingIndicator({ supportsStreaming = true }: ThinkingIndicatorProps) {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          {supportsStreaming ? (
            <>
              {/* Bouncing dots animation for streaming models */}
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
              </div>
              
              {/* Thinking text */}
              <span className="text-sm text-muted-foreground ml-1">
                Thinking...
              </span>
            </>
          ) : (
            <>
              {/* Static indicator for non-streaming models */}
              <div className="w-2 h-2 bg-primary/60 rounded-full" />
              
              {/* Generating text - static message for non-streaming */}
              <span className="text-sm text-muted-foreground ml-1">
                Generating response...
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}