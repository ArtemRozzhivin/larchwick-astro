import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { errorMessage, isTimeout } from './errors.ts'

describe('caught values', () => {
  it('describes an Error by its message and anything else as text', () => {
    assert.equal(errorMessage(new TypeError('fetch failed')), 'fetch failed')
    assert.equal(errorMessage('limiter down'), 'limiter down')
    assert.equal(errorMessage(42), '42')
    assert.equal(errorMessage(undefined), 'undefined')
  })

  it('recognises the rejection of a timed-out signal, and nothing else', async () => {
    const signal = AbortSignal.timeout(1)
    await new Promise((resolve) => signal.addEventListener('abort', resolve, { once: true }))
    assert.equal(isTimeout(signal.reason), true)
    assert.equal(isTimeout(new DOMException('stopped', 'AbortError')), false)
    assert.equal(isTimeout(new Error('TimeoutError')), false)
    for (const value of [null, undefined, 'TimeoutError', 7]) assert.equal(isTimeout(value), false)
  })
})
