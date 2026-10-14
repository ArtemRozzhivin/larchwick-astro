# Larchwick — WordPress → Astro + Sanity migration plan

The living plan and progress tracker for the Larchwick case study. We work **one phase at a
time**. Each phase ends with a short "what we did / what's next" and Artem's go-ahead before the
next one starts. Tick the boxes as work lands, and log every decision in
[Decisions](#3-decisions).

Last updated: 2026-10-13 · Current phase: **Phase 3 — in progress**

| #   | Phase                                    | Status      |
| --- | ---------------------------------------- | ----------- |
| 0   | Repo hygiene and open decisions          | done        |
| 1   | Measure the "before" site properly       | in progress |
| 2a  | Astro 7 upgrade and template cleanup     | done        |
| 2b  | Brand foundation (tokens, fonts, layout) | done        |
| 2c  | First Cloudflare deploy                  | in progress |
| 3   | Sanity setup and content model           | in progress |
| 4   | Import script                            | not started |
| 5a  | Data layer and page rendering            | not started |
| 5b  | Blog templates                           | not started |
| 5c  | Home, contact form and design polish     | not started |
| 6   | Redirects and SEO parity                 | not started |
| 7   | Production and editor workflow           | not started |
| 8   | Performance and accessibility pass       | not started |
| 9   | Case study and Upwork portfolio entry    | not started |

---

## 1. Goal

Rebuild **Larchwick Coffee Roasters**, a fictional coffee roaster's WordPress site that Artem built
on LocalWP, as a static Astro site with its content in Sanity. Publish it as a public, MIT-licensed
portfolio case study with **measured** before/after numbers.

**Done means:**

- Every phase below is ticked.
- The site is live on Cloudflare, and the repo is public with a README and a case study.
- The SEO parity report shows no losses.
- The Lighthouse targets are met, with the proof saved.
- The portfolio draft contains only numbers that trace to `docs/`.
- Every rule in §2 holds.

**The repo is already public.** `github.com/ArtemRozzhivin/larchwick-astro` has been public since
2026-10-07, with no licence. Every push to any branch is a publication, and removing a pushed file
means rewriting history. Phase 0 makes it compliant before anything else is pushed.

## 2. Ground rules (portfolio safety)

- **Honest numbers only.** Every metric is measured and saved as JSON (or a screenshot) with its
  conditions. Never estimate, never round up, and never mix numbers from different environments in
  one table.
- **Licensed content only.** Every image and font is
  credited in `CREDITS.md` with its source and licence.
- **Fictional brand only.** No real company's name, logo, design or text. No fake testimonials or
  reviews. Authors and bylines use fictional names (D-11).
- **Labelled as a demo everywhere:** "Demo project — fictional business" in the footer, README,
  case study and portfolio entry.
- **No former-employer code, templates or screenshots.**
- **No private data in the public repo or on the live site:** no emails, logins, passwords, tokens
  or deploy-hook URLs.
- **Improve on WordPress where it is weak**, for example alt text, H1s, contrast and meta, and
  record each improvement as a before/after fact. The "before" site itself is never edited: it stays
  the baseline.
- **Ask before** adding a dependency, a paid service or a plugin, changing the stack, deleting
  anything, or pushing.

## 3. Decisions

### Made

| Date       | Decision                                                                                                                                                                                         | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-10-12 | Full scope: Astro + Sanity, with the WordPress import script                                                                                                                                     | The import script is the main selling point, and the project covers both target Upwork pools (Astro migrations and headless CMS).                                                                                                                                                                                                                                                                                                                                                                            |
| 2026-10-12 | Astro stays at the repo root; `studio/` and `scripts/` sit beside it, each with its own `package.json`                                                                                           | Git hooks, CI and the Claude hooks keep working, and Sanity's dependency tree stays separate from Astro's. This deviates from the original brief's `web/` layout, so the README notes it.                                                                                                                                                                                                                                                                                                                    |
| 2026-10-12 | Design: same brand, refined, not a redesign                                                                                                                                                      | It keeps the before/after a fair "same site, rebuilt" comparison. We fix the weaknesses (contrast, hierarchy, spacing) without changing the identity.                                                                                                                                                                                                                                                                                                                                                        |
| 2026-10-12 | The WordPress export (WXR) is committed after the email and login are scrubbed                                                                                                                   | It is evidence, and a fallback source.                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2026-10-12 | Not Vercel. Hosting is on Cloudflare (product choice in D-0)                                                                                                                                     | Artem wants a platform that is new to his portfolio.                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-10-12 | No `PROGRESS.md`; this file is the plan and the tracker                                                                                                                                          | One place to look. The values the plan needs from the original brief are copied into the [appendix](#appendix-a--reference-values-from-the-original-brief).                                                                                                                                                                                                                                                                                                                                                  |
| 2026-10-12 | `CREDITS.md` source links are rebuilt from the image filenames                                                                                                                                   | All 30 filenames keep the Unsplash photo ID (`<photographer>-<id>-unsplash.jpg`), and `unsplash.com/photos/<id>` resolves (checked for 3 IDs).                                                                                                                                                                                                                                                                                                                                                               |
| 2026-10-12 | **D-1** Upgrade to Astro 7 (Phase 2a)                                                                                                                                                            | A trial copy built and passed `astro check` with 0 errors. It brings the stable Fonts API. Costs: Node ≥ 22.12, and Astro's own zod becomes v4 (our code imports none).                                                                                                                                                                                                                                                                                                                                      |
| 2026-10-12 | **D-2 / D-12** No YouTube or video anywhere: no WordPress edits, no `youtube` content type, no embed renderer                                                                                    | Not needed for this site. The brief's "Post 7 YouTube" edge case is dropped. We don't add a pull quote to WordPress either: the importer's pull-quote and "CF7 shortcode in a post" rules are covered by test fixtures. WordPress content stays exactly as it is.                                                                                                                                                                                                                                            |
| 2026-10-12 | **D-4** Contact form sends email through **Resend**, from a small Cloudflare Worker endpoint (`/api/contact`)                                                                                    | Resend is an email API, so the secret key must live on a server. The Worker is that server. The form stays a plain HTML POST with zero client JS. Free plan: 3,000 emails/month and 100/day. Without a domain, Resend's test sender delivers only to the account owner's address, which is all a contact form needs (it notifies Artem). Web3Forms is dropped.                                                                                                                                               |
| 2026-10-12 | **D-5** Licence: MIT, in Artem's name                                                                                                                                                            | The repo stays public.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2026-10-12 | **D-6** Remove Docker and the unused dependencies                                                                                                                                                | Docker isn't needed on Cloudflare, and `build:docker` already points at a missing `.mjs` config. The unused dependencies are `@base-ui/react`, `@radix-ui/*`, `react-hook-form`, `@hookform/resolvers`, `zod`, `tw-animate-css`, `@astrojs/node` and `@astrojs/vercel`.                                                                                                                                                                                                                                      |
| 2026-10-12 | **D-7** Remove React from the site: `react`, `react-dom`, `@astrojs/react`, `@types/react*`, `lucide-react`, `button.tsx`, `input.tsx`                                                           | Nothing on the site needs it; we add it back only if a component ever does. Icons move to an Astro-native approach (ask before adding a package). `buttonVariants` (cva) moves to a plain `.ts` file. Sanity Studio keeps its own React inside `studio/`: that is the CMS app, not the website.                                                                                                                                                                                                              |
| 2026-10-12 | **D-8** No RSS, subscriptions, likes or comments. Only posts                                                                                                                                     | The old feed URLs 301 to `/blog/`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-10-12 | **D-9** Unit tests for the import script                                                                                                                                                         | Vitest in `scripts/import-wp/` only. Small, real WordPress HTML snippets are fed through the converter, and the tests check the Sanity output. Each edge case gets a test, so a fix for one never silently breaks another.                                                                                                                                                                                                                                                                                   |
| 2026-10-12 | **D-10** Commit web-size copies of the before screenshots                                                                                                                                        | About 44 MB of PNG otherwise. Screenshots that show the WordPress login are not committed; Phase 1 retakes them with the byline replaced at capture time (D-11).                                                                                                                                                                                                                                                                                                                                             |
| 2026-10-12 | **D-11** The WordPress login never reaches a public file; the new site's byline is the fictional **"Larchwick Team"**                                                                            | WordPress itself is **not edited** (Artem, 2026-10-12: "we work here"). The login is served on the live site (30 times on `/blog/`, every byline, the author archive and the Yoast schema), so our tools remove it when they capture: crawl data and Lighthouse JSON are text-scrubbed; Lighthouse screenshots are turned off; page screenshots replace the byline text in the browser before capture. Each scrub is documented in `docs/before/README.md`. The importer never copies WordPress author data. |
| 2026-10-12 | **D-14** SEO-friendly alt text for all 30 images                                                                                                                                                 | Drafted by looking at each image and the page it sits on: describe what's in the photo first, and use a page keyword only where it reads naturally. About 125 characters, no "image of". Artem reviews. Stored on the Sanity image asset (`altText`); the source of truth is a committed `scripts/import-wp/alt-text.json` keyed by WordPress media ID. Pure backgrounds behind text get `alt=""` for that usage. Before: 0/30, target: 30/30.                                                               |
| 2026-10-12 | **D-0** Cloudflare **Workers** with Static Assets, plus one small script for `/api/contact` (D-4), built by Workers Builds from GitHub. No Astro adapter                                         | Workers is Cloudflare's main platform and now serves whole static sites; Pages is the older static-only product. Only Workers keeps the static site and the Resend endpoint in one project. Static requests are free and unlimited.                                                                                                                                                                                                                                                                          |
| 2026-10-12 | **D-3** Start on the free `*.workers.dev` address; a custom domain is optional later                                                                                                             | A domain needs its DNS on Cloudflare. With Resend it would add `hello@<domain>` as the sender and allow visitor auto-replies.                                                                                                                                                                                                                                                                                                                                                                                |
| 2026-10-12 | **D-13** Headline numbers: Home `/`, mobile, primary (local) environment, median of 5 runs. Performance score gives X→Y; total byte weight gives A→B                                             | Fixed before measuring, so the headline can't be cherry-picked from the 36 sets (9 pages × mobile/desktop × local/deployed). All 9 pages appear in the full table. Artem also compares the deployed Cloudflare results for his own reference; those stay in their own table and never feed the headline.                                                                                                                                                                                                     |
| 2026-10-12 | Defaults accepted: byline "Larchwick Team" (D-11); no pull quote added to WordPress (D-2)                                                                                                        | Artem agreed to all remaining recommendations.                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-10-13 | Every Phase 2a cleanup group approved: demo content, dead styling, Docker/React/extra packages (adds `clsx` and `tailwind-merge`, unused once the `.tsx` files went), 404 fixes and dead aliases | Artem, per item as the plan asked.                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-10-13 | **D-15** Zero client JS includes navigation: `ClientRouter` (view transitions) and Astro's `prefetch` are removed, with no replacement                                                           | Both injected scripts on every page. Adding any prefetch later is an architecture decision.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-10-13 | **D-16** Icons are inline SVG in `Icon.astro`, with path data copied from Lucide 0.563.0; the ISC and Feather MIT notices are in `CREDITS.md`                                                    | No icon package needed; only the icons in use are kept.                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-10-13 | **D-17** `compressHTML: true` (Astro's pre-7 HTML whitespace rules) instead of Astro 7's `'jsx'` default                                                                                         | `prettier-plugin-astro` 0.14 formats with HTML whitespace semantics. Its 1.x (Rust compiler) crashes with `prettier-plugin-tailwindcss` 0.8.1, so the formatter stays on 0.14 and the build follows it.                                                                                                                                                                                                                                                                                                      |
| 2026-10-13 | `.node-version` = 24 (Active LTS) for Workers Builds and CI; `engines.node >= 22.18`. Site URL is `https://larchwick.example` until Phase 2c                                                     | The reserved `.example` domain can't point anywhere real; 2c sets the `workers.dev` address.                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2026-10-13 | Social image is `public/og.jpg` (not `og.png`), 1200×630, 57 KB: the old Home hero photo with the Larchwick name. The 404 page now shows the header and footer                                   | A photo compresses far better as JPEG. Visitors on a dead link need the navigation. Artem reviewed the 2b shell visually and approved it.                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-10-14 | **D-18** Public address: `https://larchwick-astro.larchwick.workers.dev`                                                                                                                         | The account's first `workers.dev` subdomain was Artem's email username; he renamed it to `larchwick` before the URL went into `site.ts`, the canonicals and the sitemap.                                                                                                                                                                                                                                                                                                                                     |
| 2026-10-14 | **D-14 amended:** alt text lives on each image field (`accessibleImage`, `figure`), not on the Sanity asset; `alt-text.json` stays the importer's source                                         | The default Studio can't edit asset-level alt text without the Media plugin (a new dependency). Artem approved.                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-10-14 | Home is the `page` with slug `home`, served at `/`. Tables are a built-in rows × cells object, not `@sanity/table`. `@sanity/vision` (GROQ playground) stays in the Studio                       | No extra dependencies; Vision is used to test the importer's output and the site's queries. Artem approved.                                                                                                                                                                                                                                                                                                                                                                                                  |

### Open

None right now. New questions get logged here with a recommendation first.

---

## 4. What we are migrating (measured 2026-10-12)

The source is the live LocalWP site at `http://larchwick.local`, cross-checked against
`docs/before/larchwick.WordPress.2026-10-07.xml`.

**Stack:** WordPress 7.1.3, the Astra theme, Elementor 4.3.3, Yoast SEO 28.6 and Contact Form 7
6.1.7.

| Content      | Count | Notes                                                                                                                        |
| ------------ | ----- | ---------------------------------------------------------------------------------------------------------------------------- |
| Pages        | 7     | Home is built with Elementor. About, Services, Products, FAQ and Contact use the block editor. Blog is the empty posts page. |
| Posts        | 10    | Each has a Yoast title and description, a hand-written excerpt and a featured image.                                         |
| Categories   | 3     | brewing-guides 4 · coffee-origins 3 · roastery-news 3                                                                        |
| Tags         | 8     | beginner 5 · espresso 4 · equipment 3 · pour-over 3 · seasonal 3 · single-origin 3 · colombia 1 · ethiopia 1                 |
| Images       | 30    | All from Unsplash. Originals total 132,865,799 bytes; the largest is 25.6 MB / 8991 px. **0 of 30 have alt text.**           |
| Forms        | 1     | CF7 on Contact: name, email and subject (all required), plus message.                                                        |
| Menu         | 7     | Home, About, Services, Products, Blog, FAQ, Contact                                                                          |
| Yoast meta   | 16    | 6 pages and 10 posts, all literal text. The Blog page has none, and there is no custom canonical or noindex anywhere.        |
| Not migrated | 4     | "Hello world!", Sample Page, Privacy Policy and "Elementor #145" (all in the trash)                                          |

**Blocks used:** paragraph 91, list-item 76, heading 66, list 24, group 22, column 18, details 13,
image 8, columns 7, button 7, buttons 6, cover 5, quote 4, table 3, gallery 1, media-text 1,
shortcode 1. Only `core/` blocks appear. Home has 0 blocks: it is 51 Elementor widgets, including
a dynamic recent-posts widget.

## 5. Findings from recon (what the import and templates must handle)

1. **Yoast's `yoast_head_json` is wrong in list responses.** In `/wp/v2/posts?per_page=100`, every
   post carries the first post's title and canonical, and every page carries "Blog - Larchwick".
   Single-item requests and the rendered HTML are correct. **The importer fetches SEO data per
   item.** Verified 2026-10-12.
2. **Yoast's canonical is always the old URL.** WordPress has no custom canonicals or noindex. So
   we import only the title and description, and canonicals are rebuilt from the new URLs.
3. **`context=edit` returns 401 without auth.** It needs an Application Password. Basic Auth works
   over http because `WP_ENVIRONMENT_TYPE` is `local`.
4. **The brief's edge-case table doesn't match the content** (WP ids):
   - In-content images are in posts 8, 11, 15 and 26, all with `alt=""`.
   - Links to old post URLs that need `/blog/`: posts 15, 17 and 22, plus About and Products.
   - Tables: post 13, Services and Products.
   - Gallery, external link and blockquote: all in post 8.
   - **No YouTube embed and no pull quote.** Both are out of scope (D-2). Post 26 and About have
     a `core/quote` with an inline "— Name".
   - The CF7 shortcode is on Contact only.
   - FAQ: 13 `core/details` under 4 H2s (4/4/2/3).
   - Home's "From the blog" is a **dynamic** recent-posts widget, not hard-coded cards.
5. **Astra palette usage:**
   - Cover overlays on all 5 block pages: colour 2 on About and Services, colour 6 on Products, FAQ
     and Contact.
   - Colour-5 heading text on all 5 pages.
   - Group and column backgrounds only on About (5), Services (7) and Products (7).
   - The live CSS defines `--ast-global-color-0…8` = the 9 brand tokens in order (appendix A), so
     the mapping is fully known.
6. **Home and About have no `<h1>`.** About's cover title is an H2.
7. **Content cleanup:**
   - 31 absolute `http://larchwick.local` URLs. All are image references (30 upload URLs plus 1
     `mediaLink`), and 11 of them are in Home's Elementor HTML. There are no absolute hrefs.
   - One `/contact` link without a trailing slash (Services).
   - One `href="#"` button ("Our story" on Home).
   - About's media-text stores an attachment-page `mediaLink` but renders no link. Drop it.
   - Empty `<p></p>` in 4 posts, and fixed image widths.
8. **Old URL behaviour:**
   - Attachment pages 301 to the image file.
   - Author archive, date archives, feeds and 5 Yoast sub-sitemaps return 200.
   - `/sitemap.xml` and `/wp-sitemap.xml` 301 to `/sitemap_index.xml`.
   - `/blog/page/2/` is a 404.
   - `/home/` → `/`.
   - 2 old-slug 301s.
   - `/?p=N` shortlinks 301 to the post.
   - Slashless URLs 301 to the slash form.
9. **Images are huge.** The import uploads WordPress's `-scaled` file (≤ 2560 px) instead, and
   Astro makes the responsive sizes.
10. **Unused images:**
    - `caio-arbulu-9V5vXxnksf4` is referenced nowhere.
    - The featured images of About, Services and Products are never shown.
    - Attachments 180 and 181 have no parent.
11. **Contrast:** white on brand `#C8743A` is 3.49:1, which fails AA (Lighthouse flags the home
    buttons). White on brand-dark `#9A5420` is 5.73:1, so every text-bearing fill uses brand-dark.
12. **Sections the brief's list is missing:**

    - quote
    - steps/process
    - FAQ group headings
    - a spec list inside a card
    - a hero trust list
    - eyebrows beyond the hero
    - a disclaimer (the inline "fictional business" notes)

    These are added in Phase 3.

13. **Post template today:**
    - The byline is the WordPress login.
    - The post page has no featured image, category or related posts.
    - The blog index has no `<h1>` and one orphan card.

## 6. Baseline as it stands

On 2026-10-07 there is **one Lighthouse run per form factor, of the home page only**, taken from
the DevTools panel (Lighthouse 13.4.1, Chrome 154, simulated throttling). The files are in
`docs/before/lighthouse/`.

| Home `/`          | Mobile      | Desktop      |
| ----------------- | ----------- | ------------ |
| Performance       | 69          | 88           |
| Accessibility     | 90          | 89           |
| Best practices    | 78          | 78           |
| SEO               | 100         | 100          |
| LCP               | 7130.712 ms | 2312.4308 ms |
| FCP               | 3304.76 ms  | 685.436 ms   |
| TBT / CLS         | 0 ms / 0    | 0 ms / 0     |
| Total byte weight | 1,106,412 B | 3,086,957 B  |
| Requests          | 49          | 49           |

This is a first look, not the comparison set:

- It is a single run of a single URL.
- The desktop run was laid out at 1197 px, the DevTools window width, not the 1350 px preset.
- The network screenshots come from a different load.
- The Best Practices failures are only `is-on-https` and `redirects-http`. Both come from serving
  it locally over http.

Phase 1 re-measures with the [protocol](#10-measurement-protocol), and Phase 8 re-runs it paired
with the after set.

## 7. Target architecture

```
WordPress (LocalWP) ──REST API──▶ scripts/import-wp ──▶ Sanity Content Lake ◀── Sanity Studio (editors)
                                   │ report + docs/redirect-map.csv             │ publish
                                                                                ▼
                                                                 GROQ webhook → Workers Builds deploy hook
GitHub (public repo) ──PR merge──▶ Workers Builds: npm run build ──▶ Cloudflare Workers static assets
                                  (Astro static; fetches content       dist/ + _redirects + _headers + 404.html
                                   and images at build time)
```

- **Rendering:** `output: 'static'`, `trailingSlash: 'always'`, `build.format: 'directory'`. Every
  URL keeps WordPress's trailing slash.
- **Content:**
  - `@sanity/client` at build time (`useCdn: false`), with GROQ via `defineQuery` and types from
    Sanity TypeGen.
  - The project ID and dataset are committed as non-secret defaults. The public dataset needs no
    read token.
  - Portable Text is rendered by `astro-portabletext`, which ships no JS.
- **Images:**
  - Astro `<Picture>` turns Sanity URLs into AVIF/WebP at build time
    (`remotePatterns: cdn.sanity.io`).
  - They are served from our own origin under immutable `/_astro/*`, and the Workers Builds cache
    keeps rebuilds fast.
  - `priority` goes on the LCP image only.
- **Fonts:** self-hosted through the Astro Fonts API with the Fontsource provider:
  - DM Serif Display 400, latin only, preloaded.
  - Inter variable, latin only.
  - No Google Fonts request.
- **JavaScript:** zero client JS, and no React on the site (D-7).
- **Contact form (D-4):**
  - A plain HTML POST to `/api/contact`, handled by one small Worker script that sits beside the
    static assets.
  - The script sends the message through Resend, then 303-redirects to a static thank-you page.
  - Only `/api/*` reaches the script (`run_worker_first`); every page is a free static request.
- **Repo:** Astro at the root, plus `studio/` (Sanity 6) and `scripts/`, which holds `credits/`,
  `seo-check/`, `lighthouse-import/` and later `import-wp/`. Scripts use Node built-ins until one
  needs a package; `scripts/` then gets its own `package.json`.

## 8. URL and redirect map

`dist/_redirects` is generated at build time. Its sources are the Sanity `redirect` documents
(written by the importer and by editors) plus the pattern and sitemap rules kept in code. Every
redirect is a **301** that lands on the final URL in **one hop**.

| Old URL                                                                       | Count   | New                                                   | Rule                                                                                                                            |
| ----------------------------------------------------------------------------- | ------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Pages `/about/` etc.                                                          | 7       | same URL                                              | —                                                                                                                               |
| `/home/`                                                                      | 1       | `/`                                                   | static                                                                                                                          |
| Posts `/<slug>/`                                                              | 10      | `/blog/<slug>/`                                       | static, one per post                                                                                                            |
| Old slugs `/brewing-guides/`, `/roastery-news/`                               | 2       | the post's new URL                                    | static                                                                                                                          |
| `/category/<x>/`                                                              | 3       | `/blog/category/<x>/`                                 | dynamic, literal `/category/` prefix                                                                                            |
| `/tag/<x>/`                                                                   | 8       | `/blog/tag/<x>/`                                      | dynamic, literal `/tag/` prefix                                                                                                 |
| Date archives `/2025/…`, `/2026/…`                                            | 18      | `/blog/`                                              | `/2025/*` and `/2026/*`. **Never bare `:year/:month` placeholders**: they would also match live routes such as `/blog/<slug>/`. |
| `/author/<login>/`                                                            | 1       | `/about/`                                             | dynamic `/author/*`, so the login is never written into any file (D-11)                                                         |
| Feeds `/feed/`, `…/feed/`                                                     | 24      | `/blog/` (no RSS, D-8)                                | static, plus dynamic with literal prefixes                                                                                      |
| Attachment pages                                                              | 30      | the parent page or post (28); `/` for ids 180 and 181 | static. This is an intended change: WordPress sent them to the image file.                                                      |
| `/sitemap_index.xml`, `/sitemap.xml`, `/wp-sitemap.xml`, 5 Yoast sub-sitemaps | 8       | `/sitemap-index.xml`                                  | static, in code                                                                                                                 |
| `/robots.txt`                                                                 | 1       | same URL                                              | —                                                                                                                               |
| `/?p=N`, `/?page_id=N`                                                        | 17      | not possible                                          | known limitation (§12)                                                                                                          |
| **Total**                                                                     | **130** |                                                       |                                                                                                                                 |

**How Cloudflare `_redirects` behaves** (from the docs and the workers-sdk source):

- **Matching is exact**: `/x` and `/x/` are different sources. The generator emits every source in
  **both forms**, each pointing at the final slash URL, so a slashless old link is one 301, not a 404.
- **No loops:** authored rules run once, before `html_handling`, and every destination ends in
  `/`.
- **307s:** all 104 page-like old URLs already end in `/` (the other 26 are 17 shortlinks and 9 `.xml`/`.txt` files). Cloudflare's 307 only affects slashless
  variants of live pages (`/about` → `/about/`). Explicit 301 lines for those are optional.
- **Rules beat files:** rules apply even when a file exists, and placeholders can't be restricted
  to digits.
- **The build fails on:**
  - duplicate sources
  - a source equal to a built route
  - **any dynamic rule that matches a built route**
  - more than 2,000 static or 100 dynamic rules
  - a line over 1,000 characters

## 9. Phases

Each phase lists its steps, an exit check, and **talking points**: the decisions Artem should be
able to explain on a client call.

### Phase 0 — Repo hygiene and open decisions

- [x] D-5: MIT licence; the repo stays public (2026-10-12).
- [x] Add `LICENSE` (MIT, Artem) as the first commit.
- [x] Settle the decisions needed by Phases 0–2 (2026-10-12: all decided).
- [x] Scrub the WXR: replace the email (1×) and the login (76×) with the fictional author (D-11).
      Then commit `docs/before/`. The Lighthouse JSON has 0 login occurrences, so it is committed as
      is.
- [x] Shrink the before screenshots to web-size copies (D-10). **Don't commit the 11 that show the
      login** (10 posts and the blog index); Phase 1 retakes them. Keep the originals outside the
      repo.
- [x] Add `docs/before/` and `docs/after/` to `.prettierignore`, so the evidence JSON is never
      reformatted (2026-10-12).
- [x] `.gitignore`: add `.env.local`, `.env.*.local`, `.sanity/` and `.wrangler/`.
- [x] `scripts/credits/`, a tiny script with no dependencies:
  - It extracts each Unsplash ID as the **11 characters before `-unsplash`**
    (`/([A-Za-z0-9_-]{11})-unsplash(?:-scaled)?\.jpe?g$/`; every file ends in `-unsplash-scaled.jpg`).
    Never split on `-`: 4 of the IDs contain one.
  - It follows the redirect to the canonical URL and records the photographer and the URL.
  - It writes `CREDITS.md`.
  - `CREDITS.md` also lists the fonts (OFL) and the icons.
    `og.png` is added when it arrives.
- [x] README: a "Demo project — fictional business" header. The full rewrite comes in Phase 9.

**Exit:** the already-public repo is compliant: a licence, credits, no private data, and the
evidence committed.
**Talking points:** why credits are rebuilt from filenames; why evidence files are excluded from
formatting.

### Phase 1 — Measure the "before" site properly

**WordPress is never edited.** Everything below only reads `http://larchwick.local`. Lighthouse runs
are done **by Artem, by hand**, in his browser (decided 2026-10-12). The tools only collect, clean
and summarise his exports.

- [x] Toolchain (2026-10-12): no `lighthouse` package and no automated browser (only Brave is
      installed). Every script in `scripts/` uses Node built-ins only, so there is no
      `scripts/package.json` yet.
- [x] **Leave every WordPress flaw as it is** (missing alt, no H1, contrast). They are the
      "before".
- [x] **Record the versions** (read-only: the LocalWP files, page source, response headers):
      WordPress, plugins, theme, PHP and nginx. Phase 8 checks them again before the paired re-run
      and reports any difference.
- [x] Confirm the 2026-10-07 export is still current: no post or page `modified` date in the REST
      API is later than the export.
- [x] `scripts/seo-check/`, crawl mode (Node `fetch`, no dependencies):
  - The URL inventory is built from the committed WXR, plus the live REST API for the author
    (§8): 130 URLs.
  - Recorded per URL: status, every redirect hop, final URL, `<title>`, meta description,
    canonical, H1 and robots.
  - Output: `docs/before/old-urls.json` and `docs/before/seo-snapshot.json`.
  - Raw responses stay local (gitignored), so an extraction bug can be fixed without re-crawling.
  - The login is read at runtime and never written: author URLs are recorded as
    `/author/<author>/`.
- [x] `scripts/lighthouse-import/` (no dependencies). It takes Artem's saved Lighthouse JSON
      reports from a local inbox, removes the embedded screenshots and the login text, and files
      them as `docs/before/lighthouse/<page>/<mobile|desktop>/run-N.json.gz`. Then it writes
      `metrics.json` and `summary.md` with the median run per page and device.
- [ ] **Artem's manual runs**, per [§10](#10-measurement-protocol), saved into the inbox, then
      `npm run lighthouse:import`.
- [ ] Screenshots are optional, taken by Artem. Leave out pages with a byline (blog and posts)
      unless the byline is cropped.
- [ ] `docs/before/README.md`:
  - the measurement conditions (date, machine, browser and Lighthouse versions)
  - the versions of everything on the WordPress side
  - how the login is kept out of the files
  - the headline choice (D-13)

**Exit:** the crawl snapshot and the manual Lighthouse runs exist as files, together with the
versions they were measured on, and no file contains the login.
**Talking points:**

- Why median-of-several runs.
- Why both sites are measured exactly the same way (browser, window, machine, day).
- Why localhost would fake a Best Practices gain.
- How private data is kept out of the evidence.

### Phase 2a — Astro 7 upgrade and template cleanup

- [x] Decide D-6 and D-7 before touching code.
- [x] Upgrade to Astro 7.3.x and the matching integrations. Set `engines.node >= 22.18` (the credits script runs `.ts` natively), and add
      `.node-version` for the Cloudflare build.
- [x] Config:
  - Remove `@astrojs/vercel` and keep `output: 'static'`.
  - Add `trailingSlash: 'always'` and `build.format: 'directory'`.
- [x] Cleanup, with OK per item (all approved 2026-10-13):
  - Remove the demo copy and the `Testimonials`/`Logos` sections (fake content).
  - Remove the Nunito font.
  - Remove the dead shadcn CSS block. Keep the live `--radius` variables and the border base rule.
  - Remove `tw-animate-css` and the double Tailwind setup (PostCSS plus Vite).
  - Remove Docker and the unused dependencies.
  - Remove React (D-7): `react`, `react-dom`, `@astrojs/react`, `@types/react*`, `lucide-react`,
    `button.tsx`, `input.tsx`, and the JSX settings in `tsconfig.json`. Move `buttonVariants`
    (cva) into a plain `.ts` file. Replace `Icon.astro`'s lucide-react rendering with an
    Astro-native approach: inline SVG, or an Astro icon package (ask before adding).
  - Fix the 404 page's arbitrary hex and its script.
  - Remove the dead `@assets` and `@content` aliases.
- [x] Update `CLAUDE.md`: the `<identity>` stack line (Astro 7, no React, no zod), `packages=`,
      `<prime_directive>` (no React islands until one is needed), the `<version_traps>` and the
      forms rules. Update `.claude/docs/claude/*` wherever it describes
      removed things.

**Exit:** Astro 7 runs, no dependencies are unused, and `npm run verify` and `npm run build` pass.
**Talking points:** reading a major-version upgrade guide; why unused dependencies matter for
maintenance even when they ship no bytes.

### Phase 2b — Brand foundation

- [x] Design tokens in `global.css` `@theme`:
  - The 9 colours (appendix A).
  - `--font-serif` and `--font-sans`, loaded through the Fonts API.
  - Section padding of 40px vertical (`py-10`) and a button radius of 4px. These are the brief's
    values; refine them visually.
  - Rule: text on a coloured fill uses `brand-dark`.
- [x] Layout:
  - SEO props: exact title, description, canonical, `og:type`, article times, noindex.
  - A JSON-LD slot.
  - A skip link and `<main id="main">`.
- [x] Header: active state by URL prefix, so Blog stays active on posts; `aria-hidden` on the
      menu SVG.
- [x] Footer: navigation, contact details and the demo label.
- [x] `Section.astro`: tones mapped to brand tokens; headings in the serif font.
- [x] Add `og.png`, made by Artem or from a credited Unsplash photo, and add it to `CREDITS.md`.
- [x] Update `.claude/docs/claude/design-system.md` and `performance.md` (tokens, fonts).

**Exit:** a branded shell (header, footer, 404 and one sample page) works locally, and verify and
build pass.
**Talking points:** design tokens in Tailwind v4's CSS-first `@theme`; why the button colour
changed (contrast numbers).

### Phase 2c — First Cloudflare deploy

- [x] Add `wrangler.jsonc` (D-0): assets only for now, `html_handling: "force-trailing-slash"`,
      `not_found_handling: "404-page"`. The `/api/contact` script arrives in 5c.
- [x] ~~Add a pinned `wrangler` devDependency for local `wrangler dev`.~~ Added, then removed on 2026-10-14: nothing in the repo uses it, and Cloudflare's build fetches its own `wrangler`. `npx wrangler dev` still works ad hoc.
- [x] `public/_headers`:
  - Immutable cache for `/_astro/*`.
  - Security headers.
  - `/*  X-Robots-Tag: noindex` until production, so the half-built site is never indexed.
    Removed in Phase 7.
- [x] With Artem's explicit OK to push (Artem connected the repo, 2026-10-13):
  1. Connect Workers Builds to the repo.
  2. Branch pushes create preview versions.
  3. **Production builds when a PR is merged into `main`.** The pre-push hook blocks direct
     pushes to `main`.
- [ ] Check with `curl -I` on `*.workers.dev`: `/about` → 307 → `/about/`, a real 404 status, the
      headers, and that noindex is present.

**Exit:** the shell is live on `workers.dev`, noindexed, and the docs match the code.
**Talking points:** why a static site needs no adapter; Workers vs Pages; deploying early to
surface platform behaviour (307 vs 301).

### Phase 3 — Sanity setup and content model

- [x] Create the Sanity project (free plan) with a public `production` dataset (`zboja23d`, 2026-10-14). Drafts stay
      private.
- [x] Create `studio/` (Sanity 6; scaffolded by hand rather than `sanity init`, so there was no template code to delete).
- [x] Schemas (appendix A lists the brief's fields):
  - Documents: `post`, `page` (with `sections[]`), `category`, `tag`, `siteSettings` (singleton),
    `redirect`.
  - A shared `seo` object.
  - Portable Text: image (alt per D-14, caption), table, gallery, callout and quote with
    citation.
- [x] Page sections:
  - hero (cover and banner variants, eyebrow, trust list, tone)
  - textBlock
  - imageText (eyebrow)
  - featureGrid
  - stats
  - cardGrid (eyebrow, spec list, price, button)
  - priceTable
  - faq (groups with headings)
  - latestPosts
  - cta
  - contactForm
  - **quote, steps and disclaimer** (recon finding 12)
- [x] Validation:
  - alt text (D-14)
  - meta title and description length warnings
  - unique slugs
  - a redirect `from` must start and end with `/` and must not equal a live route (pattern and
    sitemap rules live in code, not here)
- [x] Studio UX:
  - a clear title and description on every field
  - a singleton desk structure for settings
  - list previews and ordering
- [x] TypeGen: `sanity schema extract` + `sanity typegen generate`, with the types consumed by
      Astro.
- [ ] Deploy the Studio to `*.sanity.studio` (free).
  - The free plan has only Administrator and Viewer roles. **Administrator invites go only to
    accounts Artem controls**, because an Administrator can see the webhook (and the deploy-hook
    URL inside it).
  - The editor demo is shown as a recording.
- [x] Commit the project ID and dataset as non-secret config defaults. The importer's write token
      lives only in `.env`.

**Exit:** we have reviewed the schemas together, the Studio is deployed and the types are
generated.
**Talking points:** page builder (`sections[]`) vs fixed templates; why alt text is enforced; what
the free plan does and does not include.

### Phase 4 — Import script (`scripts/import-wp/`)

- [ ] CLI flags: `--dry-run` (the default until reviewed), `--only=<type>` and `--limit`. Config
      comes from env: WordPress URL, Application Password, Sanity project, dataset and token.
- [ ] Fetch categories, tags, media, posts and pages with pagination (`per_page=100`,
      `X-WP-TotalPages`). Use `context=edit` to get `content.raw` with its block comments.
- [ ] **SEO, per item** (findings 1–2):
  - Map Yoast `title` → `seo.metaTitle` and `description` → `seo.metaDescription`, checked against
    the WXR's literal `_yoast_wpseo_title` and `_yoast_wpseo_metadesc`.
  - Leave `canonical` and `noindex` empty.
  - Set `ogImage` from the featured image.
- [ ] Parse blocks with `@wordpress/block-serialization-default-parser`.
- [ ] Convert post HTML to Portable Text with `@portabletext/html` (or `block-tools` 6) and jsdom.
      Custom rules:
  - inline and figure images, with caption
  - gallery
  - table (`createTableRule`)
  - quote with "— Name" → citation
  - pull quote (test fixture only; no WordPress post uses one)
- [ ] Map page blocks to `sections[]`:
  - `cover` → hero, with the overlay colour → tone
  - `columns`/`group` → featureGrid, cardGrid or imageText
  - `media-text` → imageText
  - `table` → priceTable
  - `details` grouped under H2 → faq groups
  - CF7 shortcode → contactForm
  - italic "fictional business" notes → disclaimer
  - Astra colours → tokens (2 heading, 5 bg, 6 dark, 7 subtle)
  - Anything else → `textBlock`, plus a warning.
- [ ] Skip Home (Elementor), with the reason documented: its layout is 51 JSON widgets, not
      blocks. It is rebuilt by hand in 5c.
- [ ] Links:
  - post `/<slug>/` → `/blog/<slug>/`
  - add missing trailing slashes
  - flag `href="#"`
  - map the 30 upload image URLs to Sanity assets
  - drop About's `mediaLink`
- [ ] Clean up: drop empty paragraphs and fixed widths.
- [ ] Media:
  - Upload the `-scaled` file. Asset IDs stay Sanity's content hashes.
  - Store the WordPress ID, filename and Unsplash URL in the asset's `source` and `creditLine`.
  - Take alt text from `alt-text.json` (D-14), and report what is missing.
- [ ] Documents get deterministic `_id`s: `wp-post-<id>`, `wp-page-<id>`, `wp-category-<id>`,
      `wp-tag-<id>` and `wp-redirect-<hash>`.
- [ ] **Idempotence:**
  - The importer fetches the existing documents, deep-compares them and skips unchanged writes, so
    a re-run reports **0 mutations**.
  - It writes only the documents and fields it owns, so Studio edits and the hand-built Home
    survive.
- [ ] Write `redirect` documents to Sanity, plus `docs/redirect-map.csv` (old, new, status, reason).
- [ ] Report: counts, warnings, unconverted blocks and shortcodes, missing alt text and rewritten
      links. Save it as JSON and as `docs/import-report.md`.
- [ ] Vitest tests on real-HTML fixtures (D-9), including a CF7 shortcode inside a post body.
- [ ] README section: "How to run this against any WordPress site".
- [ ] Run order:
  1. Dry run, then review the report together.
  2. Real run.
  3. Re-run → 0 mutations.

**Exit:** the import is complete and idempotent, and the report is committed.
**Talking points:**

- REST vs WXR as a source; `content.raw` vs `content.rendered`.
- Shortcodes, and why `[contact-form-7]` becomes a section.
- How Astra's `has-ast-global-color-N` classes and `--ast-global-color-*` variables map to tokens.
- `/wp-content/uploads/YYYY/MM/` paths, and why they aren't redirected.
- Deterministic IDs; the Yoast list bug; why Elementor isn't auto-converted.

### Phase 5a — Data layer and page rendering

- [ ] Fill in all 30 alt texts (in `alt-text.json` and re-imported, per D-14).
- [ ] `src/lib/sanity/`: the client, typed GROQ queries and `siteSettings` helpers. Set the Sanity
      env in `ci.yml` and in Workers Builds in the same PR as the first query.
- [ ] Image component: Sanity image → Astro `<Picture>`, honouring crop and hotspot
      (`@sanity/image-url` v2). AVIF/WebP, sensible widths, `priority` only on the LCP hero.
- [ ] Portable Text renderer: table, gallery, callout and quote.
- [ ] `SectionRenderer`: each `_type` → its section, following the section contract.
- [ ] Routes: `/` and `[slug]` pages, plus 404.

**Exit:** every imported page renders, and verify and build pass.

### Phase 5b — Blog templates

- [ ] `/blog/` with an H1, `/blog/[slug]/`, `/blog/category/[slug]/` and `/blog/tag/[slug]/`.
      Pagination is optional, only if posts exceed one page.
- [ ] Post template:
  - the featured image as the hero
  - category and date
  - the byline "Larchwick team"
  - related posts from the same category
  - previous/next links

**Exit:** all 10 posts and every archive render.

### Phase 5c — Home, contact form and design polish

- [ ] Rebuild Home by hand in Studio as `sections[]`, with a live `latestPosts` replacing the
      widget.
- [ ] Contact form (D-4), zero client JS:
  - `<form method="post" action="/api/contact">` with a honeypot field and a timestamp check.
  - A small Worker script validates the fields and sends through Resend's HTTP API with plain
    `fetch`: no SDK, and a `User-Agent` header is required.
  - It answers with a 303 to `/contact/thanks/` or `/contact/error/` (both static, noindex).
  - `wrangler.jsonc` gets `main` and `run_worker_first: ["/api/*"]`.
  - `RESEND_API_KEY` and the recipient address are Worker secrets (`wrangler secret put`),
    never in the repo.
  - Sender: Resend's test sender, which delivers only to the Resend account owner (Artem). With a
    domain (D-3), it would be `hello@<domain>`.
  - Tests for the handler (validation, honeypot, redirect). Ask before adding Vitest at the root.
  - Free limits: Resend allows 100 emails/day; Workers allow 100k script requests/day (only
    `/api/*` counts).
- [ ] `siteSettings` drives the navigation, footer, contact details and default SEO.
- [ ] Design refinements from recon:
  - a real type scale
  - prose at 65–75 characters per line
  - spacing below heroes
  - equal-height cards with the CTAs at the bottom
  - product cards with price
  - styled FAQ `<details>`
  - hairline tables
  - blockquotes in tokens
- [ ] Responsive review at 360, 768 and 1280 px, together.
- [ ] Run `sanity dataset export` once Home and the alt text exist. Keep the export outside the
      repo: that content lives nowhere else.
- [ ] Write `docs/pages/`, one doc per template: page, blog index, post, archive, contact and 404.

**Exit:** the site is feature-complete, and we have reviewed it together at all three widths.
**Talking points:** why a contact form needs a tiny server (the Resend key is a secret); how a page builder in Sanity becomes typed Astro components; why the site
ships zero JS; why images are optimised at build time and not on request.

### Phase 6 — Redirects and SEO parity

- [ ] The `_redirects` generator is an inline Astro integration on `astro:build:done`. It reads the
      redirect documents through GROQ, adds the §8 code rules, emits both slash forms, and writes
      `dist/_redirects`. It enforces the build-failure checks in §8.
- [ ] `<head>`:
  - the exact title from `seo.metaTitle`
  - description
  - an absolute canonical with a trailing slash
  - Open Graph and Twitter tags
  - `og:type=article` with published and modified times
  - fallbacks from `siteSettings`
- [ ] JSON-LD:
  - Organization + LocalBusiness, with a fictional address
  - BlogPosting
  - FAQPage, built from the FAQ sections
- [ ] `@astrojs/sitemap`, excluding noindex pages, plus the sitemap rules.
- [ ] `robots.txt`.
- [ ] `scripts/seo-check/`, compare mode:
  - It runs **locally against `npx wrangler dev`**, which applies `_redirects`, `_headers` and
    `html_handling` like production (`astro preview` ignores them), then against the deployed
    site.
  - It requests every old URL **and its slashless form**.
  - It compares status, final URL, hop count, title, description, canonical and H1 against the
    before snapshot.
  - It writes `docs/seo-parity-report.md`.

**Exit:** the parity report shows:

- Every old URL except the 17 shortlinks → 200, or one 301 → 200, and slashless variants too.
- No missing titles or descriptions.
- Intended differences listed with their reason:
  - Blog gains a description.
  - Home and About gain an H1.
  - Attachment pages now go to their parent.
- The 17 shortlinks in a separate "known limitation" table.

**Talking points:** 301 vs 302 vs 307; redirect chains; why editors manage redirects in the CMS;
why a parity check beats eyeballing.

### Phase 7 — Production and editor workflow

- [ ] Remove the site-wide noindex header. Production runs on `workers.dev` or on a domain (D-3).
      Confirm the build env vars and turn on the build cache.
- [ ] Create a Workers Builds deploy hook for `main`, and point a Sanity GROQ webhook at it (1 of
      the 2 free), filtered to our content types, on create, update and delete.
  - **The hook URL is a credential.** Keep it out of the repo and out of any screenshot or log we
    save, and recreate it if it is ever exposed.
- [ ] **Measure publish → live:** several runs. Record only build IDs and timestamps (publish time,
      build start and end, first 200 with the new content) in `docs/after/rebuild-times.json`.
- [ ] Optional: noindex on preview hosts. Cloudflare's example pattern
      `https://:version.:subdomain.workers.dev/*` **also matches production on `workers.dev`**.
      Verify with `curl -I` that production has no `X-Robots-Tag`, or turn off Version URLs.
- [ ] Editor walkthrough, done as a non-developer would, and checked live:

  - add a post
  - edit a section
  - change SEO
  - add a redirect

  Then write `docs/editor-guide.md` with screenshots, and no hook URLs in them.

- [ ] Optional: Cloudflare Web Analytics (cookieless). Keep it only if its measured cost is
      acceptable.

**Exit:** all four editor tasks work end to end in production, and the rebuild time is saved as
JSON.
**Talking points:** webhook → deploy hook; how quick repeat publishes are debounced; why the hook
URL is treated as a secret.

### Phase 8 — Performance and accessibility pass

- [ ] **Paired session:** re-run the before set (after checking the WordPress versions are unchanged) and the after set on the
      same machine, with the same browser version and window, on the same day. The primary table uses this
      session; the Phase 1 numbers stay as the archived first baseline.
- [ ] Targets (mobile), on the primary set for all 9 URLs:

  - Performance ≥ 95
  - SEO 100
  - Accessibility ≥ 95
  - Best Practices ≥ 95

  The deployed set is reported separately. Fix until the targets are met, or document honestly
  why one isn't.

- [ ] JS audit: count `astro-island` in `dist`, and list every script shipped with its reason.
- [ ] Image audit: every `<img>` has width, height, alt and the right loading value; the LCP image
      has priority.
- [ ] Manual accessibility pass:
  - keyboard only
  - skip link
  - focus rings
  - heading order
  - axe
  - alt text: 30 of 30
- [ ] Write `docs/after/README.md` in the same shape as `docs/before/README.md`.

**Exit:** the after numbers are saved as JSON, with a summary next to the before numbers.
**Talking points:** what actually moved the numbers, using evidence from the reports, not guesses.

### Phase 9 — Case study and Upwork portfolio entry

- [ ] Write `docs/case-study.md`:
  - problem
  - approach
  - key decisions and why
  - import report numbers
  - before/after table: measured values only, with their conditions
  - the editor workflow
  - limitations
- [ ] Final README:
  - what it is, with the demo label
  - architecture
  - how to run each part
  - the importer guide
- [ ] After screenshots at 360, 768 and 1280 px. The before set is from Phase 1.
- [ ] Upwork entry (appendix A):
  - Page and post counts come from `docs/import-report.md`. Say that Home was rebuilt by hand.
  - Instead of "kept every URL working", quote the parity report's figures and name the shortlink
    limitation.
  - X→Y and A→B are the D-13 headline numbers.
- [ ] Final check against §2:
  - every sentence and number traces to a file in `docs/`
  - the credits are complete
  - no private data in any file
  - the labels are everywhere
  - the licence is present
  - no employer code
  - no fake testimonials

**Exit:** the definition of done in §1 holds.

## 10. Measurement protocol

Artem runs Lighthouse by hand, and the same steps apply to before and after.
`scripts/lighthouse-import/` collects and summarises the saved reports.

- **Browser:**
  - Use one browser for both sides; currently Brave, which is Chromium-based.
  - Turn Shields **off** for the measured site.
  - Use a private window, with no extensions.
  - Nothing heavy should be running, and the laptop should be on power.
  - Record the browser and Chromium version from `brave://version`. The Lighthouse version is
    inside each report.
- **Lighthouse panel settings:**
  - Navigation mode, all four categories, "Simulated throttling" (the default) and "Clear
    storage" on.
  - Run Mobile, then Desktop.
  - **Keep the same window size for every run.** The desktop run lays out at the window width;
    the 2026-10-07 run was 1197 px wide.
- **Runs:**
  - Home: 5 per device (it is the headline, D-13). The other 8 pages: 3 per device.
  - The median run is the one with the median Performance score; ties go to the lower LCP.
- **URLs (9):**
  - Home, About, Services, Products, FAQ, Contact and Blog.
  - Pour-over post (`/how-to-brew-pour-over-at-home/` → `/blog/how-to-brew-pour-over-at-home/`):
    the longest, with a tall image.
  - Ethiopia post (`/ethiopia-yirgacheffe/` → `/blog/ethiopia-yirgacheffe/`): gallery, quote and
    external link.
- **Saving:**
  - From the report menu (⋮), choose "Save as JSON".
  - Name it `<page>-<mobile|desktop>-<n>.json`. Page names: `home`, `about`, `services`,
    `products`, `faq`, `contact`, `blog`, `post-pour-over`, `post-ethiopia`.
  - Save it into `docs/before/lighthouse/inbox/` (gitignored), then run
    `npm run lighthouse:import`.
- **Primary environment: local vs local, under the same conditions.**
  - Both sites run over plain http on a **non-localhost `.local` hostname**: WordPress at
    `http://larchwick.local`, Astro at `http://larchwick-astro.local`.
  - For Astro that needs one `/etc/hosts` line, or the browser started with
    `--host-resolver-rules` (Phase 8).
  - **Never measure on `localhost` or `127.0.0.1`.** Lighthouse treats localhost as secure and
    skips the https audits, which would make a fake Best Practices gain.
  - `is-on-https` and `redirects-http` are listed separately: they measure the local setup, not
    the stack.
- **Secondary environment:** the deployed Cloudflare site. It is reported in its own table (for
  Artem's own comparison) and never mixed with the primary one.
- **Paired session (Phase 8):** the before and after pages are re-run on the same day, with the
  same browser version and the same window. The headline table uses that session.
- **Headline numbers:** fixed by D-13.
- **Storage:**
  - Runs: `docs/{before,after}/lighthouse/<page>/<mobile|desktop>/run-N.json.gz`, with
    screenshots and the login removed. Every run is kept.
  - Metrics of every run: `docs/{before,after}/lighthouse/metrics.json`.
  - Summary: `docs/{before,after}/lighthouse/summary.md`.
  - Conditions: `docs/{before,after}/README.md`.

## 11. Docs that move with the code

- `CLAUDE.md`:
  - `<identity>`: the stack line and `packages=`, whenever a dependency is added or removed.
  - `<version_traps>`.
  - `<building_a_page>` and `<colors>`: copy comes from Sanity, and the token names change.
  - forms and hosting.
- `.claude/docs/claude/*.md`, `.claude/skills/landing/SKILL.md`, `.claude/agents/code-sentinel.md`.
- `.claude/hooks/check-docs-sync.sh`: add `src/lib/sanity/` and `studio/schemaTypes/`.
- `README.md`, `docs/STRUCTURE.md`, `docs/internal/PROJECT.md`, `docs/pages/*` and
  `.claude/docs/WORKLOG.md`, per CLAUDE.md task-completion.
- New files:
  - `CREDITS.md`, `LICENSE`
  - `docs/before/README.md`, `docs/after/README.md`
  - `docs/redirect-map.csv`, `docs/import-report.md`, `docs/seo-parity-report.md`
  - `docs/after/rebuild-times.json`
  - `docs/editor-guide.md`, `docs/case-study.md`

## 12. Out of scope and known limitations

**Out of scope:**

- Squarespace and Webflow versions
- e-commerce
- multi-language
- AI features
- hosting WordPress publicly
- Visual Editing and live preview (they need server rendering)
- RSS, subscriptions, likes and comments (D-8): only the default comment existed, on a trashed
  post
- YouTube and video embeds (D-2)

**Known limitations:**

- **Shortlinks** (`/?p=N`, `/?page_id=N`, 17 URLs): Cloudflare `_redirects` can't match query
  strings, so they serve Home with a 200. Supporting them would need Worker code. Documented, not
  migrated.
- **Old image URLs** (`/wp-content/uploads/*`) are not redirected. Images now come from the new
  pipeline.

## Appendix A — Reference values from the original brief

**Design tokens.** These equal Astra's `--ast-global-color-0…8`, in order:

| #   | Token      | Value     | Use                                                  |
| --- | ---------- | --------- | ---------------------------------------------------- |
| 0   | brand      | `#C8743A` | accent, decorative (never behind white text)         |
| 1   | brand-dark | `#9A5420` | links, primary button background (5.73:1 with white) |
| 2   | heading    | `#3B2A20` | headings, primary button hover                       |
| 3   | text       | `#4A3F38` | body text                                            |
| 4   | surface    | `#FFFCF7` | content background, cards                            |
| 5   | bg         | `#F7F1E8` | site background                                      |
| 6   | dark       | `#2A1E17` | dark bands, hero overlays                            |
| 7   | subtle     | `#EFE6D8` | card and band backgrounds                            |
| 8   | border     | `#E2D6C6` | borders                                              |

Fonts: DM Serif Display for headings, Inter for body, both self-hosted. Layout: section padding
40px vertical, button radius 4px.

**Content model:**

- `post`: title, slug, excerpt, body (Portable Text: table, gallery, callout; youtube dropped by
  D-2),
  mainImage (with alt), categories[], tags[], publishedAt, seo.
- `page`: title, slug, sections[], seo.
- `category` and `tag`: title, slug.
- `seo`: metaTitle, metaDescription, ogImage, noindex, canonical.
- `siteSettings`: navigation, footer, default SEO, contact details.
- `redirect`: from, to, permanent.

**Quality targets:**

- Lighthouse mobile: Performance ≥ 95, SEO 100, Accessibility ≥ 95, Best Practices ≥ 95.
- Responsive at 360, 768 and 1280 px.
- Publish → live in about 1–2 minutes (measured, not assumed).

**Upwork entry:**

- Title: "WordPress to Astro + Sanity Migration (Personal Project)".
- Skills: Astro, Sanity, Website Migration, Technical SEO, TypeScript, Tailwind CSS.
- Description template (brackets filled only from `docs/`, wording adjusted per Phase 9):

  > Demo WordPress site I built for a fictional coffee roaster. I moved [N] pages and [N] posts to
  > Astro + Sanity with an automated import script, kept every URL working with 301 redirects, and
  > carried over all SEO metadata (verified by a parity check). Lighthouse mobile performance went
  > from [X] to [Y], and page weight from [A] to [B]. The marketing team can edit pages, posts, SEO
  > and redirects in Sanity Studio.

## Appendix B — Key sources (checked 2026-10-12)

- Cloudflare Workers:
  - static assets: <https://developers.cloudflare.com/workers/static-assets/>
  - redirects: <https://developers.cloudflare.com/workers/static-assets/redirects/>
  - HTML handling:
    <https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/>
  - headers: <https://developers.cloudflare.com/workers/static-assets/headers/>
  - deploy hooks: <https://developers.cloudflare.com/workers/ci-cd/builds/deploy-hooks/>
- Astro:
  - on Cloudflare: <https://docs.astro.build/en/guides/deploy/cloudflare/>
  - upgrade to v6: <https://docs.astro.build/en/guides/upgrade-to/v6/>
  - upgrade to v7: <https://docs.astro.build/en/guides/upgrade-to/v7/>
  - fonts: <https://docs.astro.build/en/guides/fonts/>
- Sanity:
  - pricing: <https://www.sanity.io/pricing>
  - webhooks: <https://www.sanity.io/docs/content-lake/webhooks>
  - TypeGen: <https://www.sanity.io/docs/apis-and-sdks/sanity-typegen>
  - WordPress migration course:
    <https://www.sanity.io/learn/course/migrating-content-from-wordpress-to-sanity>
- Portable Text HTML: <https://github.com/portabletext/editor/tree/main/packages/html>
- Lighthouse variability: <https://github.com/GoogleChrome/lighthouse/blob/main/docs/variability.md>
- Resend:
  - pricing: <https://resend.com/pricing>
  - Cloudflare Workers guide: <https://resend.com/docs/send-with-cloudflare-workers>
  - test-domain limits: <https://resend.com/docs/knowledge-base/403-error-resend-dev-domain>
