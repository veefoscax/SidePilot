# Auto-commit DEVLOG and spec updates after task completion
# Usage: .\auto-commit-devlog.ps1 "S01" "test side panel opens" "3x estimate due to Vite path resolution"

param(
    [Parameter(Mandatory=$true)]
    [string]$SpecId,
    
    [Parameter(Mandatory=$true)]
    [string]$TaskDescription,
    
    [Parameter(Mandatory=$false)]
    [string]$TimeVarianceNote = ""
)

# Get current timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"

# Construct commit message
$commitMessage = "feat($SpecId): $TaskDescription"
if ($TimeVarianceNote -ne "") {
    $commitMessage += " - $TimeVarianceNote"
}

Write-Host "🚀 Auto-committing DEVLOG and spec updates..." -ForegroundColor Green
Write-Host "Spec: $SpecId" -ForegroundColor Cyan
Write-Host "Task: $TaskDescription" -ForegroundColor Cyan
Write-Host "Commit Message: $commitMessage" -ForegroundColor Yellow

# Add all changes
git add .

# Check if there are changes to commit
$status = git status --porcelain
if ($status) {
    Write-Host "📝 Changes detected, committing..." -ForegroundColor Green
    
    # Commit with detailed message
    git commit -m $commitMessage -m "Updated DEVLOG.md with:
- Detailed time tracking and variance analysis
- Comprehensive Kiro command usage statistics  
- Major struggles and debugging processes
- Critical issues with root cause analysis
- Testing infrastructure and verification steps
- Lessons learned for future development

Updated spec files (.kiro/specs/$SpecId/) with:
- Time tracking sections
- Lessons learned documentation
- Critical issue summaries

Timestamp: $timestamp"

    Write-Host "✅ Committed successfully!" -ForegroundColor Green
    
    # Check if this completes the spec
    $tasksFile = ".kiro/specs/$SpecId/tasks.md"
    if (Test-Path $tasksFile) {
        $tasksContent = Get-Content $tasksFile -Raw
        $incompleteTasks = ($tasksContent | Select-String -Pattern "- \[ \]" -AllMatches).Matches.Count
        
        if ($incompleteTasks -eq 0) {
            Write-Host "🎉 All tasks completed for $SpecId! Pushing to origin..." -ForegroundColor Magenta
            git push origin main
            Write-Host "✅ Pushed to origin!" -ForegroundColor Green
        } else {
            Write-Host "📋 $incompleteTasks tasks remaining in $SpecId" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "ℹ️ No changes to commit" -ForegroundColor Yellow
}

Write-Host "🏁 Auto-commit process complete!" -ForegroundColor Green