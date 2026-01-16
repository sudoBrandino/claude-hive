# Claude Hive - Quick Install Script for Windows
#
# Usage (PowerShell):
#   irm https://raw.githubusercontent.com/YOUR_USERNAME/claude-hive/main/install.ps1 | iex
#
# Or download and run:
#   Invoke-WebRequest -Uri https://raw.githubusercontent.com/YOUR_USERNAME/claude-hive/main/install.ps1 -OutFile install.ps1
#   .\install.ps1

$ErrorActionPreference = "Stop"

$Repo = "YOUR_USERNAME/claude-hive"
$HiveDir = "$env:USERPROFILE\.claude-hive"
$ComposeUrl = "https://raw.githubusercontent.com/$Repo/main/docker-compose.ghcr.yml"
$HookUrl = "https://raw.githubusercontent.com/$Repo/main/hooks/send-event.ps1"

Write-Host ""
Write-Host "  Claude Hive - Quick Install" -ForegroundColor Cyan
Write-Host ""

# Create directory
New-Item -ItemType Directory -Force -Path "$HiveDir\hooks" | Out-Null
Set-Location $HiveDir

# Download files
Write-Host "Downloading compose file..."
Invoke-WebRequest -Uri $ComposeUrl -OutFile docker-compose.yml
(Get-Content docker-compose.yml) -replace 'YOUR_USERNAME', ($Repo -split '/')[0] | Set-Content docker-compose.yml

Write-Host "Downloading hook script..."
Invoke-WebRequest -Uri $HookUrl -OutFile hooks\send-event.ps1

# Start container
Write-Host "Starting container..."
docker compose up -d

# Install hooks
Write-Host "Installing hooks..."
$ClaudeSettingsDir = "$env:USERPROFILE\.claude"
$ClaudeSettings = "$ClaudeSettingsDir\settings.json"
New-Item -ItemType Directory -Force -Path $ClaudeSettingsDir | Out-Null

$HookCmd = "powershell -ExecutionPolicy Bypass -File `"$HiveDir\hooks\send-event.ps1`""

$HookConfig = @{
    matcher = ".*"
    hooks = @(
        @{
            type = "command"
            command = $HookCmd
            timeout = 5
        }
    )
}

if (Test-Path $ClaudeSettings) {
    # Update existing settings
    $settings = Get-Content $ClaudeSettings | ConvertFrom-Json
    if (-not $settings.hooks) {
        $settings | Add-Member -NotePropertyName "hooks" -NotePropertyValue @{} -Force
    }
} else {
    # Create new settings
    $settings = @{ hooks = @{} }
}

$settings.hooks.PostToolUse = @($HookConfig)
$settings.hooks.Notification = @($HookConfig)
$settings.hooks.Stop = @($HookConfig)

$settings | ConvertTo-Json -Depth 10 | Set-Content $ClaudeSettings
Write-Host "+ Hooks installed" -ForegroundColor Green

Write-Host ""
Write-Host "Done! Open http://localhost:4520" -ForegroundColor Green
Write-Host ""
Write-Host "Commands:"
Write-Host "  docker compose -f $HiveDir\docker-compose.yml logs -f  # View logs"
Write-Host "  docker compose -f $HiveDir\docker-compose.yml down     # Stop"
Write-Host ""
