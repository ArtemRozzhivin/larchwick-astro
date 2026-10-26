import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { CONTACT_RESULTS, contactResultPath, pagePath, postPath, termPath } from './routes.ts'

describe('route paths', () => {
  it('maps the home page to / and other pages to /<slug>/', () => {
    assert.equal(pagePath('home'), '/')
    assert.equal(pagePath('faq'), '/faq/')
  })

  it('puts posts and their category and tag archives under /blog/', () => {
    assert.equal(postPath({ slug: 'cold-brew' }), '/blog/cold-brew/')
    assert.equal(termPath({ _type: 'category', slug: 'guides' }), '/blog/category/guides/')
    assert.equal(termPath({ _type: 'tag', slug: 'espresso' }), '/blog/tag/espresso/')
  })

  it('puts the contact form results under /contact/', () => {
    assert.deepEqual(CONTACT_RESULTS.map(contactResultPath), [
      '/contact/thanks/',
      '/contact/error/',
    ])
  })
})
