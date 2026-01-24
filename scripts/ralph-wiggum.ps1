# Ralph Wiggum - Autonomous AI Coding Loop
# For SidePilot specs S05-S15 completion
# 
# Usage: ./scripts/ralph-wiggum.ps1
# Stop: Ctrl+C

param(
    [int]$MaxIterations = 50,
    [int]$SleepSeconds = 10,
    [string]$Agent = "claude"  # claude, cursor, aider
)

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$SpecsPath = "$ProjectRoot\.kiro\specs"
$LogFile = "$ProjectRoot\ralph-wiggum.log"

# Specs to complete (priority order - ALL specs)
$Specs = @(
    "S01-extension-scaffold",
    "S02-provider-factory",
    "S03-provider-settings",
    "S04-chat-interface",
    "S05-cdp-wrapper",
    "S06-permissions",
    "S07-browser-tools",
    "S08-shortcuts",
    "S09-workflow-recording",
    "S10-tab-groups",
    "S11-network-console",
    "S12-notifications",
    "S13-mcp-integration",
    "S14-mcp-connector",
    "S15-model-capabilities",
    "S16-general-settings",
    "S17-voice-mode",
    "S18-context-optimization",
    "S19-screen-pointer"
)

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    Write-Host $logMessage
    Add-Content -Path $LogFile -Value $logMessage
}

function Get-IncompleteTasks {
    param([string]$SpecName)
    
    $tasksFile = "$SpecsPath\$SpecName\tasks.md"
    if (-not (Test-Path $tasksFile)) {
        return @()
    }
    
    $content = Get-Content $tasksFile -Raw
    $incomplete = [regex]::Matches($content, '- \[ \] (.+)')
    return $incomplete | ForEach-Object { $_.Groups[1].Value }
}

function Get-NextSpec {
    foreach ($spec in $Specs) {
        $tasks = Get-IncompleteTasks -SpecName $spec
        if ($tasks.Count -gt 0) {
            return @{
                Name = $spec
                Tasks = $tasks
                NextTask = $tasks[0]
            }
        }
    }
    return $null
}

function Build-Project {
    Write-Log "Building project..."
    Push-Location $ProjectRoot
    $result = npm run build 2>&1
    $exitCode = $LASTEXITCODE
    Pop-Location
    
    if ($exitCode -eq 0) {
        Write-Log "Build SUCCESS"
        return $true
    } else {
        Write-Log "Build FAILED: $result"
        return $false
    }
}

function Create-Prompt {
    param([hashtable]$Spec)
    
    $prompt = @"
# Task: Complete $($Spec.Name)

You are working on SidePilot, a Chrome extension for AI browser automation.

## Current Spec: $($Spec.Name)

Read the spec files:
- .kiro/specs/$($Spec.Name)/requirements.md
- .kiro/specs/$($Spec.Name)/design.md  
- .kiro/specs/$($Spec.Name)/tasks.md

## Next Incomplete Task:
$($Spec.NextTask)

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
"@
    
    return $prompt
}

function Invoke-Agent {
    param([string]$Prompt)
    
    switch ($Agent) {
        "claude" {
            # For Claude Code CLI
            Write-Log "Invoking Claude Code..."
            $promptFile = "$env:TEMP\ralph-prompt.md"
            $Prompt | Out-File -FilePath $promptFile -Encoding UTF8
            # claude-code --prompt-file $promptFile
            Write-Log "Prompt saved to: $promptFile"
            Write-Log "Run manually: claude-code --prompt-file $promptFile"
        }
        "cursor" {
            Write-Log "For Cursor: Open the prompt file and paste"
        }
        "aider" {
            Write-Log "Invoking Aider..."
            # aider --message $Prompt
        }
        default {
            Write-Log "Unknown agent: $Agent"
        }
    }
}

# Main Loop
Write-Log "========================================"
Write-Log "Ralph Wiggum - Starting autonomous loop"
Write-Log "Project: $ProjectRoot"
Write-Log "Max iterations: $MaxIterations"
Write-Log "Agent: $Agent"
Write-Log "========================================"

# Initial build check
if (-not (Build-Project)) {
    Write-Log "Initial build failed. Fix errors first."
}

$iteration = 0
while ($iteration -lt $MaxIterations) {
    $iteration++
    Write-Log "--- Iteration $iteration of $MaxIterations ---"
    
    # Find next incomplete spec/task
    $nextSpec = Get-NextSpec
    
    if ($null -eq $nextSpec) {
        Write-Log "All specs complete! 🎉"
        break
    }
    
    Write-Log "Working on: $($nextSpec.Name)"
    Write-Log "Task: $($nextSpec.NextTask)"
    Write-Log "Remaining tasks in spec: $($nextSpec.Tasks.Count)"
    
    # Create prompt
    $prompt = Create-Prompt -Spec $nextSpec
    
    # Save prompt for manual use
    $promptFile = "$ProjectRoot\current-task.md"
    $prompt | Out-File -FilePath $promptFile -Encoding UTF8
    Write-Log "Prompt saved to: $promptFile"
    
    # Invoke agent (or wait for manual execution)
    Invoke-Agent -Prompt $prompt
    
    Write-Log "Waiting $SleepSeconds seconds before next iteration..."
    Write-Log "(Use this time to run the agent manually if needed)"
    Start-Sleep -Seconds $SleepSeconds
    
    # Check build after each iteration
    Build-Project | Out-Null
}

Write-Log "========================================"
Write-Log "Ralph Wiggum - Loop complete"
Write-Log "Total iterations: $iteration"
Write-Log "========================================"

# Summary
Write-Log "`nRemaining incomplete tasks:"
foreach ($spec in $Specs) {
    $tasks = Get-IncompleteTasks -SpecName $spec
    if ($tasks.Count -gt 0) {
        Write-Log "  $spec`: $($tasks.Count) tasks"
    }
}
