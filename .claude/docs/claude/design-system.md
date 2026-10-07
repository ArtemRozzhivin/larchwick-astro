<source_of_truth>
src/styles/global.css

Tailwind v4 is CSS-first. There is no tailwind.config.js and adding one does
nothing — a JS config is ignored unless referenced with @config.

Structure:
  @import 'tailwindcss'
  @theme { --color-*, --shadow-* }   design tokens
  keyframes + .container-wide        the little that has to be hand-written
</source_of_truth>

<tokens>
colour scales, 50–950:
  primary-*     brand, CTAs, links, active states
  secondary-*   supporting accents
  accent-*      highlights, badges

shadows:
  shadow-soft   resting cards
  shadow-card   hover / raised

Tailwind's own gray scale, white, and black are fine for text, borders, and
surfaces — they are part of the framework, not ad-hoc values.
</tokens>

<rules>
Use tokens: bg-primary-600, text-primary-700, hover:bg-primary-700, shadow-soft.

Never:
- a hex, rgb, or hsl literal in a component
- an arbitrary colour value: bg-[#52d1fc], text-[#0ea5e9]
- a new one-off colour that only one component uses

Rebranding must stay a one-file change. Every hardcoded colour breaks that
promise, which is the whole reason the tokens exist.
</rules>

<adding_a_token>
Add the variable to @theme in global.css, then use it as a normal utility.
Tailwind v4 generates bg-/text-/border- utilities from --color-* automatically.

Prefer extending an existing scale over inventing a fourth one.
</adding_a_token>

<spacing_and_rhythm>
Section.astro owns vertical rhythm: py-20 md:py-28, and mb-12 md:mb-16 under the
header. Do not re-do padding in a block that already sits inside Section.

.container-wide (global.css) is the page container: max-width 1400px, 20px gutter.
Use it instead of a per-section max-w-… mx-auto px-….
</spacing_and_rhythm>

<typography>
Headings: font-semibold tracking-tight, with text-balance so they wrap evenly.
Body copy: text-pretty for paragraphs longer than a line.
Scale: h1 text-4xl md:text-6xl, h2 text-3xl md:text-4xl, h3 text-lg.

The font is Nunito Sans Variable, imported once in Layout.astro. One variable
file covers every weight — do not add a second family without asking.
</typography>

<components>
Variant-driven components use cva (button.tsx is the reference): variants for
look, size, and rounded, with defaultVariants set.

.astro files reuse those styles by calling buttonVariants({ variant, size }) and
passing the result as a class — no need to hydrate React for a link that looks
like a button.
</components>

<dark_mode>
@custom-variant dark (&:is(.dark *)) is declared, so dark: utilities work as soon
as a .dark class lands on a root element. No toggle ships today; the sections are
written light-first. Adding dark mode means adding dark: variants, not a second
set of tokens.
</dark_mode>
