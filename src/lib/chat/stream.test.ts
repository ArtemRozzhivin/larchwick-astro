import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { answerParts, parseEvents, safePath, sourceLabel, withoutMarkers } from './stream.ts'

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

  it('turns [label](/path/) into links to our own pages only', () => {
    assert.deepEqual(answerParts('Write to us via our [contact page](/contact/) [2].'), [
      { text: 'Write to us via our ' },
      { text: 'contact page', href: '/contact/' },
      { text: '.' },
    ])
    assert.deepEqual(answerParts('See [this](https://evil.example/) or [that](javascript:x).'), [
      { text: 'See ' },
      { text: 'this' },
      { text: ' or ' },
      { text: 'that' },
      { text: '.' },
    ])
    assert.deepEqual(answerParts('No links here.'), [{ text: 'No links here.' }])
  })

  it('holds back an unfinished link or marker while streaming, never at the end', () => {
    assert.deepEqual(answerParts('Use our [contact pa', true), [{ text: 'Use our ' }])
    assert.deepEqual(answerParts('Use our [contact page](/cont', true), [{ text: 'Use our ' }])
    assert.deepEqual(answerParts('We ship to the EU [1', true), [{ text: 'We ship to the EU ' }])
    assert.deepEqual(answerParts('A stray [ bracket', false), [{ text: 'A stray [ bracket' }])
  })

  it('labels a source with its page and heading', () => {
    assert.equal(
      sourceLabel({ title: 'FAQ', url: '/faq/', heading: 'Where do you ship?' }),
      'FAQ: Where do you ship?',
    )
    assert.equal(sourceLabel({ title: 'About', url: '/about/', heading: '' }), 'About')
  })
})
