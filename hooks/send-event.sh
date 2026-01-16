#!/bin/bash
# Claude Hive - Lightweight Hook Script
#
# This script captures Claude Code events and forwards them to the Hive server.
# Uses curl (available on most systems) - no Node.js required on host.
#
# Usage: Configured automatically via `claude-hive setup --docker`

HIVE_URL="${CLAUDE_HIVE_URL:-http://localhost:4520}"

# Read JSON from stdin
INPUT=$(cat)

# Skip if empty
[ -z "$INPUT" ] && exit 0

# Add timestamp and project dir
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Merge additional fields into JSON
PAYLOAD=$(echo "$INPUT" | jq -c --arg ts "$TIMESTAMP" --arg pd "$PROJECT_DIR" '. + {timestamp: $ts, project_dir: $pd}' 2>/dev/null || echo "$INPUT")

# Send to Hive server (async, don't block Claude Code)
curl -s -X POST "${HIVE_URL}/events" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  --connect-timeout 1 \
  --max-time 2 \
  >/dev/null 2>&1 &

exit 0
