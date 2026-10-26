import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { Passage } from './config.ts'
import { indexMode, listAllIds, planIndex, type VectorIdPage } from './index-plan.ts'

const passage = (id: string): Passage => ({ id, url: '/', title: 'Home', heading: '', text: id })

describe('rag index plan', () => {
  it('writes the live index only from production builds', () => {
    assert.equal(indexMode({ WORKERS_CI_BRANCH: 'main' }), 'write')
    assert.equal(indexMode({ WORKERS_CI_BRANCH: 'feat/chat' }), 'skip')
    assert.equal(indexMode({}), 'skip')
    assert.equal(indexMode({ RAG_INDEX: 'dry' }), 'dry')
  })

  it('embeds only new passages and removes the ones that are gone', () => {
    const plan = planIndex(['a', 'b', 'c'], [passage('b'), passage('c'), passage('d')])
    assert.deepEqual(
      plan.add.map((item) => item.id),
      ['d'],
    )
    assert.deepEqual(plan.remove, ['a'])
  })

  it('embeds everything on the first run', () => {
    assert.equal(planIndex([], [passage('a'), passage('b')]).add.length, 2)
  })

  it('lists every stored id, page by page, until the list is no longer truncated', async () => {
    const pages: Record<string, VectorIdPage> = {
      first: { vectors: [{ id: 'a' }, { id: 'b' }], isTruncated: true, nextCursor: 'c2' },
      c2: { vectors: [{ id: 'c' }], isTruncated: true, nextCursor: 'c3' },
      c3: { vectors: [{ id: 'd' }], isTruncated: false, nextCursor: null },
    }
    const cursors: (string | undefined)[] = []
    const ids = await listAllIds(async (cursor) => {
      cursors.push(cursor)
      return pages[cursor ?? 'first']
    })
    assert.deepEqual(ids, ['a', 'b', 'c', 'd'])
    assert.deepEqual(cursors, [undefined, 'c2', 'c3'])
    assert.deepEqual(await listAllIds(async () => ({ vectors: [] })), [])
  })

  it('stops on a page that claims more results but has no cursor, instead of starting over', async () => {
    let calls = 0
    const ids = await listAllIds(() => {
      calls += 1
      return { vectors: [{ id: 'a' }], isTruncated: true, nextCursor: null }
    })
    assert.deepEqual(ids, ['a'])
    assert.equal(calls, 1)
  })

  it('takes a page loader that answers synchronously, as the wrangler CLI does', async () => {
    const pages: Record<string, VectorIdPage> = {
      first: { vectors: [{ id: 'a' }], isTruncated: true, nextCursor: 'c2' },
      c2: { vectors: [{ id: 'b' }], isTruncated: false, nextCursor: null },
    }
    assert.deepEqual(await listAllIds((cursor) => pages[cursor ?? 'first']), ['a', 'b'])
  })

  it('removes every stored vector that is no passage, such as the old manifest, once', () => {
    const plan = planIndex(['manifest', 'a', 'stale', 'stale'], [passage('a')])
    assert.deepEqual(plan.add, [])
    assert.deepEqual(plan.remove, ['manifest', 'stale'])
  })
})
