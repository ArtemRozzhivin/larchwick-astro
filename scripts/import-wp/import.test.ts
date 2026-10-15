import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { buildDocuments, type DesiredDoc } from './documents.ts'
import { type AltEntry, mediaItems, type MediaSwap, parseCredits, withSwaps } from './media.ts'
import { planMutations, stable } from './sync.ts'
import { ORIGIN } from './testing.ts'
import { parseWxr } from './wxr.ts'

const ROOT = resolve(import.meta.dirname, '../..')
const wxr = parseWxr(
  readFileSync(resolve(ROOT, 'docs/before/larchwick.WordPress.2026-10-07.xml'), 'utf8'),
)
const altText = JSON.parse(
  readFileSync(resolve(import.meta.dirname, 'alt-text.json'), 'utf8'),
) as Record<string, AltEntry>
const media = mediaItems(
  wxr.items,
  altText,
  parseCredits(readFileSync(resolve(ROOT, 'CREDITS.md'), 'utf8')),
)
const swaps = JSON.parse(
  readFileSync(resolve(import.meta.dirname, 'media-swaps.json'), 'utf8'),
) as Record<string, MediaSwap>
const build = () =>
  buildDocuments(wxr, {
    origin: ORIGIN,
    media: withSwaps((wpId) => {
      const item = media.find((candidate) => candidate.wpId === wpId)
      return item && { assetId: `image-${wpId}`, alt: item.alt }
    }, swaps),
  })

