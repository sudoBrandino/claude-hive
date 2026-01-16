#!/bin/bash
# Claude Hive - Quick Install Script
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/claude-hive/main/install.sh | bash
#
# Or download and run:
#   curl -O https://raw.githubusercontent.com/YOUR_USERNAME/claude-hive/main/install.sh
#   chmod +x install.sh && ./install.sh

set -e

REPO="YOUR_USERNAME/claude-hive"
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
sed -i.bak "s|YOUR_USERNAME|${REPO%/*}|g" docker-compose.yml 2>/dev/null || \
  sed -i '' "s|YOUR_USERNAME|${REPO%/*}|g" docker-compose.yml
rm -f docker-compose.yml.bak

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

# Create or update settings
if [ -f "$CLAUDE_SETTINGS" ]; then
  # Backup existing settings
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
    echo "{\"hooks\":{\"PostToolUse\":[{\"matcher\":\".*\",\"hooks\":[{\"type\":\"command\",\"command\":\"$HOOK_CMD\",\"timeout\":5}]}],\"Notification\":[{\"matcher\":\".*\",\"hooks\":[{\"type\":\"command\",\"command\":\"$HOOK_CMD\",\"timeout\":5}]}],\"Stop\":[{\"matcher\":\".*\",\"hooks\":[{\"type\":\"command\",\"command\":\"$HOOK_CMD\",\"timeout\":5}]}]}}" | jq '.' > "$CLAUDE_SETTINGS"
  fi
  echo "+ Hooks installed"
else
  echo "! jq not found - please install hooks manually"
  echo "  Run: brew install jq && ./install.sh"
fi

echo ""
echo "Done! Open http://localhost:4520"
echo ""
echo "Commands:"
echo "  docker compose -f $HIVE_DIR/docker-compose.yml logs -f  # View logs"
echo "  docker compose -f $HIVE_DIR/docker-compose.yml down     # Stop"
echo ""
