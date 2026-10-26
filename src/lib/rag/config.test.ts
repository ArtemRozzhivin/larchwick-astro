import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

import { type Excerpt, EXCERPT_FIELDS, RAG_INDEX } from './config.ts'

// `npm run check` fails here if Excerpt gains a field that EXCERPT_FIELDS doesn't list.
type UnlistedField = Exclude<keyof Excerpt, (typeof EXCERPT_FIELDS)[number]>
const everyFieldListed: [UnlistedField] extends [never] ? true : UnlistedField = true

describe('rag index contract', () => {
  it('lists every excerpt field once, in the order passage ids hash them', () => {
    assert.equal(everyFieldListed, true)
    assert.deepEqual(EXCERPT_FIELDS, ['url', 'title', 'heading', 'text'])
  })

  it('names the same index as every Vectorize binding in wrangler.jsonc', () => {
    const wrangler = readFileSync(new URL('../../../wrangler.jsonc', import.meta.url), 'utf8')
    const names = [...wrangler.matchAll(/"index_name":\s*"([^"]+)"/g)].map((match) => match[1])
    assert.ok(names.length >= 2, 'production and preview bindings')
    assert.deepEqual(new Set(names), new Set([RAG_INDEX]))
  })
})
