# Git Helper for Spec Implementation
# Usage: .\git-helper.ps1 -SpecId "S01" -TaskDescription "Setup Vite configuration"

param(
    [Parameter(Mandatory=$true)]
    [string]$SpecId,
    
    [Parameter(Mandatory=$true)]
    [string]$TaskDescription,
    
    [switch]$Push = $false
)

# Create commit message in conventional format
$CommitMessage = "feat($SpecId): $TaskDescription"

Write-Host "🔄 Adding all changes to git..."
git add .

Write-Host "📝 Committing with message: $CommitMessage"
try {
    git commit -m $CommitMessage
    Write-Host "✅ Commit successful!"
    
    if ($Push) {
        Write-Host "🚀 Pushing to origin..."
        git push origin main
        Write-Host "✅ Push successful!"
    }
} catch {
    Write-Host "❌ Git operation failed: $_"
    exit 1
}

Write-Host "✨ Git operations completed successfully!"