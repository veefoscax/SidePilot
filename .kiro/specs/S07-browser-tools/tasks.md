# Implementation Plan: Browser Tools

## Overview

This implementation plan creates a comprehensive browser tools system that enables AI-powered browser automation. Tools integrate with the CDP wrapper and permission system to provide safe, powerful automation capabilities.

## Tasks

- [ ] 1. Tool Types and Interfaces
  - Create src/tools/types.ts with core interfaces
  - Define ToolDefinition interface with name, description, parameters
  - Define ToolParameters interface for input validation
  - Define ToolContext interface with tab info and CDP wrapper
  - Define ToolResult interface with success/error states
  - Define AnthropicToolSchema for Claude integration
  - Define OpenAIToolSchema for GPT integration
  - _Requirements: AC1, AC2_

- [ ] 1.1 Write unit tests for tool types
  - Test interface validation
  - Test schema conversion between providers
  - _Requirements: AC1_

- [ ] 2. Tool Registry Implementation
  - Create src/tools/registry.ts singleton
  - Implement registerTool() for dynamic registration
  - Implement getAllTools() for listing
  - Implement getTool() for retrieval by name
  - Implement getAnthropicSchemas() for Claude
  - Implement getOpenAISchemas() for GPT
  - Implement executeTool() with permission check integration
  - _Requirements: AC3, AC4, AC5_

- [ ] 2.1 Write tests for tool registry
  - Test tool registration and retrieval
  - Test schema generation for both providers
  - Test execution with mock permissions
  - _Requirements: AC3, AC4_

- [ ] 3. Computer Tool Implementation
  - Create src/tools/computer.ts for mouse/keyboard actions
  - Implement screenshot action (uses CDP wrapper)
  - Implement left_click, right_click, double_click, triple_click
  - Implement type action with human-like delays
  - Implement key action for special keys
  - Implement scroll action (up/down/left/right)
  - Implement wait action for timing
  - Implement left_click_drag for drag operations
  - Implement zoom action for page zoom
  - _Requirements: AC6, AC7, AC8_

- [ ] 3.1 Write tests for computer tool
  - Test each action type
  - Test coordinate handling
  - Test human delay integration
  - _Requirements: AC6_

- [ ] 4. Navigation Tool Implementation
  - Create src/tools/navigation.ts
  - Implement navigate action with URL validation
  - Implement go_back action
  - Implement go_forward action
  - Implement reload action with wait for load
  - _Requirements: AC9_

- [ ] 5. Checkpoint - Test Core Tools
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Tab Management Tools
  - Create src/tools/tabs.ts
  - Implement create_tab with URL support
  - Implement close_tab by ID
  - Implement switch_tab to bring tab to focus
  - Implement list_tabs with metadata
  - _Requirements: AC10_

- [ ] 7. Tab Groups Tool
  - Create src/tools/tab-groups.ts
  - Implement create_group with title and color
  - Implement update_group for title/color changes
  - Implement add_to_group to add tabs
  - Implement ungroup to remove from group
  - _Requirements: AC11_

- [ ] 8. Content Extraction Tools
  - Create src/tools/page-content.ts
  - Implement get_text for page text extraction
  - Implement get_html for DOM extraction
  - Implement screen_summary for accessibility tree
  - Create src/tools/execute-script.ts for JS execution
  - _Requirements: AC12, AC13_

- [ ] 9. Monitoring Tools
  - Create src/tools/network.ts for request monitoring
  - Create src/tools/console.ts for console log capture
  - Create src/tools/accessibility.ts for a11y info
  - Create src/tools/element-snapshot.ts for element info
  - _Requirements: AC14, AC15_

- [ ] 10. Utility Tools
  - Create src/tools/web-search.ts for search queries
  - Create src/tools/shortcuts.ts for keyboard shortcuts
  - Create src/tools/clipboard.ts for copy/paste
  - _Requirements: AC16_

- [ ] 11. Chat Integration
  - Connect tools to chat flow in Chat.tsx
  - Parse tool_use blocks from LLM responses
  - Execute tool and format result
  - Handle tool errors gracefully with retry option
  - Display tool results in ToolUseCard
  - _Requirements: AC17, AC18_

- [ ] 11.1 Write integration tests for chat flow
  - Test tool execution from chat
  - Test error handling and display
  - _Requirements: AC17_

- [ ] 12. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tools must integrate with permission system before execution
- Computer tool is the most complex with 12+ actions
- Tab groups require Chrome's tabGroups API permission
- Execute script tool requires careful sandboxing
- Tool results should be formatted for LLM consumption
