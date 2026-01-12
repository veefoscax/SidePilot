# S14: MCP Connector - Tasks

## Implementation Checklist

### 1. Connector Core
- [ ] Create `src/lib/mcp-connector.ts` <!-- id: 0 -->
- [ ] Define MCPConnectorConfig <!-- id: 1 -->
- [ ] Implement handleToolsList <!-- id: 2 -->
- [ ] Implement handleToolCall <!-- id: 3 -->
- [ ] Implement getActiveTabContext <!-- id: 4 -->

### 2. Communication Layer
- [ ] Choose approach (native messaging vs HTTP) <!-- id: 5 -->
- [ ] Implement message receiving <!-- id: 6 -->
- [ ] Implement response sending <!-- id: 7 -->

### 3. Settings UI
- [ ] Add MCP Connector section to Settings <!-- id: 8 -->
- [ ] Add enable/disable toggle <!-- id: 9 -->
- [ ] Add tool selection checkboxes <!-- id: 10 -->
- [ ] Add auth token display/regenerate <!-- id: 11 -->

### 4. Documentation
- [ ] Document how to connect from Cline <!-- id: 12 -->
- [ ] Document how to connect from Aider <!-- id: 13 -->
- [ ] Create companion proxy if needed <!-- id: 14 -->

### 5. Testing
- [ ] Test tool list response <!-- id: 15 -->
- [ ] Test tool call execution <!-- id: 16 -->
- [ ] Test with real Cline/Aider <!-- id: 17 -->

### 6. Automated Testing (Playwright)
- [ ] Install Playwright dependencies <!-- id: 18 -->
- [ ] Create static build verification tests (verify dist/ output size & content) <!-- id: 19 -->
- [ ] Create integration tests for UI/Logic <!-- id: 20 -->
- [ ] Add test script to package.json <!-- id: 21 -->
- [ ] Update DEVLOG with test results and screenshots <!-- id: 22 -->
