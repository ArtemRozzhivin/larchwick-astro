#!/bin/sh
# PostToolUse hook: run Prettier on the file Claude just wrote, so
# `npm run format:check` (pre-push + CI) never fails on formatting alone.

PROJ="${CLAUDE_PROJECT_DIR:-.}"

command -v jq >/dev/null 2>&1 || exit 0

FILE=$(jq -r '.tool_input.file_path // empty')
[ -z "$FILE" ] && exit 0
[ -f "$FILE" ] || exit 0

case "$FILE" in
  *.astro | *.ts | *.tsx | *.js | *.jsx | *.mjs | *.json | *.css | *.md | *.yml | *.yaml) ;;
  *) exit 0 ;;
esac

[ -d "$PROJ/node_modules/prettier" ] || exit 0

npx --no -- prettier --write --ignore-unknown "$FILE" >/dev/null 2>&1

exit 0
