<identity>
project=Larchwick Coffee Roasters — a WordPress → Astro + Sanity migration case study (fictional business)
stack=Astro 7,TypeScript strict,Tailwind v4,zero client JS
packages=astro,@astrojs/sitemap,tailwindcss,@tailwindcss/vite,class-variance-authority
</identity>

<stack_check>verified</stack_check>

<stack_check_protocol>
When the session-start hook prints `--- Stack check (marker: pending) ---`:

- Every package line `ok` and no `MISSING` → flip the marker to `<stack_check>verified</stack_check>` in this file and tell the user in one sentence.
- Any `MISSING: <pkg>` → ask the user how to reconcile (update `packages=` to match package.json, or install the missing package). Flip to `verified` only after it is resolved.
- Never flip to `verified` while a mismatch remains.
</stack_check_protocol>

<prime_directive>
This is a static marketing site. The goal is a page that loads fast and is quick to build.

Every section is a static `.astro` component and **the site ships zero client JavaScript**. There is no React and no UI framework. HTML and CSS cover what this site needs: `<details>` for accordions and menus, `:target` or an anchor for tab-like navigation, CSS transitions for motion, and a plain HTML `<form>` POST for the contact form. The FAQ and the mobile menu in this repo are both zero-JS on purpose.

If a component genuinely seems to need interactivity, stop and ask first. Even a small Astro `<script>`, let alone adding a framework, is an architecture decision.
</prime_directive>

<version_traps>

- **Astro 7** — `output: 'static'` stays, with no adapter: `dist/` is served as static assets. `trailingSlash: 'always'` and `build.format: 'directory'` keep WordPress's URLs, so every internal href ends in `/` (`/about/`, never `/about`); files such as `/robots.txt` and `/sitemap-index.xml` do not. Node ≥ 22.18 (`.node-version` pins 24).
- **Astro 7 compiler** — the Rust compiler errors on unclosed non-void tags and no longer fixes invalid nesting (no `<div>` inside `<p>`). Astro 7 defaults `compressHTML` to `'jsx'` (whitespace containing a line break between elements is removed). We set `compressHTML: true`, the pre-7 HTML whitespace rules, because `prettier-plugin-astro` 0.14 wraps inline elements assuming HTML whitespace. Don't switch to `'jsx'` until the formatter is upgraded; `prettier-plugin-astro` 1.x currently breaks `prettier-plugin-tailwindcss`.
- **Tailwind v4** — CSS-first. There is no `tailwind.config.js` and adding one does nothing. Tokens live in `src/styles/global.css` under `@theme`.
- **Fonts** — the Astro Fonts API (`fonts` in `astro.config.ts`, Fontsource provider) downloads DM Serif Display and Inter at build time and serves them from our own origin; `<Font>` in `Layout.astro` emits the `@font-face` rules and preloads. No font package and no Google Fonts link. DM Serif Display has only weight 400, so never put `font-medium`/`font-semibold`/`font-bold` on a `font-serif` heading (the browser fakes a bold).
- **No zod in our code.** Astro's own zod is v4 (import it from `astro/zod` if ever needed), so the v4 API applies: `z.email()`, `z.url()`.
- **Icons** — inline SVG in `src/components/ui/Icon.astro` (Lucide paths, ISC). A new icon is a name in `ICON_NAMES` plus its nodes; no icon package.
- **Cloudflare Workers Static Assets** — `wrangler.jsonc` serves `dist/` with `html_handling: "force-trailing-slash"` (slashless URLs get a **307**, so the old WordPress URLs need explicit 301 rules in `_redirects`, Phase 6) and `not_found_handling: "404-page"`. Headers live in `public/_headers`; it sends `script-src 'none'`, so any script added later breaks until the CSP is updated. `X-Robots-Tag: noindex` stays until Phase 7. The Worker `name` must match the dashboard's.
- **Sanity Studio lives in `studio/`** with its own `package.json` (Sanity 6, React 19 for the Studio app only; the site ships no React). Root `tsconfig.json` excludes it; type-check it with `npm --prefix studio run check`. After any schema change run `npm run studio:typegen`, which rewrites `src/lib/sanity/sanity.types.ts` (generated, never edit by hand). Alt text lives on each image field (`accessibleImage`, `figure`), not on the asset.
- **The WordPress importer lives in `scripts/import-wp/`** with its own `scripts/package.json` (`@sanity/client`, the WordPress block parser, `htmlparser2`, Vitest). Root `tsconfig.json` excludes it; check it with `npm --prefix scripts run check` and `npm --prefix scripts test` (both run in CI). `npm run import:wp` is a dry run; only `--write` changes Sanity. It owns only fields WordPress supplies and never unsets, so Studio-only values survive a re-run (PLAN D-21).
- **ESLint 10** flat config. The core unused-vars rule flags parameter names inside TypeScript function *types*; prefix those with `_`. `astro.config.ts` is TypeScript, so it can import `siteConfig`.
</version_traps>

<source_of_truth>
Trust code over docs. If they disagree, fix the doc in the same task.
</source_of_truth>

<references>
Read only what the task needs.

architecture=.claude/docs/claude/architecture.md
frontend=.claude/docs/claude/frontend.md
design-system=.claude/docs/claude/design-system.md
performance=.claude/docs/claude/performance.md
workflow=.claude/docs/claude/workflow.md
documentation=.claude/docs/claude/documentation.md
structure=docs/STRUCTURE.md
worklog=.claude/docs/WORKLOG.md
project=docs/internal/PROJECT.md
pages=docs/pages/
plan=PLAN.md — WordPress → Astro + Sanity migration: phases, decisions, progress. Read before starting any migration work; tick boxes as work lands.
</references>

