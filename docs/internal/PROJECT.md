# Project

## What is this

Larchwick Coffee Roasters is a fictional coffee roaster (demo project — fictional business). This
repo rebuilds its WordPress site as a static Astro site with content in Sanity, as a public
portfolio case study. The plan and the progress tracker are in [PLAN.md](../../PLAN.md).

## Pages

| Route                                                       | Page doc                                   | Status  | Notes                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                                         | [home](../pages/home.md)                   | partial | Larchwick brand: hero with its three promises, three features and the subscription call to action; the rest of the old home comes later |
| `/404`                                                      | [404](../pages/404.md)                     | real    | Header and footer, a large "404", links to Home, Blog and Contact; noindex                                                              |
| `/about/`, `/services/`, `/products/`, `/faq/`, `/contact/` | [content pages](../pages/content-pages.md) | real    | Sanity `page` documents rendered by `[slug].astro` + `SectionRenderer`                                                                  |

`/robots.txt` and `/sitemap-index.xml` are generated at build time from the site
config; they have no page doc.

The blog (Phase 5b) builds `/blog/`, the 10 posts and the category and tag archives from Sanity.

## Still placeholder

- Contact details use the reserved `.example` domain and a placeholder phone number, by design
- The hero has no photo yet (the old one had coffee beans behind it); images arrive with Sanity
  in Phases 3–5
- The pages listed above that the navigation links to
- Analytics: none is installed

## Notes

Static output with no Astro adapter: every page is prerendered at build time, with
`trailingSlash: 'always'` and `build.format: 'directory'`, so every URL keeps WordPress's
trailing slash. It is served by Cloudflare Workers Static Assets
(`wrangler.jsonc`), built and deployed by Workers Builds on every push to `main`. Production is
indexable (Phase 7); preview builds of other branches send `X-Robots-Tag: noindex`.

The site ships zero client JavaScript: no React, no view transitions, no prefetch script.

Content model (Phase 3): Sanity project `zboja23d`, public `production` dataset, edited in the
Studio in `studio/` (`npm run studio`, http://localhost:3333). Documents: page (built from 14
section types), post, category, tag, site settings (singleton) and redirect. The import script
(Phase 4) has filled the dataset: 10 posts, 7 pages, 3 categories, 8 tags, site settings, 43
redirects and 30 images with alt text. Every page now comes from Sanity at build time (plain `fetch`, public dataset, no token): Home,
the content pages and the blog. The menu, footer and contact details come from Site settings. The Studio is deployed at https://larchwick.sanity.studio (login required). Editors follow
`docs/editor-guide.md`; publishing rebuilds the site by itself once the Sanity webhook → Cloudflare
deploy hook is set up (Phase 7).

The design is "Larch and label" (Phase 10 redesign, replacing the Phase 2b copy of the old
look): larch green, needle gold and espresso tokens, Big Shoulders Display and Hanken Grotesk
self-hosted through the Astro Fonts API, a sticky header, coffee-label cards with a roast stamp,
a "bags" card layout, a slide-in sidebar menu on phones (native popover), blurred previews while
photos load, page headers that rise in on load, and blocks, titles and article text that fade up on
scroll (CSS only, off for reduced motion). The favicon and the `og.jpg` social image are redrawn in the same look.
