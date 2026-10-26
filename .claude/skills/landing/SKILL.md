---
name: landing
description: How to build and ship a landing page in THIS Astro template fast — the section blocks available, the content-first workflow, the section contract for new blocks, SEO wiring, and the zero-JavaScript rules. Load whenever the task is building or editing a page, a section, a hero, a CTA, copy, or anything marketing-site shaped.
---

# Building a landing page here

<prime_directive>
Two goals, in this order: the page loads fast, and the next page takes an hour.

Both come from the same rule — **a page is a Layout plus an ordered list of section components, and its content lives in Sanity.** Nothing in a section component is page-specific; fixed copy that isn't content (labels, the contact result pages, the 404) lives in `src/lib/content/`.

The only client JavaScript is the "Ask Larchwick" assistant's panel and the analytics consent banner. Every section here is static `.astro`, and there is no React. If something seems to need interactivity, check whether HTML or CSS already does it, and ask before writing any script.
</prime_directive>

<fast_path>
Building a page, in order. Do not skip step 0.

**0. Look at what exists.**

```
ls src/components/sections studio/schemaTypes/sections
grep -n "case '" src/components/sections/SectionRenderer.astro
```

**1. A new page needs no code.** Create a `page` document in Sanity Studio (`npm run studio`), give it a slug, add sections, publish. `src/pages/[slug].astro` builds it at `/<slug>/`; the publish triggers the rebuild. Home is the page with slug `home` (`src/pages/index.astro`); the blog index has its own route.

**2. How a page renders** — `src/pages/[slug].astro`, in short:

```astro
---
const page = await sanityFetch<PAGE_QUERY_RESULT>(PAGE_QUERY, { slug })
const seo = layoutSeo(page.seo, { title: `${page.title} | ${siteConfig.name}` })
---

<Layout {...seo}>
  <SectionRenderer sections={page.sections ?? []} />
</Layout>
```

`SectionRenderer.astro` has one `case` per section `_type` and spreads the Sanity object into the component (`<FAQ {...section} groups={section.groups ?? []} />`), which is why component props use the schema's field names. `Layout` already handles the head, SEO, fonts, skip link, consent banner, header, footer and chat panel.

**3. Only if no section type fits**, add one: a schema in `studio/schemaTypes/sections/` (added to `sectionTypes` in its `index.ts`; `SECTION_TYPES` is built from it), a component in `src/components/sections/` (see `<section_contract>`), a `case` in `SectionRenderer.astro`, then `npm run studio:typegen`.

Reference: `src/pages/[slug].astro` + `src/components/sections/SectionRenderer.astro`; editor steps in `docs/editor-guide.md`.
</fast_path>

<available_sections>
`src/components/sections/`, by the Sanity section type that renders them:

| Sanity type    | Component           | For                                              | Key props                                                       |
| -------------- | ------------------- | ------------------------------------------------ | --------------------------------------------------------------- |
| `hero`         | `Hero.astro`        | the larch band with the H1 (full-bleed)          | `variant`, `eyebrow`, `heading`, `text`, `image`, `label`, `primaryCta`, `secondaryCta`, `trustList` |
| `textBlock`    | `TextBlock.astro`   | rich text                                        | `eyebrow`, `heading`, `body`, `tone`                            |
| `imageText`    | `ImageText.astro`   | photo beside rich text                           | `eyebrow`, `heading`, `body`, `image`, `imagePosition`, `cta`, `tone` |
| `featureGrid`  | `Features.astro`    | value props with icons                           | `eyebrow`, `heading`, `intro`, `items`, `tone`                  |
| `stats`        | `Stats.astro`       | big numbers                                      | `eyebrow`, `heading`, `items`, `tone`                           |
| `cardGrid`     | `CardGrid.astro`    | label cards or coffee bags                       | `eyebrow`, `heading`, `intro`, `cards`, `layout`, `cta`, `tone` |
| `priceTable`   | `PriceTable.astro`  | price list                                       | `eyebrow`, `heading`, `intro`, `rows`, `note`, `tone`           |
| `faq`          | `FAQ.astro`         | accordion, native `<details>`, zero JS           | `eyebrow`, `heading`, `intro`, `groups`, `tone`                 |
| `steps`        | `Steps.astro`       | numbered steps                                   | `eyebrow`, `heading`, `intro`, `items`, `tone`                  |
| `latestPosts`  | `LatestPosts.astro` | newest posts                                     | `eyebrow`, `heading`, `count`, `cta`, `tone`                    |
| `cta`          | `CTA.astro`         | closing band (gold, white or larch)              | `heading` or `quote` + `citation`, `text`, `primaryCta`, `secondaryCta`, `tone` |
| `contactForm`  | `ContactForm.astro` | plain POST form + contact details                | `heading`, `intro`, `showContactDetails`, `tone`                |
| `quote`        | `PullQuote.astro`   | a large quote                                    | `text`, `citation`, `tone`                                      |

