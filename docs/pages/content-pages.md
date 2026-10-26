---
route: /<slug>/
status: real
---

# Content pages (from Sanity)

## Purpose

About, Services, Products, FAQ and Contact, plus Privacy. Each is a `page` document in Sanity
Studio: the first five imported from WordPress in Phase 4, Privacy written for Phase 7c (how the
site handles data: hosting, analytics only with consent, the contact form, the assistant). Every
page document becomes a page at its own address, except Home and the blog index, which are built
separately.

## Sections

Each page is a list of sections chosen in the Studio: hero, text, image and text, features,
numbers, cards, price list, FAQ, steps, latest posts, call to action, contact form and quote.
The first section is the hero, which holds the page's only H1.

Sections sit on a light or a cream background. Only the call to action can also be a dark green
band; the hero is always one.

## Key interactions

- FAQ questions open and close without JavaScript (`<details>`).
- On About, the founder's quote and the "See our coffees" and "Visit the blog" buttons share one
  gold call-to-action band (the call to action's quote field).
- The contact form checks the fields and a hidden field that only bots fill in, sends the message
  by email (through Resend), and takes the visitor to `/contact/thanks/` or `/contact/error/`
  (both hidden from search engines and left out of the sitemap). The wording of those two pages
  and the form's labels is kept in the site's code, not in the Studio. With analytics accepted,
  the thanks page sends the `generate_lead` key event (once; a reload or coming back to it
  doesn't count again).
- A visitor can send 2 messages a minute; beyond that the form lands on the error page (the
  count is approximate, so a quick burst may get a few more through). Visitors on one home or
  office connection count as one visitor. If the email service fails or doesn't answer within 10
  seconds, the visitor sees the error page, which suggests emailing us instead. Line breaks count as
  one character each, the same as in the form.

## Content owner

Edited in Sanity Studio (https://larchwick.sanity.studio). Publishing rebuilds the site by
itself; a change is live about a minute later.

## Known limitations

- Messages only reach the inbox once the Worker secrets `RESEND_API_KEY` and `CONTACT_TO` are
  set. Resend's test sender delivers only to the Resend account owner. With `RESEND_TEMPLATE_ID`
  set, the email uses the branded Resend template; without it, plain text. Messages are limited
  to 1,500 characters.
- There is no daily limit of our own. Resend sends at most 100 emails a day (3,000 a month) on its
  free plan, and a single script sending 2 messages a minute from one connection uses up the day's
  100 in about 50 minutes (the month's 3,000 in about 25 hours). Until the day or the month
  resets, every real message then lands on the error page. The owner accepted this for the demo;
  the next step would be a daily counter or a bot check on the form.
