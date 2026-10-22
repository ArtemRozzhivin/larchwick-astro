# After: the Astro + Sanity site

Evidence from the rebuilt site, the "after" side of the before/after comparison with the WordPress
site in [`docs/before/`](../before/README.md). Generated files are kept as recorded.

## Contents

- `lighthouse/`: the paired Lighthouse session of 2026-10-22 (PLAN.md Phase 8). Each run is in
  `<page>/<mobile|desktop>/run-N.json.gz` (cleaned and gzipped; every run is kept), with
  `metrics.json` (the key numbers of every run) and `summary.md` (the median run per page and
  device, plus the test conditions). The WordPress side of the same session is in
  `docs/before/lighthouse/`.
- `seo-snapshot.json`: the 130 old URLs checked against the new site (Phase 6, `npm run
seo:compare`).
- `rebuild-times.json`: from publishing in the Studio to the change being live (Phase 7,
  `npm run rebuild:watch`).
- `rag-eval.json`: the "Ask Larchwick" assistant answering 22 test questions in production (Phase
  7b, `npm run rag:eval`).

## Results: the paired session (2026-10-22)

Both sites were measured on the same machine, in the same browser, on the same day, with the two
sides alternating run by run. Each row is the median run (median Performance score, ties to the
lower LCP). Full tables: [`lighthouse/summary.md`](lighthouse/summary.md) and
[`../before/lighthouse/summary.md`](../before/lighthouse/summary.md).

**Headline (D-13): Home, mobile, median of 5 runs.** Performance **69 → 100**; total byte weight
**1,118 KiB → 115 KiB** (−90%).

Mobile (simulated slow 4G and a 4× slower CPU):

| Page           | Performance | LCP           | FCP           | Total bytes         | Requests |
| -------------- | ----------- | ------------- | ------------- | ------------------- | -------- |
| Home           | 69 → 100    | 7.1 s → 1.6 s | 3.3 s → 1.1 s | 1,118 KiB → 115 KiB | 50 → 13  |
| About          | 68 → 100    | 6.1 s → 1.9 s | 4.1 s → 1.1 s | 927 KiB → 224 KiB   | 25 → 16  |
| Services       | 74 → 99     | 4.5 s → 2.0 s | 4.1 s → 1.1 s | 611 KiB → 149 KiB   | 22 → 10  |
| Products       | 73 → 100    | 4.7 s → 1.7 s | 4.1 s → 1.1 s | 630 KiB → 123 KiB   | 22 → 10  |
| FAQ            | 94 → 100    | 2.6 s → 1.7 s | 2.4 s → 1.1 s | 256 KiB → 108 KiB   | 19 → 10  |
| Contact        | 73 → 100    | 4.8 s → 1.7 s | 4.1 s → 1.1 s | 635 KiB → 128 KiB   | 23 → 10  |
| Blog           | 75 → 99     | 5.3 s → 2.0 s | 2.9 s → 1.1 s | 969 KiB → 320 KiB   | 29 → 26  |
| Pour-over post | 78 → 100    | 4.4 s → 1.9 s | 3.3 s → 1.1 s | 576 KiB → 193 KiB   | 21 → 17  |
| Ethiopia post  | 69 → 99     | 5.7 s → 2.3 s | 4.1 s → 1.1 s | 772 KiB → 266 KiB   | 24 → 20  |

The other categories, mobile: Accessibility 90–96 → 97–100, SEO 92–100 → 100 on every page, Best
Practices 74–78 → 78 (see "Reading the numbers"). Desktop: Performance 93–100 → 100 on every page,
LCP 0.6–1.7 s → 0.4 s.

### Phase 8 targets (mobile, all 9 URLs)

- **Performance ≥ 95:** met, 99–100.
- **SEO 100:** met on every page.
- **Accessibility ≥ 95:** met, 97–100.
- **Best Practices ≥ 95:** met on the deployed site (100 in the 2026-10-21 production scan). The
  paired session scores 78 because both sites are served over plain http locally.

## What moved the numbers

From the median home runs (mobile), WordPress → Astro:

