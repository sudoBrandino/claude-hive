#!/bin/bash
# Claude Hive - Quick Install Script
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/sudoBrandino/claude-hive/main/install.sh | bash
#
# Or download and run:
#   curl -O https://raw.githubusercontent.com/sudoBrandino/claude-hive/main/install.sh
#   chmod +x install.sh && ./install.sh

set -e

REPO="sudoBrandino/claude-hive"
HIVE_DIR="$HOME/.claude-hive"
COMPOSE_URL="https://raw.githubusercontent.com/$REPO/main/docker-compose.ghcr.yml"
HOOK_URL="https://raw.githubusercontent.com/$REPO/main/hooks/send-event.sh"

echo ""
echo "  Claude Hive - Quick Install"
echo ""

# Create directory
mkdir -p "$HIVE_DIR/hooks"
cd "$HIVE_DIR"

# Download files
echo "Downloading compose file..."
curl -fsSL "$COMPOSE_URL" -o docker-compose.yml

echo "Downloading hook script..."
curl -fsSL "$HOOK_URL" -o hooks/send-event.sh
chmod +x hooks/send-event.sh

# Start container
echo "Starting container..."
docker compose up -d

# Install hooks
echo "Installing hooks..."
CLAUDE_SETTINGS="$HOME/.claude/settings.json"
mkdir -p "$HOME/.claude"

HOOK_CMD="bash \"$HIVE_DIR/hooks/send-event.sh\""

# Backup existing settings
if [ -f "$CLAUDE_SETTINGS" ]; then
  cp "$CLAUDE_SETTINGS" "$CLAUDE_SETTINGS.bak"
fi

# Check if jq is available
if command -v jq &> /dev/null; then
  if [ -f "$CLAUDE_SETTINGS" ]; then
    # Update existing settings with jq
    jq --arg cmd "$HOOK_CMD" '
      .hooks.PostToolUse = [{"matcher": ".*", "hooks": [{"type": "command", "command": $cmd, "timeout": 5}]}] |
      .hooks.Notification = [{"matcher": ".*", "hooks": [{"type": "command", "command": $cmd, "timeout": 5}]}] |
      .hooks.Stop = [{"matcher": ".*", "hooks": [{"type": "command", "command": $cmd, "timeout": 5}]}]
    ' "$CLAUDE_SETTINGS" > "$CLAUDE_SETTINGS.tmp" && mv "$CLAUDE_SETTINGS.tmp" "$CLAUDE_SETTINGS"
  else
    # Create new settings
    jq -n --arg cmd "$HOOK_CMD" '{
      hooks: {
        PostToolUse: [{"matcher": ".*", "hooks": [{"type": "command", "command": $cmd, "timeout": 5}]}],
        Notification: [{"matcher": ".*", "hooks": [{"type": "command", "command": $cmd, "timeout": 5}]}],
        Stop: [{"matcher": ".*", "hooks": [{"type": "command", "command": $cmd, "timeout": 5}]}]
      }
    }' > "$CLAUDE_SETTINGS"
  fi
  echo "+ Hooks installed"
else
  echo "! jq not found - please install jq first"
  echo "  macOS: brew install jq"
  echo "  Linux: sudo apt install jq"
  echo ""
  echo "  Then re-run this script to complete hook installation."
fi

echo ""
echo "Done! Open http://localhost:4520"
echo ""
echo "Commands:"
echo "  cd $HIVE_DIR && docker compose logs -f   # View logs"
echo "  cd $HIVE_DIR && docker compose down      # Stop"
echo ""
