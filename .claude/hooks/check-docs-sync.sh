#!/bin/bash
# Stop hook: blocks Claude from ending its turn if page/section code changed
# without the matching docs (.claude/docs/WORKLOG.md, docs/internal/PROJECT.md,
# docs/pages/<page>.md) also being part of the same
# working-tree diff. See CLAUDE.md <task_completion> and
# .claude/docs/claude/documentation.md for what belongs in each file.
#
# Limitation: inspects the UNCOMMITTED working tree only (git status --porcelain).
# If Claude committed the change before stopping, this check no longer sees it.
#
# Loop guard: reminds AT MOST ONCE per stop-sequence. The Stop payload carries
# `stop_hook_active: true` once Claude is already continuing because this hook
# blocked. On that second stop we let the turn end instead of blocking again —
# otherwise a legitimate no-doc-needed change (e.g. a pure refactor, which cannot
# be made to satisfy a git-diff check) would loop forever.

set -u
cd "${CLAUDE_PROJECT_DIR:-.}" || { echo '{"continue": true}'; exit 0; }

INPUT=$(cat 2>/dev/null || true)
STOP_ACTIVE=$(printf '%s' "$INPUT" | jq -r '.stop_hook_active // false' 2>/dev/null || echo false)
if [ "$STOP_ACTIVE" = "true" ]; then
  echo '{"continue": true}'
  exit 0
fi

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo '{"continue": true}'
  exit 0
fi

CHANGED=$(git status --porcelain --untracked-files=all 2>/dev/null | cut -c4-)

PAGE_CHANGED=$(printf '%s\n' "$CHANGED" | grep -E '^src/pages/.*\.astro$' || true)
SECTION_CHANGED=$(printf '%s\n' "$CHANGED" | grep -E '^src/components/sections/' || true)
CONTENT_CHANGED=$(printf '%s\n' "$CHANGED" | grep -E '^src/lib/content/' || true)

if [ -z "$PAGE_CHANGED" ] && [ -z "$SECTION_CHANGED" ] && [ -z "$CONTENT_CHANGED" ]; then
  echo '{"continue": true}'
  exit 0
fi

ISSUES=()

if ! printf '%s\n' "$CHANGED" | grep -qE '^\.claude/docs/WORKLOG\.md$'; then
  ISSUES+=(".claude/docs/WORKLOG.md was not updated — every task needs a dated work-log entry (see <task_completion> in CLAUDE.md)")
fi

if ! printf '%s\n' "$CHANGED" | grep -qE '^docs/internal/PROJECT\.md$'; then
  ISSUES+=("docs/internal/PROJECT.md was not reviewed/updated — check the Pages table (see <task_completion> in CLAUDE.md)")
fi

PAGES=$(printf '%s\n' "$PAGE_CHANGED" | sed -E 's#^src/pages/(.*)\.astro$#\1#' | sed -E 's#/index$##' | sort -u)
for p in $PAGES; do
  NAME="$p"
  [ "$NAME" = "index" ] && NAME="home"
  DOC="docs/pages/$NAME.md"
  if [ -f "$DOC" ] && ! printf '%s\n' "$CHANGED" | grep -qF "$DOC"; then
    ISSUES+=("page '$NAME' changed but $DOC was not updated (see <pages_doc> in documentation.md)")
  fi
done

if [ "${#ISSUES[@]}" -eq 0 ]; then
  echo '{"continue": true}'
  exit 0
fi

REASON="Docs are out of sync with this task's code changes:"
for issue in "${ISSUES[@]}"; do
  REASON="$REASON
- $issue"
done
REASON="$REASON

Update these now, without asking the user, then finish. If a change genuinely needs no doc update (e.g. pure refactor with no behavior/UI change), say so briefly instead of silently skipping it."

jq -n --arg reason "$REASON" '{"decision": "block", "reason": $reason}'
