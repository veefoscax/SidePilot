# Prompt: Complete SidePilot Specs S05-S15

## Context

You are working on **SidePilot**, a Chrome extension for AI-powered browser automation. The project uses Kiro for spec-driven development.

**Current Status:**
- ✅ Complete: S01-S04 (Foundation), S16-S19 (Settings, Voice, Context, Pointer)
- ⚠️ Partial: S05-S15 (need verification and completion)

## Task

Review and complete all partial specs from S05 to S15. For each spec:

1. Check `tasks.md` for incomplete items
2. Implement any missing functionality
3. Mark tasks as complete `[x]` when done
4. Verify with build (`npm run build`)

## Specs to Complete

### S05: CDP Wrapper (Browser-Use Enhanced)
**Location**: `.kiro/specs/S05-cdp-wrapper/`
**Purpose**: Chrome DevTools Protocol wrapper for browser automation
**Key Files**: `src/lib/browser-use/`, `src/lib/cdp/`

### S06: Permission System
**Location**: `.kiro/specs/S06-permissions/`
**Purpose**: Domain-based permission rules for browser tools
**Key Files**: `src/lib/permissions/`, `src/components/PermissionDialog.tsx`

### S07: Browser Tools
**Location**: `.kiro/specs/S07-browser-tools/`
**Purpose**: Screenshot, click, type, navigate, scroll, extract tools
**Key Files**: `src/tools/`

### S08: Shortcuts System
**Location**: `.kiro/specs/S08-shortcuts/`
**Purpose**: Keyboard shortcuts and quick actions
**Key Files**: `src/stores/shortcuts.ts`, `src/components/chat/ShortcutEditor.tsx`

### S09: Workflow Recording
**Location**: `.kiro/specs/S09-workflow-recording/`
**Purpose**: Record and replay browser automation workflows
**Key Files**: `src/lib/workflow/`, `src/components/WorkflowEditor.tsx`

### S10: Tab Groups
**Location**: `.kiro/specs/S10-tab-groups/`
**Purpose**: Organize browser tabs for AI context
**Key Files**: Check if implemented in `src/tools/tabs.ts`

### S11: Network/Console
**Location**: `.kiro/specs/S11-network-console/`
**Purpose**: Capture network requests and console logs
**Key Files**: Check `src/lib/cdp/` for network monitoring

### S12: Notifications
**Location**: `.kiro/specs/S12-notifications/`
**Purpose**: Chrome notifications for task completion, errors
**Key Files**: `src/lib/notifications.ts`

### S13: MCP Integration
**Location**: `.kiro/specs/S13-mcp-integration/`
**Purpose**: Model Context Protocol client for external tools
**Key Files**: `src/lib/mcp/`

### S14: MCP Connector
**Location**: `.kiro/specs/S14-mcp-connector/`
**Purpose**: Expose browser tools to external LLMs via MCP
**Key Files**: `src/lib/mcp-connector/`

### S15: Model Capabilities
**Location**: `.kiro/specs/S15-model-capabilities/`
**Purpose**: Detect and display model capabilities (vision, tools, streaming)
**Key Files**: `src/lib/model-capabilities.ts`, `src/components/settings/CapabilityBadges.tsx`

## Execution Instructions

```bash
# For each spec:

# 1. Read the tasks
cat .kiro/specs/S{NN}-{name}/tasks.md

# 2. Check what's implemented
grep -r "functionName" src/

# 3. Implement missing parts
# ... code changes ...

# 4. Verify build
npm run build

# 5. Mark task complete in tasks.md
# Change [ ] to [x]
```

## Priority Order

1. **S07: Browser Tools** - Core functionality
2. **S06: Permissions** - Needed for tools
3. **S05: CDP Wrapper** - Foundation for tools
4. **S12: Notifications** - User feedback
5. **S15: Model Capabilities** - UX improvement
6. **S08-S11, S13-S14** - Advanced features

## Success Criteria

- All tasks.md items marked `[x]`
- `npm run build` succeeds
- No TypeScript errors
- Features manually testable in Chrome

## Notes

- Focus on core functionality first
- Skip complex features if time-constrained
- Document any skipped items in DEVLOG.md
