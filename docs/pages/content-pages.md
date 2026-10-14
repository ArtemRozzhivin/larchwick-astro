---
route: /<slug>/
status: real
---

# Content pages (from Sanity)

## Purpose

About, Services, Products, FAQ and Contact. Each is a `page` document in Sanity Studio, imported
from WordPress in Phase 4 and edited in the Studio from now on. One route,
`src/pages/[slug].astro`, builds every page except Home (`home`) and the blog index (`blog`).

## Sections

Each page is a list of sections chosen in the Studio: hero, text, image and text, features,
numbers, cards, price list, FAQ, steps, latest posts, call to action, contact form, quote and
disclaimer. The first section is the hero, which holds the page's only H1.

## Key interactions

- FAQ questions open and close without JavaScript (`<details>`).
- The contact form posts to `/api/contact`. The endpoint that sends the email arrives in Phase 5c;
  until then the form has nowhere to send to.

## Content owner

Edited in Sanity Studio (https://larchwick.sanity.studio). A change shows on the site after the
next build; publishing will trigger that build automatically from Phase 7.

## Known limitations

- The contact details next to the form still come from `src/lib/config/site.ts`, not Site settings
  (Phase 5c).
- Photo 120 on Services shows a real brand and is replaced in Phase 5c.
