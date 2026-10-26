# Project

## What is this

Larchwick Coffee Roasters is a fictional coffee roaster (demo project — fictional business). This
repo rebuilds its WordPress site as a static Astro site with content in Sanity, as a public
portfolio case study. The plan and the progress tracker are in [PLAN.md](../../PLAN.md).

## Pages

| Route                                                                    | Page doc                                   | Status | Notes                                                                                                                                                         |
| ------------------------------------------------------------------------ | ------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                                                      | [home](../pages/home.md)                   | real   | The Sanity `home` page: hero with the coffee label, features, coffee bags, "From farm to your cup", image and text, latest posts, subscription call to action |
| `/404`                                                                   | [404](../pages/404.md)                     | real   | Header and footer, a large "404", links to Home, Blog and Contact; noindex                                                                                    |
| `/about/`, `/services/`, `/products/`, `/faq/`, `/contact/`, `/privacy/` | [content pages](../pages/content-pages.md) | real   | Sanity `page` documents rendered by `[slug].astro` + `SectionRenderer`                                                                                        |
| `/contact/thanks/`, `/contact/error/`                                    | [content pages](../pages/content-pages.md) | real   | Where the contact form lands; one route, `contact/[result].astro`, copy in `src/lib/content/contact.ts`; noindex, not in the sitemap                          |
| `/blog/`, `/blog/<slug>/`, `/blog/category/<slug>/`, `/blog/tag/<slug>/` | [blog](../pages/blog.md)                   | real   | Built from Sanity posts and terms; a tag with a single post is noindex and left out of the sitemap                                                            |

`/robots.txt` and `/sitemap-index.xml` are generated at build time from the site
config; they have no page doc.

## Still placeholder

- Contact details use the reserved `.example` domain and a placeholder phone number, by design
- Category and tag descriptions: written for all 11 terms as unpublished Sanity drafts
  (2026-10-24). Until an editor publishes them, archives use the generated description and
  show no intro; once published, each becomes the archive's intro and meta description

## Notes

Static output with no Astro adapter: every page is prerendered at build time, with
`trailingSlash: 'always'` and `build.format: 'directory'`, so every URL keeps WordPress's
trailing slash. It is served by Cloudflare Workers Static Assets
(`wrangler.jsonc`), built and deployed by Workers Builds on every push to `main`. Production is
indexable (Phase 7); preview builds of other branches send `X-Robots-Tag: noindex` (a preview
uploaded by hand must go through `npm run preview:deploy`). The Worker serves `POST /api/contact`
(2 sends a minute per visitor and no daily cap, PLAN D-27: one script on one address can use up
Resend's free 100 a day in about 50 minutes, after which real messages land on the error page;
accepted for the demo) and `POST /api/chat`, the "Ask Larchwick" assistant's answers (10 questions
a minute per visitor and 60 for all visitors together, counted per Cloudflare location, Phase 7b).
Those are rates, not totals: one address can still spend roughly $40–90 a day on Anthropic, and
only the monthly spend limit in the Anthropic console caps the total (then the assistant says it
is unavailable until the month resets).

The only client JavaScript is the "Ask Larchwick" assistant (a 2.2 KB loader on every page,
the 4.3 KB chat module when its panel opens) and the analytics consent banner (2.4 KB plus a
1.7 KB shared event module on every page; Google Analytics 4 loads only after "Accept", on production, Phase 7c): no React, no view
transitions, no prefetch script. Pages: the content pages include `/privacy/` (Sanity `page`).

Content model (Phase 3): Sanity project `zboja23d`, public `production` dataset, edited in the
Studio in `studio/` (`npm run studio`, http://localhost:3333). Documents: page (built from 13
section types), post, category, tag, site settings (singleton) and redirect. The import script
(Phase 4) has filled the dataset: 10 posts, 7 pages, 3 categories, 8 tags, site settings, 43
redirects and 30 images with alt text. Every page now comes from Sanity at build time (plain `fetch`, public dataset, no token): Home,
the content pages and the blog. The menu, footer and contact details come from Site settings. The Studio is deployed at https://larchwick.sanity.studio (login required). Editors follow
`docs/editor-guide.md`; publishing rebuilds the site by itself through a Sanity webhook → Cloudflare deploy hook,
live about a minute later (50–100 s measured, `docs/after/rebuild-times.json`).

The design is "Larch and label" (Phase 10 redesign, replacing the Phase 2b copy of the old
look): larch green, needle gold and espresso tokens, Big Shoulders Display and Hanken Grotesk
self-hosted through the Astro Fonts API, a solid sticky header, coffee-label cards with a roast stamp,
a "bags" card layout, a slide-in sidebar menu on phones (native popover), blurred previews while
photos load, page headers that rise in on load, and blocks, titles and article text that fade up on
scroll (CSS only, off for reduced motion). The favicon and the `og.jpg` social image are redrawn in the same look.
