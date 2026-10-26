<file_types>
.astro   anything rendered. Static, ships no JS.
.ts      config, content, types, and shared class strings (ui/button.ts and
         ui/field.ts export cva variants; ui/link.ts exports plain strings,
         because the lazy chat module uses them and must not carry cva).

There are no .tsx files: the site has no React (PLAN.md D-7).
</file_types>

<astro_components>
Frontmatter first: imports, then `interface Props`, then destructure Astro.props,
then any derived constants. Template after the fence.

  ---
  interface Props {
    id?: string
    heading: string
    items: readonly { label: string }[]
  }

  const { id, heading, items } = Astro.props
  ---

Conditional classes use class:list, not string concatenation:

  <div class:list={['rounded-sm p-6', isActive && 'bg-surface', className]}>

Pull anything longer than one short expression out of the template into a named
const above the fence.
</astro_components>

<props>
Required props have no default. Optional props are defaulted in the destructure,
not with `??` scattered through the template.

Content arrays are `readonly` — content files are `as const`, and a mutable
`Item[]` will not accept them.

Every section takes an optional `id` with no default. A fixed default would
give two sections of one type on a page the same id; pass one when a page needs
an anchor.
</props>

<client_js>
No client JavaScript beyond the assistant and the consent banner. No React, no
client: directive, no <script> in a component or page except ChatPanel.astro's
loader and ConsentBanner.astro's script (the JSON-LD
<script type="application/ld+json"> is data, not code). The CSP allows only
bundled scripts from our origin, so an inline script would be blocked.

If a component seems to need interactivity, ask before writing any: a small
Astro <script> or a UI framework is an architecture decision.
</client_js>

<imports>
Aliases from tsconfig.json:
  @lib/*, @components/*, @layouts/*

Use an alias whenever an import crosses a folder. Relative imports stay inside one
folder (./Section.astro, ../types).

Order is enforced by simple-import-sort: side effects, then external packages,
then aliases, then relative, then styles and assets. Run npm run lint:fix rather
than sorting by hand.
</imports>

<accessibility>
Interactive things are <button> or <a>, never a <div> with a handler.
Icon-only controls need an aria-label or sr-only text.
Decorative SVG gets aria-hidden="true"; meaningful images get real alt text.
Focus: a base rule in global.css gives every :focus-visible element a 2px
currentColor outline (3px offset); buttons set their own outline colour in the
cva variant. Never remove an outline without replacing it.
Layout.astro renders a "Skip to content" link (label in
siteConfig.header.labels.skipToContent) as the first focusable element, visible
on focus above the sticky header (focus:z-60), that targets
<main id="main" tabindex="-1">.
State is never colour alone: the active nav link gets an underline and
aria-current ("page" on an exact match, "true" on an ancestor such as /blog/
for /blog/<slug>/).
Exactly one <h1> per page: the Hero title on Sanity pages; posts, the blog index
and archives, the contact result pages and the 404 render their own. Section
headings are <h2>. Card
titles inside a section are <h3> under a section title, and <h2> when the
section has none (itemHeading() in sections/heading.ts picks the level; Features,
CardGrid, FAQ, Steps, LatestPosts and the contact details use it), so no level
is skipped.

The assistant's panel is a non-modal popover with role="dialog". Its input and
send button sit in a <fieldset disabled> until the loader has attached the
listener that cancels a native submit (which would GET the question into the
URL). The thinking status is static text beside a pulsing aria-hidden dot. While
the answer streams, its bubble is aria-live="off" and the draft inert (hidden
from screen readers, and its links can't be tabbed to or clicked); the finished
answer and its sources go in once, as new nodes that are not inert, so the log
announces each answer once. Over the per-visitor limit the 429 asks the visitor
to wait a minute; over the site-wide one it says the assistant is busy. Escape closes the consent banner without
storing a choice; after a first-visit choice, focus moves to #main.
</accessibility>

<forms>
A form is a plain HTML <form method="post">, with zero client JS. Validation is
native HTML (required, type="email", maxlength); the server re-checks it.

The contact form (Phase 5c, PLAN.md D-4) posts to /api/contact, a small
Cloudflare Worker script beside the static assets. It sends the message through
Resend, then 303-redirects to a static thank-you page. The fields' maxlength
comes from LIMITS in src/lib/contact/limits.ts, which the Worker checks too (line
breaks counted once, as the textarea does), and their labels from contactForm in
src/lib/content/contact.ts. Each visitor (an IPv4 address or an IPv6 /64) can
send 2 messages a minute (CONTACT_LIMITER); more, a limiter or send failure, or a
Resend call past 10 s go to /contact/error/. There is no site-wide or daily cap
(PLAN D-27): a single script on one address uses up Resend's free 100 a day in
about 50 minutes (3,000 a month in about 25 hours), and real messages then land
on /contact/error/. Accepted for the demo; a Durable Object daily counter or
Turnstile is the next step.

No form or validation library is installed. Astro's own zod is v4 (astro/zod),
and none of our code imports it.
</forms>

<ui_primitives>
src/components/ui/
  button.ts         buttonVariants (primary, secondary, accent,
                    inverse-outline; sm/md/lg), ButtonVariant, and
                    iconButtonVariants (square icon-only buttons; sm/md)
  field.ts          fieldVariants: text inputs and textareas (sm/md)
  link.ts           inlineLinkClass and pillVariants() (tags, chat
                    suggestions and sources), plain strings, no cva
  CtaButtons.astro  the hero's and the CTA band's button row from Sanity
                    links; keeps the cta_click data-track attributes
  SpecList.astro    label/value rows, as on a coffee label
  CoffeeLabel.astro, SanityImage.astro
  Icon.astro        inline SVG by name (Lucide 0.563.0 paths, ISC), no runtime

src/lib/types/link.ts holds Link (a Sanity linkItem's label and href),
UsableLink and isUsableLink(): render a link only when both are set. Import
types through the barrel, @lib/types.

Extend a primitive with a new cva variant rather than forking it. A new icon is
a name in ICON_NAMES (src/lib/types/icon.ts) plus its nodes in Icon.astro,
copied from Lucide; the Record type fails the check if the two drift apart.
</ui_primitives>
