<shape>
A page is a Layout plus an ordered list of sections. Copy lives in a content file.
Nothing else. That split is what makes the next landing page take an hour.

src/pages/<page>.astro       route — composition only, no copy, no logic
src/lib/content/<page>.ts    all copy for that page, one object, `as const`
src/components/sections/     reusable blocks, props in, static HTML out
src/components/ui/           primitives (button cva classes, Icon)
src/layouts/Layout.astro     head, SEO, fonts, JSON-LD slot, skip link, Header, Footer
src/lib/config/site.ts       brand, URL, nav, contact, footer — single source
src/lib/seo/schema.ts        typed JSON-LD builders (Organization, WebSite)
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

src/pages/404.astro is the one page with its own markup (a large numeral,
heading and links inside a Section), because no section fits it; its copy still
comes from src/lib/content/not-found.ts. It renders the header and footer like
every other page, so a lost visitor keeps the navigation.

src/pages/robots.txt.ts is an endpoint, generated at build time from siteConfig.
</pages>

<sections>
src/components/sections/

Section.astro is the layout primitive — container width, vertical rhythm, and the
optional eyebrow/title/subtitle header. Every block builds on it unless it needs a
full-bleed layout of its own (Hero, Header and Footer do; CTA, Features and FAQ
are built on it).

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
Layout.astro owns everything above and around the page content:

- <head>: the exact <title>, description, robots, canonical, the two <Font>
  tags, favicon, theme-color, Open Graph (locale, site name, type, title,
  description, url, image 1200×630 + alt, article times), twitter:card, and one
  <script type="application/ld+json"> per jsonLd object
- the skip link, Header, <main id="main" tabindex="-1">, Footer on every page
- no client script of any kind (no ClientRouter, no prefetch)

Props (all optional):
  title          the exact <title> and og:title; nothing is appended.
                 Default siteConfig.title ('Larchwick Coffee Roasters')
  description    default siteConfig.description
  canonical      a path or absolute URL; default the current path. Always
                 rendered absolute, with a trailing slash
  ogImage        a 1200×630 image; default siteConfig.ogImage ('/og.jpg')
  ogImageAlt     default siteConfig.ogImageAlt
  ogType         'website' (default) | 'article'
  publishedTime  ISO 8601 → article:published_time (only when ogType is article)
  modifiedTime   ISO 8601 → article:modified_time (only when ogType is article)
  noindex        robots "noindex, follow", and no canonical or og:url
  jsonLd         one object or an array (builders in src/lib/seo/schema.ts)

Indexable pages get robots "index, follow, max-image-preview:large,
max-snippet:-1, max-video-preview:-1", the old site's Yoast value.

A page passes its SEO object from its content file (`<Layout {...home.seo}>`).
There is no site-wide JSON-LD: the home page passes organizationSchema() and
websiteSchema().
</layout>

<content>
src/lib/content/<page>.ts

One exported object per page, `as const` so the literal types flow into section
props. A `seo` key ({ title, description }) is spread into Layout; the other keys
are grouped by section, mirroring the order on the page. home.ts and
not-found.ts exist so far.

Never inline copy into a component. Never put a brand name, URL, nav item, or
contact detail here — those live in src/lib/config/site.ts and are shared.
</content>

<config>
src/lib/config/site.ts is the single source of truth for the brand: name, title,
description, URL, language and locale, OG image + alt, theme colour, nav, contact
details, and the footer's headings, labels, demo label and copyright.

astro.config.ts imports it for `site`, which is what makes the sitemap and every
absolute canonical/OG URL correct. Change the URL in ONE place.
</config>

<rendering>
output: 'static' — every page is prerendered to HTML at build time.
trailingSlash: 'always' + build.format: 'directory' — /about/ builds to
dist/about/index.html, and every internal href ends in '/', as on WordPress.

astro.config.ts is the only config, and there is no adapter: dist/ is served as
static assets by Cloudflare Workers (wrangler.jsonc: html_handling
force-trailing-slash, not_found_handling 404-page; public/_headers sets
caching and security headers; previewNoindex() appends a noindex rule on
preview branches). Without an
adapter, `export const prerender = false` is not available. Never flip the
global mode to 'server'.
</rendering>

<javascript>
The only client JavaScript is the "Ask Larchwick" assistant: ChatPanel.astro's
loader (1.9 KB, every page) dynamically imports src/lib/chat/client.ts (3 KB) on
the panel's first open. There is no React and no client: directive anywhere.
Icon.astro renders inline SVG with no runtime.

If something seems to need interactivity, ask first: a small Astro <script> or
a UI framework is an architecture decision, not a default.
</javascript>
