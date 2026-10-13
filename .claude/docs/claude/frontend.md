<file_types>
.astro   anything rendered. Static, ships no JS.
.ts      config, content, types, and shared class strings (button.ts exposes
         buttonVariants, which .astro files use as a class string).

There are no .tsx files: the site has no React (PLAN.md D-7).
</file_types>

<astro_components>
Frontmatter first: imports, then `interface Props`, then destructure Astro.props,
then any derived constants. Template after the fence.

  ---
  interface Props {
    id?: string
    title: string
    items: readonly { label: string }[]
  }

  const { id = 'features', title, items } = Astro.props
  ---

Conditional classes use class:list, not string concatenation:

  <div class:list={['rounded-2xl p-6', isActive && 'ring-2', className]}>

Pull anything longer than one short expression out of the template into a named
const above the fence.
</astro_components>

<props>
Required props have no default. Optional props are defaulted in the destructure,
not with `??` scattered through the template.

Content arrays are `readonly` — content files are `as const`, and a mutable
`Item[]` will not accept them.

An `id` prop with a sensible default belongs on every section, so pages can link
to `#features` without editing the component.
</props>

<client_js>
Zero client JavaScript. No React, no client: directive, no <script> in a
component or page (the JSON-LD <script type="application/ld+json"> is data, not
code).

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
Never remove a focus ring without replacing it — every focusable element in this
repo uses focus-visible:ring-2.
Exactly one <h1> per page (the Hero title); section headings are <h2>. Card
titles inside a section are <h3> under a section title, and <h2> when the
section has none (Features picks the level from its title), so no level is
skipped.
</accessibility>

<forms>
A form is a plain HTML <form method="post">, with zero client JS. Validation is
native HTML (required, type="email", maxlength); the server re-checks it.

The contact form (Phase 5c, PLAN.md D-4) posts to /api/contact, a small
Cloudflare Worker script beside the static assets. It sends the message through
Resend, then 303-redirects to a static thank-you page.

No form or validation library is installed. Astro's own zod is v4 (astro/zod),
and none of our code imports it.
</forms>

<ui_primitives>
src/components/ui/
  button.ts    cva variants; .astro files call buttonVariants() for a class string
  Icon.astro   inline SVG by name (Lucide paths, ISC), no runtime

Extend a primitive with a new cva variant rather than forking it. A new icon is
a name in ICON_NAMES (src/lib/types/icon.ts) plus its nodes in Icon.astro,
copied from Lucide; the Record type fails the check if the two drift apart.
</ui_primitives>
