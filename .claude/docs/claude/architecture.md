<shape>
A page is a Layout plus an ordered list of sections. Its content lives in Sanity;
fixed copy that isn't content lives in src/lib/content/. Nothing else. That split
is what makes the next landing page take an hour.

src/pages/<page>.astro       route — composition only, no copy, no logic
src/lib/content/             fixed copy (labels, result pages, 404), `as const`
src/components/sections/     reusable blocks, props in, static HTML out
src/components/ui/           primitives: button.ts, field.ts, link.ts (class strings),
                             CtaButtons, SpecList, CoffeeLabel, SanityImage, Icon
src/layouts/Layout.astro     head, SEO, fonts, JSON-LD slot, skip link, Header, Footer
src/lib/config/site.ts       brand, URL, OG defaults, logo, UI labels — single source
src/lib/routes.ts            every URL path: pagePath, postPath, termPath, contactResultPath,
                             and CONTACT_SLUG; HOME_SLUG comes from studio/homePage.ts
src/lib/seo/                 layout-seo.ts (seo fields → Layout props), schema.ts (typed
                             JSON-LD builders), canonical.ts, sitemap.ts
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
no business logic. If a page grows past that, the extra belongs in a section, in
src/lib/ or in src/lib/content/.

src/pages/404.astro has its own markup (a large numeral,
heading and links inside a Section), because no section fits it; its copy still
comes from src/lib/content/not-found.ts. It renders the header and footer like
every other page, so a lost visitor keeps the navigation.

src/pages/contact/[result].astro renders /contact/thanks/ and /contact/error/
(noindex), one per CONTACT_RESULTS entry (src/lib/routes.ts, which the Worker's
redirects use too): its h1 in a Section, then a CTA band, with copy from
contactResult in src/lib/content/contact.ts; the thanks page carries the
generate_lead view event.

src/pages/robots.txt.ts is an endpoint, generated at build time from siteConfig.
</pages>

<sections>
src/components/sections/

Section.astro is the layout primitive — container width, vertical rhythm, and the
optional eyebrow/heading/intro header (SectionHeader.astro). Every block builds on it unless it needs a
full-bleed layout of its own (Hero, Header and Footer do; CTA, Features and FAQ
are built on it).

Contract for every section:
- typed `interface Props` in the frontmatter, `readonly` arrays for lists
- all copy via props, none baked in
- optional `id` with no default (a fixed default would give two sections of
  one type on a page the same id)
- static markup, no `client:` directive
- colour from tokens only

Existing: Section, SectionHeader, Hero, TextBlock, ImageText, Features, Stats,
CardGrid, PriceTable, FAQ, Steps, LatestPosts, CTA, ContactForm, PullQuote,
Header, Footer. Check them before writing a new one.

Tone: Section takes `default` (paper), `muted` (surface, "Cream" in the Studio)
or `inverted` (larch, "Dark"). Only the CTA offers Dark in the Studio
(`toneField`); the other sections use `lightToneField` and type their prop as
`LightTone`. Hero is always the larch band. SectionHeader colours the eyebrow and
heading for the tone; Section and ImageText render it.
</sections>

<layout>
Layout.astro owns everything above and around the page content:

- <head>: the exact <title>, description, robots, canonical, the two <Font>
  tags, favicon, theme-color, Open Graph (locale, site name, type, title,
  description, url, image 1200×630 + alt, article times), twitter:card, and one
  <script type="application/ld+json"> per jsonLd object
- the skip link, the consent banner, Header, <main id="main" tabindex="-1">,
  Footer and the chat panel on every page
- no other client script (no ClientRouter, no prefetch)

Props (all optional):
  title          the exact <title> and og:title; nothing is appended.
                 Default siteConfig.title ('Larchwick Coffee Roasters')
  description    default the Site settings description (Sanity)
  canonical      a path or absolute URL; default the current path. Our own
                 URLs are rendered absolute with a trailing slash and no query
                 or fragment; a URL on another site is kept as given
                 (canonicalUrl() in src/lib/seo/canonical.ts)
  ogImage        a SocialImage { src, width, height, alt? }, from
                 ogImageSource() in src/lib/sanity/image.ts (cropped to
                 1200×630, narrower when the original is). Default
                 siteConfig.ogImage ('/og.jpg') with siteConfig.ogImageAlt;
                 og:image:alt is rendered only when alt is known
  ogType         'website' (default) | 'article'
  publishedTime  ISO 8601 → article:published_time (only when ogType is article)
  modifiedTime   ISO 8601 → article:modified_time (only when ogType is article)
  noindex        robots "noindex, follow", and no canonical or og:url
  jsonLd         one object or an array (builders in src/lib/seo/schema.ts)

