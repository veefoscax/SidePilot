# Kiro Hooks for SidePilot Development

This directory contains automated hooks that trigger during development to maintain comprehensive documentation and git history.

## Available Hooks

### 1. `complete-task-automation.json` ⭐ **RECOMMENDED**
**Purpose**: Complete automation for task completion documentation
**Trigger**: After any agent execution that completes a task
**Features**:
- ✅ Comprehensive DEVLOG.md updates with detailed time tracking
- ✅ Documents struggles, debugging processes, and refactorings  
- ✅ Updates all spec files with time tracking and lessons learned
- ✅ Updates statistics tables (Kiro CLI usage, time tracking)
- ✅ Automated git commit with detailed messages
- ✅ Auto-push when spec is complete

### 2. `devlog-updater.json` 
**Purpose**: Enhanced DEVLOG updater with git integration
**Trigger**: After task completion in spec context
**Features**:
- Detailed DEVLOG.md updates
- Spec file time tracking
- Git commit automation
- Comprehensive documentation format

### 3. `auto-devlog-updater.json`
**Purpose**: Focused on documentation updates only
**Trigger**: After task completion
**Features**:
- DEVLOG.md updates with engineering journal style
- Spec file time tracking
- No git automation

### 4. `comprehensive-devlog-updater.json`
**Purpose**: Most detailed documentation template
**Trigger**: After task completion
**Features**:
- Extremely detailed documentation templates
- Comprehensive analysis requirements
- Engineering journal style guidelines

## Supporting Files

### `auto-commit-devlog.ps1`
PowerShell script for manual git automation:
```powershell
.\auto-commit-devlog.ps1 "S01" "test side panel opens" "3x estimate due to Vite path resolution"
```

### `comprehensive-devlog-guide.md`
Detailed guide for documentation standards, templates, and writing guidelines.

## Hook Installation

1. **Automatic**: Hooks in this directory are automatically available in Kiro
2. **Manual**: Open Kiro Hook UI (Command Palette → "Open Kiro Hook UI")
3. **Enable**: Toggle the desired hook to "enabled"
4. **Test**: Complete a task to see the hook trigger

## Recommended Setup

For comprehensive development documentation, enable:
1. **`complete-task-automation.json`** - Primary automation
2. Keep others disabled to avoid duplicate messages

## Documentation Standards

All hooks follow these standards:

### DEVLOG.md Format
```markdown
### S0X: Spec Name
- **Started**: 2026-01-12 17:30
- **Completed**: 2026-01-12 19:45  
- **Time**: 2h 15m (originally estimated 45m)
- **Kiro Commands Used**: [detailed list with purposes]
- **Files Modified**: [all files with NEW/CRITICAL FIX highlights]

#### Major Struggles & Refactorings
**🚨 Critical Issue**: [detailed problem analysis]
**🔧 Debugging Process**: [step-by-step debugging]
**📊 Build Verification**: [what was verified]
**🧪 Testing Infrastructure**: [test files created]

- **Summary**: [comprehensive with learnings]
- **Time Impact**: [variance explanation]
```

### Spec File Updates
- **tasks.md**: Time tracking + lessons learned
- **requirements.md**: Time tracking + key learning  
- **design.md**: Time tracking + critical issue note

### Git Commit Format
```
feat(S01): test side panel opens - 3x estimate due to Vite path resolution

Updated DEVLOG.md with:
- Detailed time tracking and variance analysis
- Comprehensive Kiro command usage statistics
- Major struggles and debugging processes
- Critical issues with root cause analysis
- Testing infrastructure and verification steps
- Lessons learned for future development

Updated spec files (.kiro/specs/S01/) with:
- Time tracking sections
- Lessons learned documentation  
- Critical issue summaries

Timestamp: 2026-01-12 19:45
```

## Writing Style Guidelines

- **Engineering journal tone** - honest about struggles and successes
- **Future developer focused** - help others avoid similar issues
- **Specific and technical** - include file paths, error messages, configs
- **Emoji organization** - 🚨🔧📊🧪✅❌ for visual structure
- **Bold formatting** - **CRITICAL FIX**, **NEW**, **Problem**, **Solution**
- **Process documentation** - show the debugging journey, not just solutions

## Manual Trigger

If hooks aren't working, use this prompt:
```
Please perform comprehensive task documentation following .kiro/hooks/comprehensive-devlog-guide.md standards. Include detailed time tracking, struggles, refactorings, Kiro command usage, file modifications, and lessons learned. Update DEVLOG.md, spec files, and statistics tables.
```

## Benefits

This automation ensures:
- ✅ **Complete development history** with real struggles documented
- ✅ **Accurate time tracking** for future estimation improvement  
- ✅ **Detailed technical knowledge** for debugging similar issues
- ✅ **Consistent documentation** across all specs and tasks
- ✅ **Automated git history** with meaningful commit messages
- ✅ **Future developer guidance** to avoid repeating mistakes

## Legacy Files

The following files are from the original simpler hook system:
- `devlog-updater.ps1` - Original PowerShell script
- `devlog-updater.sh` - Original bash script  
- `update-devlog.md` - Original documentation

These are kept for reference but the new JSON hooks provide much more comprehensive automation.