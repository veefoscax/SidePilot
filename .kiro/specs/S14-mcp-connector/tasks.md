# S14: MCP Connector - Tasks

## Implementation Checklist

### 1. Connector Core
- [ ] Create `src/lib/mcp-connector.ts`
- [ ] Define MCPConnectorConfig
- [ ] Implement handleToolsList
- [ ] Implement handleToolCall
- [ ] Implement getActiveTabContext

### 2. Communication Layer
- [ ] Choose approach (native messaging vs HTTP)
- [ ] Implement message receiving
- [ ] Implement response sending

### 3. Settings UI
- [ ] Add MCP Connector section to Settings
- [ ] Add enable/disable toggle
- [ ] Add tool selection checkboxes
- [ ] Add auth token display/regenerate

### 4. Documentation
- [ ] Document how to connect from Cline
- [ ] Document how to connect from Aider
- [ ] Create companion proxy if needed

### 5. Testing
- [ ] Test tool list response
- [ ] Test tool call execution
- [ ] Test with real Cline/Aider
