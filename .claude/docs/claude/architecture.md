<shape>
A page is a Layout plus an ordered list of sections. Copy lives in a content file.
Nothing else. That split is what makes the next landing page take an hour.

src/pages/<page>.astro       route — composition only, no copy, no logic
src/lib/content/<page>.ts    all copy for that page, one object, `as const`
src/components/sections/     reusable blocks, props in, static HTML out
src/components/ui/           primitives (button, input, Icon)
src/layouts/Layout.astro     head, SEO, JSON-LD, Header, Footer
src/lib/config/site.ts       brand, URL, nav, social, footer — single source
src/styles/global.css        Tailwind v4 @theme tokens
</shape>

<aliases>
@lib        → src/lib/index.ts
@lib/*      → src/lib/*
@components/* → src/components/*
@layouts/*  → src/layouts/*
@assets/*   → src/assets/*
@content/*  → src/content/*

Defined in tsconfig.json. Use them instead of ../../ across folders; relative
imports stay inside one folder.
</aliases>

<pages>
src/pages/**/*.astro maps 1:1 to routes.

A page file contains: imports, a Layout, and sections. No copy, no data shaping,
no business logic. If a page grows past that, the extra belongs in a section or
in the content file.

src/pages/robots.txt.ts is an endpoint, generated at build time from siteConfig.
</pages>

<sections>
src/components/sections/

Section.astro is the layout primitive — container width, vertical rhythm, and the
optional eyebrow/title/subtitle header. Every block builds on it unless it needs a
full-bleed layout of its own (Hero, CTA, Header, Footer do).

Contract for every section:
- typed `interface Props` in the frontmatter, `readonly` arrays for lists
- all copy via props, none baked in
- optional `id` with a default, so in-page anchors work
- static markup, no `client:` directive
- colour from tokens only

Existing: Header, Hero, Logos, Features, Testimonials, FAQ, CTA, Footer, Section.
Check them before writing a new one.
</sections>

<layout>
Layout.astro owns everything above the page content:

- <head>: title, description, keywords, canonical, OG, Twitter, Organization JSON-LD
- Header and Footer, on by default
- optional ClientRouter (view transitions)

Props: title, description, ogImage, noIndex, showHeader, showFooter, headerCta,
viewTransitions.

A page passes title + description and usually nothing else.
</layout>

<content>
src/lib/content/<page>.ts

One exported object per page, `as const` so the literal types flow into section
props. Group by section key, mirroring the order on the page.

Never inline copy into a component. Never put a brand name, URL, nav item, or
social link here — those live in src/lib/config/site.ts and are shared.
</content>

<config>
src/lib/config/site.ts is the single source of truth for the brand.

astro.config.ts imports it for `site`, which is what makes the sitemap and every
absolute canonical/OG URL correct. Change the URL in ONE place.
</config>

<rendering>
output: 'static' — every page is prerendered to HTML at build time.

Opt one page into on-demand rendering with `export const prerender = false`.
Never flip the global mode to 'server' for a landing site.

astro.config.ts (Vercel adapter) is the default; astro.config.docker.ts (Node
standalone) is used by the Docker build. Keep both in sync when changing
integrations.
</rendering>

<islands>
React is available but is the exception, not the default. A section becomes an
island only when it genuinely needs state or event handling, and then:

client:visible  below the fold
client:idle     needed soon after load
client:load     must be interactive at first paint — justify it

lucide-react rendered in .astro with NO client: directive emits inline SVG and
ships zero JavaScript. That is the intended usage.
</islands>
