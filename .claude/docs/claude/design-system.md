<source_of_truth>
src/styles/global.css

Tailwind v4 is CSS-first. There is no tailwind.config.js and adding one does
nothing — a JS config is ignored unless referenced with @config.

Structure:
  @import 'tailwindcss' source('..')   scans src/ only
  @source not …                        minus *.test.ts and src/integrations/
  @theme { --color-*, --radius-*, --shadow-* }
  @custom-variant short                max-height 32rem: landscape phones, high zoom
  @theme inline { --font-* }           font-display / font-sans → the Fonts API variables
  @layer base                          * { border-border }; scroll padding; :focus-visible
  @utility container-wide              the page container
  @utility reveal                      scroll-driven fade-up (see <motion>)
  @utility bag-crimp                   the striped top seal of a coffee bag
  @keyframes rise, press               reveal and the label stamp
  @layer components                    .drawer, .chat-panel, .consent-banner (positions,
                                       and one popover rise-in rule for the panel and banner)

Look: "Larch and label" (PLAN.md Phase 10). A larch is the conifer whose needles
turn gold in autumn: larch green bands, needle gold accents, espresso text on
pale paper. The coffee bag label is the graphic device: a bordered card with a
hard gold offset shadow, label-and-value rows, and a round roast stamp.
</source_of_truth>

<tokens>
  utility       value    use
  larch         #34502f  hero and inverted bands, primary button, links, eyebrows on light
  larch-deep    #263c22  primary button hover
  needle        #e6b95a  accent button, CTA band, label shadow, rule accents, text on
                         larch or espresso only (never text on a light background)
  espresso      #2a1a10  headings, label borders, footer band, secondary button
  ink           #3b2b21  body text (the <body> default)
  mist          #dfe6d6  body text on larch and espresso, category pill fill
  paper         #f2f3ef  page background (the <body> default), theme-color
  surface       #fbfbf8  labels, cards, form fields, the muted band, text on larch
  stamp         #a3362b  the roast stamp and the 404 stamp
  border        #d9d8cf  label rows and dividers (the base rule's default)
  roast-light   #e7d6a8  bag colours in the "bags" card layout, light to dark
  roast-medium  #c98b4e
  roast-dark    #7a4a2c

  radius-label  14px     labels, cards, FAQ, callouts, small photos
  radius-photo  18px     photos and the bottom of a bag
  radius-band   36px     the hero bottom and the CTA band
  shadow-label  8px 8px 0 needle, the hard offset under a label

Avoid Tailwind's gray scale and plain white/black: every pair below is covered
by a token.
</tokens>

