<commands>
dev=npm run dev
build=npm run build
preview=npm run preview
preview_deploy=npm run preview:deploy
                             build as a preview of the current branch (WORKERS_CI_BRANCH set,
                             so noindex) and run npx wrangler preview; refuses on main
test=npm test                node --test: the Worker handlers, the redirect rules and the
                             pure helpers in src/lib (worker/**/*.test.ts, src/**/*.test.ts)
check=npm run check          astro check — types + .astro templates
lint=npm run lint
lint_fix=npm run lint:fix
format=npm run format
format_check=npm run format:check
verify=npm run verify        check + lint + format:check + npm test
credits=npm run credits      rebuild CREDITS.md
seo_crawl=npm run seo:crawl  crawl the WordPress "before" site
rebuild_watch=npm run rebuild:watch
                             measure publish → live time against production
                             (docs/after/rebuild-times.json)
studio=npm run studio        Sanity Studio on http://localhost:3333 (studio/ has its own
                             package.json: npm install --prefix studio once)
studio_typegen=npm run studio:typegen
                             schema extract + typegen → src/lib/sanity/sanity.types.ts
import_wp=npm run import:wp     WordPress → Sanity, dry run by default; -- --write to apply
                             (scripts/ has its own package.json: npm install --prefix scripts once;
                             tests: npm --prefix scripts test; npm --prefix scripts run check
                             type-checks import-wp/ and shared/)
lighthouse_run=npm run lighthouse:run
                             the paired Lighthouse session; set CHROME_PATH (Chrome, Chromium or
                             Brave) unless Brave is at its macOS default path
lighthouse_import=npm run lighthouse:import
                             file saved Lighthouse JSON reports into docs/

Node >= 22.18 (package.json engines); .node-version pins 24 for CI and the
Cloudflare build.

Serve the built site the way Cloudflare does: npm run build && npx wrangler dev
(npx downloads wrangler; it is not a dependency). Deploys are not run by hand: Workers Builds
deploys main on every push and uploads a preview version for other branches. If a preview
must be uploaded by hand, use npm run preview:deploy: a plain local build has no
WORKERS_CI_BRANCH and would be built as production (indexable).

Tests: npm test (Node's built-in runner, no Vitest at the root) and, for the importer,
npm --prefix scripts test (Vitest). CI runs both, plus check, lint, format:check and the
build. Verification is astro check + lint + format + the tests + a successful build.
</commands>

<git_hooks>
pre_commit=lint-staged (eslint --fix + prettier) then npm run check
commit_msg=commitlint, @commitlint/config-conventional
pre_push=blocks direct push to main, then format:check + lint + check + npm test + build

Managed by husky (npm run prepare on install). Do not write hooks into .git/hooks
by hand — .husky/ is the source of truth.
Do not bypass a failing hook. --no-verify is for a WIP commit on your own branch.
</git_hooks>

<commit_style>
Conventional Commits, enforced by commitlint:

feat: add pricing page
fix: give the mobile menu an accessible name
chore: update dependencies
refactor: build Features on the Section primitive

Subject line only. No body unless the user asks.
Never add Co-Authored-By or any AI attribution, in commit messages or in PR
descriptions.
</commit_style>

<branch_names>
feat/<slug>     new section, page, or capability
fix/<slug>      bug fix
refactor/<slug> restructure without behaviour change
chore/<slug>    tooling and config

Branch off dev. Base branch for PRs is dev, not main. main only receives merges
from dev (releases). Direct pushes to main are blocked by pre-push.
</branch_names>

<pr_workflow>
Never push and never open a PR on your own initiative. It requires the user's
explicit instruction, given fresh for that specific task. Permission from a
previous task does not carry over.

PRs target dev. main only receives merges from dev.

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
The project has no agents of its own. Reviews use the review team, a user-level
skill outside this repo: /review-team dev reviews the diff against dev before a
PR; /review-team --all reviews the whole project.
</agents>

<skills>
landing — how to build a page fast here: the blocks, the content-first workflow,
the section contract, SEO, and the zero-JS patterns.
backlog — write CRM-format tasks, requirements, and acceptance criteria.
</skills>
