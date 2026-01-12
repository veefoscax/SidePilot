# S07: Browser Tools - Requirements

## Feature Description
Implement all 13+ browser automation tools with Anthropic-compatible schema, integrating CDP wrapper and permission system.

## Tools to Implement

### Core Tools
1. **computer** - Screenshot, click, type, scroll, wait, zoom
2. **web_navigation** - Navigate, back, forward, reload
3. **tab_management** - Create, close, switch, list tabs
4. **tab_groups** - Create, update, ungroup tab groups

### Content Tools
5. **page_content** - Get screen summary, extract text
6. **execute_script** - Run JavaScript in page context
7. **page_styling** - Modify CSS (hide elements, highlight)
8. **accessibility_snapshot** - Get accessibility tree

### Monitoring Tools
9. **network_requests** - View recent API calls
10. **console_logs** - View console output

### Analysis Tools
11. **element_snapshot** - Get element details at coordinates
12. **web_search** - Google search integration

### Automation Tools
13. **shortcuts_list** - List saved shortcuts
14. **shortcuts_execute** - Run a shortcut

## Acceptance Criteria

### AC1: Tool Registration
- [ ] Central tool registry
- [ ] Anthropic schema generation
- [ ] Tool discovery by name

### AC2: Tool Execution
- [ ] Unified execute function
- [ ] Permission check before execution
- [ ] Error handling with friendly messages

### AC3: Computer Tool
- [ ] `screenshot` action
- [ ] `left_click`, `right_click` actions
- [ ] `double_click`, `triple_click` actions
- [ ] `type` action
- [ ] `key` action (keyboard shortcuts)
- [ ] `scroll` action (up, down, left, right)
- [ ] `wait` action
- [ ] `left_click_drag` action
- [ ] `zoom` action (region screenshot)

### AC4: Navigation Tool
- [ ] `navigate` to URL
- [ ] `go_back`, `go_forward`
- [ ] `reload` page

### AC5: Content Tools
- [ ] Extract visible text
- [ ] Run arbitrary JS
- [ ] Modify CSS

## Dependencies
- S05: CDP wrapper
- S06: Permission system
