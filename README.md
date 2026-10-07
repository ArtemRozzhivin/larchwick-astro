# Astro Landing Template

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
- [Docker](#docker)

---

## Getting Started

**Prerequisites:** Node.js 20+, npm, Git.

```bash
git clone <repo-url>
cd your-project
npm install          # also installs the git hooks (husky)
cp .env.example .env
npm run dev          # → http://localhost:4321
```

### First five minutes on a new project

1. `src/lib/config/site.ts` — name, URL, description, OG image, nav, social,
   footer links. Everything else derives from this, including the sitemap and every
   canonical/OG URL.
2. `src/styles/global.css` — the `primary-*` / `secondary-*` / `accent-*` colour
   scales.
3. `src/lib/content/home.ts` — the home page copy.
4. `public/favicon.svg` and `public/og.png`.

---

## Building a Page

**1. Write the copy** — `src/lib/content/<page>.ts`:

```ts
export const pricing = {
  hero: { title: 'Simple pricing', primaryCta: { label: 'Start free', href: '#plans' } },
  faq: { title: 'Questions', items: [{ question: '…', answer: '…' }] },
} as const
```

**2. Compose the page** — `src/pages/<page>.astro`:

```astro
---
import FAQ from '@components/sections/FAQ.astro'
import Hero from '@components/sections/Hero.astro'
import { pricing } from '@lib/content/pricing'
import Layout from '@layouts/Layout.astro'
---

<Layout title="Pricing" description="Simple plans for every team.">
  <Hero {...pricing.hero} />
  <FAQ {...pricing.faq} />
</Layout>
```

That is the whole page — `Layout` already handles the head, SEO, header, and footer.

**3. Only if no section fits**, add one to `src/components/sections/`. Copy the
closest existing block; keep the [section contract](./docs/STRUCTURE.md#section-contract).

---

## Available Sections

`src/components/sections/`

| Component      | For                                    | Key props                                                            |
| -------------- | -------------------------------------- | -------------------------------------------------------------------- |
| `Section`      | layout primitive every block sits on   | `id`, `eyebrow`, `title`, `subtitle`, `align`, `tone`                |
| `Header`       | sticky nav + mobile menu, zero JS      | `cta`                                                                |
| `Hero`         | above the fold                         | `eyebrow`, `title`, `subtitle`, `primaryCta`, `secondaryCta`, `note` |
| `Logos`        | social-proof strip                     | `title`, `items`                                                     |
| `Features`     | value props in a grid                  | `eyebrow`, `title`, `subtitle`, `items`, `columns`                   |
| `Testimonials` | quotes                                 | `eyebrow`, `title`, `items`                                          |
| `FAQ`          | accordion, native `<details>`, zero JS | `eyebrow`, `title`, `items`                                          |
| `CTA`          | closing conversion block               | `title`, `subtitle`, `primaryCta`, `secondaryCta`                    |
| `Footer`       | links + social, from `siteConfig`      | none                                                                 |

`Header` and `Footer` are rendered by `Layout`. Turn them off per page with
`showHeader={false}` / `showFooter={false}`.

See [`/`](./src/pages/index.astro) for a page using all of them.

---

## Project Structure

```
src/
├── pages/                 Routes — one file per URL, composition only
│   ├── index.astro        Home: Layout + sections
│   ├── 404.astro
│   └── robots.txt.ts      Generated from siteConfig at build time
├── layouts/Layout.astro   <head>, SEO, JSON-LD, Header, Footer
├── components/
│   ├── sections/          The page blocks
│   └── ui/                Primitives — button, input, Icon
├── lib/
│   ├── config/site.ts     Brand, URL, nav, social — single source of truth
│   ├── content/           Copy, one file per page
│   ├── types/             Shared types
│   └── utils/             cn() and friends
└── styles/global.css      Tailwind v4 @theme tokens
```

Full detail, including where new code goes: [docs/STRUCTURE.md](./docs/STRUCTURE.md).

### Aliases

```
@lib  @lib/*  @components/*  @layouts/*  @assets/*  @content/*
```

Use an alias whenever an import crosses a folder; keep relative imports inside one
folder.

---

## Performance

A page ships **~4.5 kB gzip** — the view-transition script, and nothing else. Pass
`viewTransitions={false}` on a single-page landing and it ships zero JavaScript.

That is protected by one rule: **HTML → CSS → a React island, in that order.**

- FAQ accordion and mobile menu — `<details>` / `<summary>`, no JS
- Icons — `lucide-react` rendered on the server as inline SVG, no JS
- Motion — CSS transitions and the keyframes in `global.css`

React is available. A component only hydrates when a page adds an explicit
`client:` directive — prefer `client:visible` or `client:idle` over `client:load`.

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

Colour comes from tokens in `src/styles/global.css` — `primary-*`, `secondary-*`,
`accent-*`, `shadow-soft`, `shadow-card`. Never a hex or arbitrary value in a
component, so a rebrand stays a one-file change. There is no `tailwind.config.js`
(Tailwind v4 is CSS-first) and adding one does nothing.

`cn()` from `@lib/utils` for conditional classes in `.tsx`.

### Accessibility

One `<h1>` per page (the Hero title). Interactive things are `<button>` or `<a>`.
Icon-only controls need an accessible name. Never remove a focus ring without
replacing it.

---

## Git Flow

### Branches

`feat/…` · `fix/…` · `refactor/…` · `docs/…` · `chore/…`

Direct pushes to `main` are blocked by the pre-push hook.

### Commits

[Conventional Commits](https://www.conventionalcommits.org/), enforced by
commitlint:

```
feat: add pricing page
fix: give the mobile menu an accessible name
chore: update dependencies
```

### Quality gates

| Stage      | Runs                                                      |
| ---------- | --------------------------------------------------------- |
| pre-commit | lint-staged (eslint --fix + prettier), then `astro check` |
| commit-msg | commitlint — Conventional Commits                         |
| pre-push   | blocks push to `main`, then format + lint + check + build |
| CI         | check + lint + format + build on every pull request       |

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
```

---

## Deployment

Output is **static** — every page is prerendered at build time, which is what makes
a landing fast. A single page can opt into on-demand rendering with
`export const prerender = false`; the site mode stays static.

**Vercel** — `astro.config.ts` uses `@astrojs/vercel`. Push to the connected
project; no extra config.

**Anywhere else** — swap the adapter in `astro.config.ts`, or drop it entirely and
serve `dist/` from any static host. See the
[Astro deployment guides](https://docs.astro.build/en/guides/deploy/).

Set the real URL in `src/lib/config/site.ts` before deploying — the sitemap and
every canonical/OG URL come from it.

---

## Docker

Run the project without a local Node install.

```bash
cp .env.example .env
docker compose up dev     # dev server with hot reload → http://localhost:4321
docker compose up app     # production server
```

The production image uses `@astrojs/node` in standalone mode via
`astro.config.docker.ts` (multi-stage build). Keep that config in sync with
`astro.config.ts` when changing integrations.

```bash
npm run docker:dev    # dev container
npm run docker:build  # build the production image
npm run docker:start  # run the production container
```

### Environment variables

Add them to `.env` (copied from `.env.example`). Variables prefixed with `PUBLIC_`
are exposed to the client; everything else stays server-side.

---

## Documentation

- [Structure](./docs/STRUCTURE.md) — folders, the section contract, where code goes
- [Pages](./docs/pages/README.md) — one doc per page, written for PM/QA/clients
- [Project](./docs/internal/PROJECT.md) — routes, status, what is still placeholder
