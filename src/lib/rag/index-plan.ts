import type { Passage } from './chunks.ts'

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

/** Ids are content hashes: unchanged passages are kept as they are, and nothing is re-embedded. */
export function planIndex(
  previousIds: readonly string[],
  passages: readonly Passage[],
): { add: Passage[]; remove: string[] } {
  const previous = new Set(previousIds)
  const current = new Set(passages.map((passage) => passage.id))
  return {
    add: passages.filter((passage) => !previous.has(passage.id)),
    remove: previousIds.filter((id) => !current.has(id)),
  }
}
