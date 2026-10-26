# Larchwick Coffee Roasters — WordPress → Astro + Sanity

> **Demo project — fictional business.** Larchwick Coffee Roasters is not a real company. This is
> a personal portfolio project: a WordPress site migrated to Astro + Sanity on Cloudflare Workers.

The migration is in progress: see [PLAN.md](./PLAN.md) for the plan and the tracker. Image and
font credits are in [CREDITS.md](./CREDITS.md), and the code is MIT-licensed ([LICENSE](./LICENSE)).

---

## Built on: Astro landing template

A starter for marketing sites and landing pages. Static-first Astro with
ready-made section blocks, SEO already wired, and quality gates in place.

A page here is **a Layout plus an ordered list of sections**. The content (pages, posts, menu,
contact details) lives in Sanity, so a new page is made in the Studio with no code change.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Building a Page](#building-a-page)
- [Available Sections](#available-sections)
- [Project Structure](#project-structure)
- [Performance](#performance)
- [Coding Standards](#coding-standards)
- [Git Flow](#git-flow)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Importing from WordPress](#importing-from-wordpress)

---

## Getting Started

**Prerequisites:** Node.js 22.18+ (`.node-version` pins 24), npm, Git.

```bash
git clone <repo-url>
cd larchwick-astro
npm install          # also installs the git hooks (husky)
cp .env.example .env
npm run dev          # → http://localhost:4321
```

### First five minutes on a new project

1. Sanity Studio (`npm run studio`, first time `npm install --prefix studio`): the pages, posts,
   and **Site settings** (name, description, menu, contact details, opening hours). How to edit
   and publish: [docs/editor-guide.md](./docs/editor-guide.md).
2. `src/lib/config/site.ts` — URL, name and titles, default OG image and alt, logo, analytics
   ID, and the header and footer UI labels. The sitemap and every canonical/OG URL derive from
   the URL here.
3. `src/styles/global.css` — the "Larch and label" colour, radius and shadow tokens (`larch`,
   `needle`, `espresso`, `paper`, `surface` and the rest). `astro.config.ts` — the two
   self-hosted fonts (Astro Fonts API).
4. `public/favicon.svg`, `public/logo.png` (512×512, the structured-data logo) and
   `public/og.jpg` (1200×630).

---

## Building a Page

A page is a Sanity `page` document. One with slug `<slug>` is built at `/<slug>/` by
`src/pages/[slug].astro`, which hands its `sections[]` to `SectionRenderer.astro`; that picks a
component per section `_type` and spreads the Sanity object into it. Home is the page with slug
`home` (`src/pages/index.astro`), and the blog index is `src/pages/blog/index.astro`. So a new
page is made and published in the Studio; the publish rebuilds the site.

Only if no section type fits, add one:

1. a schema in `studio/schemaTypes/sections/`, added to `sectionTypes` in its `index.ts`
   (`SECTION_TYPES` is built from it);
2. a component in `src/components/sections/` whose props use the schema's field names, built on
   `Section.astro` (keep the [section contract](./docs/STRUCTURE.md#section-contract));
3. a `case` in `SectionRenderer.astro`, then `npm run studio:typegen`.

`Layout` already handles the head, SEO, fonts, header, footer, consent banner and chat panel.
More in [docs/STRUCTURE.md](./docs/STRUCTURE.md#building-a-page).

---

## Available Sections

`src/components/sections/`, by the Sanity section type that renders them:

| Sanity type (Studio name)    | Component     | Key props                                                                                            |
| ---------------------------- | ------------- | ---------------------------------------------------------------------------------------------------- |
| `hero` (Hero)                | `Hero`        | `variant`, `eyebrow`, `heading`, `text`, `image`, `label`, `primaryCta`, `secondaryCta`, `trustList` |
| `textBlock` (Text)           | `TextBlock`   | `eyebrow`, `heading`, `body`, `tone`                                                                 |
| `imageText` (Image and text) | `ImageText`   | `eyebrow`, `heading`, `body`, `image`, `imagePosition`, `cta`, `tone`                                |
| `featureGrid` (Features)     | `Features`    | `eyebrow`, `heading`, `intro`, `items`, `tone`                                                       |
| `stats` (Numbers)            | `Stats`       | `eyebrow`, `heading`, `items`, `tone`                                                                |
| `cardGrid` (Cards)           | `CardGrid`    | `eyebrow`, `heading`, `intro`, `cards`, `layout` (`cards` / `bags`), `cta`, `tone`                   |
| `priceTable` (Price list)    | `PriceTable`  | `eyebrow`, `heading`, `intro`, `rows`, `note`, `tone`                                                |
| `faq` (FAQ)                  | `FAQ`         | `eyebrow`, `heading`, `intro`, `groups` (native `<details>`, zero JS), `tone`                        |
| `steps` (Steps)              | `Steps`       | `eyebrow`, `heading`, `intro`, `items`, `tone`                                                       |
| `latestPosts` (Latest posts) | `LatestPosts` | `eyebrow`, `heading`, `count`, `cta`, `tone`                                                         |
| `cta` (Call to action)       | `CTA`         | `heading` or `quote` + `citation`, `text`, `primaryCta`, `secondaryCta`, `tone`                      |
| `contactForm` (Contact form) | `ContactForm` | `heading`, `intro`, `showContactDetails`, `tone`                                                     |
| `quote` (Quote)              | `PullQuote`   | `text`, `citation`, `tone`                                                                           |

Every component also takes an optional `id` (no default). `tone` is `default` (paper), `muted`
(cream; the gold band on the CTA) or, on the CTA only, `inverted` (the larch band); the hero is
always the larch band. All but the hero are built on `Section`, the layout primitive (`eyebrow`,
`heading`, `intro`, `align`, `width`, `tone`). `Header` and `Footer` take no props (they read Site settings and `siteConfig`); `Layout` renders
them on every page, the 404 included.

---

## Project Structure

```
src/
├── pages/                 Routes — one file per URL, composition only
│   ├── index.astro        Home: the Sanity `home` page through SectionRenderer
│   ├── [slug].astro       Every other Sanity page (the blog index has its own route)
│   ├── blog/              Blog index, posts, category and tag archives
│   ├── contact/[result].astro  /contact/thanks/ and /contact/error/
│   ├── 404.astro
│   └── robots.txt.ts      Generated from siteConfig at build time
├── layouts/Layout.astro   <head>, SEO, fonts, JSON-LD, Header, Footer
├── components/
│   ├── sections/          The page blocks
│   ├── blog/              Post cards, header, meta, tags and neighbour links
│   └── ui/                Primitives — button, field and link classes, CTA buttons, spec list, Icon
├── lib/
│   ├── config/site.ts     Brand, URL, OG defaults, logo, UI labels — single source of truth
│   ├── content/           Copy that isn't Sanity content (labels, result pages, 404)
│   ├── routes.ts          Page, post, archive and contact result paths
│   ├── sanity/            Queries, cached loaders, images, generated types
│   ├── seo/               Layout SEO props, JSON-LD builders, canonical URLs, sitemap dates
│   └── types/             Shared types (import from @lib/types)
└── styles/global.css      Tailwind v4 @theme tokens
```

Full detail, including where new code goes: [docs/STRUCTURE.md](./docs/STRUCTURE.md).

### Aliases

```
@lib/*  @components/*  @layouts/*
```

Use an alias whenever an import crosses a folder; keep relative imports inside one
folder.

---

## Performance

Pages ship **no JavaScript of their own**: no view transitions, no prefetch script, no
islands, and no React. The one exception is the "Ask Larchwick" assistant: a 2.2 KB loader
on every page and a 4.3 KB chat module that downloads only when the panel opens. The analytics
consent banner adds 2.4 KB and the shared event module 1.7 KB on every page; Google Analytics
loads only after a visitor accepts.

That is protected by one rule: **HTML → CSS → ask first.**

- FAQ accordion — `<details>` / `<summary>`; mobile menu — a native `popover`; no JS
- Icons — inline SVG from `Icon.astro` (Lucide paths, ISC), no JS
- Fonts — self-hosted woff2 through the Astro Fonts API, no Google Fonts request

Every image comes from Sanity and goes through `src/components/ui/SanityImage.astro`: it is
downloaded and re-encoded at build time (AVIF and WebP, a JPEG fallback), served from our own
origin, and gets width/height and a srcset. `sizes` describes the column the image really fills.
`priority` (eager, high fetch priority) goes to the likely LCP image only: a hero that is the
page's first section (`SectionRenderer` passes `index === 0`), a post's main image and the first
card on the blog index and archives. Every other image is lazy, including an image-and-text
section that an editor puts first; a new image section that can come first needs a `priority`
prop and the same `index === 0` in `SectionRenderer`.

```astro
<SanityImage image={image} widths={[480, 720, 960, 1280]} sizes="(min-width: 48rem) 50vw, 100vw" />
```

A raw `<img>` is only for files in `public/`, always with width, height, loading and decoding.

---

## Coding Standards

### Astro components

Frontmatter order: imports → `interface Props` → destructure `Astro.props` →
derived constants. Conditional classes use `class:list`.

```astro
---
interface Props {
  id?: string
  heading: string
  items: readonly { label: string }[]
}

const { id, heading, items } = Astro.props
---
```

Content arrays are `readonly` — content files are `as const`. A section's `id` has no default,
so two sections of one type on a page never share one.

### TypeScript

Type parameters and return values, avoid `any`, use `interface` for object shapes.
`npm run check` runs `astro check`, which type-checks `.astro` templates too.

### Styling

Colour comes from the tokens in `src/styles/global.css` — `larch`, `larch-deep`,
`needle`, `espresso`, `ink`, `mist`, `paper`, `surface`, `stamp`, `border` and the
`roast-*` bag colours. Never a hex or arbitrary colour value in a component, so a
rebrand stays a one-file change. Gold (`needle`) is text only on `larch` or
`espresso`. Blocks fade up as they scroll into view with the CSS-only `reveal`
utility; it is off for reduced motion. There is no `tailwind.config.js`
(Tailwind v4 is CSS-first) and adding one does nothing.

### Accessibility

One `<h1>` per page: the Hero title on Sanity pages; posts, the blog index and archives, the
contact result pages and the 404 render their own. Interactive things are `<button>` or `<a>`.
Icon-only controls need an accessible name. Every page starts with a "Skip to
content" link. Never remove a focus outline without replacing it.

---

## Git Flow

### Branches

`feat/…` · `fix/…` · `refactor/…` · `docs/…` · `chore/…`

Branch off `dev` and open the pull request against `dev`. `dev` is merged into
`main` for a release. Direct pushes to `main` are blocked by the pre-push hook.

### Commits

[Conventional Commits](https://www.conventionalcommits.org/), enforced by
commitlint:

```
feat: add pricing page
fix: give the mobile menu an accessible name
chore: update dependencies
```

### Quality gates

| Stage      | Runs                                                                                                                                      |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| pre-commit | lint-staged (eslint --fix + prettier), then `astro check`                                                                                 |
| commit-msg | commitlint — Conventional Commits                                                                                                         |
| pre-push   | blocks push to `main`, then format + lint + check + `npm test` + build                                                                    |
| CI         | check + lint + format + build + `npm test`, and the importer's type check and Vitest, on every pull request and on push to `main` / `dev` |

---

## Scripts

```bash
npm run dev              # Dev server → http://localhost:4321
npm run build            # Production build
npm run preview          # Preview the production build
npm run preview:deploy   # Build as a preview of the current branch (noindex) and run wrangler preview

npm run check            # astro check — types + .astro templates
npm run lint             # ESLint
npm run lint:fix         # Auto-fix
npm run format           # Prettier
npm run format:check     # Prettier, check only
npm run verify           # check + lint + format:check + npm test

npm run credits            # Rebuild CREDITS.md
npm run seo:crawl          # Crawl the WordPress "before" site (SEO snapshot)
npm run seo:compare        # Check every old URL against the new site (default: wrangler dev on :8787)
npm run rebuild:watch      # Measure publish → live time against production (docs/after/rebuild-times.json)
npm test                   # Unit tests: Worker handlers, redirect rules, src/lib helpers (node --test)
npm run rag:passages       # Build the assistant's passages without indexing; fails on a leak
npm run rag:inspect        # Compare the production vector index with the current content
npm run rag:eval           # Ask the live assistant 22 test questions; production → docs/after/rag-eval.json
npm run lighthouse:run     # Run the paired Lighthouse session (WordPress + local Astro) into the inboxes
npm run lighthouse:import  # File saved Lighthouse JSON reports into docs/
npm run studio             # Sanity Studio at http://localhost:3333 (first time: npm install --prefix studio)
npm run studio:typegen     # Regenerate src/lib/sanity/sanity.types.ts after a schema change
```

---

## Deployment

Output is **static** — every page is prerendered at build time, with
`trailingSlash: 'always'` and `build.format: 'directory'`, so every URL keeps
WordPress's trailing slash. There is no Astro adapter: `dist/` is plain static
files.

**Cloudflare Workers Static Assets**, configured in `wrangler.jsonc` and built by
Workers Builds from GitHub. Every push to `main` builds (`npm run build`) and deploys
(`npx wrangler deploy`); pushes to other branches get a preview (`npx wrangler preview`).
Cloudflare's build fetches `wrangler` itself, so the repo doesn't depend on it. Response
headers (asset caching and security headers) live in `public/_headers`. Production is
indexable; preview builds add `X-Robots-Tag: noindex` (the `previewNoindex()` integration
appends it to `dist/_headers` when `WORKERS_CI_BRANCH` is not `main`). A local build has no
`WORKERS_CI_BRANCH` and is built as production, so deploy a preview by hand only with
`npm run preview:deploy`: it refuses on `main`, sets the variable to the current branch, builds and
runs `npx wrangler preview`.

**Assistant (one-time).** Create the Vectorize index `larchwick-content` with 768 dimensions and
the cosine metric (`npx wrangler vectorize create larchwick-content --dimensions=768 --metric=cosine`).
`main` builds refresh it with the Workers Builds build token (or `RAG_INDEX_TOKEN`, if set), which
needs Workers AI and Vectorize read and write: the build lists the index's ids before it writes.
Set the Anthropic key as a secret for production (`npx wrangler secret put ANTHROPIC_API_KEY`) and
for previews (`npx wrangler preview secret put ANTHROPIC_API_KEY`), and set a monthly spend limit
in the Anthropic console: the rate limits cap questions a minute (10 per visitor, 60 for everyone
per Cloudflare location), not a total, so one address can still spend roughly $40–90 a day. Once
the limit is reached the assistant answers "unavailable" until the month resets. After the first
`main` build, look for "indexing failed" in its log (the site deploys anyway, so nothing else
shows it) and run `npm run rag:inspect` to compare the index with the content.

**Contact form (one-time).** Set `npx wrangler secret put RESEND_API_KEY`, `… CONTACT_TO` and,
for the branded email, `… RESEND_TEMPLATE_ID`; previews need their own
(`npx wrangler preview secret put NAME`). Never add them as plain-text variables in the dashboard:
every deploy replaces variables with `wrangler.jsonc`'s, so they vanish and every message lands
on `/contact/error/` (that is how `CONTACT_TO` disappeared once). The form allows 2 messages a
minute per visitor and has no daily cap, so a single script on one address can use up Resend's
free 100 a day in about 50 minutes; after that, real messages land on the error page too
(PLAN.md D-27).

Optional: to serve the build locally the way Cloudflare does (trailing-slash redirects,
the 404 page, `_headers`), run `npm run build && npx wrangler dev`. npx downloads wrangler on
first use.

Set the real URL in `src/lib/config/site.ts` before deploying — the sitemap and
every canonical/OG URL come from it.

### Environment variables

`npm run dev` and `npm run build` need none: the Sanity project, dataset and API version are
constants in `studio/env.ts`, and the dataset is public. Two optional local files, both
gitignored, each with a committed example:

- `.env` (from `.env.example`): `SANITY_WRITE_TOKEN`, for the import script and one-off content
  writes.
- `.dev.vars` (from `.dev.vars.example`): read by `npx wrangler dev` to run the Worker locally,
  with the contact form's Resend settings and `ANTHROPIC_API_KEY` for the assistant. The AI and
  Vectorize bindings are remote, so a local `/api/chat` queries the real index (read-only) after
  `npx wrangler login`.

In production the same names are Cloudflare secrets (`npx wrangler secret put NAME`, never a
plain-text dashboard variable). `WORKERS_CI_BRANCH` (set by Workers Builds,
or by `npm run preview:deploy`) and `RAG_INDEX` (set by `npm run rag:passages`) are never put in a
file.

## Importing from WordPress

`scripts/import-wp/` moves a WordPress site into Sanity. It reads a standard WordPress export
(**Tools → Export → All content**), so it needs no plugin, no Application Password and no change
to WordPress. Images are downloaded from the old site with plain GET requests.

```bash
npm install --prefix scripts          # once: the importer's own packages
npm run import:wp                     # dry run: writes the report, changes nothing in Sanity
npm run import:wp -- --write          # uploads missing images, then creates/patches documents
npm run import:wp -- --write          # again: reports 0 mutations
npm --prefix scripts test             # Vitest: one test per WordPress edge case
```

`--write` needs `SANITY_WRITE_TOKEN` (an Editor token) in `.env`. Other flags:
`--only=media,taxonomy,posts,pages,settings,redirects`, `--limit=N` (first N posts and pages),
`--wxr=<path>` and `--origin=<old site URL>`. Every run writes `docs/import-report.md`,
`docs/import-report.json` and `docs/redirect-map.csv`.

What it does:

- **Posts** become Portable Text: headings, nested lists, links, images with alt text and
  captions, galleries, tables and quotes (a trailing "— Name" becomes the citation; pull quotes
  and old-style quotes are read whether their text sits in inner blocks or plain `<p>` tags, and a
  quote with no text is reported). Shortcodes can't live in rich text, so they are dropped and
  reported.
- **Pages** become sections: a cover → hero, media-text → image and text, titled columns →
  features or cards, bold one-line lists → numbers, `details` under H2s → one FAQ, an ordered
  "Title: text" list → steps, a coloured box with buttons → call to action, the Contact Form 7
  shortcode → the contact form (its details go to Site settings), italic "fictional" notes →
  disclaimers. Anything else stays a text section with a warning.
- **Links** lose the old origin, get a trailing slash, and old post URLs move under `/blog/`.
- **Redirects** (301, one hop): old post URLs, old slugs, `/home/` and every attachment page.
- **Idempotent**: documents get stable ids (`wp-post-<id>`, `wp-page-<id>`, …) and stable keys,
  and only changed fields the importer owns are written. Pages built with Elementor keep their
  title, slug and SEO from WordPress; their sections are built by hand and never overwritten.

To point it at another WordPress site, export its WXR, set `--origin`, write
`scripts/import-wp/alt-text.json` (keyed by media ID), and adjust the Astra colour → background
map in `sections.ts` if the theme differs.

---

## Documentation

- [Structure](./docs/STRUCTURE.md) — folders, the section contract, where code goes
- [Pages](./docs/pages/README.md) — one doc per page, written for PM/QA/clients
- [Project](./docs/internal/PROJECT.md) — routes, status, what is still placeholder
