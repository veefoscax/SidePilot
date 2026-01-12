# S15: Model Capabilities - Design

## Capability System

```typescript
// Already in S02, enhanced here

interface ModelCapabilities {
  supportsVision: boolean;
  supportsTools: boolean;
  supportsStreaming: boolean;
  supportsReasoning: boolean;
  contextWindow: number;
  maxOutputTokens: number;
}

const CAPABILITY_BADGES = {
  vision: { 
    icon: Eye, 
    label: 'Vision', 
    color: 'bg-blue-500/20 text-blue-400',
    description: 'Can process images and screenshots'
  },
  tools: { 
    icon: Wrench, 
    label: 'Tools', 
    color: 'bg-green-500/20 text-green-400',
    description: 'Supports browser automation'
  },
  streaming: { 
    icon: Zap, 
    label: 'Streaming', 
    color: 'bg-yellow-500/20 text-yellow-400',
    description: 'Real-time response streaming'
  },
  reasoning: { 
    icon: Brain, 
    label: 'Reasoning', 
    color: 'bg-purple-500/20 text-purple-400',
    description: 'Extended thinking mode'
  },
};

const CAPABILITY_WARNINGS = {
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
  }
};
```

## Warning Component

```tsx
function ModelWarnings({ model }: { model: ModelInfo }) {
  const warnings = [];
  
  if (!model.capabilities.supportsTools) {
    warnings.push(CAPABILITY_WARNINGS.noTools);
  }
  if (!model.capabilities.supportsVision) {
    warnings.push(CAPABILITY_WARNINGS.noVision);
  }
  if (!model.capabilities.supportsStreaming) {
    warnings.push(CAPABILITY_WARNINGS.noStreaming);
  }
  
  if (warnings.length === 0) return null;
  
  return (
    <div className="space-y-2 mt-4">
      {warnings.map(w => (
        <Alert key={w.title} variant={w.type === 'error' ? 'destructive' : 'default'}>
          <AlertTitle>{w.title}</AlertTitle>
          <AlertDescription>{w.message}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
```

## Vision Fallback

```typescript
async function getPageRepresentation(
  tabId: number, 
  model: ModelInfo
): Promise<ContentPart[]> {
  if (model.capabilities.supportsVision) {
    const ss = await cdpWrapper.screenshot(tabId);
    return [{
      type: 'image',
      image: { data: ss.base64, mediaType: 'image/png' }
    }];
  } else {
    // Fallback: use accessibility tree
    const a11y = await getAccessibilitySnapshot(tabId);
    return [{
      type: 'text',
      text: `[Page Content - Accessibility Snapshot]\n${a11y}`
    }];
  }
}
```
