# DEVLOG Auto-Updater Hook

## Hook Configuration

**Trigger**: After agent execution completes (when a task is finished)
**Action**: Send message to update DEVLOG.md

## Message Template

```
Update DEVLOG.md with the following completed task:

**Task Completed**: [Task Name from tasks.md]
**Spec**: [Spec ID and Name]
**Timestamp**: [Current date and time]
**Duration**: [Time spent on task]
**Kiro Commands Used**: 
- [List of commands/tools used during implementation]
- [Include file operations, searches, builds, tests, etc.]

**Files Modified**:
- [List of files created/modified]

**Summary**: 
[Brief description of what was accomplished]

**Challenges Encountered**:
[Any issues faced and how they were resolved]

Please add this entry to the appropriate phase section in DEVLOG.md, update the time tracking table, and increment the Kiro CLI usage statistics.
```

## Setup Instructions

1. Open Kiro Hook UI (Command Palette → "Open Kiro Hook UI")
2. Create new hook with these settings:
   - **Name**: "DEVLOG Auto-Updater"
   - **Trigger**: "When an agent execution completes"
   - **Condition**: Task completion detected
   - **Action**: "Send a new message to the agent"
   - **Message**: Use the template above

## Alternative Manual Command

If automatic hooks aren't working, you can manually trigger DEVLOG updates by sending this message:

```
Please update DEVLOG.md with the task I just completed. Include:
- Current timestamp
- Task name and spec
- Kiro commands/tools used
- Files modified
- Brief summary of work done
- Update time tracking and statistics
```

## DEVLOG Structure to Maintain

The hook should maintain this structure in DEVLOG.md:

```markdown
### S0X: Spec Name
- **Started**: YYYY-MM-DD HH:MM
- **Completed**: YYYY-MM-DD HH:MM  
- **Time**: Xh Ym
- **Kiro Commands Used**:
  - command 1
  - command 2
- **Files Modified**:
  - file1.ts
  - file2.tsx
- **Summary**: Brief description
- **Challenges**: Any issues encountered
```