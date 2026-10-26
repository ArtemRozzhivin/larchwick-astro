import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { siteConfig } from '../config/site.ts'
import type { SiteSettings } from '../sanity/settings.ts'
import {
  blogPostingSchema,
  breadcrumbListSchema,
  faqQuestions,
  organizationSchema,
} from './schema.ts'

type Sections = Parameters<typeof faqQuestions>[0]

const home = new URL('/', siteConfig.url).href
const settings: SiteSettings = {
  siteName: 'Larchwick',
  description: 'Small-batch coffee.',
  navigation: [],
  contact: { email: 'hello@larchwick.example', hours: [] },
  demoLabel: 'Demo',
}
const paragraph = (text: string): Record<string, unknown> => ({
  _type: 'block',
  children: [{ _type: 'span', text }],
})

describe('JSON-LD', () => {
  it('gives the Organization an absolute raster logo', () => {
    const organization = organizationSchema(settings)
    assert.equal(organization.logo, new URL(siteConfig.logo, siteConfig.url).href)
    assert.match(organization.logo, /^https:\/\/.+\.png$/)
  })

  it('names the Organization as the author of a post', () => {
    const post = blogPostingSchema({
      title: 'Cold brew',
      description: 'Four steps.',
      url: `${home}blog/cold-brew/`,
      publishedAt: '2026-10-01T00:00:00Z',
      modifiedAt: '2026-10-02T00:00:00Z',
    })
    assert.deepEqual(post.author, {
      '@type': 'Organization',
      '@id': organizationSchema(settings)['@id'],
      name: siteConfig.title,
      url: home,
    })
    assert.equal(post.image, undefined)
  })

  it('numbers breadcrumbs from 1 with absolute URLs', () => {
    const list = breadcrumbListSchema([
      { name: 'Home', path: '/' },
      { name: 'Blog', path: '/blog/' },
      { name: 'Cold brew', path: '/blog/cold-brew/' },
    ])
    assert.deepEqual(list.itemListElement, [
      { '@type': 'ListItem', position: 1, name: 'Home', item: home },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${home}blog/` },
      { '@type': 'ListItem', position: 3, name: 'Cold brew', item: `${home}blog/cold-brew/` },
    ])
  })

  it('collects the questions of every FAQ section and skips the rest', () => {
    const sections = [
      { _type: 'textBlock', _key: 't' },
      {
        _type: 'faq',
        _key: 'f',
        groups: [
          {
            items: [
              {
                question: 'Do you ship?',
                answer: [paragraph('Across the EU.'), paragraph('Fast.')],
              },
              { answer: [paragraph('A question is missing.')] },
            ],
          },
          { items: [{ question: 'Whole bean?', answer: [] }] },
        ],
      },
    ] as unknown as Sections
    assert.deepEqual(faqQuestions(sections), [
      { question: 'Do you ship?', answer: 'Across the EU.\n\nFast.' },
      { question: 'Whole bean?', answer: '' },
    ])
    assert.deepEqual(faqQuestions([]), [])
  })
})
