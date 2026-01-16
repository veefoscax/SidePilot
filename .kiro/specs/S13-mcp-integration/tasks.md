# Implementation Plan: MCP Integration

## Overview

This implementation plan adds Model Context Protocol (MCP) client support, enabling SidePilot to connect to external MCP servers and use their tools alongside browser automation tools.

## Tasks

- [x] 1. MCP Types and Utilities
  - Create src/lib/mcp.ts with core types
  - Define MCPServer interface (url, name, status, tools)
  - Define MCPTool interface (name, description, inputSchema)
  - Implement formatMcpToolName for prefixing
  - Implement parseMcpToolName for extraction
  - Implement isMcpTool checker
  - _Requirements: AC1_

- [x] 2. MCP Client Implementation
  - Create MCPClient class
  - Implement connect with WebSocket or HTTP
  - Implement tool discovery on connect
  - Implement callTool for execution
  - Handle connection errors gracefully
  - Implement reconnection logic
  - _Requirements: AC2, AC3_

- [x] 2.1 Write tests for MCP client
  - Test connection lifecycle
  - Test tool discovery parsing
  - Test tool execution
  - _Requirements: AC2_

- [x] 3. MCP Store Implementation
  - Create src/stores/mcp.ts with Zustand
  - Implement addServer with validation
  - Implement removeServer
  - Implement refreshTools for reconnection
  - Implement setToolEnabled toggle
  - Persist server list to chrome.storage
  - _Requirements: AC4_

- [ ] 4. Checkpoint - Test MCP Core
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Tool Registry Integration
  - Add getEnabledMcpTools to registry
  - Merge MCP tools with browser tools
  - Route MCP tool calls through client
  - Handle schema conversion for providers
  - _Requirements: AC5_

- [ ] 6. Settings UI
  - Add MCP servers section to Settings
  - Add server URL input field
  - Show connected servers list with status
  - Show tools per server with enable/disable toggles
  - Add connect/disconnect buttons
  - Add refresh tools button
  - _Requirements: AC6_

- [ ] 7. Integration Testing
  - Test with mock MCP server
  - Test tool discovery from real server
  - Test tool execution round-trip
  - Test UI updates on connection changes
  - _Requirements: All_

- [ ] 8. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- MCP uses JSON-RPC 2.0 over WebSocket or HTTP
- Tool names prefixed with server name for disambiguation
- Connection status should be visible in UI
- Consider rate limiting for MCP calls
