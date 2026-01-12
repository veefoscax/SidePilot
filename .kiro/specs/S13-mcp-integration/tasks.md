# S13: MCP Integration - Tasks

## Implementation Checklist

### 1. MCP Types & Utilities
- [ ] Create `src/lib/mcp.ts` <!-- id: 0 -->
- [ ] Define MCPServer interface <!-- id: 1 -->
- [ ] Define MCPTool interface <!-- id: 2 -->
- [ ] Implement formatMcpToolName <!-- id: 3 -->
- [ ] Implement parseMcpToolName <!-- id: 4 -->
- [ ] Implement isMcpTool <!-- id: 5 -->

### 2. MCP Client
- [ ] Create MCPClient class <!-- id: 6 -->
- [ ] Implement connect with tool discovery <!-- id: 7 -->
- [ ] Implement callTool for execution <!-- id: 8 -->

### 3. MCP Store
- [ ] Create `src/stores/mcp.ts` <!-- id: 9 -->
- [ ] Implement addServer <!-- id: 10 -->
- [ ] Implement removeServer <!-- id: 11 -->
- [ ] Implement refreshTools <!-- id: 12 -->
- [ ] Implement setToolEnabled <!-- id: 13 -->
- [ ] Persist to chrome.storage <!-- id: 14 -->

### 4. Tool Registry Integration
- [ ] Add getEnabledMcpTools to registry <!-- id: 15 -->
- [ ] Merge MCP tools with browser tools <!-- id: 16 -->
- [ ] Route MCP tool calls through client <!-- id: 17 -->

### 5. Settings UI
- [ ] Add MCP servers section <!-- id: 18 -->
- [ ] Add server input field <!-- id: 19 -->
- [ ] Show connected servers list <!-- id: 20 -->
- [ ] Show tools per server with toggles <!-- id: 21 -->

### 6. Testing
- [ ] Test with mock MCP server <!-- id: 22 -->
- [ ] Test tool discovery <!-- id: 23 -->
- [ ] Test tool execution <!-- id: 24 -->

### 7. Automated Testing (Playwright)
- [ ] Install Playwright dependencies <!-- id: 25 -->
- [ ] Create static build verification tests (verify dist/ output size & content) <!-- id: 26 -->
- [ ] Create integration tests for UI/Logic <!-- id: 27 -->
- [ ] Add test script to package.json <!-- id: 28 -->
- [ ] Update DEVLOG with test results and screenshots <!-- id: 29 -->
