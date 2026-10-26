import type { Callout, CardGrid } from '@lib/sanity/sanity.types'

type Roast = NonNullable<NonNullable<CardGrid['cards']>[number]['roast']>
type CalloutTone = NonNullable<Callout['tone']>

/**
 * Fixed labels that components show beside Sanity content: the roast line on a coffee bag
 * (CardGrid.astro, "bags" layout) and the title of a rich-text callout (Callout.astro).
 */
export const ui = {
  roastLabels: {
    light: 'Light roast',
    medium: 'Medium roast',
    dark: 'Dark roast',
    seasonal: 'Seasonal',
  } satisfies Record<Roast, string>,
  calloutLabels: { note: 'Note', tip: 'Tip', warning: 'Warning' } satisfies Record<
    CalloutTone,
    string
  >,
} as const
