// Plain strings, not cva: the chat module (src/lib/chat/client.ts) uses these too, and it should
// not carry cva into the browser.

/** A link inside running text on a light background. */
export const inlineLinkClass =
  'text-larch decoration-needle hover:text-espresso font-semibold underline decoration-2 underline-offset-4'

const PILL =
  'border-espresso text-espresso hover:bg-needle rounded-full border-2 px-3 py-1 text-sm font-bold transition-colors'

/** A small pill-shaped chip: tags, the assistant's suggestions and source links. */
export function pillVariants({ as = 'link' }: { as?: 'link' | 'button' } = {}): string {
  return as === 'button' ? `${PILL} cursor-pointer text-left` : `${PILL} inline-block`
}
