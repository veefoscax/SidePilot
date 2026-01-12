# S13: MCP Integration - Tasks

## Implementation Checklist

### 1. MCP Types & Utilities
- [ ] Create `src/lib/mcp.ts`
- [ ] Define MCPServer interface
- [ ] Define MCPTool interface
- [ ] Implement formatMcpToolName
- [ ] Implement parseMcpToolName
- [ ] Implement isMcpTool

### 2. MCP Client
- [ ] Create MCPClient class
- [ ] Implement connect with tool discovery
- [ ] Implement callTool for execution

### 3. MCP Store
- [ ] Create `src/stores/mcp.ts`
- [ ] Implement addServer
- [ ] Implement removeServer
- [ ] Implement refreshTools
- [ ] Implement setToolEnabled
- [ ] Persist to chrome.storage

### 4. Tool Registry Integration
- [ ] Add getEnabledMcpTools to registry
- [ ] Merge MCP tools with browser tools
- [ ] Route MCP tool calls through client

### 5. Settings UI
- [ ] Add MCP servers section
- [ ] Add server input field
- [ ] Show connected servers list
- [ ] Show tools per server with toggles

### 6. Testing
- [ ] Test with mock MCP server
- [ ] Test tool discovery
- [ ] Test tool execution
