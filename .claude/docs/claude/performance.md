<baseline>
A page on this site ships 0 kB of JavaScript: no ClientRouter, no prefetch
script, no islands. The only <script> in the HTML is the JSON-LD data block.

That is the number to protect. Every review asks what a change adds to it.

Measure, do not guess:
  npm run build
  find dist -name '*.js'                      nothing means no JS shipped
  grep -o '<script[^>]*>' dist/index.html     only type="application/ld+json"
</baseline>

<javascript_budget>
The budget is zero. Order of preference, always:

1. HTML does it       <details>/<summary>, <dialog>, anchors, forms
2. CSS does it        transitions, animations, :hover, :focus-within, group-open:
3. Ask first          anything else. A small Astro <script> or a UI framework is
                      an architecture decision, never a default.

Already solved without JS in this repo — reuse rather than re-solve:
  accordion / FAQ     <details> + group-open: (FAQ.astro)
  mobile menu         <details> + group-open: (Header.astro)
  icons               inline SVG from Icon.astro, no runtime
  smooth scroll       scroll-smooth on <html> + #anchor links
  entrance motion     animate-slide-up in global.css
  contact form        plain HTML POST to /api/contact (Phase 5c)
</javascript_budget>

<navigation>
No ClientRouter (view transitions) and no Astro prefetch: both inject a client
script. No prefetch of any kind; adding one is an architecture decision (ask
first).
</navigation>

<images>
Anything in src/assets/ goes through astro:assets:

  import { Image } from 'astro:assets'
  import hero from '../assets/hero.png'
  <Image src={hero} alt="…" widths={[480, 960, 1440]} loading="eager" />

It emits width/height (no layout shift), modern formats, and a srcset.

Rules:
- above the fold → loading="eager"; everything else → lazy (the default)
- raw <img> only for files already in public/, and then always with explicit
  width, height, loading, and decoding
- alt="" for decorative, real text for meaningful
- an <img> without width/height is a layout-shift bug, not a style nit
</images>

<fonts>
No web font is loaded yet; text uses the system stack. Phase 2b self-hosts the
two brand fonts through the Astro Fonts API with the Fontsource provider:
DM Serif Display 400 (latin, preloaded) and Inter variable (latin). No Google
Fonts request.

Every extra family or weight adds payload — ask before adding one.
</fonts>

<css>
Tailwind v4 generates only the classes it finds in its sources, so the
stylesheet stays small on its own. global.css limits those sources to src/
(`@import 'tailwindcss' source('..')`), so class names quoted in PLAN.md or the
docs never ship. Two things spoil that:
- long arbitrary values repeated across files (extract a token instead)
- hand-written CSS in global.css that duplicates a utility

global.css should hold tokens, keyframes, and the container helper. Not much else.
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
- [ ] npm run build passes, and dist/ contains no .js file
- [ ] no client: directive and no <script> other than JSON-LD
- [ ] every image has width/height and the right loading value
- [ ] exactly one <h1>
- [ ] no render-blocking third-party script
</checklist>
