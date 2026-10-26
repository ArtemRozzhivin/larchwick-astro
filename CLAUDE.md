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

Every section is a static `.astro` component, and **the only client JavaScript is the "Ask Larchwick" assistant (`src/components/chat/ChatPanel.astro`: a 2.2 KB loader on every page and a 4.3 KB chat module that downloads only when the panel opens, PLAN.md Phase 7b) and the analytics consent banner (`src/components/consent/ConsentBanner.astro`: 2.4 KB on every page, plus the 1.7 KB event module both share; Google's `gtag.js` only after the visitor accepts, and only on production builds, PLAN.md Phase 7c)**. There is no React and no UI framework. HTML and CSS cover what this site needs: `<details>` for accordions, a native `popover` for the mobile menu, `:target` or an anchor for tab-like navigation, CSS transitions for motion, and a plain HTML `<form>` POST for the contact form. The FAQ and the mobile menu in this repo are both zero-JS on purpose.

If a component genuinely seems to need interactivity, stop and ask first. Any other `<script>`, let alone a framework, is an architecture decision.
</prime_directive>

<version_traps>

- **Astro 7** — `output: 'static'` stays, with no adapter: `dist/` is served as static assets. `trailingSlash: 'always'` and `build.format: 'directory'` keep WordPress's URLs, so every internal href ends in `/` (`/about/`, never `/about`); files such as `/robots.txt` and `/sitemap-index.xml` do not. Node ≥ 22.18 (`.node-version` pins 24).
- **Astro 7 compiler** — the Rust compiler errors on unclosed non-void tags and no longer fixes invalid nesting (no `<div>` inside `<p>`). Astro 7 defaults `compressHTML` to `'jsx'` (whitespace containing a line break between elements is removed). We set `compressHTML: true`, the pre-7 HTML whitespace rules, because `prettier-plugin-astro` 0.14 wraps inline elements assuming HTML whitespace. Don't switch to `'jsx'` until the formatter is upgraded; `prettier-plugin-astro` 1.x currently breaks `prettier-plugin-tailwindcss`.
- **Tailwind v4** — CSS-first. There is no `tailwind.config.js` and adding one does nothing. Tokens live in `src/styles/global.css` under `@theme`. Its minifier folds `animation` plus `animation-timeline` into one `animation: … view()` shorthand, which browsers reject silently; write scroll-driven animations as longhands (see `reveal` in `global.css`). It scans `src/` only (`source('..')`), minus test files (`@source not '../**/*.test.ts'`) and `src/integrations/` (`@source not '../integrations'`). Everywhere else under `src/` a class-like word ships a utility to every page, whether it sits in markup, a comment or a string (a test suite named "sitemap filter" shipped a `filter` rule before the exclusion); today only `.table` ships that way, from the Sanity block type `table` in code.
- **Fonts** — the Astro Fonts API (`fonts` in `astro.config.ts`, Fontsource provider) downloads Big Shoulders Display (`font-display`, variable 600–900) and Hanken Grotesk (`font-sans`, variable 400–700) at build time and serves them from our own origin; `<Font>` in `Layout.astro` emits the `@font-face` rules and preloads. No font package and no Google Fonts link. Weights outside those ranges are faked by the browser, so don't use them.
- **No zod in our code.** Astro's own zod is v4 (import it from `astro/zod` if ever needed), so the v4 API applies: `z.email()`, `z.url()`.
- **AI assistant (Phase 7b)** — the `ragIndex()` integration splits Sanity content into passages (`src/lib/rag/chunks.ts`), embeds them with Workers AI and writes them to the Vectorize index `larchwick-content` on `main` builds only, using the build token; it never fails a build. It finds stale passages by listing the index's ids and deletes every id that isn't a current passage, so the index holds nothing else and the build token must be able to read (list) it. The index name, embedding model, namespace and the `Excerpt`/`Passage` shapes live in `src/lib/rag/config.ts` (a test checks that `wrangler.jsonc` binds the same index). A passage id hashes the fields in `EXCERPT_FIELDS` (url, title, heading, text, in that order: reordering re-embeds the whole index), so renaming a page re-embeds its passages; `rag:inspect` compares the same list, and the type check fails if `Excerpt` gains a field the list lacks. `listAllIds()` (`src/lib/rag/index-plan.ts`) pages through the stored ids for both the build and `rag:inspect`, `LIST_PAGE_SIZE` (1,000, Vectorize's maximum) at a time. Review the passages with `npm run rag:passages`; it fails if a passage holds a word its page doesn't show (the leak guard), which is why post dates in both come from `formatPostDate()` (`src/lib/format/date.ts`, UTC). `npm run rag:inspect` reads the production index read-only through your own wrangler login and writes `.cache/rag/production-index.html`, a passage-by-passage comparison (url, title, heading, text) with the current content. A new section type needs a case in `sectionDrafts()` or it is indexed by heading, intro and text only. Claude Haiku 5.5 (`worker/chat.ts`) thinks before it answers even without a `thinking` parameter, and the hidden thinking counts toward `max_tokens`: keep the cap well above the answer length (1,024 at effort `low`), or answers stop mid-word. The answer's only markup is `[label](/path/)` links, rendered by `answerParts()` (`src/lib/chat/stream.ts`) for on-site paths only.
- **Analytics (Phase 7c)** — Google Analytics 4 only after consent: `ConsentBanner.astro` (a manual popover, in `<body>` right after the skip link) and `src/lib/analytics/consent.ts` store the choice in `localStorage` (`larchwick-analytics-consent`), load `gtag.js` after the page has loaded and the browser is idle, and on "Decline" set `ga-disable-<id>` and delete the `_ga` cookies. The Measurement ID (`siteConfig.analytics`, public) is built only into production pages (`measurementId()`: `WORKERS_CI_BRANCH === 'main'`), so previews and local builds show the banner but send nothing. Simulate production locally with `WORKERS_CI_BRANCH=main RAG_INDEX=dry npm run build` and `npx wrangler dev`. Events (`src/lib/analytics/track.ts`, list in PLAN.md Phase 7c): add `data-track="<event>"` and `data-track-<param>` attributes to a link or button, or `data-track-view` to send on page load (not again on a reload or Back/Forward: `isRepeatView()`); `track()` is a no-op without consent. A tracked link to another of our pages is sent by the next page (sent on click, it is lost as the page unloads). Never send names, emails, message text or assistant questions to GA.
- **Icons** — inline SVG in `src/components/ui/Icon.astro` (Lucide paths, ISC). A new icon is a name in `ICON_NAMES` plus its nodes; no icon package.
- **Cloudflare Workers Static Assets** — `wrangler.jsonc` serves `dist/` with `html_handling: "force-trailing-slash"` (slashless URLs get a **307**, so the old WordPress URLs need explicit 301 rules in `_redirects`, Phase 6) and `not_found_handling: "404-page"`. Headers live in `public/_headers`; its CSP allows scripts from our own origin (bundled `/_astro/*.js` files only; an inline script would be blocked) plus Google's tag and collection domains for analytics. Astro inlines script chunks under 4 KB, so `astro.config.ts` sets `vite.build.assetsInlineLimit` to never inline `.js`; without it a small `<script>` silently stops working in production. Production is indexable since Phase 7; preview builds get `X-Robots-Tag: noindex` from the `previewNoindex()` integration, which appends it to `dist/_headers` when `WORKERS_CI_BRANCH` (set by Workers Builds) is not `main`. A local build has no `WORKERS_CI_BRANCH`, so it is built as production: deploy a preview by hand only with `npm run preview:deploy`, which refuses on `main` and sets the variable to the current branch. Never put a host-pattern noindex in `public/_headers`: Cloudflare's `https://:version.:subdomain.workers.dev/*` example also matches production. The Worker `name` must match the dashboard's. **Previews (branch builds, `wrangler preview`) inherit neither top-level bindings nor production secrets:** every binding must be repeated in the `previews` block of `wrangler.jsonc` (the assistant's `ai` and `vectorize` and all three rate limiters are), and secrets are set per preview with `npx wrangler preview secret put NAME` (or `preview base-config secret put` for all new previews). A preview missing either fails quietly; the chat answers "not available". `main: worker/index.ts` handles only `/api/*` (`run_worker_first`): `/api/contact` (binding `CONTACT_LIMITER`, 2 sends a minute per visitor, counted only for posts that would send; a missing binding, a limiter or send that throws, or a Resend call past its 10 s timeout all go to `/contact/error/`, never Cloudflare's error page) and `/api/chat` (the assistant: bindings `AI`, `VECTORIZE`, `CHAT_LIMITER` (10 a minute per visitor) and `CHAT_SITE_LIMITER` (60 a minute for all visitors together, one key, `site`) in `wrangler.jsonc`, secret `ANTHROPIC_API_KEY`, all required, so a missing one answers "unavailable"; over the per-visitor limit a 429 says `MESSAGES.busy`, over the site-wide one `MESSAGES.siteBusy` ("The assistant is busy right now…"); one 30 s deadline, `DEADLINE_MS`, covers the limiters, the retrieval and the Claude stream; it never logs questions or returns upstream error text). The per-visitor limiters key on `visitorKey()` through `withinLimit()` (`worker/rate-limit.ts`): an IPv4 address, an IPv6 address's /64, an IPv4-mapped IPv6 address as its IPv4. Rate-limit bindings count per Cloudflare location, not worldwide, and they cap a rate, not a total (PLAN D-27): one address at the per-visitor 10 a minute can still spend roughly $40–90 a day on Anthropic. The total is capped only by the monthly spend limit Artem sets in the Anthropic console; once it is reached the assistant answers "unavailable" until the month resets. A daily question budget would need a Durable Object (or KV) counter. The contact form has no site-wide or daily cap, by Artem's choice for the demo: at 2 a minute, a single script on one address (no rotation needed) uses up Resend's free 100 a day in about 50 minutes and its 3,000 a month in about 25 hours, and real messages then land on `/contact/error/`; a Durable Object daily counter or Turnstile is the next step. The form's `Origin` check only stops other sites' forms; the honeypot and the limiter are what slow scripts down. Code the pages and the Worker share lives in `src/lib/` and the Worker imports it, never the reverse: the form's `LIMITS` (`src/lib/contact/limits.ts`), `QUESTION_MAX` (`src/lib/chat/stream.ts`), the index config (`src/lib/rag/config.ts`), `errorMessage()`/`isTimeout()` (`src/lib/errors.ts`) and the paths in `src/lib/routes.ts`. (`CHAT_PANEL_ID` in `src/lib/chat/config.ts` is shared only by the panel's markup and its loader.) The Worker handlers, the redirect rules and the pure helpers under `src/lib/` are tested with `npm test` (Node's built-in `node --test`, no Vitest at the root); the Worker tests share their rate-limiter fakes through `worker/test-fakes.ts`, which is not a test file and never reaches the bundle. `dist/_redirects` is generated by the `redirects()` integration (`src/integrations/`) from Sanity redirect documents plus code rules; the build fails on duplicate sources, a source that is a live page, a pattern that matches a live page, or a chain. It also drops noindex pages, and pages whose canonical is another URL, from the sitemap. Check parity with `npm run seo:compare` against `npx wrangler dev` (`astro preview` ignores `_redirects`). Its secrets `RESEND_API_KEY`, `CONTACT_TO` and the optional `RESEND_TEMPLATE_ID` live only in Cloudflare, set with `npx wrangler secret put NAME`: a plain-text variable added in the dashboard is deleted by the next deploy (deploys replace variables with `wrangler.jsonc`'s, and production has none), which is how `CONTACT_TO` vanished and the form silently redirected to `/contact/error/`. Logs: `observability` is on, so each `/api/*` run appears in the dashboard (the Worker → Logs); `npx wrangler tail larchwick-astro` streams production live (not previews). With a template id it sends the Resend template whose source is `worker/templates/contact-notification.html` (variables are inserted as raw HTML, so the Worker escapes them; each is capped at 2,000 characters, hence the 1,500-character message limit); without one it sends plain text.
- **Sanity Studio lives in `studio/`** with its own `package.json` (Sanity 6, React 19 for the Studio app only; the site ships no React). Root `tsconfig.json` excludes it; type-check it with `npm --prefix studio run check`. One file crosses over: `studio/homePage.ts` (`HOME_SLUG`, `isHomePage()`) serves the Studio's page, SEO and redirect schemas and is imported by `src/lib/routes.ts`, so the site and the Worker load it too; it must stay free of imports (no `sanity`). After any schema change run `npm run studio:typegen`, which rewrites `src/lib/sanity/sanity.types.ts` (generated, never edit by hand). Alt text lives on each image field (`accessibleImage`, `figure`), not on the asset.
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

1. Schema in `studio/schemaTypes/sections/`, added to `sectionTypes` in its `index.ts` (`SECTION_TYPES` is built from it; adding the name there too lists the type twice). Its background is `lightToneField` (Light/Cream) unless every colour in the component adapts to the dark larch band; only then `toneField` (adds Dark; today only the CTA).
2. A component in `src/components/sections/` whose props use the schema's field names (`heading`, `intro`, `text`, `items`, `tone`…), so the Sanity object spreads straight in. With `lightToneField`, type `tone` as `LightTone` (exported by `Section.astro`).
3. A `case` in `SectionRenderer.astro`, then `npm run studio:typegen`.

Rich text goes through `src/components/rich-text/RichText.astro`; Sanity images through `src/components/ui/SanityImage.astro` (never a raw `cdn.sanity.io` URL in markup: the CSP only allows our own origin). Home is the `home` page document (rendered by `src/pages/index.astro`); the 404 and the contact result pages keep their copy in `src/lib/content/`, and copy there that names the brand builds it from `siteConfig`, its links from `src/lib/routes.ts`. URL paths come from `src/lib/routes.ts` (`pagePath`, `postPath`, `termPath`, `contactResultPath`, with the slugs `HOME_SLUG` and `CONTACT_SLUG`). Sanity pages, posts and the blog index spread `layoutSeo()` (`src/lib/seo/layout-seo.ts`) into `Layout`: the document's `seo` fields, each falling back to the route's defaults. Home uses `homeSeo()`, which leaves out noindex and canonical (the Studio hides both there); term archives get theirs from `src/lib/sanity/archives.ts`. The menu, contact details, demo label and default description come from the **Site settings** document (`getSiteSettings()`); `src/lib/config/site.ts` keeps only the URL, language, titles, OG defaults, the logo path and the header and footer UI labels.

Never inline copy into a section component, and never hardcode a brand name, URL, nav item, or contact detail — those come from Site settings or `src/lib/config/site.ts`.
</building_a_page>

<reuse_before_building>
**Before creating any component, look for an existing one. Every time, including when the request sounds like a brand-new block.**

```
ls src/components/sections   # Section, SectionHeader, Hero, TextBlock, ImageText, Features, Stats, CardGrid,
                             # PriceTable, FAQ, Steps, LatestPosts, CTA, ContactForm, PullQuote, Header, Footer
ls src/components/ui         # button.ts (buttonVariants, iconButtonVariants), field.ts, link.ts (inline link, pill),
                             # CtaButtons, SpecList, CoffeeLabel, SanityImage, Icon
ls src/components/blog       # BlogArchive, PostCard, PostGrid, PostHeader, PostMeta, PostNav, PostTags
grep -ril "<thing>" src/components src/lib
```

Then decide:

- **Exact or near fit** → use it.
- **Close, but missing something** → add a prop or a `cva` variant to the existing section. Do not fork it.
- **A layout/spacing wrapper** → `Section.astro` already owns the container, vertical rhythm, and the eyebrow/heading/intro header (`SectionHeader.astro`). Build on it rather than re-doing padding.
- **Genuinely new** → create it in `src/components/sections/`, with a typed `Props` interface and copy passed in as props.

Rebuilding something that already exists is a review finding. If you do build new, say in one line what you searched for and why nothing fit.
</reuse_before_building>

<section_contract>
Every section component follows the same shape, so they stay interchangeable:

- a typed `interface Props` in the frontmatter, with `readonly` arrays for list content
- all copy arrives via props — no text baked into the component
- an optional `id` prop with no default, so a page can give a section an anchor; a fixed default would give two sections of one type the same id
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
Comments explain _why_, never _what_. A non-obvious decision (an ordering, a workaround, a magic value, a performance choice) gets a one-line why at that spot. An exported function or component whose behaviour isn't obvious from its name and types gets TSDoc; self-explanatory code gets none. No comments that restate the code or narrate a change ("added…", "now uses…"). When behaviour changes, update the comments that describe it.
</comment_style>

<colors>
Tokens only, from `src/styles/global.css` (`@theme`), the "Larch and label" palette (PLAN.md Phase 10): `larch`, `larch-deep`, `needle`, `espresso`, `ink`, `mist`, `paper`, `surface`, `stamp`, `border`, the `roast-*` bag colours, plus `radius-label`/`radius-photo`/`radius-band` and `shadow-label`. Avoid Tailwind's gray scale and plain white/black.

Contrast rule: `needle` (gold) is text only on `larch` or `espresso`, never on a light background, and never the only state signal there. A button on a `larch` band takes a `surface` focus ring.

Never a hex or arbitrary colour value in a component. If a new colour is needed, add it to `@theme` in `global.css` first. Full rules and the contrast table in `.claude/docs/claude/design-system.md`.
</colors>

<task_completion>
The task is complete only when all of these hold:

- `npm run check` passes (`astro check` — types plus `.astro` templates)
- `npm run lint` passes
- `npm run format:check` passes
- `npm test` passes (the Worker handlers, the redirect rules and the `src/lib` helpers)
- when `scripts/` changed: `npm --prefix scripts run check` and `npm --prefix scripts test` pass
- `npm run build` passes
- `.claude/docs/WORKLOG.md` updated — every task with a real behaviour change; skip pure chores/refactors
- `docs/internal/PROJECT.md` opened and reviewed **every task, no exceptions**, even when nothing needs to change — update Pages if a route was added or removed
- relevant `docs/pages/<page>.md` checked/updated when a page's content or behaviour changes, and `docs/pages/README.md` updated if a page doc was added, removed, or renamed
- `docs/STRUCTURE.md` updated if a folder convention changed
- `packages=` in `<identity>` updated if a dependency was added or removed

`npm run verify` runs check + lint + format:check + `npm test` in one command.

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
