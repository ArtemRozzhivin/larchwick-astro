import { createHash } from 'node:crypto'

export function hash(text: string, length = 12): string {
  return createHash('sha1').update(text).digest('hex').slice(0, length)
}

/** Sequential `_key`s seeded by the document id, so a re-run produces identical keys. */
export function createKeyer(seed: string): () => string {
  let count = 0
  return () => hash(`${seed}:${count++}`)
}
