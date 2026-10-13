<source_of_truth>
src/styles/global.css

Tailwind v4 is CSS-first. There is no tailwind.config.js and adding one does
nothing — a JS config is ignored unless referenced with @config.

Structure:
  @import 'tailwindcss' source('..')   scans src/ only
  @theme { --color-*, --shadow-* }     the 9 brand colours and 2 shadows
  @theme inline { --font-* }           font-serif / font-sans → the Fonts API variables
  @layer base                          * { border-border }; :focus-visible outline
  @utility container-wide              the page container

Look: the old WordPress site's brand, refined (PLAN.md decision "same brand,
refined, not a redesign"): warm cream backgrounds, dark-brown serif headings,
Inter body, copper accents. docs/before/screenshots/ shows the original.
</source_of_truth>

<tokens>
Colours = Astra's global colours 0–8 on the old site (PLAN.md Appendix A):

  #  utility      value    Appendix name  use
  0  brand        #c8743a  brand          decorative accent only: icons, underlines,
                                          borders, eyebrows on dark. Never text on a
                                          light background, never behind white text
  1  brand-dark   #9a5420  brand-dark     links, active nav, eyebrows on light,
                                          primary button fill, secondary button text
  2  heading      #3b2a20  heading        headings, wordmark, primary button hover
  3  body         #4a3f38  text           body text (the <body> default)
  4  surface      #fffcf7  surface        page and card background, text on dark
  5  canvas       #f7f1e8  bg             muted bands (CTA, FAQ)
  6  dark         #2a1e17  dark           dark bands: hero, footer, inverted sections
  7  subtle       #efe6d8  subtle         hover fills; body text on dark
  8  border       #e2d6c6  border         borders and dividers (the base rule's default)

The Appendix names "text" and "bg" became `body` and `canvas`, so the utilities
read as text-body and bg-canvas.

shadows (tinted with the dark brown, rgb 42 30 23):
  shadow-soft   resting panels (FAQ)
  shadow-card   raised panels (the open mobile menu)

white is still used for text on a brand-dark fill (5.73:1). Avoid Tailwind's
gray scale: its cool greys clash with the warm palette, and every pair below is
already covered by a token.
</tokens>

<rules>
Use tokens: bg-brand-dark, text-heading, text-body, bg-canvas, border-border.

Text on a coloured fill: the fill is brand-dark and the text white. Never white
text on brand (3.49:1 fails AA); that was the old site's button.

On a dark band, text is surface or subtle, eyebrows are brand, buttons use the
inverse variants.

Never:
- a hex, rgb, or hsl literal in a component (an SVG asset in public/ may have hex)
- an arbitrary colour value: bg-[#52d1fc], text-[#0ea5e9]
- a new one-off colour that only one component uses

Rebranding must stay a one-file change. Every hardcoded colour breaks that
promise, which is the whole reason the tokens exist.

The only colour outside global.css is siteConfig.themeColor (the theme-color
meta), which repeats --color-surface.
</rules>

<contrast>
WCAG 2.2 ratios for every text/background pair in use (computed from the hex
values with the WCAG relative-luminance formula, 2026-10-13). AA needs 4.5:1 for
normal text, 3:1 for large text (24px, or 18.66px bold) and for UI parts such as
focus rings and state indicators.

  pair                              ratio    where
  body on surface                    9.96   body text
  heading on surface                13.34   headings, wordmark, menu links, inverse button text
  brand-dark on surface              5.60   active nav, eyebrows, secondary button, focus ring
  brand on surface                   3.41   active-nav underline and the aria-hidden 404
                                            numeral only (UI part / decorative), never text
  body on canvas                     9.08   CTA and FAQ text
  heading on canvas                 12.16   CTA heading
  brand-dark on canvas               5.11   eyebrow on a muted band, focus ring
  white on brand-dark                5.73   primary button, skip link
  white on heading                  13.65   primary button hover
  brand-dark on subtle               4.64   secondary button hover
  heading on subtle                 11.04   inverse button hover, menu button hover
  surface on dark                   15.83   hero h1, footer headings and links, inverse-outline
                                            button, focus ring on dark
  subtle on dark                    13.10   hero and footer body text
  brand on dark                      4.64   hero eyebrow, eyebrow on inverted sections,
                                            icons and demo-label border in the footer
  surface/60 on dark                 6.51   inverse-outline button border

Before → after (old values read from the WordPress CSS): the Elementor buttons
were white on brand, 3.49:1, which fails AA; the primary button is now white on
brand-dark, 5.73:1. The old active nav link was brand-dark (5.60:1) with colour as
its only signal; it now also has an underline and aria-current.
</contrast>

<focus>
A base rule gives every :focus-visible element a 2px currentColor outline with a
3px offset, so the ring is as legible as the element's text on light and dark
bands. Buttons set their outline colour in the variant (brand-dark on light,
surface on dark), unprefixed so transition-colors doesn't fade it in. Never
remove the outline without replacing it.
</focus>

<spacing_and_rhythm>
Section.astro owns vertical rhythm: py-12 md:py-20 (48/80px), and mb-10 md:mb-12
under the header. The brief's 40px (py-10) read as cramped against the serif
headings, so it was refined to these values. Do not re-do padding in a block that
already sits inside Section.

Hero: py-16 md:py-24. Header bar: h-16 md:h-20, not sticky (as on the old site).

container-wide (an @utility in global.css) is the page container: 1200px of
content as on the old site (max-width 79rem including the gutters), with a 16px
gutter on phones and 32px from md. Use it instead of a per-section
max-w-… mx-auto px-….
</spacing_and_rhythm>

<typography>
Fonts (astro.config.ts `fonts`, rendered by <Font> in Layout.astro):
  font-serif  DM Serif Display 400 — every heading and the wordmark
  font-sans   Inter variable 100–900 — body, UI (the <body> default)

DM Serif Display ships one weight. Never put font-medium/semibold/bold on a serif
heading: the browser fakes a bold. Headings get their weight from the face.

Scale:
  h1 (Hero)       text-4xl sm:text-5xl lg:text-[3.5rem], leading-tight
  h1 (404)        text-4xl md:text-5xl
  h2 (Section)    text-3xl md:text-4xl, leading-tight
  card title      text-2xl, leading-snug (Features)
  footer heading  text-xl
  lead paragraph  text-lg leading-relaxed (hero, section subtitle)
  body            text-base; leading-relaxed for paragraphs
  eyebrow         text-sm font-semibold uppercase tracking-widest

Headings use text-balance; paragraphs longer than a line use text-pretty.
</typography>

<components>
Variant-driven components use cva. src/components/ui/button.ts is the reference:

  variant  primary          brand-dark fill, white text, hover heading
           secondary        brand-dark outline and text, hover subtle
           inverse          surface fill, heading text (dark bands)
           inverse-outline  surface outline and text (dark bands)
  size     sm | md | lg     (default primary, md)

Radius: Tailwind's default scale; buttons and panels are rounded-sm (4px, the
brief's value).

.astro files call buttonVariants({ variant, size }) and pass the result as the
class of an <a> or <button>; Hero, CTA and the 404 do.
</components>

<dark_mode>
There is no dark mode. The site is light only, and no dark variant or dark
token set is defined. Adding one is a design decision; ask first.
</dark_mode>
