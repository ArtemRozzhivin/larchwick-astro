import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { filterSitemap, lastModified, sitemapExclusion, withLastmod } from './sitemap.ts'

const SITE = 'https://larchwick.example'

describe('sitemap lastmod', () => {
  it('dates posts and pages; a page listing posts takes the newest post date', () => {
    const dates = lastModified(
      [
        { slug: 'home', _updatedAt: '2026-10-16T11:20:36Z', listsPosts: true },
        { slug: 'blog', _updatedAt: '2026-10-14T12:29:45Z', listsPosts: true },
        { slug: 'faq', _updatedAt: '2026-10-14T12:29:45Z', listsPosts: false },
        { slug: 'privacy', _updatedAt: '2026-10-21T08:42:18Z', listsPosts: true },
        { slug: null, _updatedAt: '2026-10-22T00:00:00Z', listsPosts: false },
      ],
      [
        { path: '/blog/cold-brew/', _updatedAt: '2026-10-14T12:29:45Z' },
        { path: '/blog/autumn-blend/', _updatedAt: '2026-10-19T08:21:25Z' },
      ],
    )
    assert.deepEqual(Object.fromEntries(dates), {
      '/blog/cold-brew/': '2026-10-14T12:29:45Z',
      '/blog/autumn-blend/': '2026-10-19T08:21:25Z',
      '/': '2026-10-19T08:21:25Z',
      '/blog/': '2026-10-19T08:21:25Z',
      '/faq/': '2026-10-14T12:29:45Z',
      '/privacy/': '2026-10-21T08:42:18Z',
    })
  })

  it('keeps page dates when there are no posts', () => {
    const dates = lastModified(
      [{ slug: 'blog', _updatedAt: '2026-10-14T12:29:45Z', listsPosts: true }],
      [],
    )
    assert.equal(dates.get('/blog/'), '2026-10-14T12:29:45Z')
  })

  it('dates an archive by the newer of its term and the newest post', () => {
    const dates = lastModified(
      [],
      [
        { path: '/blog/cold-brew/', _updatedAt: '2026-10-14T12:29:45Z' },
        { path: '/blog/autumn-blend/', _updatedAt: '2026-10-19T08:21:25Z' },
      ],
      [
        { path: '/blog/category/guides/', _updatedAt: '2026-10-07T10:00:00Z' },
        { path: '/blog/tag/espresso/', _updatedAt: '2026-10-20T09:00:00Z' },
      ],
    )
    assert.equal(dates.get('/blog/category/guides/'), '2026-10-19T08:21:25Z')
    assert.equal(dates.get('/blog/tag/espresso/'), '2026-10-20T09:00:00Z')
  })

  it('never dates an archive back when a post leaves it', () => {
    const seasonal = { path: '/blog/tag/seasonal/', _updatedAt: '2026-10-07T10:00:00Z' }
    const coldBrew = { path: '/blog/cold-brew/', _updatedAt: '2026-10-14T12:29:45Z' }
    const autumn = { path: '/blog/autumn-blend/', _updatedAt: '2026-10-19T08:21:25Z' }
    const before = lastModified([], [coldBrew, autumn], [seasonal]).get(seasonal.path) ?? ''
    // Untagging the autumn post moves its date; the archive then lists cold brew only.
    const untagged = { ...autumn, _updatedAt: '2026-10-24T09:00:00Z' }
    const after = lastModified([], [coldBrew, untagged], [seasonal]).get(seasonal.path) ?? ''
    assert.equal(before, autumn._updatedAt)
    assert.equal(after, untagged._updatedAt)
    assert.ok(after >= before)
  })

  it('adds lastmod to dated URLs only and loads the dates once', async () => {
    let loads = 0
    const serialize = withLastmod(async () => {
      loads += 1
      return new Map([['/faq/', '2026-10-14T12:29:45Z']])
    })
    assert.deepEqual(await serialize({ url: `${SITE}/faq/` }), {
      url: `${SITE}/faq/`,
      lastmod: '2026-10-14T12:29:45Z',
    })
    assert.deepEqual(await serialize({ url: `${SITE}/blog/tag/espresso/` }), {
      url: `${SITE}/blog/tag/espresso/`,
    })
    assert.equal(loads, 1)
  })

  it('leaves every URL undated and warns once when the dates fail to load', async () => {
    const warnings: string[] = []
    const serialize = withLastmod(
      async () => {
        throw new Error('Sanity query failed with HTTP 503')
      },
      (message) => warnings.push(message),
    )
    assert.deepEqual(await serialize({ url: `${SITE}/faq/` }), { url: `${SITE}/faq/` })
    assert.deepEqual(await serialize({ url: `${SITE}/` }), { url: `${SITE}/` })
    assert.equal(warnings.length, 1)
    assert.match(warnings[0] ?? '', /HTTP 503/)
  })
})

describe('sitemap entries', () => {
  const page = (robots: string, canonical?: string): string =>
    `<head><meta name="robots" content="${robots}">${
      canonical ? `<link rel="canonical" href="${canonical}">` : ''
    }</head>`
  const indexed = 'index, follow'

  it('keeps a page that is its own canonical, or has no built page', () => {
    assert.equal(sitemapExclusion(page(indexed, `${SITE}/faq/`), `${SITE}/faq/`), undefined)
    assert.equal(sitemapExclusion('', `${SITE}/faq/`), undefined)
  })

  it('drops a noindex page and a page whose canonical is another URL', () => {
    assert.equal(sitemapExclusion(page('noindex, follow'), `${SITE}/blog/tag/x/`), 'noindex')
    const syndicated = page(indexed, 'https://magazine.example/story')
    assert.equal(sitemapExclusion(syndicated, `${SITE}/blog/story/`), 'canonicalElsewhere')
    const elsewhere = page(indexed, `${SITE}/about/`)
    assert.equal(sitemapExclusion(elsewhere, `${SITE}/our-story/`), 'canonicalElsewhere')
  })

  it('removes the excluded entries from the sitemap and counts them by reason', async () => {
    const entry = (path: string): string =>
      `<url><loc>${SITE}${path}</loc><lastmod>2026-10-14T12:29:45.000Z</lastmod></url>`
    const xml = `<?xml version="1.0"?><urlset>${['/', '/blog/story/', '/contact/thanks/', '/faq/']
      .map(entry)
      .join('')}</urlset>`
    const pages: Record<string, string> = {
      [`${SITE}/`]: page(indexed, `${SITE}/`),
      [`${SITE}/blog/story/`]: page(indexed, 'https://magazine.example/story'),
      [`${SITE}/contact/thanks/`]: page('noindex, follow'),
    }
    const filtered = await filterSitemap(xml, async (loc) => pages[loc] ?? '')
    assert.equal(
      filtered.xml,
      `<?xml version="1.0"?><urlset>${entry('/')}${entry('/faq/')}</urlset>`,
    )
    assert.deepEqual(filtered.dropped, { noindex: 1, canonicalElsewhere: 1 })
  })
})
