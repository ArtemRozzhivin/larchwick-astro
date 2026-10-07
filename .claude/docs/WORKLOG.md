# Work Log

Claude's private engineering log. Technical detail belongs here — file paths, what
was rejected and why, what a change cost in shipped kB. Newest date on top.

## 2026-08-07

- [Feat]: landing toolkit added — `Section.astro` (container, vertical rhythm, eyebrow/title/subtitle header) plus `Header`, `Hero`, `Logos`, `Features`, `Testimonials`, `FAQ`, `CTA`, `Footer` in `src/components/sections/`. Every block takes its copy as props and ships zero JavaScript: the FAQ accordion and the mobile menu are both `<details>`/`<summary>` with `group-open:` styling, and `Icon.astro` renders `lucide-react` server-side with no `client:` directive, emitting inline SVG. `src/pages/index.astro` is now a Layout plus six spread props, with all copy in `src/lib/content/home.ts`.

- [Fix]: `site` was commented out in the Astro config, so `@astrojs/sitemap` could not emit a sitemap and every canonical/OG URL depended on `siteConfig.url` separately. Both configs are now `.ts` (`astro.config.ts`, `astro.config.docker.ts`) and import `siteConfig`, so the URL lives in one place. `sitemap-index.xml` is generated on build again, and `src/pages/robots.txt.ts` derives the sitemap URL from the same source. `output: 'static'` is now explicit.

- [Feat]: `Layout.astro` gained Organization JSON-LD, a keywords meta tag, and it now renders `Header`/`Footer` by default (`showHeader`/`showFooter` to opt out — the 404 does, to keep its full-screen design). `ClientRouter` became conditional behind a `viewTransitions` prop: it is ~4.5 kB gzip and the only script a page ships, so a single-page landing can now ship literally zero JavaScript. Verified: `dist/index.html` links only ClientRouter + a 0.07 kB page script, and contains no `astro-island` — the 194 kB React chunk Vite emits is never referenced by a page.

- [Fix]: TypeScript and `@astrojs/check` were not installed at all, so `tsconfig.json` extending `astro/tsconfigs/strict` was unenforced and there was no way to type-check `.astro` files. Added both plus a `check` script; `astro check` reports 0 errors across 31 files.

- [Fix]: quality gates were a single `.husky/pre-commit` running `npx lint-staged` and nothing else — no type check, no commit-msg hook, no pre-push, and no CI at all. `pre-commit` now also runs `astro check`; `commit-msg` runs commitlint; `pre-push` blocks direct pushes to `main` then runs format + lint + check + build; `.github/workflows/ci.yml` runs the same set on every PR. `lint-staged` now runs Prettier on `.ts`/`.tsx` too (it only ran ESLint before, so formatting drifted).

- [Fix]: `.gitignore` ignored the whole `.claude/` directory, which would have kept any shared agent config out of the repo. Now only `.claude/settings.local.json` is ignored. Added `.prettierignore` (there was none, so `prettier --check .` walked `dist/` and `.astro/`).

- [Feat]: Claude Code setup added — `CLAUDE.md` with the real stack and its version traps (notably zod is **v3** here, not v4), a `landing` skill for the content-first page workflow, the `code-sentinel` reviewer adapted to catch shipped JavaScript and duplicated sections, the `backlog` skill and worktree commands, and hooks for session orientation, Prettier-on-edit, and docs-sync.