Indexable pages get robots "index, follow, max-image-preview:large,
max-snippet:-1, max-video-preview:-1", the old site's Yoast value.

Content pages ([slug].astro), posts and the blog index spread layoutSeo()
(src/lib/seo/layout-seo.ts): their Sanity `seo` fields (title, description,
ogImage, noindex, canonical), each falling back to the route's defaults (a post
shares its main image, with its alt). Home spreads homeSeo(), the same without
noindex and canonical; term archives get theirs from src/lib/sanity/archives.ts
(a tag with fewer than 2 posts is noindex). A post's BlogPosting url is its
resolved canonical. There is
no site-wide JSON-LD: home passes organizationSchema() and websiteSchema()
(with the logo, siteConfig.logo), posts pass blogPostingSchema() (author = the
Organization @id) and breadcrumbListSchema(), and pages with FAQ sections pass
faqPageSchema(faqQuestions(sections)).
</layout>

<content>
src/lib/content/

Copy that isn't Sanity content, `as const` so the literal types flow into
props: blog.ts (index, archive and post labels, archive title and description
templates), chat.ts, consent.ts, contact.ts (the form's field labels and the
two result pages), not-found.ts, and ui.ts (fixed labels shown beside Sanity
content: roast lines, callout titles).

Never inline copy into a component. Never write a brand name, URL, nav item, or
contact detail here: copy that names the brand builds it from siteConfig (e.g.
`Ask ${siteConfig.name}`), and the menu and contact details come from Site
settings.
</content>

<config>
src/lib/config/site.ts is the single source of truth for the brand: name, title,
URL, language and locale, OG image + alt, logo, theme colour, the analytics
Measurement ID, and the header's and footer's UI labels (skip link, menu,
headings, copyright). The description, menu, contact details and demo label come
from the Sanity Site settings document.

astro.config.ts imports it for `site`, which is what makes the sitemap and every
absolute canonical/OG URL correct. Change the URL in ONE place. The Worker
(the contact email's sender name and subject) and scripts/rag-eval and
scripts/rebuild-time (the production URL) read siteConfig too. The Worker also
imports src/lib/routes.ts (and through it studio/homePage.ts, which therefore
imports nothing), src/lib/contact/limits.ts, src/lib/chat/stream.ts,
src/lib/rag/config.ts and src/lib/errors.ts (errorMessage(), isTimeout(), also
used by the sitemap and the index build); nothing in src/ imports from worker/.
</config>

<rendering>
output: 'static' — every page is prerendered to HTML at build time.
trailingSlash: 'always' + build.format: 'directory' — /about/ builds to
dist/about/index.html, and every internal href ends in '/', as on WordPress.

astro.config.ts is the only config, and there is no adapter: dist/ is served as
static assets by Cloudflare Workers (wrangler.jsonc: html_handling
force-trailing-slash, not_found_handling 404-page; public/_headers sets
caching and security headers; previewNoindex() appends a noindex rule on
preview branches). sitemap() dates every URL with <lastmod> from Sanity's
_updatedAt (withLastmod() in src/lib/seo/sitemap.ts): a page or post its own, a
page that lists posts the newest post's when that is later, a category or tag
archive the later of its term's date and the newest post's, of all posts (dated
by its own posts, it would move back when a post left it; only deleting the
newest post still moves dates back). termArchives() in src/lib/sanity/posts.ts decides
which terms get an archive, for the routes and the sitemap alike. If loading
the dates fails, the sitemap is written undated and the build logs a warning.
redirects() then drops noindex pages and pages whose canonical is another URL
(filterSitemapFile() → filterSitemap()). Without an
adapter, `export const prerender = false` is not available. Never flip the
global mode to 'server'.
</rendering>

<javascript>
The only client JavaScript is the "Ask Larchwick" assistant and the analytics
consent banner. ChatPanel.astro's loader (2.2 KB, every page) dynamically imports
src/lib/chat/client.ts (4.3 KB) on the panel's first open. ConsentBanner.astro's
script (2.4 KB, every page, plus src/lib/analytics/track.ts, 1.7 KB, shared with
the chat) asks for consent and, only after "Accept" and only on
production builds, loads Google's gtag.js once the page is idle (Phase 7c). There is no React and no client: directive anywhere.
Icon.astro renders inline SVG with no runtime.

If something seems to need interactivity, ask first: a small Astro <script> or
a UI framework is an architecture decision, not a default.
</javascript>
