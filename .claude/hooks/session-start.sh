#!/bin/sh
# UserPromptSubmit hook: on the first prompt of each hour, inject a short
# orientation block (recent work log + commits) and validate that the stack
# declared in CLAUDE.md <identity> actually matches package.json.

PROJ="${CLAUDE_PROJECT_DIR:-.}"
CLAUDE_MD="$PROJ/CLAUDE.md"
WORKLOG="$PROJ/.claude/docs/WORKLOG.md"

HASH=$(printf '%s' "$PROJ" | md5 2>/dev/null || printf '%s' "$PROJ" | md5sum | cut -d' ' -f1)
MARKER_FILE="/tmp/claude-$(printf '%s' "$HASH" | cut -c1-8)-$(date +%Y%m%d%H).marker"

[ -f "$MARKER_FILE" ] && exit 0
touch "$MARKER_FILE"

echo '=== SESSION START ==='

echo 'Last work-log entries:'
tail -5 "$WORKLOG" 2>/dev/null || echo '(empty)'

echo 'Recent commits:'
git -C "$PROJ" log --oneline -n 10 2>/dev/null || echo '(no git history)'

MARKER=$(sed -n 's/^<stack_check>\([^<]*\)<\/stack_check>.*/\1/p' "$CLAUDE_MD" 2>/dev/null | tr -d '[:space:]')
[ "$MARKER" = "pending" ] || exit 0

echo '--- Stack check (marker: pending) ---'

PKGS=$(sed -n 's/^packages=//p' "$CLAUDE_MD" 2>/dev/null | cut -d'<' -f1 | tr -d '[:space:]')

if [ -z "$PKGS" ]; then
  echo 'WARNING: packages= field missing in <identity>. Add it or remove the <stack_check> marker.'
  exit 0
fi

if ! command -v jq >/dev/null 2>&1; then
  echo 'WARNING: jq is not installed, cannot verify packages against package.json.'
  exit 0
fi

OUT=$(printf '%s\n' "$PKGS" | tr ',' '\n' | while IFS= read -r P; do
  [ -z "$P" ] && continue
  V=$(jq -r --arg p "$P" '(.dependencies[$p] // .devDependencies[$p]) // empty' "$PROJ/package.json" 2>/dev/null)
  if [ -z "$V" ]; then
    echo "  MISSING: $P"
  else
    echo "  ok $P: $V"
  fi
done)

echo "$OUT"

if echo "$OUT" | grep -q 'MISSING'; then
  echo 'ACTION: reconcile with the user, then flip <stack_check> to verified'
else
  echo 'ACTION: flip <stack_check>pending</stack_check> to <stack_check>verified</stack_check> in CLAUDE.md'
fi
