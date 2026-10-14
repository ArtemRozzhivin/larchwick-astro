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

The navigation links to the old site's menu. `/blog/` and the posts are not built yet (Phase 5b),
so they show the 404 page until then.

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
(`wrangler.jsonc`), built and deployed by Workers Builds on every push to `main`. Until launch
(Phase 7) every response carries `X-Robots-Tag: noindex` from `public/_headers`.

The site ships zero client JavaScript: no React, no view transitions, no prefetch script.

Content model (Phase 3): Sanity project `zboja23d`, public `production` dataset, edited in the
Studio in `studio/` (`npm run studio`, http://localhost:3333). Documents: page (built from 14
section types), post, category, tag, site settings (singleton) and redirect. The import script
(Phase 4) has filled the dataset: 10 posts, 7 pages, 3 categories, 8 tags, site settings, 43
redirects and 30 images with alt text. Since Phase 5a the site builds its content pages from Sanity at build time (plain `fetch`, public
dataset, no token); Home and the blog follow in 5b and 5c. The Studio is deployed at https://larchwick.sanity.studio (login required).

The brand foundation (Phase 2b) is in: the 9 colour tokens from the old site, DM Serif Display
and Inter self-hosted through the Astro Fonts API, the Larchwick favicon and the `og.jpg` social
preview image.
