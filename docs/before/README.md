# Before: the WordPress site

Evidence from the WordPress "before" site, a LocalWP install served at `http://larchwick.local`.
It is the baseline for the before/after comparison with the Astro + Sanity rebuild. The files are
kept exactly as recorded, and `.prettierignore` stops them from being reformatted. WordPress itself
is never edited: every tool here only reads it.

## Contents

- `larchwick.WordPress.2026-10-07.xml`: the WordPress export (WXR) of all content. It was scrubbed
  on 2026-10-12: the author's login, display name and email were replaced with the fictional
  author "Larchwick Team" (login `larchwick-team`, email `team@larchwick.example`). Nothing else
  in the file was changed.
- `old-urls.json`: the 130 old URLs the redirect map must cover
  ([PLAN.md §8](../../PLAN.md#8-url-and-redirect-map)), as a sorted list of `{ group, path }`. It
  is built from the export above plus the live REST API for the author archive.
- `seo-snapshot.json`: one record per old URL, crawled on 2026-10-12 at 18:20 UTC. Each record has
  the status, every redirect hop, the final URL, content type, `<title>`, meta description,
  canonical, robots meta, `X-Robots-Tag` header and H1s; sitemaps also get their entry count.
  Empty values are `null`, and `h1: []` means an HTML page with no H1.
- `lighthouse/`:
  - `wp-{mobile,desktop}-lighthouse.{json,png}`: one run of the home page per device, from the
    Chrome DevTools panel on 2026-10-07 (Lighthouse 13.4.1). This is a first look only; see
    [PLAN.md §6](../../PLAN.md#6-baseline-as-it-stands). It is kept as recorded and is not one of
    the protocol runs.
  - Once Artem's manual runs are imported: `<page>/<mobile|desktop>/run-N.json.gz` (each report
    cleaned and gzipped; every run is kept), `metrics.json` (the key numbers of every run) and
    `summary.md` (the median run per page and device, plus the test conditions).
- `network/`: DevTools Network panel screenshots from 2026-10-07.
- `screenshots/`: web-size JPEG copies of 6 pages. The 11 screenshots that showed the WordPress
  login (the blog index and 10 posts) are not committed. The full-size originals are kept outside
  the repo.

### Crawling again

```sh
npm run seo:crawl                    # fetch all 130 URLs, one at a time (about 7 s)
npm run seo:crawl -- --from-cache    # rebuild from the saved responses, no network
```

The raw responses are saved in `.cache/seo-check/before/` (gitignored), so an extraction bug can be
fixed and the files rebuilt without crawling again. Two crawls give identical files apart from
`crawledAt`.

### What the crawl shows

- All 130 URLs end in a 200. 78 answer directly, 52 redirect once with a 301, and none take more
  than one hop.
- Home, About and Blog have no H1.
- Blog, the category, tag and date archives and the author page have no meta description.
- The 18 date archives are `noindex, follow` with no canonical. Every other HTML page has a
  canonical pointing at itself.
- The 30 attachment pages 301 straight to the image file. `/sitemap.xml` and `/wp-sitemap.xml`
  301 to `/sitemap_index.xml`.
- `/brewing-guides/` and `/roastery-news/` are old post slugs that 301 to posts, even though they
  share names with categories.

## Environment

Recorded on 2026-10-12, read-only: the LocalWP files, page source and response headers. Phase 8
checks these again before the paired re-run and reports any difference.

| Item              | Version                                                                   |
| ----------------- | ------------------------------------------------------------------------- |
| WordPress         | 7.1.3 (database 61833)                                                    |
| Theme             | Astra 4.14.0, active, no child theme                                      |
| Elementor         | 4.3.3, active                                                             |
| Contact Form 7    | 6.1.7, active                                                             |
| Yoast SEO         | 28.6, active                                                              |
| Starter Templates | 4.7.8, active. It adds a script to every page (6,628 B, 2,313 B gzipped). |
| PHP               | 8.2.29                                                                    |
| nginx             | 1.26.1                                                                    |
| MySQL             | 8.4.0 Community                                                           |
| LocalWP           | 10.1.2                                                                    |

The Twenty Twenty-Three, -Four and -Five themes are installed but inactive.

How the site is served:

- HTTP/1.1 over plain http. HTTPS answers with a self-signed certificate and is not measured.
- gzip only (level 5), no brotli or zstd. The home page HTML is 153,019 B, or 27,378 B gzipped.
- The HTML has no caching headers. CSS and JS are `no-cache` with an ETag. Images and fonts are
  cached for 5 minutes, and `.webp` has no rule. These are LocalWP's own nginx defaults, so they
  describe the local setup, not a choice made in WordPress.

The 2026-10-07 export is still current. It was created at 09:28 UTC, and the newest change to any
published post or page (10 posts and 7 pages, from the REST API) is at 09:23:11 UTC that day.
Media was last changed on 2026-10-03. Drafts and private items can't be seen without logging in,
so they weren't checked.

Machine and browser:

- Apple M2 Pro (12 cores: 8 performance, 4 efficiency), 32 GiB RAM, macOS 26.6.2 (25G83).
- Brave 1.96.59 on Chromium 154.0.8037.58, read from the app files without launching it. Confirm
  this in `brave://version` on the day of the runs.
- The Lighthouse version is inside each report and listed in `lighthouse/summary.md`.

## How to measure (manual)

Artem runs Lighthouse by hand. The full protocol, and the reasons behind it, are in
[PLAN.md §10](../../PLAN.md#10-measurement-protocol).

1. Put the laptop on power and close anything heavy. Open Brave in a private window with no
   extensions, and turn Shields off for `larchwick.local`. Note the Brave and Chromium versions
   from `brave://version`.
2. Always measure `http://larchwick.local`, never `localhost` or `127.0.0.1`.
3. In DevTools, open Lighthouse: Navigation mode, all four categories, "Simulated throttling" and
   "Clear storage" on.
4. Keep the same window size for every run. The 2026-10-07 desktop run was 1197 px wide.
5. For each page, run Mobile, then Desktop. Home gets 5 runs per device; the other 8 pages get 3.
6. After each run, choose "Save as JSON" from the report menu (⋮). Name it
   `<page>-<mobile|desktop>-<n>.json` and save it into `docs/before/lighthouse/inbox/` (create
   the folder if needed; it is gitignored). The pages are:
   `home` (`/`), `about`, `services`, `products`, `faq`, `contact`, `blog`,
   `post-pour-over` (`/how-to-brew-pour-over-at-home/`) and `post-ethiopia`
   (`/ethiopia-yirgacheffe/`).
7. Run `npm run lighthouse:import`. It checks each file's name, device and URL, cleans it, files it
   under `lighthouse/<page>/<device>/`, and rebuilds `metrics.json` and `summary.md`. If any file
   is rejected, nothing is imported: fix or remove that file and run it again.

The median run is the one with the median Performance score; ties go to the lower LCP. The
headline (D-13) was fixed before measuring: Home, mobile, local, median of 5 runs, reporting the
Performance score and the total byte weight.

## Privacy

The WordPress author's login is shown on the live site (every byline, the author archive and the
Yoast schema). WordPress is not edited, so every tool removes it when it captures.

- The login and display name are read at runtime from `/wp-json/wp/v2/users` and are never written
  to a file. If WordPress is not running, the Lighthouse import takes them from the
  `WP_AUTHOR_SLUG` and `WP_AUTHOR_NAME` environment variables instead.
- Crawl: the author archive is recorded as `/author/<author>/`, and any other occurrence becomes
  `larchwick-team`.
- Lighthouse: the import replaces the login and name the same way, including URL-encoded forms. It
  also strips the embedded screenshots (every `data:image/…` value and the full-page screenshot,
  of which only the width and height are kept).
- Both tools check their output and refuse to write if any trace of the login is left.
- The unscrubbed raw data stays on the machine and is gitignored: the crawl cache in `.cache/` and
  the Lighthouse inbox.
- No machine hostname, OS user name or real email address is recorded in this folder.

## Still to come

- ~~Artem's manual Lighthouse runs~~: replaced by the scripted paired session of 2026-10-22
  (`npm run lighthouse:run`, PLAN.md §10), now in `lighthouse/` with its `summary.md`: Brave
  154.1.96.59 (Chromium 154) headless, Lighthouse 13.5.0, the WordPress versions above
  re-checked that day. The comparison with the Astro side is in
  [`docs/after/README.md`](../after/README.md).
- Optional screenshots, taken by Artem. Pages with a byline (the blog and the posts) are left out
  unless the byline is cropped.
