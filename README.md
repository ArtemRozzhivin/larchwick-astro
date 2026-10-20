# Larchwick Coffee Roasters — WordPress → Astro + Sanity

> **Demo project — fictional business.** Larchwick Coffee Roasters is not a real company. This is
> a personal portfolio project: a WordPress site migrated to Astro + Sanity on Cloudflare Workers.

The migration is in progress: see [PLAN.md](./PLAN.md) for the plan and the tracker. Image and
font credits are in [CREDITS.md](./CREDITS.md), and the code is MIT-licensed ([LICENSE](./LICENSE)).

---

## Built on: Astro landing template

A starter for marketing sites and landing pages. Static-first Astro with
ready-made section blocks, SEO already wired, and quality gates in place.

A page here is **a Layout plus an ordered list of sections, with all copy in one
content file** — which is why the next landing takes an hour, not a day.

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

1. `src/lib/config/site.ts` — name, URL, description, OG image, nav, contact
   details, footer. Everything else derives from this, including the sitemap and
   every canonical/OG URL.
2. `src/styles/global.css` — the "Larch and label" colour, radius and shadow
   tokens (`larch`, `needle`, `espresso`, `paper`, `surface` and the rest).
   `astro.config.ts` — the two self-hosted fonts (Astro Fonts API).
3. `src/lib/content/home.ts` — the home page copy.
4. `public/favicon.svg` and `public/og.jpg` (1200×630).

---

## Building a Page

**1. Write the copy** — `src/lib/content/<page>.ts`:

```ts
export const pricing = {
  seo: { title: 'Pricing | Larchwick', description: 'Plans and prices.' },
  hero: { title: 'Simple pricing', primaryCta: { label: 'Start free', href: '#plans' } },
  faq: { title: 'Questions', items: [{ question: '…', answer: '…' }] },
} as const
```

**2. Compose the page** — `src/pages/<page>.astro`:

```astro
---
import { pricing } from '@lib/content/pricing'
import FAQ from '@components/sections/FAQ.astro'
import Hero from '@components/sections/Hero.astro'
import Layout from '@layouts/Layout.astro'
---

<Layout {...pricing.seo}>
  <Hero {...pricing.hero} />
  <FAQ {...pricing.faq} />
</Layout>
```

That is the whole page — `Layout` already handles the head, SEO, fonts, header, and footer.

**3. Only if no section fits**, add one to `src/components/sections/`. Copy the
closest existing block; keep the [section contract](./docs/STRUCTURE.md#section-contract).

---

## Available Sections

`src/components/sections/`

| Component  | For                                    | Key props                                                              |
| ---------- | -------------------------------------- | ---------------------------------------------------------------------- |
| `Section`  | layout primitive every block sits on   | `id`, `eyebrow`, `title`, `subtitle`, `align`, `tone`                  |
| `Header`   | nav with active state + mobile menu    | none (reads `siteConfig`)                                              |
| `Hero`     | above the fold, dark band              | `eyebrow`, `title`, `subtitle`, `primaryCta`, `secondaryCta`, `points` |
| `Features` | value props in a grid                  | `eyebrow`, `title`, `subtitle`, `items`, `columns`                     |
| `FAQ`      | accordion, native `<details>`, zero JS | `eyebrow`, `title`, `items`                                            |
| `CTA`      | closing conversion block               | `title`, `subtitle`, `primaryCta`, `secondaryCta`                      |
| `Footer`   | nav, contact, hours, demo label        | none (reads `siteConfig`)                                              |

`Header` and `Footer` are rendered by `Layout` on every page, the 404 included.

See [`/`](./src/pages/index.astro) for a page built from `Hero`, `Features` and `CTA`.

---

## Project Structure

```
src/
├── pages/                 Routes — one file per URL, composition only
│   ├── index.astro        Home: Layout + sections
│   ├── 404.astro
│   └── robots.txt.ts      Generated from siteConfig at build time
├── layouts/Layout.astro   <head>, SEO, fonts, JSON-LD, Header, Footer
├── components/
│   ├── sections/          The page blocks
│   └── ui/                Primitives — button classes (cva), Icon
├── lib/
│   ├── config/site.ts     Brand, URL, nav, contact — single source of truth
│   ├── content/           Copy, one file per page
│   ├── seo/               JSON-LD builders
│   └── types/             Shared types
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
islands, and no React. The one exception is the "Ask Larchwick" assistant: a 1.9 KB loader
on every page and a 3.6 KB chat module that downloads only when the panel opens.

That is protected by one rule: **HTML → CSS → ask first.**

- FAQ accordion and mobile menu — `<details>` / `<summary>`, no JS
- Icons — inline SVG from `Icon.astro` (Lucide paths, ISC), no JS
- Fonts — self-hosted woff2 through the Astro Fonts API, no Google Fonts request

Images in `src/assets/` go through `astro:assets` `<Image>`, which emits
width/height, modern formats, and a srcset:

```astro
<Image src={hero} alt="…" widths={[480, 960, 1440]} loading="eager" />
```

---

## Coding Standards

### Astro components

Frontmatter order: imports → `interface Props` → destructure `Astro.props` →
derived constants. Conditional classes use `class:list`.

```astro
---
interface Props {
  id?: string
  title: string
  items: readonly { label: string }[]
}

const { id = 'features', title, items } = Astro.props
---
```

Content arrays are `readonly` — content files are `as const`.

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

One `<h1>` per page (the Hero title). Interactive things are `<button>` or `<a>`.
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

| Stage      | Runs                                                                              |
| ---------- | --------------------------------------------------------------------------------- |
| pre-commit | lint-staged (eslint --fix + prettier), then `astro check`                         |
| commit-msg | commitlint — Conventional Commits                                                 |
| pre-push   | blocks push to `main`, then format + lint + check + build                         |
| CI         | check + lint + format + build on every pull request and on push to `main` / `dev` |

---

## Scripts

```bash
npm run dev              # Dev server → http://localhost:4321
npm run build            # Production build
npm run preview          # Preview the production build

npm run check            # astro check — types + .astro templates
npm run lint             # ESLint
npm run lint:fix         # Auto-fix
npm run format           # Prettier
npm run format:check     # Prettier, check only
npm run verify           # check + lint + format:check

npm run credits            # Rebuild CREDITS.md
npm run seo:crawl          # Crawl the WordPress "before" site (SEO snapshot)
npm run seo:compare        # Check every old URL against the new site (default: wrangler dev on :8787)
npm test                   # Unit tests: contact Worker and redirect rules (node --test)
npm run rag:passages       # Build the assistant's passages without indexing; fails on a leak
npm run rag:inspect        # Compare the production vector index with the current content
npm run rag:eval           # Ask the live assistant 22 test questions; production → docs/after/rag-eval.json
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
appends it to `dist/_headers` when `WORKERS_CI_BRANCH` is not `main`).

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

In production the same names are Cloudflare secrets. `WORKERS_CI_BRANCH` (set by Workers Builds)
and `RAG_INDEX` (set by `npm run rag:passages`) are never put in a file.

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
  captions, galleries, tables and quotes (a trailing "— Name" becomes the citation). Shortcodes
  can't live in rich text, so they are dropped and reported.
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
