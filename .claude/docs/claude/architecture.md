<shape>
A page is a Layout plus an ordered list of sections. Copy lives in a content file.
Nothing else. That split is what makes the next landing page take an hour.

src/pages/<page>.astro       route — composition only, no copy, no logic
src/lib/content/<page>.ts    all copy for that page, one object, `as const`
src/components/sections/     reusable blocks, props in, static HTML out
src/components/ui/           primitives (button cva classes, Icon)
src/layouts/Layout.astro     head, SEO, JSON-LD, Header, Footer
src/lib/config/site.ts       brand, URL, nav, contact, footer — single source
src/styles/global.css        Tailwind v4 @theme tokens
</shape>

<aliases>
@lib/*      → src/lib/*
@components/* → src/components/*
@layouts/*  → src/layouts/*

Defined in tsconfig.json. Use them instead of ../../ across folders; relative
imports stay inside one folder.
</aliases>

<pages>
src/pages/**/*.astro maps 1:1 to routes.

A page file contains: imports, a Layout, and sections. No copy, no data shaping,
no business logic. If a page grows past that, the extra belongs in a section or
in the content file.

The one deliberate exception is src/pages/404.astro: it is self-contained, with
its full-screen markup and copy inline, and no content file or sections.

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

Existing: Header, Hero, Features, FAQ, CTA, Footer, Section.
Check them before writing a new one.
</sections>

<layout>
Layout.astro owns everything above the page content:

- <head>: title, description, canonical, OG, Twitter, Organization JSON-LD
- Header and Footer, on by default
- no client script of any kind (no ClientRouter, no prefetch)

Props: title, description, ogImage, noIndex, showHeader, showFooter, headerCta.

A page passes title + description and usually nothing else. The home page may
rely on the siteConfig name/description defaults instead.
</layout>

<content>
src/lib/content/<page>.ts

One exported object per page, `as const` so the literal types flow into section
props. Group by section key, mirroring the order on the page.

Never inline copy into a component. Never put a brand name, URL, nav item, or
contact detail here — those live in src/lib/config/site.ts and are shared.
</content>

<config>
src/lib/config/site.ts is the single source of truth for the brand.

astro.config.ts imports it for `site`, which is what makes the sitemap and every
absolute canonical/OG URL correct. Change the URL in ONE place.
</config>

<rendering>
output: 'static' — every page is prerendered to HTML at build time.
trailingSlash: 'always' + build.format: 'directory' — /about/ builds to
dist/about/index.html, and every internal href ends in '/', as on WordPress.

astro.config.ts is the only config, and there is no adapter: dist/ is served as
static assets (Cloudflare Workers Static Assets from Phase 2c). Without an
adapter, `export const prerender = false` is not available. Never flip the
global mode to 'server'.
</rendering>

<javascript>
The site ships zero client JavaScript. There is no React and no client:
directive anywhere. Icon.astro renders inline SVG with no runtime.

If something seems to need interactivity, ask first: a small Astro <script> or
a UI framework is an architecture decision, not a default.
</javascript>
