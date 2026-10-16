import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { previewNoindexRule } from './preview-noindex.ts'

describe('preview noindex', () => {
  it('leaves production and local builds indexable', () => {
    assert.equal(previewNoindexRule('main'), null)
    assert.equal(previewNoindexRule(undefined), null)
    assert.equal(previewNoindexRule(''), null)
  })

  it('adds a site-wide noindex header to preview branches', () => {
    assert.match(
      previewNoindexRule('feat/phase-7-production') ?? '',
      /^\/\*\n {2}X-Robots-Tag: noindex$/m,
    )
  })
})
