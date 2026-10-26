/**
 * The "Ask Larchwick" index contract (PLAN.md Phase 7b), shared by the build that writes the index
 * (`ragIndex()`), the Worker that reads it (`worker/chat.ts`) and `scripts/rag-eval/`. Pure, with
 * no imports, so each of them can load it. `wrangler.jsonc` repeats the index name for the binding.
 */
export const RAG_INDEX = 'larchwick-content'
export const EMBEDDING_MODEL = '@cf/baai/bge-base-en-v1.5'
export const CONTENT_NAMESPACE = 'content'

/** What each vector stores as metadata, and what the Worker hands Claude as one excerpt. */
export interface Excerpt {
  url: string
  title: string
  heading: string
  text: string
}

/**
 * Every field of `Excerpt` (config.test.ts fails the type check if one is missing), in the order
 * `passageId()` hashes them: reordering changes every id and re-embeds the whole index.
 */
export const EXCERPT_FIELDS = [
  'url',
  'title',
  'heading',
  'text',
] as const satisfies readonly (keyof Excerpt)[]

/** One indexed passage: its id is a hash of the excerpt (`passageId()` in chunks.ts). */
export interface Passage extends Excerpt {
  id: string
}