- **Bytes, 1,118 → 115 KiB.**
  - **Images:** 595 KiB in 6 files → 19 KiB in 5. Responsive AVIF at quality 50 (Phase 8 found
    that Astro's default 75 made AVIF larger than WebP), sized per screen. WordPress sent a phone
    its 2560 px `-scaled` photo (290 KiB).
  - **Fonts:** 290 KiB in 4 files (three icon and theme fonts, plus one from Google Fonts) →
    70 KiB in 2 variable fonts from our own origin.
  - **JavaScript:** 164 KiB in 18 files (jQuery, Elementor, Astra) → 5 KiB in 3 (the assistant's
    loader, the consent banner and the event module they share).
  - **CSS:** 38 KiB in 19 files → 8 KiB in 1.
- **Render-blocking requests, 21 → 1.** WordPress blocks first paint on 19 stylesheets plus jQuery
  and jQuery Migrate. Astro blocks only on its single 8 KiB CSS file. That is most of the FCP drop
  from 3.3 s to 1.1 s. Inlining that last file was tried and measured worse (PLAN.md Phase 8).
- **No third-party requests, 5 → 0.** WordPress loaded Google Fonts from `fonts.googleapis.com`
  and `fonts.gstatic.com`: two extra connections before the text can show in that font. Google
  Analytics loads only after a visitor accepts, so a first visit (and Lighthouse) never fetches it.
- **JavaScript work on the main thread, 133 → 33 ms.** In return, Astro spends more on style,
  layout and rendering (68 → 129 ms), the cost of the CSS scroll-driven fade-ins. Total
  main-thread time is about the same (394 vs 383 ms), and Total Blocking Time is 0 ms on both
  sides. The win is in what loads, not in what runs.
- **The largest element arrives sooner.** On WordPress it is an Elementor container waiting for its
  CSS and fonts. On Astro it is the header wordmark, painted after the one CSS file and the
  preloaded fonts. On the blog index it is the first post image, which Phase 8 changed from
  lazy-loaded to high priority.

## Reading the numbers

- **Best Practices 78 on both sides** is the plain-http local setup: `is-on-https` and
  `redirects-http` fail for every run on both sites. They are reported separately in each
  `summary.md`.
- **Accessibility 97 on Services, Products, FAQ, Blog and the pour-over post** (mobile; Contact
  too on desktop) comes from
  Lighthouse's color-contrast check catching blocks half-way through their scroll fade-in, e.g.
  `#e9ece6` on `#f1f2ee` (contrast 1.06). axe 4.10, run after scrolling each page, finds 0
  violations on all 9 URLs, and the settled colors are the ones in the design system's contrast
  table. Artem chose to keep the fade (PLAN.md Phase 8).
- **Lab numbers, not field data.** Simulated throttling on one machine. They compare the two sites
  under identical conditions; they do not predict any one visitor's experience.

## Environment

- **WordPress (before):** LocalWP at `http://larchwick.local`, the same versions as recorded in
  [`docs/before/README.md`](../before/README.md#environment), checked again on 2026-10-22 from the
  page and response headers: WordPress 7.1.3, Astra 4.14.0, Elementor 4.3.3, Contact Form 7
  6.1.7, Yoast SEO 28.6, nginx 1.26.1, PHP 8.2.29.
- **Astro (after):** `npm run build` of branch `feat/phase-8`, served by `npx wrangler dev --port
8787`, the same Workers runtime with `_headers` and `_redirects`. It was reached as
  `http://larchwick-astro.local` through Brave's `--host-resolver-rules`, never as localhost.
  Analytics is off in local builds, as on a first visit to production.
- **Machine:** Apple M2 Pro (12 cores), 32 GiB RAM, macOS 26.6.2, on power, nothing heavy running.
- **Browser and tool:** Brave 154.1.96.59 (Chromium 154) headless, `lighthouse@13.5.0` CLI, run by
  `npm run lighthouse:run` (PLAN.md §10): Navigation mode, all four categories, simulated
  throttling, storage cleared, mobile emulation (412 px) and `--preset=desktop` (1350 px), with
  Brave's https upgrade turned off for the plain-http sites.

## Privacy

The WordPress author's login appears in the WordPress pages. `npm run lighthouse:import` removes
it from every stored report and refuses to write if any trace is left; the raw inbox files stay
on the machine and are gitignored. The Astro reports also have their embedded screenshots and
`data:` image placeholders removed.

## Still to come

- The deployed set: the same 9 URLs measured on production
  (`https://larchwick-astro.larchwick.workers.dev`) once this branch is live, reported separately
  from the paired local session.