Every one takes an optional `id` (no default). Not section types: `Section.astro` (the layout primitive: `eyebrow`, `heading`, `intro`, `align`, `width`, `tone`), `SectionHeader.astro` (its eyebrow/heading/intro header, coloured for the tone), and `Header.astro` / `Footer.astro` (no props; they read Site settings and `siteConfig`), which `Layout` renders on every page, the 404 included.

Buttons: `buttonVariants({ variant, size })` from `src/components/ui/button.ts` — `primary` / `secondary` on light bands, `accent` / `inverse-outline` on larch ones. A row of large buttons from Sanity links is `CtaButtons.astro` (it keeps the `cta_click` tracking); icon-only buttons use `iconButtonVariants`, text fields `fieldVariants` (`ui/field.ts`), inline links and pills `inlineLinkClass` / `pillVariants()` (`ui/link.ts`).

`Section.astro` owns the container width, vertical rhythm, and the eyebrow/heading/intro header. Build a new block on it instead of re-doing padding.
</available_sections>

<section_contract>
A new section must follow the same shape, or blocks stop being interchangeable:

- typed `interface Props` in the frontmatter; `readonly` arrays for list content
- **all copy arrives via props** — never bake text into the component
- optional `id` with no default (a fixed default would give two sections of one type on a page the same id)
- built on `Section.astro` unless it needs a full-bleed layout
- static markup, no `client:` directive
- tokens only for colour (`larch`, `larch-deep`, `needle`, `espresso`, `ink`, `mist`, `paper`, `surface`, `stamp`, `border`, `roast-*`, `shadow-label`)
- headings in `font-display` (Big Shoulders Display, 600–900), set heavy and tight
- a `tone` prop typed `LightTone` (from `Section.astro`) and `lightToneField` in the schema, unless every colour in the block works on the dark larch band

Copy the closest existing section as the starting point rather than writing one from scratch.
</section_contract>

<zero_js>
Pages ship no JavaScript of their own: no view transitions, no prefetch script, no islands. The assistant's loader (and its chat module) and the consent banner's script are the only exceptions. Keep it that way.

Already solved without JS in this repo — reuse these patterns:

- **Accordion / FAQ** → `<details>` + `<summary>`, styled with `group-open:`
- **Mobile menu** → a native `popover` sidebar opened by `popovertarget`, animated with `@starting-style` (`Header.astro`, `.drawer` in `global.css`)
- **Icons** → `Icon.astro`, inline SVG by name (Lucide paths, ISC), no runtime
- **Motion** → CSS transitions; respect `motion-safe:` / `motion-reduce:`
- **Smooth scroll** → `motion-safe:scroll-smooth` on `<html>`, plain `#anchor` links
- **Active nav link** → `aria-current` computed at build time in `Header.astro`
- **Forms** → a plain HTML `<form method="post">` with native validation

