#!/bin/bash

# ShowMe Installation Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_SETTINGS_DIR="$HOME/.claude"
CLAUDE_SETTINGS_FILE="$CLAUDE_SETTINGS_DIR/settings.json"

echo "Installing ShowMe..."

# Check for Bun
if ! command -v bun &> /dev/null; then
    echo "Error: Bun is required. Install it from https://bun.sh"
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
cd "$SCRIPT_DIR"
bun install

# Build the UI
echo "Building UI..."
bun run build

# Create Claude settings directory if it doesn't exist
mkdir -p "$CLAUDE_SETTINGS_DIR"

# Create or update settings.json
if [ -f "$CLAUDE_SETTINGS_FILE" ]; then
    # Check if hooks already exist
    if grep -q '"hooks"' "$CLAUDE_SETTINGS_FILE"; then
        echo "Note: Claude settings already has hooks configured."
        echo "Please manually add the ShowMe hook to your settings.json"
        echo ""
        echo "Add this to your hooks configuration:"
        cat << EOF
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Skill",
        "hooks": [
          {
            "type": "command",
            "command": "bun run $SCRIPT_DIR/server/index.ts",
            "timeout": 300000
          }
        ]
      }
    ]
  }
}
EOF
    fi
else
    # Create new settings file
    cat > "$CLAUDE_SETTINGS_FILE" << EOF
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Skill",
        "hooks": [
          {
            "type": "command",
            "command": "bun run $SCRIPT_DIR/server/index.ts",
            "timeout": 300000
          }
        ]
      }
    ]
  }
}
EOF
    echo "Created Claude settings with ShowMe hook."
fi

# Create skill directory in Claude skills directory
SKILLS_DIR="$CLAUDE_SETTINGS_DIR/skills/showme"
mkdir -p "$SKILLS_DIR"

# Copy skill file as SKILL.md (Claude Code convention)
cp "$SCRIPT_DIR/skills/showme.md" "$SKILLS_DIR/SKILL.md"

# Update the server path in SKILL.md to use absolute path
sed -i "s|bun run .*/server/index.ts|bun run $SCRIPT_DIR/server/index.ts|g" "$SKILLS_DIR/SKILL.md"

echo "Installed /showme skill to $SKILLS_DIR/SKILL.md"

echo ""
echo "ShowMe installed successfully!"
echo ""
echo "Usage: Type /showme in Claude Code to open the visual canvas."
