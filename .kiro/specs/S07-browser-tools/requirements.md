# S07: Browser Tools - Requirements

## Feature Description
Implement all 14 browser automation tools with Anthropic-compatible schema, integrating CDP wrapper and permission system.

## Tools to Implement

### Core Tools
1. **computer** - Screenshot, click, type, scroll, wait, zoom
2. **web_navigation** - Navigate, back, forward, reload
3. **tab_management** - Create, close, switch, list tabs
4. **tab_groups** - Create, update, ungroup tab groups

### Content Tools
5. **page_content** - Get screen summary, extract text, get HTML
6. **execute_script** - Run JavaScript in page context
7. **accessibility** - Get accessibility tree snapshot

### Monitoring Tools
8. **network** - View recent API calls
9. **console** - View console output

### Analysis Tools
10. **element_snapshot** - Get element details at coordinates

### Utility Tools
11. **web_search** - Google search integration
12. **shortcuts** - List and execute saved shortcuts
13. **clipboard** - Copy/paste operations

## Acceptance Criteria

### AC1: Tool Types and Interfaces
- [ ] ToolDefinition interface with name, description, parameters
- [ ] ToolParameters interface for input validation
- [ ] ToolContext interface with tab info and CDP wrapper
- [ ] ToolResult interface with success/error states
- [ ] AnthropicToolSchema for Claude integration
- [ ] OpenAIToolSchema for GPT integration

### AC2: Tool Registry
- [ ] Central tool registry singleton
- [ ] registerTool() for dynamic registration
- [ ] getAllTools() for listing
- [ ] getTool() for retrieval by name
- [ ] getAnthropicSchemas() for Claude
- [ ] getOpenAISchemas() for GPT

### AC3: Tool Execution
- [ ] Unified executeTool() function
- [ ] Permission check before execution via PermissionManager
- [ ] Return ToolResult with permissionRequired flag (not error string)
- [ ] Error handling with friendly messages

### AC4: Computer Tool
- [ ] `screenshot` action - capture page screenshot
- [ ] `left_click` action - single left click at coordinates
- [ ] `right_click` action - right click at coordinates
- [ ] `double_click` action - double left click
- [ ] `triple_click` action - triple left click (select paragraph)
- [ ] `type` action - type text with human-like delays
- [ ] `key` action - press keyboard shortcuts
- [ ] `scroll` action - scroll up/down/left/right
- [ ] `wait` action - wait for duration (max 30s)
- [ ] `left_click_drag` action - drag from start to end coordinates
- [ ] `zoom` action - region screenshot

### AC5: Navigation Tool
- [ ] `navigate` action - navigate to URL with validation
- [ ] `go_back` action - browser back
- [ ] `go_forward` action - browser forward
- [ ] `reload` action - reload page with wait for load
- [ ] Default case returns error for unknown actions

### AC6: Tab Tools
- [ ] `create_tab` action - create new tab with optional URL
- [ ] `close_tab` action - close tab by ID
- [ ] `switch_tab` action - bring tab to focus
- [ ] `list_tabs` action - list all tabs with metadata

### AC7: Tab Groups
- [ ] `create_group` action - create group with title and color
- [ ] `update_group` action - update title/color
- [ ] `add_to_group` action - add tabs to group
- [ ] `ungroup` action - remove tabs from group

### AC8: Page Content Tools
- [ ] `get_text` action - extract visible page text
- [ ] `get_html` action - extract DOM HTML
- [ ] `screen_summary` action - get accessibility tree summary
- [ ] Execute script tool for arbitrary JS execution

### AC9: Monitoring Tools
- [ ] Network tool - capture recent API requests
- [ ] Console tool - capture console log output
- [ ] Accessibility tool - get a11y tree information

### AC10: Analysis Tools
- [ ] Element snapshot - get element details at coordinates
- [ ] Web search - perform Google search queries

### AC11: Utility Tools
- [ ] Shortcuts tool - list saved shortcuts
- [ ] Shortcuts tool - execute a shortcut by name
- [ ] Clipboard tool - copy/paste operations

### AC12: Chat Integration
- [ ] Connect tools to chat flow in Chat.tsx
- [ ] Parse tool_use blocks from LLM responses
- [ ] Execute tool and format result
- [ ] Handle tool errors gracefully with retry option
- [ ] Display tool results in ToolUseCard

## Dependencies
- S05: CDP wrapper
- S06: Permission system
