# Project

## What is this

Larchwick Coffee Roasters is a fictional coffee roaster (demo project — fictional business). This
repo rebuilds its WordPress site as a static Astro site with content in Sanity, as a public
portfolio case study. The plan and the progress tracker are in [PLAN.md](../../PLAN.md).

## Pages

| Route  | Page doc                 | Status  | Notes                                                                                                      |
| ------ | ------------------------ | ------- | ---------------------------------------------------------------------------------------------------------- |
| `/`    | [home](../pages/home.md) | partial | Larchwick's hero, three features and the subscription call to action; the rest of the old home comes later |
| `/404` | [404](../pages/404.md)   | real    | Full-screen, no header or footer by design; links to Home and Contact                                      |

`/robots.txt` and `/sitemap-index.xml` are generated at build time from the site
config; they have no page doc.

The navigation already links to `/about/`, `/services/`, `/products/`, `/blog/`, `/faq/` and
`/contact/`, the old site's menu. Those pages are not built yet (Phases 5a–5c), so they show the
404 page until then.

## Still placeholder

- Site URL: `https://larchwick.example` until Phase 2c sets the `workers.dev` address
- The `og.png` social preview image referenced by the config but not in `public/` (Phase 2b)
- The favicon (`public/favicon.svg` is the Astro default)
- Colour tokens, fonts and section styling are still the template's; text uses the system font
  stack until Phase 2b adds the brand foundation
- Contact details use the reserved `.example` domain and a placeholder phone number, by design
- The pages listed above that the navigation links to
- Analytics: none is installed

## Notes

Static output with no Astro adapter: every page is prerendered at build time, with
`trailingSlash: 'always'` and `build.format: 'directory'`, so every URL keeps WordPress's
trailing slash. There is no Vercel and no Docker setup any more; the static build is headed for
Cloudflare Workers Static Assets in Phase 2c.

The site ships zero client JavaScript: no React, no view transitions, no prefetch script.
