/**
 * ThinkingIndicator Component
 * 
 * Animated thinking indicator with bouncing dots.
 * Displayed while the AI is processing but hasn't started streaming content yet.
 */

export function ThinkingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          {/* Bouncing dots animation */}
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
          </div>
          
          {/* Thinking text */}
          <span className="text-sm text-muted-foreground ml-1">
            Thinking...
          </span>
        </div>
      </div>
    </div>
  );
}