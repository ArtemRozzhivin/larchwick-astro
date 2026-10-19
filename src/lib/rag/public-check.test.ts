import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { unpublishedWords, visibleText, words } from './public-check.ts'

const page = `<html><head><meta name="description" content="Secret meta words"></head>
<body><h1>Fresh coffee</h1><p>We roast on Mondays &amp; Thursdays. Don&#39;t wait.</p>
<script type="application/ld+json">{"hidden":"script words"}</script></body></html>`

describe('rag public check', () => {
  it('reads only the visible body text, with entities decoded', () => {
    const text = visibleText(page)
    assert.match(text, /Mondays & Thursdays\. Don't wait\./)
    assert.doesNotMatch(text, /Secret|script words/)
  })

  it('passes a passage made of words the page shows', () => {
    assert.deepEqual(unpublishedWords("Fresh coffee: don't wait!", words(visibleText(page))), [])
  })

  it('reports words the page does not show', () => {
    assert.deepEqual(unpublishedWords('Fresh coffee, secret discount', words(visibleText(page))), [
      'secret',
      'discount',
    ])
  })
})
