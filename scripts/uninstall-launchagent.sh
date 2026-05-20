#!/usr/bin/env bash
set -euo pipefail

LABEL="com.codex.desktop-model-switcher"
PLIST_PATH="$HOME/Library/LaunchAgents/$LABEL.plist"
uid="$(id -u)"

launchctl bootout "gui/$uid" "$PLIST_PATH" >/dev/null 2>&1 || true
rm -f "$PLIST_PATH"

echo "Stopped and removed launchd service: $LABEL"
