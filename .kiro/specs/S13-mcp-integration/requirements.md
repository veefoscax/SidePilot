# S13: MCP Integration - Requirements

## User Stories

### US1: Connect MCP Server
**As a** user
**I want** to connect external MCP servers
**So that** the AI can use additional tools

### US2: Discover Tools
**As a** user
**I want** to see available tools from connected servers
**So that** I know what capabilities are available

### US3: Enable/Disable Tools
**As a** user
**I want** to control which MCP tools are active
**So that** I can limit potential actions

## Acceptance Criteria (EARS Notation)

### AC1: Register Server
WHEN the user adds an MCP server URL
THE SYSTEM SHALL connect and discover available tools
AND store the server configuration

### AC2: Tool Naming
WHEN tools are discovered from an MCP server
THE SYSTEM SHALL prefix tool names with `mcp__<uuid>__`
TO ensure unique identification

### AC3: Tool Execution
WHEN the AI calls an MCP tool
THE SYSTEM SHALL forward the request to the appropriate server
AND return the tool result

### AC4: Toggle Tools
WHEN the user toggles an MCP tool
THE SYSTEM SHALL include or exclude it from AI tool list

## Dependencies
- S07: Browser Tools (tool registry pattern)