There is no React and no `client:` directive. If a component seems to need state or event handling, stop and ask: a small Astro `<script>` or a UI framework is an architecture decision.
</zero_js>

<seo>
`Layout.astro` emits the exact `title` (nothing is appended), description, robots, canonical, Open Graph (the image at its real size, and its alt when known) and `twitter:card`. Per page, spread `layoutSeo(document.seo, defaults)` (`src/lib/seo/layout-seo.ts`): the Sanity document's `seo` fields (title, description, social image, `noindex`, canonical), each falling back to the route's defaults; Home uses `homeSeo()`, without noindex and canonical. Other props: `canonical` (our own URLs get a trailing slash; another site's URL is kept as given), `ogImage` (a `{ src, width, height, alt? }` object from `ogImageSource()`; og:image:alt only when `alt` is known), `ogType` (`'article'` adds `publishedTime` / `modifiedTime`), `noindex` and `jsonLd` (one object or an array, built with `src/lib/seo/schema.ts`). There is no site-wide JSON-LD: home passes the Organization and WebSite builders, posts BlogPosting and BreadcrumbList, and pages with FAQ sections FAQPage.

- `siteConfig` (`src/lib/config/site.ts`) is the single source for name, title, URL, OG image and alt, logo, theme colour, analytics ID, and the header's and footer's UI labels. The description, menu, contact details and demo label come from the Sanity Site settings document (`getSiteSettings()`). `astro.config.ts` reads `site` from it, so the sitemap and every absolute URL follow automatically.
- `src/pages/robots.txt.ts` generates robots.txt with the right sitemap URL at build time.
- Set `noindex` on pages that should stay out of search (the contact result pages, the 404; in Sanity, the SEO tab's "Hide from search engines"): robots becomes `noindex, follow`, the canonical is dropped, and `redirects()` leaves the page out of the sitemap, as it does a page whose canonical is another URL.
- Every page needs exactly one `<h1>`: the `Hero` title on Sanity pages; posts, the blog index and archives, the contact result pages and the 404 render their own. Section headings are `<h2>`. Card titles are `<h3>` under a section title and `<h2>` when the section has none, so no level is skipped.
- `trailingSlash: 'always'`: every internal link ends in `/` (`/about/`, never `/about`).
  </seo>

<images>
Every image comes from Sanity and goes through `src/components/ui/SanityImage.astro` (downloaded and re-encoded at build time, served from our origin; never a raw `cdn.sanity.io` URL, which the CSP blocks). There is no `src/assets/`.

```astro
<SanityImage image={image} widths={[480, 720, 960, 1280]} sizes="(min-width: 48rem) 50vw, 100vw" />
```

It emits width/height (no layout shift), AVIF and WebP, and a srcset.

- `sizes` describes the column the image really fills. `priority` goes to the likely LCP image only: a hero in first place (`SectionRenderer` passes `priority={index === 0}`), a post's main image and the first blog card; every other image is lazy (the default). A new image section that can come first needs a `priority` prop and the same `index === 0` in `SectionRenderer` (ImageText has none today).
- Raw `<img>` is only for files already in `public/`, and then always with explicit `width`, `height`, `loading`, and `decoding`.
- `alt=""` for decorative images, real text for meaningful ones.
  </images>

<checklist>
Before calling a page done:

- [ ] content lives in Sanity and fixed copy in `src/lib/content/`, not in components
- [ ] no brand name, URL, or contact detail hardcoded — those come from Site settings or `siteConfig`
- [ ] exactly one `<h1>`
- [ ] the route spreads `layoutSeo()` (or `homeSeo()`) into `Layout`
- [ ] every image has dimensions and an `alt`
- [ ] no `client:` directive and no `<script>` other than ChatPanel's, ConsentBanner's and JSON-LD
- [ ] `npm run verify` (check, lint, format, `npm test`) and `npm run build` pass; when `scripts/` changed, also `npm --prefix scripts run check` and `npm --prefix scripts test`
      </checklist>