<rules>
Never:
- a hex, rgb, or hsl literal in a component (an SVG asset in public/ may have hex)
- an arbitrary colour value: bg-[#52d1fc], text-[#0ea5e9]
- a new one-off colour that only one component uses

Rebranding must stay a one-file change. Every hardcoded colour breaks that
promise, which is the whole reason the tokens exist.

Opacity modifiers on a token are fine (border-espresso/15 under the header,
border-mist/15 in the footer); a class for a token that doesn't exist
(border-heading) silently falls back to the default border colour, so check the
name against @theme.

The only colour outside global.css is siteConfig.themeColor (the theme-color
meta), which repeats --color-paper. public/favicon.svg and public/og.jpg carry
the palette as image assets.
</rules>

<contrast>
WCAG 2.2 ratios for every text/background pair in use (computed from the hex
values with the WCAG relative-luminance formula, 2026-10-16). AA needs 4.5:1 for
normal text, 3:1 for large text (24px, or 18.66px bold) and for UI parts such as
focus rings, field borders and state indicators.

  pair                              ratio    where
  ink on paper                      12.13   body text
  espresso on paper                 15.03   headings, nav links
  larch on paper                     8.07   eyebrows, links, active-nav underline, focus ring
  ink / espresso on surface   13.04 / 16.16  labels, cards, form fields, muted band
  larch on surface                   8.68   label origin line, check icons
  stamp on paper / surface    6.04 / 6.49   the stamps
  surface on larch                   8.68   hero h1, primary button, focus ring on larch
  mist on larch                      7.04   hero and inverted-band body text
  needle on larch                    4.91   eyebrows on larch, check icons
  surface on larch-deep             11.56   primary button hover
  espresso on needle                 9.13   accent button, CTA band text
  larch on needle                    4.91   primary button and its focus ring on the CTA band
  mist on espresso                  13.10   footer text
  needle on espresso                 9.13   footer headings, icons, demo label
  surface on espresso               16.16   secondary and accent button hover
  espresso on roast-light / medium 11.63 / 5.81   bag text
  surface on roast-dark / larch    7.12 / 8.68   bag text on dark and seasonal bags
  larch on mist                      7.04   category pill
  espresso/60 on surface             4.40   form field border

needle on paper is about 1.7:1, so gold is never text, and never the only state
signal, on a light background: the active nav underline is larch, and gold is the
hover underline only. espresso on larch is 1.86:1, so a button sitting on larch
uses a surface focus ring (the accent variant does).

The chat launcher floats over every band, light and dark, so its focus state is
not the ring alone: on keyboard focus it fills espresso with surface text (as on
hover), and the currentColor ring turns surface with it.
</contrast>

<focus>
A base rule gives every :focus-visible element a 2px currentColor outline with a
3px offset, so the ring is as legible as the element's text on light and dark
bands. Buttons set their outline colour in the variant, unprefixed so
transition-colors doesn't fade it in. Never remove the outline without replacing
it.
</focus>

<motion>
All CSS only, all off for prefers-reduced-motion:

- `reveal` (an @utility): an element fades up 2rem as it scrolls into view, driven
  by animation-timeline: view(), eased out over the first 35vh of the cover range
  (measured in viewport height, so a title and a tall card take the same ~240px
  of scrolling). Written as longhands: the minifier would otherwise fold it into
  an `animation: … view()` shorthand that browsers drop. Browsers without
  scroll-driven animations (Firefox today) show the content as is. Stagger with an
  inline style="--reveal-delay: N" (3vh per step).
  Titles animate on their own: a section header's eyebrow, title and intro reveal
  in turn (0, 1, 2), as do the image-and-text column's eyebrow, title and button;
  FAQ group titles, the CTA heading or quote (inside the rising band), cards,
  steps, stats, post cards, the contact form and its details card all reveal.
  Rich text (posts, text sections) reveals each paragraph, heading, list and
  figure on its own, unless it sits inside a block that already rises.
- `rise-in` and `unveil` (@utilities): the first screen has nothing to scroll, so
  page headers enter once on load. Hero, blog archive and post header text rise in
  turn (style="--rise-delay: N", 90 ms steps: eyebrow/meta 0, h1 1, text 2,
  buttons and label 3, promises 4); the hero photo and the post's featured image
  fade in from a 1.04 scale. The h1 starts at 90 ms, so LCP moves by about 0.1 s at
  most.
- `press` (a keyframe): the roast stamp presses on at 1 s, after the label has
  landed; the 404 stamp at 0.3 s (motion-safe:animate-[press_…]).

Hover motion stays small: colour changes, and the related-post card gains its
label shadow.
</motion>

<spacing_and_rhythm>
Section.astro owns vertical rhythm: py-8 md:py-12 (32/48px each side, so 64/96px
between two sections; Artem found 56/80px too loose), and mb-8 md:mb-10 under the
header. The CTA band's outer padding matches. Headers are left aligned by default (align="center" is still available).
Do not re-do padding in a block that already sits inside Section.

Hero: a larch band with rounded-b-band; py-16 md:py-24 (cover), py-14 md:py-20
(banner). With a coffee label, text and label sit in two columns. With a photo,
the photo fills the right half of the band edge to edge from lg (absolute,
object-cover, min-h-[32rem]); below lg it runs full width under the text.

The header is sticky (top-0) on solid paper, with no backdrop blur (a blur
re-composites the header on every scroll frame), and
scroll-padding-top in the base layer keeps anchors below it. On short viewports
(`short:`, max-height 32rem: a landscape phone, 400% zoom) it scrolls with the
page instead (`short:relative`, scroll-padding-top 0): stuck to the top, it and
the consent banner would cover every focus stop. While the banner is open there,
`scroll-padding-bottom: calc(100dvh - 4rem)` makes the browser scroll each
focused element into the 4rem strip the banner leaves free at the top. Known
gap: at normal phone heights (e.g. 375×667) the open banner can still cover
focus stops near the bottom of the screen until the visitor chooses or presses
Escape. Below md the menu
is a sidebar: a native popover (`popovertarget`, no JavaScript) styled by
`.drawer` in global.css. It slides in from the right over a dimmed backdrop and
its links follow one after another (@starting-style). Escape, an outside click
and the close button shut it, and the page doesn't scroll while it is open.
Without popover support (pre-2023 browsers) its button is hidden and the footer
keeps the links.

container-wide (an @utility in global.css) is the page container: 1200px of
content as on the old site, with a 16px gutter on phones and 32px from md. Use it
instead of a per-section max-w-… mx-auto px-….
</spacing_and_rhythm>

<typography>
Fonts (astro.config.ts `fonts`, rendered by <Font> in Layout.astro):
  font-display  Big Shoulders Display, variable 600–900 — headings, wordmark,
                stamps, big numbers
  font-sans     Hanken Grotesk, variable 400–700 — body and UI (the <body> default)

Big Shoulders is condensed; set it tight (leading-[0.88] to leading-none) and
heavy (font-extrabold or font-black). No all-caps labels and no letter-spaced
eyebrows: eyebrows are font-bold in larch (or needle on larch).

Scale:
  h1 (Hero cover)  text-[3.6rem] sm:text-7xl xl:text-[6.75rem], leading-[0.88]
  h1 (banner)      text-[3.2rem] sm:text-6xl lg:text-7xl
  h2 (Section)     text-[2.6rem] md:text-6xl, leading-[0.95], font-black
  card title       text-[1.9rem]–text-[2rem], leading-none
  lead paragraph   text-lg leading-relaxed (hero, section subtitle)
  body             text-base; leading-relaxed for paragraphs

Headings use text-balance; paragraphs longer than a line use text-pretty.
</typography>

<components>
Variant-driven components use cva. src/components/ui/button.ts is the reference:

  variant  primary          larch fill, surface text, hover larch-deep
           secondary        espresso outline and text, hover espresso fill
           accent           needle fill, espresso text (on larch bands)
           inverse-outline  surface outline and text (on larch bands)
  size     sm | md | lg     (default primary, md)

Buttons are rounded-md with a 2px border and bold text. ButtonVariant is the
variant type; CtaButtons (src/components/ui/CtaButtons.astro) renders the hero's
and the CTA band's row of large buttons from Sanity links, one variant per
button. iconButtonVariants is the square icon-only button (menu, close); its base
classes include shrink-0, so a flex row never squeezes it.

Other shared class strings: fieldVariants (src/components/ui/field.ts) for text
inputs and textareas, espresso/60 border and larch focus; inlineLinkClass (larch
text, needle underline) and pillVariants() (espresso-bordered chips: post tags,
chat suggestions and sources) in src/components/ui/link.ts. SpecList is the
label/value rows of a coffee label and a card's details.

CoffeeLabel (src/components/ui/CoffeeLabel.astro) is the label card: name,
origin line, label/value rows, a bottom line and an optional stamp ("small line"
newline "big line"). The home hero shows it when the hero's `label` is filled in.
The name's right padding clears the stamp (pr-20, pr-24 from sm) and its size
shrinks fluidly below about 370px wide, so a long word fits at 320px; the hero
grid is one grid-cols-1 column below lg, so the label can't widen it.

CTA takes an optional quote and citation, shown large in place of a heading
(About: the founder's quote sits in the band with its buttons). Without a
heading, quote or text it is a compact band of buttons.

SanityImage paints each image's Sanity LQIP (a blurred ~0.5 KB preview) as the
img background, so a photo never loads into an empty box.

ChatPanel (src/components/chat/) is the assistant: a needle (gold) launcher
with an espresso border, icon-only below sm, and a popover panel styled as a
label (surface, 2px espresso border, rounded-label, shadow-label). Questions are
larch bubbles on the right; answers are paper bubbles with a border, errors use
stamp. The "Looking through the site" status is static ink text beside a larch
dot that pulses only with motion-safe (pulsing text would drop below 4.5:1). `.chat-panel` in global.css positions it (bottom sheet on phones,
25rem card from sm) and fades it up 1rem on open (none for reduced motion); on
short viewports (the `short:` variant) the whole panel scrolls instead of only
the conversation.

The consent banner (`.consent-banner`) is a 26rem card bottom left from sm, full
width on phones, capped at the viewport's height minus its margins and scrolling
inside; it rises in with the same rule as the chat panel. On short viewports
(`short:`, e.g. 400% zoom) its max-height leaves the top 4rem free at every
width (`100dvh - 4.5rem`, `- 5.5rem` from sm, less the 0.5rem / 1.5rem bottom
inset): it sits in the top layer, and the strip has to hold the focused skip
link (top-3, 2.5rem tall) and its ring. The base layer's scroll padding (see
the header, above) moves other focused elements into the same strip.

CardGrid has two layouts: `cards` (label cards with photo, details, points) and
`bags` (coffee bags coloured by each card's `roast`, with the crimped top).
</components>

<tones>
Section tones: default (paper, "Light" in the Studio), muted (surface between
2px espresso rules, "Cream") and inverted (larch, "Dark"). Dark is offered only
where every colour in the block adapts to the larch band: today the CTA
(toneField), whose tone colours its rounded band instead (default surface with an
espresso border, muted needle, inverted larch). Every other section uses lightToneField (Light/Cream) and types
`tone` as LightTone, exported by Section.astro, because its dark text, links or
buttons would vanish on larch. The Hero is always the larch band; its tone field
is hidden in the Studio. SectionHeader (used by Section and ImageText) switches
the eyebrow to needle and the heading to surface on inverted.
</tones>

<dark_mode>
There is no dark mode. The site is light only, and no dark variant or dark
token set is defined. Adding one is a design decision; ask first.
</dark_mode>
