import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { canonicalUrl } from './canonical.ts'

const SITE = 'https://larchwick.example'

describe('canonical URL', () => {
  it('makes a path absolute with the trailing slash every route has', () => {
    assert.equal(canonicalUrl('/about', SITE), `${SITE}/about/`)
    assert.equal(canonicalUrl('/blog/cold-brew/', SITE), `${SITE}/blog/cold-brew/`)
    assert.equal(canonicalUrl('/', SITE), `${SITE}/`)
  })

  it('drops the query and the fragment from our own URLs', () => {
    assert.equal(canonicalUrl('/faq/?utm_source=news#shipping', SITE), `${SITE}/faq/`)
    assert.equal(canonicalUrl(`${SITE}/about?ref=1`, SITE), `${SITE}/about/`)
  })

  it('keeps a URL on another site exactly as given', () => {
    const external = 'https://magazine.example/coffee/post.html?id=7#top'
    assert.equal(canonicalUrl(external, SITE), external)
    assert.equal(
      canonicalUrl('https://magazine.example/story', SITE),
      'https://magazine.example/story',
    )
  })

  it('treats another subdomain or scheme as another site', () => {
    assert.equal(
      canonicalUrl('https://www.larchwick.example/about', SITE),
      'https://www.larchwick.example/about',
    )
    assert.equal(
      canonicalUrl('http://larchwick.example/about', SITE),
      'http://larchwick.example/about',
    )
  })
})
