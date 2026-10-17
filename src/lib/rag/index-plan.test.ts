import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { Passage } from './chunks.ts'
import { indexMode, planIndex } from './index-plan.ts'

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
})
