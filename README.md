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
2. `src/styles/global.css` — the 9 brand colour tokens (`brand`, `brand-dark`,
   `heading`, `body`, `surface`, `canvas`, `dark`, `subtle`, `border`).
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

A page ships **zero JavaScript**: no view transitions, no prefetch script, no
islands, and no React. The only `<script>` in the HTML is the JSON-LD data block.

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

Colour comes from the brand tokens in `src/styles/global.css` — `brand`,
`brand-dark`, `heading`, `body`, `surface`, `canvas`, `dark`, `subtle`, `border`,
`shadow-soft`, `shadow-card`. Never a hex or arbitrary value in a component, so a
rebrand stays a one-file change. Text on a coloured fill is white on `brand-dark`
(5.73:1), never on `brand`. There is no `tailwind.config.js`
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
npm run lighthouse:import  # File saved Lighthouse JSON reports into docs/
```

---

## Deployment

Output is **static** — every page is prerendered at build time, with
`trailingSlash: 'always'` and `build.format: 'directory'`, so every URL keeps
WordPress's trailing slash. There is no Astro adapter: `dist/` is plain static
files.

**Cloudflare** — the site is headed for Cloudflare Workers Static Assets, built by
Workers Builds from GitHub (Phase 2c in [PLAN.md](./PLAN.md)).

Set the real URL in `src/lib/config/site.ts` before deploying — the sitemap and
every canonical/OG URL come from it.

### Environment variables

Add them to `.env` (copied from `.env.example`). Variables prefixed with `PUBLIC_`
can reach client code; the others are read at build time only. There is no
server, so anything a page renders is baked into the static HTML.

---

## Documentation

- [Structure](./docs/STRUCTURE.md) — folders, the section contract, where code goes
- [Pages](./docs/pages/README.md) — one doc per page, written for PM/QA/clients
- [Project](./docs/internal/PROJECT.md) — routes, status, what is still placeholder