describe('the real WordPress export', () => {
  it('has alt text and a photographer credit for all 30 images', () => {
    expect(media).toHaveLength(30)
    for (const item of media) {
      expect(item.alt, `media ${item.wpId}`).toBeTruthy()
      expect(item.filename.startsWith(altText[item.wpId].file), `media ${item.wpId}`).toBe(true)
      expect(item.credit?.url, `media ${item.wpId}`).toMatch(/^https:\/\/unsplash\.com\/photos\//)
    }
  })

  it('builds the expected documents with deterministic ids', () => {
    const counts = Object.groupBy(build().docs, (item) => item.group)
    expect(
      Object.fromEntries(Object.entries(counts).map(([group, docs]) => [group, docs?.length])),
    ).toEqual({
      taxonomy: 11,
      posts: 10,
      pages: 7,
      settings: 1,
      redirects: 43,
    })
    expect(build().docs.map((item) => item.doc._id)).toContain('wp-post-8')
  })

  it('produces identical output on every run', () => {
    expect(stable(build())).toBe(stable(build()))
  })

  it('never writes the Elementor home page sections, so the hand-built Home survives', () => {
    const home = build().docs.find((item) => item.doc._id === 'wp-page-63')!
    expect(home.owned).not.toContain('sections')
    expect(home.doc.sections).toBeUndefined()
  })

  it('redirects old URLs in one hop to trailing-slash targets', () => {
    const { redirects } = build()
    expect(redirects).toContainEqual(expect.objectContaining({ from: '/home/', to: '/' }))
    expect(redirects).toContainEqual(
      expect.objectContaining({ from: '/brewing-guides/', to: '/blog/ethiopia-yirgacheffe/' }),
    )
    const sources = new Set(redirects.map((row) => row.from))
    for (const row of redirects) {
      expect(row.from.endsWith('/') && row.to.endsWith('/')).toBe(true)
      expect(sources.has(row.to), `${row.from} → ${row.to} chains`).toBe(false)
    }
  })

  it('reports 0 mutations when Sanity already holds the same documents', () => {
    const desired: DesiredDoc[] = build().docs
    const existing = new Map(
      desired.map(({ doc }) => [doc._id, { ...doc, _rev: 'abc', _updatedAt: 'x' }]),
    )
    expect(planMutations(desired, existing).mutations).toEqual([])
  })

  it('rewrites only WordPress-supplied fields and keeps everything edited only in the Studio', () => {
    const post = build().docs.find((item) => item.doc._id === 'wp-post-8')!
    const doc = post.doc as Record<string, Record<string, unknown>>
    const studio = {
      ...post.doc,
      _rev: 'rev-1',
      title: 'Edited in Studio',
      mainImage: { ...doc.mainImage, hotspot: { x: 0.3, y: 0.4, width: 1, height: 1 } },
      seo: { ...doc.seo, noindex: true, canonical: 'https://example.com/original/' },
    }
    const [mutation] = planMutations([post], new Map([[post.doc._id, studio]])).mutations
    expect(mutation).toEqual({
      kind: 'patch',
      id: 'wp-post-8',
      group: 'posts',
      rev: 'rev-1',
      setIfMissing: {},
      set: { title: post.doc.title },
    })
  })

  it('creates missing nested objects before setting their owned fields', () => {
    const post = build().docs.find((item) => item.doc._id === 'wp-post-8')!
    const [mutation] = planMutations(
      [post],
      new Map([[post.doc._id, { ...post.doc, seo: undefined }]]),
    ).mutations
    expect(mutation).toMatchObject({
      setIfMissing: { seo: { _type: 'seo' } },
      set: { 'seo.metaTitle': expect.any(String), 'seo.metaDescription': expect.any(String) },
    })
  })

  it('never owns a field WordPress leaves empty, so Studio values there survive', () => {
    const category = build().docs.find((item) => item.doc._id === 'wp-category-1')!
    expect(category.owned).not.toContain('description')
    const edited = { ...category.doc, description: 'Written in the Studio' }
    expect(planMutations([category], new Map([[category.doc._id, edited]])).mutations).toEqual([])
  })

  it('leaves the contact details alone when --limit skips the Contact page', () => {
    const limited = buildDocuments(wxr, { origin: ORIGIN, media: () => undefined, limit: 3 })
    const settings = limited.docs.find((item) => item.doc._id === 'siteSettings')!
    expect(settings.owned).not.toContain('contact')
    expect(settings.doc.contact).toBeUndefined()
  })

  it('skips documents that have an unpublished draft in the Studio', () => {
    const [first] = build().docs
    const plan = planMutations([first], new Map(), new Set([first.doc._id]))
    expect(plan).toEqual({ mutations: [], unchanged: [], drafts: [first.doc._id] })
  })

  it('turns the lone link in an About team card into the card button', () => {
    const about = build().docs.find((item) => item.doc._id === 'wp-page-65')!
    const sections = about.doc.sections as {
      _type: string
      cards?: { title: string; cta?: unknown }[]
    }[]
    const team = sections.find(
      (section) =>
        section._type === 'cardGrid' &&
        section.cards?.some((card) => card.title.startsWith('Mira')),
    )
    expect(team?.cards?.find((card) => card.title.startsWith('Mira'))?.cta).toEqual({
      _type: 'linkItem',
      label: 'Meet our new roaster',
      href: '/blog/meet-our-new-roaster/',
    })
  })

  it('keeps single link fields free of array keys', () => {
    const text = JSON.stringify(build().docs.map((item) => item.doc))
    expect(text).not.toMatch(/"(cta|primaryCta|secondaryCta)":\{"_type":"linkItem","_key"/)
  })
  it('replaces the two real-brand photos everywhere they are used', () => {
    const text = JSON.stringify(build().docs.map((item) => item.doc))
    expect(text).not.toMatch(/"image-(120|133)"/)
    const services = build().docs.find((item) => item.doc._id === 'wp-page-67')!
    const hero = (
      services.doc.sections as { _type: string; image?: { asset: { _ref: string } } }[]
    )[0]
    expect(hero.image?.asset._ref).toBe('image-118')
  })

  it('imports no fictional-business notes as sections', () => {
    const text = JSON.stringify(build().docs.map((item) => item.doc))
    expect(text).not.toMatch(/"_type":"disclaimer"/)
    expect(
      build().skipped.filter((item) => item.reason.startsWith('fictional-business note')),
    ).toHaveLength(2)
  })
})
