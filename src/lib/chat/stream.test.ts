import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { parseEvents, safePath, sourceLabel, withoutMarkers } from './stream.ts'

describe('chat stream', () => {
  it('reads complete events and keeps the unfinished tail', () => {
    const first = parseEvents('data: {"type":"delta","text":"Yes"}\n\ndata: {"type":"del')
    assert.deepEqual(first.events, [{ type: 'delta', text: 'Yes' }])
    const second = parseEvents(`${first.rest}ta","text":" we do"}\n\ndata: {"type":"done"}\n\n`)
    assert.deepEqual(second.events, [{ type: 'delta', text: ' we do' }, { type: 'done' }])
    assert.equal(second.rest, '')
  })

  it('skips blocks that are not valid events', () => {
    assert.deepEqual(parseEvents(': ping\n\ndata: {broken\n\n').events, [])
  })

  it('hides citation markers, even when one arrived split across two deltas', () => {
    assert.equal(
      withoutMarkers('We ship to the EU [1], free over €40 [2][3].'),
      'We ship to the EU, free over €40.',
    )
    assert.equal(withoutMarkers('Yes [' + '1].'), 'Yes.')
  })

  it('only allows links to our own pages', () => {
    assert.equal(safePath('/faq/'), '/faq/')
    assert.equal(
      safePath('/blog/cold-brew-four-simple-steps/'),
      '/blog/cold-brew-four-simple-steps/',
    )
    for (const url of [
      'javascript:alert(1)',
      'https://evil.example/',
      '//evil.example/',
      'faq/',
      '/a b/',
    ]) {
      assert.equal(safePath(url), null, url)
    }
  })

  it('labels a source with its page and heading', () => {
    assert.equal(
      sourceLabel({ title: 'FAQ', url: '/faq/', heading: 'Where do you ship?' }),
      'FAQ: Where do you ship?',
    )
    assert.equal(sourceLabel({ title: 'About', url: '/about/', heading: '' }), 'About')
  })
})
