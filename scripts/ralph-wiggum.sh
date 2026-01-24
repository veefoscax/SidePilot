#!/bin/bash
# Ralph Wiggum - Autonomous AI Coding Loop (Bash version)
# For SidePilot specs S05-S15 completion
#
# Usage: ./scripts/ralph-wiggum.sh
# Stop: Ctrl+C

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SPECS_PATH="$PROJECT_ROOT/.kiro/specs"
LOG_FILE="$PROJECT_ROOT/ralph-wiggum.log"
MAX_ITERATIONS=${1:-50}
SLEEP_SECONDS=${2:-10}

# Specs to complete (ALL specs S01-S19)
SPECS=(
    "S01-extension-scaffold"
    "S02-provider-factory"
    "S03-provider-settings"
    "S04-chat-interface"
    "S05-cdp-wrapper"
    "S06-permissions"
    "S07-browser-tools"
    "S08-shortcuts"
    "S09-workflow-recording"
    "S10-tab-groups"
    "S11-network-console"
    "S12-notifications"
    "S13-mcp-integration"
    "S14-mcp-connector"
    "S15-model-capabilities"
    "S16-general-settings"
    "S17-voice-mode"
    "S18-context-optimization"
    "S19-screen-pointer"
)

log() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo "$msg"
    echo "$msg" >> "$LOG_FILE"
}

get_incomplete_tasks() {
    local spec=$1
    local tasks_file="$SPECS_PATH/$spec/tasks.md"
    
    if [ -f "$tasks_file" ]; then
        grep -E "^- \[ \]" "$tasks_file" | head -1 | sed 's/- \[ \] //'
    fi
}

count_incomplete() {
    local spec=$1
    local tasks_file="$SPECS_PATH/$spec/tasks.md"
    
    if [ -f "$tasks_file" ]; then
        grep -c "^- \[ \]" "$tasks_file" 2>/dev/null || echo "0"
    else
        echo "0"
    fi
}

build_project() {
    log "Building project..."
    cd "$PROJECT_ROOT"
    if npm run build > /dev/null 2>&1; then
        log "Build SUCCESS ✓"
        return 0
    else
        log "Build FAILED ✗"
        return 1
    fi
}

create_prompt() {
    local spec=$1
    local task=$2
    
    cat << EOF
# Task: Complete $spec

You are working on SidePilot, a Chrome extension for AI browser automation.

## Current Spec: $spec

Read the spec files:
- .kiro/specs/$spec/requirements.md
- .kiro/specs/$spec/design.md
- .kiro/specs/$spec/tasks.md

## Next Incomplete Task:
$task

## Instructions:
1. Read the task requirements
2. Check what code already exists (grep/search)
3. Implement the missing functionality
4. Verify with: npm run build
5. If build passes, mark task as [x] in tasks.md
6. If build fails, fix the errors

## Important:
- Focus on ONE task at a time
- Use existing patterns from src/
- No external dependencies unless specified
- TypeScript strict mode

After completing, say DONE or describe what's blocking.
EOF
}

# Header
log "========================================"
log "Ralph Wiggum - Starting autonomous loop"
log "Project: $PROJECT_ROOT"
log "Max iterations: $MAX_ITERATIONS"
log "========================================"

# Initial build
build_project || log "Initial build has issues"

iteration=0
while [ $iteration -lt $MAX_ITERATIONS ]; do
    iteration=$((iteration + 1))
    log "--- Iteration $iteration of $MAX_ITERATIONS ---"
    
    # Find next spec with incomplete tasks
    current_spec=""
    current_task=""
    
    for spec in "${SPECS[@]}"; do
        task=$(get_incomplete_tasks "$spec")
        if [ -n "$task" ]; then
            current_spec="$spec"
            current_task="$task"
            break
        fi
    done
    
    if [ -z "$current_spec" ]; then
        log "All specs complete! 🎉"
        break
    fi
    
    remaining=$(count_incomplete "$current_spec")
    log "Working on: $current_spec"
    log "Task: $current_task"
    log "Remaining in spec: $remaining"
    
    # Create and save prompt
    prompt=$(create_prompt "$current_spec" "$current_task")
    echo "$prompt" > "$PROJECT_ROOT/current-task.md"
    log "Prompt saved to: current-task.md"
    
    # For Claude Code CLI (if installed):
    # claude-code --prompt-file "$PROJECT_ROOT/current-task.md"
    
    log "Waiting $SLEEP_SECONDS seconds..."
    log "(Run agent manually or let it auto-continue)"
    sleep $SLEEP_SECONDS
    
    build_project || true
done

log "========================================"
log "Ralph Wiggum - Loop complete"
log "Total iterations: $iteration"
log "========================================"

# Summary
log ""
log "Remaining incomplete tasks:"
for spec in "${SPECS[@]}"; do
    count=$(count_incomplete "$spec")
    if [ "$count" -gt 0 ]; then
        log "  $spec: $count tasks"
    fi
done
