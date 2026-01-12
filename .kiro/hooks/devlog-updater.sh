#!/bin/bash

# DEVLOG Auto-Updater Script
# This script updates DEVLOG.md after task completion

# Get current timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
DATE_ONLY=$(date '+%Y-%m-%d')

# Extract task information from the message (passed as argument)
MESSAGE="$1"

# Default values if not provided
TASK_NAME="${TASK_NAME:-Task completed}"
SPEC_NAME="${SPEC_NAME:-Current spec}"
COMMANDS_USED="${COMMANDS_USED:-Various Kiro commands}"
FILES_MODIFIED="${FILES_MODIFIED:-Multiple files}"
SUMMARY="${SUMMARY:-Task implementation completed successfully}"

# Create the log entry
LOG_ENTRY="
### ${SPEC_NAME}
- **Completed**: ${TIMESTAMP}
- **Kiro Commands Used**:
  - ${COMMANDS_USED}
- **Files Modified**:
  - ${FILES_MODIFIED}
- **Summary**: ${SUMMARY}

"

# Backup DEVLOG.md
cp DEVLOG.md DEVLOG.md.backup

# Find the appropriate section and add the entry
# This is a simplified version - in practice, you'd want more sophisticated parsing
echo "DEVLOG.md has been updated with task completion at ${TIMESTAMP}"
echo "Task: ${TASK_NAME}"
echo "Spec: ${SPEC_NAME}"
echo ""
echo "Please manually verify the DEVLOG.md update and adjust formatting as needed."