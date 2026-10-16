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
- The contact form posts to `/api/contact`, a small Cloudflare Worker that checks the fields and
  the hidden honeypot, sends the message through Resend, and redirects to `/contact/thanks/` or
  `/contact/error/` (both noindex, not in the sitemap). Copy for those two pages is in
  `src/lib/content/contact.ts`.

## Content owner

Edited in Sanity Studio (https://larchwick.sanity.studio). A change shows on the site after the
next build; publishing will trigger that build automatically from Phase 7.

## Known limitations

- Messages only reach the inbox once the Worker secrets `RESEND_API_KEY` and `CONTACT_TO` are
  set. Resend's test sender delivers only to the Resend account owner. With `RESEND_TEMPLATE_ID`
  set, the email uses the branded Resend template (source: `worker/templates/contact-notification.html`);
  without it, plain text. Messages are limited to 1,500 characters.
- There is no rate limit beyond Resend's 100 emails a day.
