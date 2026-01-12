# S04: Chat Interface - Tasks

## Implementation Checklist

### 1. Zustand Chat Store
- [ ] Create src/stores/chat.ts <!-- id: 0 -->
- [ ] Define Message, ToolCall, ToolResult interfaces <!-- id: 1 -->
- [ ] Implement addUserMessage action <!-- id: 2 -->
- [ ] Implement streaming actions (start, append, end) <!-- id: 3 -->
- [ ] Implement addToolResult action <!-- id: 4 -->
- [ ] Add persistence with chrome.storage <!-- id: 5 -->

### 2. Message Components
- [ ] Create MessageList with auto-scroll <!-- id: 6 -->
- [ ] Create UserMessage component <!-- id: 7 -->
- [ ] Create AssistantMessage component <!-- id: 8 -->
- [ ] Style with Tailwind dark mode <!-- id: 9 -->

### 3. Tool Use Card
- [ ] Create ToolUseCard component <!-- id: 10 -->
- [ ] Expandable input/output toggle <!-- id: 11 -->
- [ ] Status badge (pending, executing, complete, error) <!-- id: 12 -->
- [ ] Screenshot display <!-- id: 13 -->

### 4. Thinking Indicator
- [ ] Create ThinkingIndicator with bouncing dots <!-- id: 14 -->
- [ ] Show when streaming <!-- id: 15 -->

### 5. Error Card
- [ ] Create ErrorCard component <!-- id: 16 -->
- [ ] Show error message <!-- id: 17 -->
- [ ] Retry button <!-- id: 18 -->
- [ ] Dismiss button <!-- id: 19 -->

### 6. Input Area
- [ ] Create InputArea component <!-- id: 20 -->
- [ ] Multiline Textarea <!-- id: 21 -->
- [ ] Send button <!-- id: 22 -->
- [ ] Enter key handling (with Shift for newline) <!-- id: 23 -->
- [ ] Disabled during streaming <!-- id: 24 -->

### 7. Markdown Renderer
- [ ] Create Markdown component <!-- id: 25 -->
- [ ] Use react-markdown or similar <!-- id: 26 -->
- [ ] Syntax highlighting for code blocks <!-- id: 27 -->
- [ ] Style links, lists, headers <!-- id: 28 -->

### 8. Chat Page
- [ ] Create Chat.tsx page <!-- id: 29 -->
- [ ] Connect to chat store <!-- id: 30 -->
- [ ] Connect to provider store <!-- id: 31 -->
- [ ] Handle send message → stream response <!-- id: 32 -->

### 9. Chat Flow Implementation
- [ ] On send: add user message to store <!-- id: 33 -->
- [ ] Call provider.stream() with messages <!-- id: 34 -->
- [ ] Append chunks to streamingContent <!-- id: 35 -->
- [ ] On done: end streaming, add assistant message <!-- id: 36 -->
- [ ] Handle tool calls from response <!-- id: 37 -->

### 10. Testing
- [ ] Test message display <!-- id: 38 -->
- [ ] Test streaming visuals <!-- id: 39 -->
- [ ] Test tool use card expansion <!-- id: 40 -->
- [ ] Test error handling <!-- id: 41 -->
- [ ] Test message persistence <!-- id: 42 -->

## Success Criteria
- Messages display correctly with styling
- Streaming works with visual feedback
- Tool uses show expandable cards
- Errors display with retry option
- Input area handles Enter/Shift+Enter correctly

### 11. Automated Testing (Playwright)
- [ ] Install Playwright dependencies <!-- id: 43 -->
- [ ] Create static build verification tests (verify dist/ output size & content) <!-- id: 44 -->
- [ ] Create integration tests for UI/Logic <!-- id: 45 -->
- [ ] Add test script to package.json <!-- id: 46 -->
- [ ] Update DEVLOG with test results and screenshots <!-- id: 47 -->
