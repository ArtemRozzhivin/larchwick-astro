import type { Passage } from './config.ts'

export type IndexMode = 'write' | 'dry' | 'skip'

/**
 * Only production builds write to the live index; `npm run rag:passages` writes the passages to
 * a local file for review instead. Previews, local builds and GitHub CI leave the index alone.
 */
export function indexMode(env: Record<string, string | undefined>): IndexMode {
  if (env.RAG_INDEX === 'dry') return 'dry'
  if (env.WORKERS_CI_BRANCH === 'main') return 'write'
  return 'skip'
}

/** The largest page Vectorize's list endpoint returns (`count` is 1 to 1,000). */
export const LIST_PAGE_SIZE = 1000

/**
 * One page of Vectorize's "list vector ids" endpoint (`GET …/vectorize/v2/indexes/<name>/list`),
 * which `wrangler vectorize list-vectors --json` prints unchanged. The last page has
 * `isTruncated: false` and `nextCursor: null`.
 */
export interface VectorIdPage {
  vectors: { id: string }[]
  isTruncated?: boolean
  nextCursor?: string | null
}

/**
 * Every id stored in the index, following the list endpoint's cursor page by page. It stops when
 * a page is not truncated or has no cursor, the condition wrangler's own `list-vectors` uses.
 * `listPage` may answer synchronously (a wrangler call) or with a promise (a fetch).
 */
export async function listAllIds(
  listPage: (_cursor: string | undefined) => VectorIdPage | Promise<VectorIdPage>,
): Promise<string[]> {
  const ids: string[] = []
  let cursor: string | undefined
  do {
    const page = await listPage(cursor)
    ids.push(...page.vectors.map((vector) => vector.id))
    cursor = (page.isTruncated && page.nextCursor) || undefined
  } while (cursor)
  return ids
}

/**
 * Ids are content hashes: unchanged passages are kept as they are, and nothing is re-embedded.
 * The index holds only these passages, so every stored id that is not a current passage is removed
 * (an edited or deleted passage, or the manifest vector earlier builds kept).
 */
export function planIndex(
  storedIds: readonly string[],
  passages: readonly Passage[],
): { add: Passage[]; remove: string[] } {
  const stored = new Set(storedIds)
  const current = new Set(passages.map((passage) => passage.id))
  return {
    add: passages.filter((passage) => !stored.has(passage.id)),
    remove: [...stored].filter((id) => !current.has(id)),
  }
}
