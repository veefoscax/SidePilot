# S04: Chat Interface - Tasks

## Implementation Checklist

### 1. Zustand Chat Store ✅ COMPLETED
- [x] Create src/stores/chat.ts <!-- id: 0 -->
- [x] Define Message, ToolCall, ToolResult interfaces <!-- id: 1 -->
- [x] Implement addUserMessage action <!-- id: 2 -->
- [x] Implement streaming actions (start, append, end) <!-- id: 3 -->
- [x] Implement addToolResult action <!-- id: 4 -->
- [x] Add persistence with chrome.storage <!-- id: 5 -->

### 2. Install Dependencies
- [ ] Install react-markdown and syntax highlighting <!-- id: 6 -->
  - Install react-markdown for markdown rendering
  - Install react-syntax-highlighter for code blocks
  - _Requirements: AC6 - Markdown rendering with syntax highlighting_

### 3. Create Chat Components Directory
- [ ] Create src/components/chat/ directory structure <!-- id: 7 -->
  - Set up component organization
  - _Requirements: AC1, AC2, AC4, AC5 - All chat UI components_

### 4. Message Components
- [ ] Create MessageList with auto-scroll <!-- id: 8 -->
  - Implement auto-scroll to bottom on new messages
  - Add pin to bottom toggle functionality
  - _Requirements: AC1 - Auto-scroll and pin to bottom_

- [ ] Create UserMessage component <!-- id: 9 -->
  - Style user messages differently from assistant
  - Use Tailwind dark mode classes
  - _Requirements: AC1 - User messages styled differently_

- [ ] Create AssistantMessage component <!-- id: 10 -->
  - Render assistant messages with markdown support
  - Include tool call display integration
  - _Requirements: AC1 - Assistant messages with markdown_

### 5. Markdown Renderer
- [ ] Create Markdown component <!-- id: 11 -->
  - Use react-markdown for rendering
  - Add syntax highlighting for code blocks
  - Style links, lists, headers appropriately
  - _Requirements: AC6 - Code blocks, links, lists, headers_

### 6. Tool Use Card
- [ ] Create ToolUseCard component <!-- id: 12 -->
  - Show tool name and expandable input/output
  - Implement status badges (pending, executing, complete, error)
  - Add screenshot display capability
  - _Requirements: AC4 - Tool name, expandable I/O, status, screenshots_

### 7. Thinking Indicator
- [ ] Create ThinkingIndicator with bouncing dots <!-- id: 13 -->
  - Implement animated thinking indicator
  - Show during streaming state
  - _Requirements: AC3 - Thinking indicator animation_

### 8. Error Card
- [ ] Create ErrorCard component <!-- id: 14 -->
  - Display error messages clearly
  - Add retry and dismiss buttons
  - _Requirements: AC5 - Error card with message, retry, dismiss_

### 9. Input Area
- [ ] Create InputArea component <!-- id: 15 -->
  - Implement multiline textarea
  - Add send button with proper styling
  - Handle Enter key (send) and Shift+Enter (newline)
  - Disable during streaming
  - _Requirements: AC2 - Multiline textarea, send button, Enter key, disabled while streaming_

### 10. Chat Page
- [ ] Create Chat.tsx page <!-- id: 16 -->
  - Set up main chat page layout
  - Connect to chat store and provider store
  - Implement message sending and streaming flow
  - _Requirements: US1, US2 - Send messages and view streaming responses_

### 11. Chat Flow Implementation
- [ ] Implement complete chat flow in Chat.tsx <!-- id: 17 -->
  - Handle send message → add to store → call provider.stream()
  - Process streaming chunks and append to streamingContent
  - Handle completion: end streaming, add assistant message
  - Process tool calls from LLM responses
  - _Requirements: US1, US2, US3 - Message sending, streaming, tool use display_

### 12. App Navigation Integration
- [ ] Update App.tsx to enable Chat navigation <!-- id: 18 -->
  - Remove "disabled" from Chat button
  - Add routing to Chat page
  - Update navigation state management
  - _Requirements: US1 - User can access chat interface_

### 13. Testing & Validation
- [ ] Test message display and styling <!-- id: 19 -->
  - Verify user/assistant message styling
  - Test markdown rendering
  - _Requirements: AC1, AC6 - Message styling and markdown_

- [ ] Test streaming functionality <!-- id: 20 -->
  - Verify real-time text display
  - Test thinking indicator animation
  - _Requirements: AC3 - Real-time display and thinking indicator_

- [ ] Test tool use card functionality <!-- id: 21 -->
  - Verify expandable input/output
  - Test status badge updates
  - _Requirements: AC4 - Tool use card features_

- [ ] Test error handling and recovery <!-- id: 22 -->
  - Verify error display
  - Test retry functionality
  - _Requirements: AC5 - Error handling with retry_

- [ ] Test message persistence <!-- id: 23 -->
  - Verify conversation history is saved
  - Test restoration after page reload
  - _Requirements: US5 - Message history preservation_

## Success Criteria
- Messages display correctly with proper styling (user vs assistant)
- Streaming works with visual feedback (thinking indicator)
- Tool uses show expandable cards with status
- Errors display clearly with retry option
- Input area handles Enter/Shift+Enter correctly
- Message history persists across sessions
- Chat interface is accessible from main navigation
