# Before: the WordPress site

Evidence from the WordPress "before" site, a LocalWP install served at `http://larchwick.local`.
It is the baseline for the before/after comparison with the Astro + Sanity rebuild. The files are
kept exactly as recorded, and `.prettierignore` stops them from being reformatted.

## Contents

- `larchwick.WordPress.2026-10-07.xml`: the WordPress export (WXR) of all content. It was scrubbed
  on 2026-10-12: the author's login, display name and email were replaced with the fictional
  author "Larchwick Team" (login `larchwick-team`, email `team@larchwick.example`). Nothing else
  in the file was changed.
- `lighthouse/`: one Lighthouse run of the home page for mobile and one for desktop, taken from the
  Chrome DevTools panel on 2026-10-07 (JSON reports and summary screenshots). This is a first look
  only; see [PLAN.md §6](../../PLAN.md#6-baseline-as-it-stands). The case-study numbers come from
  the Phase 1 protocol.
- `network/`: DevTools Network panel screenshots from 2026-10-07.
- `screenshots/`: web-size JPEG copies of 6 pages. The 11 screenshots that showed the WordPress
  login (the blog index and 10 posts) are not committed; Phase 1 retakes them with the byline text
  replaced at capture time (WordPress itself is never edited). The full-size originals are kept outside the repo.

## Phase 1 will add

- Lighthouse runs that follow the
  [measurement protocol](../../PLAN.md#10-measurement-protocol): 9 pages, mobile and desktop,
  5 runs each.
- `seo-snapshot.json`: status, final URL, title, meta description, canonical, H1 and robots for
  every old URL.
- Screenshots of the 9 measured pages at 360, 768 and 1280 px.
- The measurement conditions: date, machine, and the WordPress, Chrome and Lighthouse versions,
  plus how the login was kept out of every captured file.
