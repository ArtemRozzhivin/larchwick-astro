<baseline>
A page in this template ships:
  ClientRouter (view transitions)   ~4.5 kB gzip — the only script, and optional
  everything else                   0 kB

That is the number to protect. Every review asks what a change adds to it.

Measure, do not guess:
  npm run build      then read the emitted chunk sizes
  grep -c astro-island dist/<page>.html    0 means nothing hydrated
</baseline>

<javascript_budget>
Order of preference, always:

1. HTML does it       <details>/<summary>, <dialog>, anchors, forms
2. CSS does it        transitions, animations, :hover, :focus-within, group-open:
3. A React island     only when state or event handling is unavoidable

Already solved without JS in this repo — reuse rather than re-solve:
  accordion / FAQ     <details> + group-open: (FAQ.astro)
  mobile menu         <details> + group-open: (Header.astro)
  icons               lucide-react in .astro, no client: directive
  smooth scroll       scroll-smooth on <html> + #anchor links
  entrance motion     animate-fade-in / animate-slide-up in global.css

Hydration directives, cheapest first:
  client:visible      below the fold — carousels, maps, heavy widgets
  client:idle         needed soon, not for first paint
  client:load         must be interactive immediately — justify it in the PR

client:load above the fold is the single easiest way to wreck this template.
</javascript_budget>

<view_transitions>
Layout renders ClientRouter by default, which costs ~4.5 kB gzip.

Worth it for a multi-page site. For a one-page landing it buys nothing — pass
viewTransitions={false} and the page ships literally zero JavaScript.
</view_transitions>

<images>
Anything in src/assets/ goes through astro:assets:

  import { Image } from 'astro:assets'
  import hero from '@assets/hero.png'
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
@fontsource-variable/nunito-sans is imported once in Layout.astro. One variable
font file covers every weight.

Adding a second family doubles the font payload — ask before doing it, and prefer
another weight of the existing one.
</fonts>

<css>
Tailwind v4 generates only the classes actually used, so the stylesheet stays
small on its own. Two things spoil that:
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
- [ ] npm run build passes, and no new chunk appeared without a reason
- [ ] no client: directive that HTML or CSS could have replaced
- [ ] every image has width/height and the right loading value
- [ ] exactly one <h1>
- [ ] no render-blocking third-party script
</checklist>
