# Claude Hive - Hook Script for Windows (PowerShell)
#
# This script captures Claude Code events and forwards them to the Hive server.
# No additional dependencies required - uses built-in PowerShell cmdlets.
#
# Usage: Configured automatically via `claude-hive setup --docker`

$ErrorActionPreference = "SilentlyContinue"

$HiveUrl = if ($env:CLAUDE_HIVE_URL) { $env:CLAUDE_HIVE_URL } else { "http://localhost:4520" }

# Read JSON from stdin
$input = [Console]::In.ReadToEnd()

if ([string]::IsNullOrWhiteSpace($input)) {
    exit 0
}

try {
    # Parse and augment the JSON
    $event = $input | ConvertFrom-Json
    $event | Add-Member -NotePropertyName "timestamp" -NotePropertyValue (Get-Date -Format "o") -Force
    $event | Add-Member -NotePropertyName "project_dir" -NotePropertyValue (if ($env:CLAUDE_PROJECT_DIR) { $env:CLAUDE_PROJECT_DIR } else { Get-Location }) -Force

    $body = $event | ConvertTo-Json -Depth 10 -Compress

    # Send to Hive server (async via job to not block Claude Code)
    Start-Job -ScriptBlock {
        param($url, $body)
        try {
            Invoke-RestMethod -Uri "$url/events" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 2 | Out-Null
        } catch {}
    } -ArgumentList $HiveUrl, $body | Out-Null

} catch {
    # Silently fail - don't block Claude Code
}

exit 0