<global_rules>
Prefer existing patterns.
Minimize diff size.
Do not refactor unrelated code.
Do not introduce new architecture without approval.
Reuse existing abstractions.
Keep pages thin — a page is a Layout plus an ordered list of sections.
Trust implementation over documentation.
</global_rules>

<building_a_page>
Content pages live in Sanity, not in code. A `page` document with slug `<slug>` is built at `/<slug>/` by `src/pages/[slug].astro`, which renders its `sections[]` through `SectionRenderer.astro` (one `case` per section `_type`). A new page is made in the Studio; no code changes.

A new section type, in order:

1. Schema in `studio/schemaTypes/sections/`, added to `sectionTypes` and to `SECTION_TYPES`.
2. A component in `src/components/sections/` whose props use the schema's field names (`heading`, `intro`, `text`, `items`, `tone`…), so the Sanity object spreads straight in.
3. A `case` in `SectionRenderer.astro`, then `npm run studio:typegen`.

Rich text goes through `src/components/rich-text/RichText.astro`; Sanity images through `src/components/ui/SanityImage.astro` (never a raw `cdn.sanity.io` URL in markup: the CSP only allows our own origin). Home (`src/lib/content/home.ts`) and the 404 (`not-found.ts`) are still code until Phase 5c.

Never inline copy into a section component, and never hardcode a brand name, URL, nav item, or contact detail — those come from `src/lib/config/site.ts`.
</building_a_page>

<reuse_before_building>
**Before creating any component, look for an existing one. Every time, including when the request sounds like a brand-new block.**

```
ls src/components/sections   # Header, Hero, Features, FAQ, CTA, Footer, Section
ls src/components/ui         # button (cva classes), Icon
grep -ril "<thing>" src/components src/lib
```

Then decide:

- **Exact or near fit** → use it.
- **Close, but missing something** → add a prop or a `cva` variant to the existing section. Do not fork it.
- **A layout/spacing wrapper** → `Section.astro` already owns the container, vertical rhythm, and the eyebrow/title/subtitle header. Build on it rather than re-doing padding.
- **Genuinely new** → create it in `src/components/sections/`, with a typed `Props` interface and copy passed in as props.

Rebuilding something that already exists is a review finding. If you do build new, say in one line what you searched for and why nothing fit.
</reuse_before_building>

<section_contract>
Every section component follows the same shape, so they stay interchangeable:

- a typed `interface Props` in the frontmatter, with `readonly` arrays for list content
- all copy arrives via props — no text baked into the component
- an optional `id` prop, defaulted, so in-page anchors work
- built on `Section.astro` unless it needs a full-bleed layout of its own
- static markup; no `client:` directive
</section_contract>

<code_style>
Always destructure props from `Astro.props` in the frontmatter.
Explicit return types on exported TypeScript functions.
Extract inline logic — pull anything longer than one short expression into a named variable above the template.
Use `class:list` for conditional classes in `.astro`.
If a pattern repeats 2+ times across files, flag it and propose a shared abstraction before implementing.
</code_style>

<comment_style>
Do not write code comments unless the user explicitly asks. Config files and non-obvious performance decisions are the exception — a one-line note explaining _why_ is welcome there.
</comment_style>

<colors>
Tokens only, from `src/styles/global.css` (`@theme`), the old site's 9 brand colours: `brand`, `brand-dark`, `heading`, `body`, `surface`, `canvas`, `dark`, `subtle`, `border`, plus `shadow-soft` and `shadow-card`. `white` is fine for text on a `brand-dark` fill; avoid Tailwind's gray scale (cool greys clash with the warm palette).

Contrast rule: text on a coloured fill uses `brand-dark` as the fill with white text (5.73:1). Never white on `brand` (3.49:1), and never `brand` as text on a light background; `brand` is a decorative accent (icons, underlines, borders, eyebrows on `dark`).

Never a hex or arbitrary colour value in a component. If a new colour is needed, add it to `@theme` in `global.css` first. Full rules and the contrast table in `.claude/docs/claude/design-system.md`.
</colors>

<task_completion>
The task is complete only when all of these hold:

- `npm run check` passes (`astro check` — types plus `.astro` templates)
- `npm run lint` passes
- `npm run format:check` passes
- `npm run build` passes
- `.claude/docs/WORKLOG.md` updated — every task with a real behaviour change; skip pure chores/refactors
- `docs/internal/PROJECT.md` opened and reviewed **every task, no exceptions**, even when nothing needs to change — update Pages if a route was added or removed
- relevant `docs/pages/<page>.md` checked/updated when a page's content or behaviour changes, and `docs/pages/README.md` updated if a page doc was added, removed, or renamed
- `docs/STRUCTURE.md` updated if a folder convention changed
- `packages=` in `<identity>` updated if a dependency was added or removed

`npm run verify` runs check + lint + format:check in one command.

A `Stop` hook checks the doc files above against the working-tree diff and reminds once. If a change genuinely needs no doc update, say so in one line — never write a filler entry to silence it.
</task_completion>

<pr_workflow>
Never create a PR and never push automatically. This requires the user's explicit instruction, given fresh for that specific task. Do not infer permission from a previous task, from context, or from how earlier tasks in the same session were handled.
PRs target `dev`; `main` only receives merges from `dev`.

After completing every task:

1. List every file created or modified (path only, one per line).
2. Ask: "Shall I create a PR?" — wait for explicit confirmation before running `git push` or `gh pr create`.
</pr_workflow>

<commit_style>
Conventional Commits, enforced by commitlint (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `style:`).
Subject line only — no body, no description, unless the user asks.
Never add `Co-Authored-By:` or any AI attribution, in commit messages or PR descriptions.
</commit_style>
