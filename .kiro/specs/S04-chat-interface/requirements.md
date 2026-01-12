# S04: Chat Interface - Requirements

## Feature Description
Build the main chat interface for conversing with the LLM, displaying messages, tool uses, and streaming responses.

## User Stories

### US1: Send Message
**As a** user
**I want** to type a message and send it
**So that** I can interact with the AI

### US2: View Response
**As a** user
**I want** to see the AI's response stream in real-time
**So that** I don't have to wait for the full response

### US3: Tool Use Display
**As a** user
**I want** to see when the AI uses browser tools
**So that** I know what actions it's performing

### US4: Error Handling
**As a** user
**I want** to see errors clearly with retry options
**So that** I can recover from failures

### US5: Message History
**As a** user
**I want** my conversation history preserved
**So that** I can continue where I left off

## Acceptance Criteria

### AC1: Message List
- [ ] Auto-scroll to bottom on new messages
- [ ] Pin to bottom toggle
- [ ] User messages styled differently
- [ ] Assistant messages with markdown

### AC2: Input Area
- [ ] Multiline textarea
- [ ] Send button (and Enter key)
- [ ] Disabled while streaming
- [ ] Attachment placeholder (future)

### AC3: Streaming
- [ ] Real-time text display
- [ ] Thinking indicator animation
- [ ] Cancel streaming option

### AC4: Tool Use Cards
- [ ] Show tool name
- [ ] Expandable input/output
- [ ] Status (pending, complete, error)
- [ ] Screenshots displayed

### AC5: Error Display
- [ ] Error card with message
- [ ] Retry button
- [ ] Dismiss option

### AC6: Markdown Rendering
- [ ] Code blocks with syntax highlighting
- [ ] Links clickable
- [ ] Lists, headers, bold, italic

## Dependencies
- S01: Extension scaffold
- S02: Provider factory
- S03: Provider settings (provider connected)

## shadcn Components
- Card (messages)
- Textarea (input)
- Button (send, retry)
- ScrollArea (message list)
