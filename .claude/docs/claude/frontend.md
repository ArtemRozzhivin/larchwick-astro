<file_types>
.astro   default for anything rendered. Static, ships no JS.
.tsx     only for a React island that genuinely needs state or events, and for
         primitives whose variants are shared (button.tsx exposes buttonVariants,
         which .astro files use as a class string).
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

<react_islands>
A .tsx component only becomes an island when a page adds a client: directive.
Without one, Astro renders it to static HTML — which is exactly how Icon.astro
uses lucide-react.

When an island is genuinely needed:
- keep it as small as possible; wrap the interactive part, not the whole section
- pass data down as props from the .astro parent, serialisable values only
- client:visible or client:idle before client:load
</react_islands>

<imports>
Aliases from tsconfig.json:
  @lib, @lib/*, @components/*, @layouts/*, @assets/*, @content/*

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
Exactly one <h1> per page (the Hero title); section headings are <h2>.
</accessibility>

<forms>
react-hook-form + @hookform/resolvers + zod are installed.

zod here is v3 — z.string().url(), z.string().email(). NOT the v4 top-level
z.url().

A form is one of the few legitimate islands. Keep the form itself in a .tsx
component with client:visible, and leave the surrounding section static.
</forms>

<ui_primitives>
src/components/ui/
  button.tsx   cva variants; .astro files import buttonVariants() for a class string
  input.tsx    label + error handling built in
  Icon.astro   lucide icon by name, server-rendered

Extend a primitive with a new cva variant rather than forking it. New icons are
added to ICON_NAMES in src/lib/types/icon.ts and to the map in Icon.astro.
</ui_primitives>
