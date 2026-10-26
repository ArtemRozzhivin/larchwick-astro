import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  codeRules,
  type Rule,
  sanityRules,
  slashlessRules,
  toRedirectsFile,
  validateRules,
} from './redirect-rules.ts'

const ROUTES = [
  '/',
  '/about/',
  '/blog/',
  '/blog/ethiopia-yirgacheffe/',
  '/blog/category/brewing-guides/',
]

describe('redirect rules', () => {
  it('emits every Sanity redirect in both slash forms', () => {
    assert.deepEqual(
      sanityRules([
        { from: '/brewing-guides/', to: '/blog/ethiopia-yirgacheffe/', permanent: true },
      ]),
      [
        { from: '/brewing-guides/', to: '/blog/ethiopia-yirgacheffe/', status: 301 },
        { from: '/brewing-guides', to: '/blog/ethiopia-yirgacheffe/', status: 301 },
      ],
    )
  })

  it('maps temporary redirects to 302', () => {
    assert.equal(
      sanityRules([{ from: '/sale/', to: '/products/', permanent: false }])[0].status,
      302,
    )
  })

  it('gives slashless live pages a 301, never the home page', () => {
    assert.deepEqual(slashlessRules(['/', '/about/']), [
      { from: '/about', to: '/about/', status: 301 },
    ])
  })

  it('covers feeds, archives, the author and old sitemaps without touching live pages', () => {
    const rules = codeRules([2025, 2026])
    const sources = rules.map((rule) => rule.from)
    for (const source of [
      '/feed/',
      '/category/:slug/',
      '/tag/:slug',
      '/2025/*',
      '/2026',
      '/author/:name/',
      '/sitemap.xml',
    ]) {
      assert.ok(sources.includes(source), source)
    }
    assert.deepEqual(validateRules(rules, ROUTES), [])
  })

  it('fails on duplicates, live sources, matching patterns and chains', () => {
    const rules: Rule[] = [
      { from: '/old/', to: '/about/', status: 301 },
      { from: '/old/', to: '/blog/', status: 301 },
      { from: '/about/', to: '/', status: 301 },
      { from: '/blog/:slug/', to: '/', status: 301 },
      { from: '/a/', to: '/old/', status: 301 },
    ]
    const errors = validateRules(rules, ROUTES)
    assert.ok(errors.some((error) => error.startsWith('duplicate source /old/')))
    assert.ok(errors.some((error) => error.includes('/about/ is a live page')))
    assert.ok(errors.some((error) => error.includes('/blog/:slug/ matches the live page')))
    assert.ok(errors.some((error) => error.includes('/a/ → /old/ is a chain')))
  })

  it('writes exact-path rules before patterns', () => {
    const file = toRedirectsFile([
      { from: '/tag/:slug/', to: '/blog/tag/:slug/', status: 301 },
      { from: '/home/', to: '/', status: 301 },
    ])
    assert.ok(file.indexOf('/home/ / 301') < file.indexOf('/tag/:slug/'))
  })
})
