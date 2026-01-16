# Implementation Plan: MCP Connector

## Overview

This implementation plan creates an MCP server connector that exposes SidePilot's browser tools to external AI tools like Cline, Aider, and other MCP clients.

## Tasks

- [x] 1. Connector Core Implementation
  - Create src/lib/mcp-connector.ts
  - Define MCPConnectorConfig interface
  - Implement handleToolsList for tool discovery
  - Implement handleToolCall for execution
  - Implement getActiveTabContext for context
  - Generate unique auth token for security
  - _Requirements: AC1, AC2_

- [x] 1.1 Write tests for connector core
  - Test tools list generation
  - Test tool call routing
  - _Requirements: AC1_

- [~] 2. Communication Layer
  - Choose approach (native messaging vs HTTP local server)
  - Implement message receiving with validation
  - Implement response sending with proper formatting
  - Handle auth token verification
  - Implement request timeout handling
  - _Requirements: AC3_

- [~] 3. Settings UI Integration
  - Add MCP Connector section to Settings
  - Add enable/disable toggle
  - Add tool selection checkboxes (expose subset of tools)
  - Add auth token display with copy button
  - Add regenerate token button
  - Show connection status
  - _Requirements: AC4_

- [~] 4. Checkpoint - Test Core Connector
  - Ensure all tests pass, ask the user if questions arise.

- [~] 5. Documentation
  - Document how to connect from Cline
  - Document how to connect from Aider
  - Create companion proxy if needed for HTTP
  - Add troubleshooting guide
  - _Requirements: AC5_

- [~] 6. Integration Testing
  - Test tool list response format
  - Test tool call execution and response
  - Test with real Cline/Aider (manual)
  - Test auth token validation
  - _Requirements: All_

- [~] 7. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Native messaging requires manifest.json entry
- HTTP approach may need companion app
- Security is critical - auth token must be verified
- Consider WebSocket for real-time communication
