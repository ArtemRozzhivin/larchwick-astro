---
description: Create a git worktree as a sibling folder (../<repo>.worktrees/<branch>), copy env files, install deps, and open it in the editor
argument-hint: <branch-name> [base-branch]
---

Create and fully set up a new git worktree. Arguments: `$ARGUMENTS`

- `$1` = branch name for the new worktree (e.g. `feat/login`). Required — if missing, ask the user.
- `$2` = base branch to branch from. Optional — if omitted, use the **current** branch (HEAD).

Worktrees live **outside** the working tree as a sibling folder, so no tool (ESLint, Vitest, `tsc`, `next build`, IDE indexers) ever scans them.

Do this step by step, reporting what you run:

1. **Verify** you are in a git repository: `git rev-parse --is-inside-work-tree`. If not, stop and tell the user.
2. **Resolve paths:**
    - `ROOT="$(git rev-parse --show-toplevel)"`, `NAME="$(basename "$ROOT")"`, `PARENT="$(dirname "$ROOT")"`.
    - Derive a folder slug from `$1`: replace every `/` with `-` (so `feat/login` → `feat-login`).
    - Worktree path: `"$PARENT/$NAME.worktrees/<slug>"`. Create the container first: `mkdir -p "$PARENT/$NAME.worktrees"`.
    - If the target path already exists, stop and report.
3. **Create the worktree** on a new branch named exactly `$1`:
    - With a base: `git worktree add -b "$1" "$PARENT/$NAME.worktrees/<slug>" "$2"`
    - Without: `git worktree add -b "$1" "$PARENT/$NAME.worktrees/<slug>"` (branches from HEAD).
    - If the branch already exists, omit `-b` and check it out instead.
4. **Copy gitignored env files** from the repo root into the worktree if they exist: `.env`, `.env.local`, and any other real `.env.*` (skip `.env.example`, it is tracked). Use `cp`.
5. **Install dependencies** in the worktree, detecting the package manager by lockfile: `pnpm-lock.yaml` → `pnpm install`; `yarn.lock` → `yarn`; `bun.lockb` → `bun install`; otherwise `npm install`. Skip if there is no `package.json`.
6. **Open in the editor**, first match wins, and never fail the command over this step:
    - `$EDITOR_CMD` if the user set it, else `cursor` if on PATH, else `code` if on PATH.
    - If none is available, just print the absolute path so the user can open it manually.
7. **Report** the worktree path, the branch name, and the base it was created from. Mention that `git worktree list` shows every worktree.

Do NOT commit anything. Do NOT modify files on the base branch.
