---
description: Safely remove a sibling git worktree (../<repo>.worktrees/<name>) and delete its branch
argument-hint: [worktree-name]
---

Safely remove a git worktree. Argument: `$ARGUMENTS` (`$1` = the worktree folder name, optional).

Worktrees live as siblings at `../<repo>.worktrees/<name>`.

Do this step by step:

1. **List worktrees** with `git worktree list` so you and the user can see what exists.
2. **Pick the target:**
    - Resolve `ROOT="$(git rev-parse --show-toplevel)"`, `NAME="$(basename "$ROOT")"`, `PARENT="$(dirname "$ROOT")"`; the container is `"$PARENT/$NAME.worktrees"`.
    - If `$1` is given, target `"$PARENT/$NAME.worktrees/$1"`.
    - If not, show the list and ask which one to remove. Never guess.
    - **Refuse to remove the main worktree** (the repo root `$ROOT`) — only ones under `<repo>.worktrees/`.
3. **If the session's current directory is inside the target worktree**, first `cd "$ROOT"` so you are not deleting the folder you are standing in.
4. **Check for work that would be lost:** run `git -C <target> status -s` and `git -C <target> log --oneline <base>..HEAD` (compare against the branch it was created from, or `dev`).
    - Clean and fully merged → `git worktree remove <target>`.
    - Uncommitted changes or unmerged commits → **summarise exactly what would be lost and ask the user to confirm** before `git worktree remove --force <target>`.
5. **Delete the branch:** `git branch -d <branch>`. If git refuses because it is unmerged, report it and ask before `git branch -D <branch>`.
6. **Tidy up:** `git worktree prune`.
7. **Confirm** the worktree and branch are gone (`git worktree list`, `git branch --list <branch>`) and report what was removed.

Be conservative: when anything is unmerged or uncommitted, stop and confirm rather than force-deleting.
