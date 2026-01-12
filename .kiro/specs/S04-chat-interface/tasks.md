# S04: Chat Interface - Tasks

## Implementation Checklist

### 1. Zustand Chat Store
- [ ] Create src/stores/chat.ts
- [ ] Define Message, ToolCall, ToolResult interfaces
- [ ] Implement addUserMessage action
- [ ] Implement streaming actions (start, append, end)
- [ ] Implement addToolResult action
- [ ] Add persistence with chrome.storage

### 2. Message Components
- [ ] Create MessageList with auto-scroll
- [ ] Create UserMessage component
- [ ] Create AssistantMessage component
- [ ] Style with Tailwind dark mode

### 3. Tool Use Card
- [ ] Create ToolUseCard component
- [ ] Expandable input/output toggle
- [ ] Status badge (pending, executing, complete, error)
- [ ] Screenshot display

### 4. Thinking Indicator
- [ ] Create ThinkingIndicator with bouncing dots
- [ ] Show when streaming

### 5. Error Card
- [ ] Create ErrorCard component
- [ ] Show error message
- [ ] Retry button
- [ ] Dismiss button

### 6. Input Area
- [ ] Create InputArea component
- [ ] Multiline Textarea
- [ ] Send button
- [ ] Enter key handling (with Shift for newline)
- [ ] Disabled during streaming

### 7. Markdown Renderer
- [ ] Create Markdown component
- [ ] Use react-markdown or similar
- [ ] Syntax highlighting for code blocks
- [ ] Style links, lists, headers

### 8. Chat Page
- [ ] Create Chat.tsx page
- [ ] Connect to chat store
- [ ] Connect to provider store
- [ ] Handle send message → stream response

### 9. Chat Flow Implementation
- [ ] On send: add user message to store
- [ ] Call provider.stream() with messages
- [ ] Append chunks to streamingContent
- [ ] On done: end streaming, add assistant message
- [ ] Handle tool calls from response

### 10. Testing
- [ ] Test message display
- [ ] Test streaming visuals
- [ ] Test tool use card expansion
- [ ] Test error handling
- [ ] Test message persistence

## Success Criteria
- Messages display correctly with styling
- Streaming works with visual feedback
- Tool uses show expandable cards
- Errors display with retry option
- Input area handles Enter/Shift+Enter correctly
