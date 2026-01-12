# Kiro Hooks for SidePilot

This directory contains Kiro hooks for automating development workflow tasks.

## DEVLOG Auto-Updater Hook

Automatically updates `DEVLOG.md` after each task completion with detailed information about what was accomplished.

### Files

- `devlog-updater.json` - Hook configuration for Kiro
- `update-devlog.md` - Documentation and manual instructions
- `devlog-updater.ps1` - PowerShell script for Windows
- `devlog-updater.sh` - Bash script for Unix systems

### Setup Instructions

#### Option 1: Using Kiro Hook UI (Recommended)

1. Open the command palette in your IDE
2. Search for "Open Kiro Hook UI" and select it
3. Click "Create New Hook"
4. Configure the hook with these settings:

**Basic Settings:**
- **Name**: `DEVLOG Auto-Updater with Git`
- **Description**: `Automatically updates DEVLOG.md and commits changes after task completion`

**Trigger:**
- **Event**: `When an agent execution completes`
- **Condition**: Task completion detected (look for task status updates)

**Action:**
- **Type**: `Send a new message to the agent`
- **Message Template**:
```
Task completed! Please:

1. **Update DEVLOG.md** with:
   - **Task**: [Current task from tasks.md]
   - **Spec**: [Current spec ID and name]
   - **Started**: [When task began]
   - **Completed**: [Current timestamp]
   - **Time**: [Duration]
   - **Kiro Commands Used**: [List all tools used: fsWrite, executePwsh, readFile, etc.]
   - **Files Modified**: [All files created/changed]
   - **Summary**: [What was accomplished]
   - **Challenges**: [Any issues and solutions]

2. **Update Kiro CLI Usage Statistics** table with command counts

3. **Git commit** all changes with message format:
   `feat(specName): task description`
   
4. **Check if spec is complete** - if all tasks done, push to origin

Follow the DEVLOG structure from Phase 1 section and update time tracking table.
```

#### Option 2: Manual Trigger

After completing any task, send this message to Kiro:

```
Update DEVLOG.md with my completed task. Include timestamp, task details, Kiro commands used, files modified, and a summary. Update the time tracking table.
```

#### Option 3: PowerShell Script (Windows)

```powershell
# Run after completing a task
.\.kiro\hooks\devlog-updater.ps1 -TaskName "S01.1 Setup Vite config" -SpecName "S01: Extension Scaffold" -CommandsUsed "fsWrite, executePwsh, readFile" -FilesModified "vite.config.ts, package.json" -Summary "Configured Vite for Chrome extension build"
```

### Expected DEVLOG Format

The hook maintains this structure in DEVLOG.md:

```markdown
## Phase X: Phase Name
**Target Specs**: S0X, S0Y

### S0X: Spec Name
- **Started**: 2026-01-12 14:30
- **Completed**: 2026-01-12 16:45
- **Time**: 2h 15m
- **Kiro Commands Used**:
  - fsWrite (created 5 files)
  - executePwsh (ran build commands)
  - readFile (reviewed existing code)
  - grepSearch (found dependencies)
- **Files Modified**:
  - vite.config.ts
  - package.json
  - src/sidepanel/App.tsx
- **Summary**: Successfully set up Vite build system with multi-entry configuration for Chrome extension
- **Challenges**: Had to resolve TypeScript path alias issues, fixed by updating tsconfig.json

### S0Y: Next Spec
- **Started**: 2026-01-12 17:00
- **In Progress**: Working on provider factory implementation
```

### Kiro CLI Usage Tracking

The hook also updates this statistics table:

```markdown
## Kiro CLI Usage Statistics

| Command | Count | Purpose |
|---------|-------|---------|
| fsWrite | 15 | File creation/modification |
| executePwsh | 8 | Running build/test commands |
| readFile | 12 | Code review and analysis |
| grepSearch | 6 | Finding code patterns |
| getDiagnostics | 4 | Checking for errors |
```

### Troubleshooting

**Hook not triggering automatically?**
- Check that the hook is enabled in Kiro Hook UI
- Verify the trigger condition matches your workflow
- Use manual trigger as fallback

**Incorrect information captured?**
- The hook relies on context from your conversation with Kiro
- Be specific about task names and files when working with Kiro
- Manually edit DEVLOG.md if needed

**PowerShell script not running?**
- Check execution policy: `Get-ExecutionPolicy`
- If restricted, run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

### Customization

You can modify the hook behavior by:
1. Editing the message template in the hook configuration
2. Adjusting the PowerShell script parameters
3. Creating additional hooks for other automation needs

### Integration with Specs

This hook works best when:
- Working on tasks from `.kiro/specs/*/tasks.md` files
- Using Kiro's task status tracking
- Following the spec-driven development workflow
- Being explicit about which spec and task you're working on