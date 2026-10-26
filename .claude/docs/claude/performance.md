<baseline>
Pages ship no JavaScript of their own: no ClientRouter, no prefetch script, no
islands. The only scripts are the four bundled files in the budget below; every
other <script> in the HTML is a JSON-LD data block.

That is the number to protect. Every review asks what a change adds to it.

Measure, do not guess:
  npm run build
  wc -c dist/_astro/*.js                      exactly four files (2026-10-24: 2,302 B
                                              chat loader, 2,434 B consent, 4,359 B
                                              chat module, 1,698 B events)
  grep -o '<script[^>]*>' dist/index.html     the two module scripts + ld+json blocks
</baseline>

<javascript_budget>
The budget is the assistant and the consent banner, nothing else: ChatPanel.astro's
loader (2.2 KB, every page), src/lib/chat/client.ts (4.3 KB, fetched on the panel's
first open), ConsentBanner.astro's script (2.4 KB, every page) and the event module
they share (src/lib/analytics/track.ts, 1.7 KB, every page). The chat module imports
its link and pill classes from src/components/ui/link.ts, which are plain strings on
purpose: importing a cva helper there would ship cva to the browser. Google's gtag.js is
not ours to size: it loads only after "Accept", on production, once the page is idle,
so a first visit and Lighthouse never fetch it. Order of preference, always:

1. HTML does it       <details>/<summary>, <dialog>, anchors, forms
2. CSS does it        transitions, animations, :hover, :focus-within, group-open:
3. Ask first          anything else. A small Astro <script> or a UI framework is
                      an architecture decision, never a default.

Already solved without JS in this repo — reuse rather than re-solve:
  accordion / FAQ     <details> + group-open: (FAQ.astro)
  mobile menu         native popover + @starting-style (Header.astro, .drawer)
  chat panel open     native popover; JS only for sending and streaming
  active nav link     aria-current set at build time from the URL (Header.astro)
  icons               inline SVG from Icon.astro, no runtime
  smooth scroll       motion-safe:scroll-smooth on <html> + #anchor links
  skip link           <a href="#main"> + <main id="main" tabindex="-1">
  contact form        plain HTML POST to /api/contact (Phase 5c)
</javascript_budget>

<navigation>
No ClientRouter (view transitions) and no Astro prefetch: both inject a client
script. No prefetch of any kind; adding one is an architecture decision (ask
first).
</navigation>

<images>
Every image comes from Sanity and goes through src/components/ui/SanityImage.astro
(astro:assets <Picture>: downloaded and re-encoded to AVIF and WebP with a JPEG
fallback at build time, served from our origin, with width/height and a srcset).
There is no src/assets/. The image most likely to be the LCP gets `priority`
(eager, fetchpriority high): the hero when it is the first section
(SectionRenderer passes `priority={index === 0}`), a post's main image
(PostHeader), and the first card on the blog index and archives (BlogArchive →
PostGrid prioritizeFirst). Every other image is lazy. ImageText takes no
priority prop, so a page an editor starts with an image-and-text section gets a
lazy LCP image; a new image section that can come first needs a `priority` prop
and the same `priority={index === 0}` in SectionRenderer.

Rules:
- raw <img> only for files already in public/, and then always with explicit
  width, height, loading, and decoding
- alt="" for decorative, real text for meaningful
- an <img> without width/height is a layout-shift bug, not a style nit

Each image also gets its Sanity LQIP as an inline background (getImagePlaceholders() in
src/lib/sanity/image.ts, one query per build): about 0.5 KB of HTML per image
(blog index, 10 cards: 5 KB raw), no extra request, and no LCP effect, since
Chrome ignores low-entropy placeholder images for LCP. The CSP already allows
data: images and inline styles.

`sizes` must describe the column the image really fills, or the browser fetches a
larger file than it shows. ImageText's photo is half the container from md:
"(min-width: 76rem) 34.25rem, (min-width: 48rem) calc(50vw - 3.75rem), 100vw",
derived from the container's width and padding and the grid gap (the formula is a
comment beside it in ImageText.astro; change it with either).
</images>

<fonts>
Self-hosted through the Astro Fonts API (`fonts` in astro.config.ts, Fontsource
provider, no package). At build time Astro downloads the files, writes them to
dist/_astro/fonts/ with hashed names, and <Font> in Layout.astro inlines the
@font-face rules and the CSS variables. The browser only ever talks to our own
origin: no Google Fonts or CDN request.

  family                  subset  style    file (dist/_astro/fonts/)  preloaded
  Big Shoulders Display   latin   normal   35,504 B woff2             yes
  Hanken Grotesk          latin   normal   34,704 B woff2             yes
  Hanken Grotesk          latin   italic   35,592 B woff2             no

Both are variable fonts (Big Shoulders 600–900, Hanken 400–700), so every weight
in use comes from these files. Why these preloads: the h1 (Big Shoulders) and the
body copy (Hanken) are both above the fold on every page, so both files are
needed for the first paint; preloading starts them with the HTML instead of after
the CSS. Hanken italic is declared but not preloaded: the browser fetches it only
when italic text renders (some posts have it). That keeps it to 2 preload links,
70,208 B (the Phase 2b DM Serif Display + Inter pair was 97,664 B; Phase 10
redesign).

Fallbacks: each family gets a metric-matched local fallback generated by Astro
(Arial with size-adjust and ascent overrides for both), so the swap from
fallback to web font barely moves the layout. font-display is swap.

Every extra family, weight or style adds payload — ask before adding one.
</fonts>

<css>
Tailwind v4 generates only the classes it finds in its sources, so the
stylesheet stays small on its own. global.css limits those sources to src/
(`@import 'tailwindcss' source('..')`), so class names quoted in PLAN.md or the
docs never ship, and `@source not` leaves out test files (`*.test.ts`) and
src/integrations/, which hold no markup. Everything else under src/ is scanned,
comments and strings included: a class-like word there ships a utility to every
page (a test suite named "sitemap filter" shipped a `filter` rule before the
exclusion). Today only `.table` ships that way, from the Sanity block type
`table` named in code. Stylesheet on 2026-10-24: 36,430 B (dist/_astro/*.css).
Two things spoil that:
- long arbitrary values repeated across files (extract a token instead)
- hand-written CSS in global.css that duplicates a utility

global.css should hold tokens, the two base rules (border colour, focus outline)
and the container utility. Not much else.

No backdrop-filter on the sticky header: a blur behind a fixed element is
re-composited on every scroll frame. The header is solid paper.
</css>

<third_party>
Analytics, chat widgets, and embeds are the usual reason a fast landing becomes a
slow one. Before adding one:
- load it after interaction or on idle, never render-blocking in <head>
- self-host what can be self-hosted
- say in the PR what it costs in kB and requests

A marketing tag added "temporarily" is the most common permanent regression.
</third_party>

<checklist>
Before calling a page done:
- [ ] npm run build passes, and dist/_astro/ holds only the four budgeted .js files
- [ ] no client: directive and no <script> other than ChatPanel's, ConsentBanner's
      and JSON-LD
- [ ] every image has width/height and the right loading value
- [ ] exactly one <h1>
- [ ] no render-blocking third-party script
</checklist>
