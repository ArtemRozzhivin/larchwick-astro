---
name: landing
description: How to build and ship a landing page in THIS Astro template fast — the section blocks available, the content-first workflow, the section contract for new blocks, SEO wiring, and the zero-JavaScript rules. Load whenever the task is building or editing a page, a section, a hero, a CTA, copy, or anything marketing-site shaped.
---

# Building a landing page here

<prime_directive>
Two goals, in this order: the page loads fast, and the next page takes an hour.

Both come from the same rule — **a page is a Layout plus an ordered list of section components, and all copy lives in a content file.** Nothing in a section component is page-specific.

The site ships zero client JavaScript. Every section here is static `.astro`, and there is no React. If something seems to need interactivity, check whether HTML or CSS already does it, and ask before writing any script.
</prime_directive>

<fast_path>
Building a page, in order. Do not skip step 0.

**0. Look at what exists.**

```
ls src/components/sections
ls src/lib/content
```

**1. Write the copy** — `src/lib/content/<page>.ts`, one exported object, `as const`:

```ts
export const pricing = {
  hero: { title: '…', subtitle: '…', primaryCta: { label: '…', href: '#plans' } },
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

<Layout title="Pricing" description="Simple plans for every team.">
  <Hero {...pricing.hero} />
  <FAQ {...pricing.faq} />
</Layout>
```

That is the whole page. `Layout` already handles the head, SEO, header, and footer.

**3. Only if no section fits**, add one — see `<section_contract>`.

Reference: `src/pages/index.astro` + `src/lib/content/home.ts`.
</fast_path>

<available_sections>
`src/components/sections/`

| Component            | For                                   | Key props                                         |
| -------------------- | ------------------------------------- | ------------------------------------------------- |
| `Section.astro`      | layout primitive every block sits on  | `id`, `eyebrow`, `title`, `subtitle`, `align`, `tone` |
| `Header.astro`       | sticky nav, mobile menu, zero JS      | `cta`                                             |
| `Hero.astro`         | above-the-fold                        | `eyebrow`, `title`, `subtitle`, `primaryCta`, `secondaryCta`, `note` |
| `Features.astro`     | value props in a grid                 | `eyebrow`, `title`, `subtitle`, `items`, `columns` |
| `FAQ.astro`          | accordion, native `<details>`, zero JS | `eyebrow`, `title`, `items`                       |
| `CTA.astro`          | closing conversion block              | `title`, `subtitle`, `primaryCta`, `secondaryCta` |
| `Footer.astro`       | nav, email, demo label, from siteConfig | none                                            |

`Header` and `Footer` are rendered by `Layout` automatically. Turn them off per page with `showHeader={false}` / `showFooter={false}`.

`Section.astro` owns the container width, vertical rhythm, and the eyebrow/title/subtitle header. Build a new block on it instead of re-doing padding.
</available_sections>

<section_contract>
A new section must follow the same shape, or blocks stop being interchangeable:

- typed `interface Props` in the frontmatter; `readonly` arrays for list content
- **all copy arrives via props** — never bake text into the component
- optional `id` with a sensible default, so in-page anchors work
- built on `Section.astro` unless it needs a full-bleed layout
- static markup, no `client:` directive
- tokens only for colour (`primary-*`, `secondary-*`, `accent-*`, `shadow-soft`, `shadow-card`)

Copy the closest existing section as the starting point rather than writing one from scratch.
</section_contract>

<zero_js>
Every page ships zero JavaScript: no view transitions, no prefetch script, no islands. Keep it that way.

Already solved without JS in this repo — reuse these patterns:

- **Accordion / FAQ** → `<details>` + `<summary>`, styled with `group-open:`
- **Mobile menu** → same `<details>` pattern (see `Header.astro`)
- **Icons** → `Icon.astro`, inline SVG by name (Lucide paths, ISC), no runtime
- **Motion** → CSS transitions and the `animate-slide-up` keyframes in `global.css`
- **Smooth scroll** → `scroll-smooth` on `<html>`, plain `#anchor` links
- **Forms** → a plain HTML `<form method="post">` with native validation

There is no React and no `client:` directive. If a component seems to need state or event handling, stop and ask: a small Astro `<script>` or a UI framework is an architecture decision.
</zero_js>

<seo>
`Layout.astro` already emits title, description, canonical, OpenGraph, Twitter cards, and Organization JSON-LD. Per page, pass `title` and `description` — that is usually all that is needed.

- `siteConfig` (`src/lib/config/site.ts`) is the single source for name, URL, OG image, nav, contact details, and the footer's demo label and copyright. `astro.config.ts` reads `site` from it, so the sitemap and every absolute URL follow automatically.
- `src/pages/robots.txt.ts` generates robots.txt with the right sitemap URL at build time.
- Set `noIndex` on pages that should stay out of search (thank-you pages, the 404).
- Every page needs exactly one `<h1>` — that is the `Hero` title. Section headings are `<h2>`. Card titles are `<h3>` under a section title and `<h2>` when the section has none, so no level is skipped.
- `trailingSlash: 'always'`: every internal link ends in `/` (`/about/`, never `/about`).
  </seo>

<images>
Use `astro:assets` for anything in `src/assets/`:

```astro
---
import { Image } from 'astro:assets'
import hero from '../assets/hero.png'
---

<Image src={hero} alt="…" widths={[480, 960, 1440]} loading="eager" />
```

It emits width/height (no layout shift), modern formats, and a srcset.

- Above the fold → `loading="eager"`; everything else → `loading="lazy"` (the default).
- Raw `<img>` is only for files already in `public/`, and then always with explicit `width`, `height`, `loading`, and `decoding`.
- `alt=""` for decorative images, real text for meaningful ones.
  </images>

<checklist>
Before calling a page done:

- [ ] copy lives in `src/lib/content/`, not in components
- [ ] no brand name, URL, or contact detail hardcoded — those come from `siteConfig`
- [ ] exactly one `<h1>`
- [ ] `title` and `description` passed to `Layout` (the home page may rely on the `siteConfig` name/description defaults)
- [ ] every image has dimensions and an `alt`
- [ ] no `client:` directive and no `<script>` other than JSON-LD
- [ ] `npm run verify` and `npm run build` pass
      </checklist>
