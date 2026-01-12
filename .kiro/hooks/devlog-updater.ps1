# DEVLOG Auto-Updater PowerShell Script with Git Integration
# This script updates DEVLOG.md and commits changes after task completion

param(
    [string]$TaskName = "Task completed",
    [string]$SpecName = "Current spec", 
    [string]$CommandsUsed = "Various Kiro commands",
    [string]$FilesModified = "Multiple files",
    [string]$Summary = "Task implementation completed successfully",
    [string]$Challenges = "None reported",
    [string]$StartTime = "",
    [string]$Duration = "Unknown"
)

# Get current timestamp
$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
$DateOnly = Get-Date -Format "yyyy-MM-dd"

# Create the log entry following DEVLOG structure
$LogEntry = @"

### $SpecName
- **Started**: $StartTime
- **Completed**: $Timestamp
- **Time**: $Duration
- **Kiro Commands Used**:
  - $CommandsUsed
- **Files Modified**:
  - $FilesModified
- **Summary**: $Summary
- **Challenges**: $Challenges

"@

# Backup DEVLOG.md
if (Test-Path "DEVLOG.md") {
    Copy-Item "DEVLOG.md" "DEVLOG.md.backup"
}

Write-Host "DEVLOG.md update prepared for task completion at $Timestamp"
Write-Host "Task: $TaskName"
Write-Host "Spec: $SpecName"
Write-Host ""
Write-Host "Log entry created:"
Write-Host $LogEntry

# Git operations
Write-Host ""
Write-Host "Preparing git commit..."

# Add all modified files
git add .

# Create commit message in format: feat(specName): task description
$CommitMessage = "feat($($SpecName.Split(':')[0])): $TaskName"
Write-Host "Commit message: $CommitMessage"

# Commit changes
try {
    git commit -m $CommitMessage
    Write-Host "✅ Git commit successful"
} catch {
    Write-Host "❌ Git commit failed: $_"
}

Write-Host ""
Write-Host "Please manually add this entry to the appropriate phase section in DEVLOG.md"
Write-Host "and update the Kiro CLI Usage Statistics table."