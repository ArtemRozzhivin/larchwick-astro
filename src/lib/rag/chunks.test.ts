import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  embeddingText,
  pagePassages,
  passageId,
  postPassages,
  richTextDrafts,
  splitLong,
} from './chunks.ts'

const block = (text: string, style = 'normal', listItem?: string): Record<string, unknown> => ({
  _type: 'block',
  style,
  ...(listItem && { listItem }),
  children: [{ _type: 'span', text }],
})

describe('rag passages', () => {
  it('starts a new passage at every heading inside rich text', () => {
    const drafts = richTextDrafts(
      [
        block('Intro line.'),
        block('Brewing', 'h2'),
        block('Use 15 g of coffee.'),
        block('Grind medium-fine', 'normal', 'bullet'),
        { _type: 'table', rows: [{ cells: ['Coffee', '250 g'] }, { cells: ['Huila', '€13'] }] },
      ],
      'Guide',
    )
    assert.deepEqual(drafts, [
      { heading: 'Guide', lines: ['Intro line.'] },
      {
        heading: 'Brewing',
        lines: ['Use 15 g of coffee.', '- Grind medium-fine', 'Coffee | 250 g', 'Huila | €13'],
      },
    ])
  })

  it('gives each FAQ question and each card its own passage', () => {
    const passages = pagePassages({
      title: 'FAQ',
      url: '/faq/',
      sections: [
        {
          _type: 'faq',
          groups: [
            {
              items: [
                { question: 'Do you ship to Spain?', answer: [block('Yes, within 48 hours.')] },
                { question: 'Can I pause?', answer: [block('Any time.')] },
              ],
            },
          ],
        },
        {
          _type: 'cardGrid',
          heading: 'Single origins',
          cards: [{ title: 'Colombia Huila', specs: [{ label: 'Roast', value: 'Medium' }] }],
        },
        { _type: 'latestPosts', heading: 'From the blog' },
      ],
    })
    assert.deepEqual(
      passages.map(({ heading, text }) => [heading, text]),
      [
        ['Do you ship to Spain?', 'Yes, within 48 hours.'],
        ['Can I pause?', 'Any time.'],
        ['Colombia Huila', 'Roast: Medium'],
      ],
    )
    assert.ok(passages.every((passage) => passage.url === '/faq/' && passage.title === 'FAQ'))
  })

  it('opens a post with its excerpt, date and category', () => {
    const [first] = postPassages({
      title: 'Cold brew',
      url: '/blog/cold-brew/',
      excerpt: 'Smooth and simple.',
      publishedAt: '2026-10-01T09:00:00Z',
      categories: ['Brewing Guides'],
      body: [block('Use coarse coffee.')],
    })
    assert.equal(
      first.text,
      'Smooth and simple.\n1 October 2026, Brewing Guides\nUse coarse coffee.',
    )
    assert.equal(embeddingText(first), `Cold brew\n${first.text}`)
  })

  it('keeps the spaces around links and bold words', () => {
    const [draft] = richTextDrafts([
      {
        _type: 'block',
        children: [
          { _type: 'span', text: 'Send us a ' },
          { _type: 'span', text: 'message', marks: ['link'] },
          { _type: 'span', text: ' and we reply.' },
        ],
      },
    ])
    assert.deepEqual(draft.lines, ['Send us a message and we reply.'])
  })

  it('splits long text at paragraph boundaries', () => {
    const paragraph = Array.from({ length: 200 }, () => 'word').join(' ')
    assert.equal(splitLong([paragraph, paragraph, paragraph], 350).length, 3)
    assert.equal(splitLong(['short', 'lines'], 350).length, 1)
  })

  it('keeps ids stable for an unchanged passage and changes them when anything stored changes', () => {
    const stored = { url: '/a/', title: 'About', heading: 'H', text: 'text' }
    assert.equal(passageId(stored), passageId({ ...stored }))
    assert.match(passageId(stored), /^[0-9a-f]{32}$/)
    for (const changed of [
      { ...stored, url: '/b/' },
      { ...stored, title: 'About us' },
      { ...stored, heading: 'H2' },
      { ...stored, text: 'text!' },
    ]) {
      assert.notEqual(passageId(changed), passageId(stored), JSON.stringify(changed))
    }
  })

  it('re-indexes a page whose title was renamed', () => {
    const page = {
      url: '/about/',
      sections: [{ _type: 'textBlock', heading: 'Us', body: [block('Hi.')] }],
    }
    const [before] = pagePassages({ ...page, title: 'About' })
    const [after] = pagePassages({ ...page, title: 'About Larchwick' })
    assert.notEqual(before.id, after.id)
  })
})
