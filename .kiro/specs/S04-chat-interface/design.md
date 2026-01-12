# S04: Chat Interface - Design

## Component Hierarchy

```
ChatPage
├── Header
│   ├── ModelBadge
│   └── SettingsButton
├── MessageList (ScrollArea)
│   ├── UserMessage[]
│   ├── AssistantMessage[]
│   └── ToolUseCard[]
├── ThinkingIndicator (when streaming)
├── ErrorCard (when error)
└── InputArea
    ├── Textarea
    └── SendButton
```

## Zustand Store

```typescript
// src/stores/chat.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  timestamp: number;
}

interface ToolCall {
  id: string;
  name: string;
  input: object;
  status: 'pending' | 'executing' | 'complete' | 'error';
}

interface ToolResult {
  toolUseId: string;
  output?: string;
  error?: string;
  screenshot?: string;
}

interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;
  
  addUserMessage(content: string): string;
  startStreaming(): void;
  appendStreamContent(chunk: string): void;
  endStreaming(fullContent: string, toolCalls?: ToolCall[]): void;
  addToolResult(toolUseId: string, result: ToolResult): void;
  setError(error: string | null): void;
  clearMessages(): void;
  retryLast(): void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      isStreaming: false,
      streamingContent: '',
      error: null,
      
      addUserMessage: (content) => {
        const id = crypto.randomUUID();
        set(state => ({
          messages: [...state.messages, {
            id,
            role: 'user',
            content,
            timestamp: Date.now(),
          }],
          error: null,
        }));
        return id;
      },
      
      startStreaming: () => set({ isStreaming: true, streamingContent: '' }),
      
      appendStreamContent: (chunk) => set(state => ({
        streamingContent: state.streamingContent + chunk
      })),
      
      endStreaming: (fullContent, toolCalls) => set(state => ({
        isStreaming: false,
        streamingContent: '',
        messages: [...state.messages, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: fullContent,
          toolCalls,
          timestamp: Date.now(),
        }],
      })),
      
      // ... more actions
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({ messages: state.messages }),
    }
  )
);
```

## Message Components

```tsx
// src/components/chat/UserMessage.tsx
export function UserMessage({ message }: { message: Message }) {
  return (
    <div className="flex justify-end mb-4">
      <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2 max-w-[80%]">
        {message.content}
      </div>
    </div>
  );
}

// src/components/chat/AssistantMessage.tsx  
export function AssistantMessage({ message }: { message: Message }) {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2 max-w-[80%]">
        <Markdown content={message.content} />
        {message.toolCalls?.map(tc => (
          <ToolUseCard key={tc.id} toolCall={tc} />
        ))}
      </div>
    </div>
  );
}
```

## Tool Use Card

```tsx
// src/components/chat/ToolUseCard.tsx
import { Card } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function ToolUseCard({ toolCall, result }: Props) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <Card className="mt-2 bg-background/50">
      <div 
        className="flex items-center justify-between p-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <ToolIcon name={toolCall.name} />
          <span className="font-medium">{toolCall.name}</span>
          <StatusBadge status={toolCall.status} />
        </div>
        {expanded ? <ChevronUp /> : <ChevronDown />}
      </div>
      {expanded && (
        <div className="p-2 border-t">
          <pre className="text-xs">{JSON.stringify(toolCall.input, null, 2)}</pre>
          {result?.screenshot && (
            <img src={result.screenshot} className="mt-2 rounded" />
          )}
        </div>
      )}
    </Card>
  );
}
```

## Thinking Indicator

```tsx
// src/components/chat/ThinkingIndicator.tsx
export function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 p-4">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
      </div>
      <span className="text-sm text-muted-foreground">Thinking...</span>
    </div>
  );
}
```

## Input Area

```tsx
// src/components/chat/InputArea.tsx
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

export function InputArea({ onSend, disabled }: Props) {
  const [input, setInput] = useState('');
  
  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <div className="p-4 border-t">
      <div className="relative">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          disabled={disabled}
          className="pr-12 resize-none"
          rows={3}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className="absolute bottom-2 right-2"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
```

## Files to Create
- src/sidepanel/pages/Chat.tsx
- src/stores/chat.ts
- src/components/chat/MessageList.tsx
- src/components/chat/UserMessage.tsx
- src/components/chat/AssistantMessage.tsx
- src/components/chat/ToolUseCard.tsx
- src/components/chat/ThinkingIndicator.tsx
- src/components/chat/ErrorCard.tsx
- src/components/chat/InputArea.tsx
- src/components/chat/Markdown.tsx
