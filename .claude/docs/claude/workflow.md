<commands>
dev=npm run dev
build=npm run build
preview=npm run preview
check=npm run check          astro check — types + .astro templates
lint=npm run lint
lint_fix=npm run lint:fix
format=npm run format
format_check=npm run format:check
verify=npm run verify        check + lint + format:check

docker_dev=npm run docker:dev
docker_build=npm run docker:build

There is no test runner in this template. Verification is astro check + lint +
format + a successful build.
</commands>

<git_hooks>
pre_commit=lint-staged (eslint --fix + prettier) then npm run check
commit_msg=commitlint, @commitlint/config-conventional
pre_push=blocks direct push to main, then format:check + lint + check + build

Managed by husky (npm run prepare on install). Do not write hooks into .git/hooks
by hand — .husky/ is the source of truth.
Do not bypass a failing hook. --no-verify is for a WIP commit on your own branch.
</git_hooks>

<commit_style>
Conventional Commits, enforced by commitlint:

feat: add pricing page
fix: give the mobile menu an accessible name
chore: bump astro to 5.3
refactor: build Features on the Section primitive

Subject line only. No body unless the user asks.
Never add Co-Authored-By or any AI attribution.
</commit_style>

<branch_names>
feat/<slug>     new section, page, or capability
fix/<slug>      bug fix
refactor/<slug> restructure without behaviour change
chore/<slug>    tooling and config

Direct pushes to main are blocked by pre-push. Base branch for PRs is main.
</branch_names>

<pr_workflow>
Never push and never open a PR on your own initiative. It requires the user's
explicit instruction, given fresh for that specific task. Permission from a
previous task does not carry over.

After finishing a task:
1. List every file created or modified, path only, one per line.
2. Ask: "Shall I create a PR?" and wait before git push or gh pr create.
</pr_workflow>

<session_start>
The UserPromptSubmit hook (.claude/hooks/session-start.sh) injects a SESSION START
block on the first prompt of each hour: recent .claude/docs/WORKLOG.md entries,
recent commits, and a stack check when <stack_check> in CLAUDE.md is pending.

When you see it:
1. Compare recent commits against the last work-log entries.
2. Undocumented commits → list them and ask the user before writing code.
3. Work log up to date → proceed silently.
</session_start>

<stop_hook>
.claude/hooks/check-docs-sync.sh runs on Stop. When something under src/pages/,
src/components/sections/, or src/lib/content/ changed, it blocks the turn unless
the same working-tree diff also touches .claude/docs/WORKLOG.md,
docs/internal/PROJECT.md, and docs/pages/<page>.md.

It reminds AT MOST ONCE per stop-sequence, then lets the turn end. When a change
genuinely needs no doc update (a pure refactor), say so in one line and finish.
Never write a filler entry just to satisfy the diff check.

Caveat: it inspects the uncommitted working tree only.
</stop_hook>

<agents>
code-sentinel — review a diff before merge: shipped JavaScript, duplicated
sections, accessibility, SEO, types, conventions. Run it after finishing a page
or section, before asking about a PR.
</agents>

<skills>
landing — how to build a page fast here: the blocks, the content-first workflow,
the section contract, SEO, and the zero-JS patterns.
backlog — write CRM-format tasks, requirements, and acceptance criteria.
</skills>
