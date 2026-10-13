<documentation_update>
Docs are updated in the SAME task as the code, before the task is called complete.
Every path below is real — verify it exists before writing to it.

Three files, three audiences:

.claude/docs/WORKLOG.md      Claude's engineering log. Technical detail welcome.
docs/internal/PROJECT.md     Living map: pages, status, what is still placeholder.
docs/pages/<page>.md         One per route. Read by PM, QA, and clients.

A Stop hook (.claude/hooks/check-docs-sync.sh) blocks the turn when something
under src/pages/, src/components/sections/, or src/lib/content/ changed without
these being touched in the same working-tree diff. It reminds once, then lets the
turn end — so if a change genuinely needs no doc update (a pure refactor), say so
in one line rather than inventing an entry. Never write a fake entry to silence it.
</documentation_update>

<worklog>
file=.claude/docs/WORKLOG.md

Claude's private engineering log — kept in .claude/ on purpose.

Update on every task with a real behaviour change. Skip pure chores and refactors
with no user-visible effect.

Newest date section on top, one per day.

## YYYY-MM-DD

- [Feat]: description
- [Fix]: description
- [Refactor]: description
- [Chore]: description
- [Docs]: description

1-3 sentences per bullet. Technical detail belongs here: file paths, what was
rejected and why, what was NOT verified, and — for this template especially —
what a change cost in shipped kB.

Append only; never rewrite an existing entry.
</worklog>

<project_doc>
file=docs/internal/PROJECT.md

Open and review it EVERY task, even when nothing needs to change. Update in place;
it is a living map, not a log.

Sections:

## What is this
1-2 sentences: what the site is and who it is for.

## Pages

| Route | Page doc | Status | Notes |
| ----- | -------- | ------ | ----- |

Status: real (final copy and assets) | partial | placeholder (template content).

## Still placeholder
- what still has to be replaced before launch: site URL, OG image, favicon,
  pages not built yet, analytics.

Update when a route is added or removed, or when a page moves off placeholder
content.
</project_doc>

<pages_doc>
file=docs/pages/<page>.md

One file per page that has its own route. The filename matches the route:
src/pages/index.astro → docs/pages/home.md, src/pages/pricing.astro →
docs/pages/pricing.md. The Stop hook relies on that mapping.

docs/pages/README.md is the index — add or update its row in the same task that a
page doc is added, removed, or renamed.

No jargon anywhere in the file. It is read by PMs, QA, and clients. No file paths,
no component names, no framework terms. Say what a visitor sees and can do.

Template:

---
route: /path
status: placeholder | partial | real
---

# Page Title

## Purpose
[1-2 sentences: what this page is for and who it targets]

## Sections, in order
1. [Section name] — [what it says / does]

## Key interactions
- [what a visitor can click, and what happens]

## Content owner
[who supplies the final copy and assets, or "—"]

## Known limitations
- [placeholder copy, missing assets, anything not wired yet]
</pages_doc>

<engineering_docs>
Not part of task_completion, but keep them true when they go stale:

docs/STRUCTURE.md   folders, the page/section/content split, where things go
README.md           quick start, stack, scripts, quality gates
</engineering_docs>

<stack_check>
CLAUDE.md carries an <identity> block with a packages= list and a <stack_check>
marker. The session-start hook validates that list against package.json.

Whenever a dependency is added or removed in a way that changes the declared
stack, update packages= in the same task.
</stack_check>
