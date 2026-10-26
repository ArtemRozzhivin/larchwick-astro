import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { homeSeo, layoutSeo } from './layout-seo.ts'

const photo = (id: string): { asset: { _ref: string } } => ({
  asset: { _ref: `image-${id}-2560x1707-jpg` },
})
const main = { ...photo('main'), alt: 'Beans cooling on the roaster tray' }

describe('Layout SEO props', () => {
  it('falls back to the defaults when the document leaves its seo fields empty', () => {
    assert.deepEqual(layoutSeo(null, { title: 'About | Site', description: 'Who we are.' }), {
      title: 'About | Site',
      description: 'Who we are.',
      ogImage: undefined,
      noindex: false,
      canonical: undefined,
    })
  })

  it('takes every seo field the document sets', () => {
    const props = layoutSeo(
      {
        metaTitle: 'Our story',
        metaDescription: 'Roasting since 2019.',
        ogImage: { asset: { _ref: 'image-og-2400x1260-jpg' } },
        noindex: true,
        canonical: 'https://magazine.example/story',
      },
      { title: 'About | Site', description: 'Who we are.' },
    )
    assert.equal(props.title, 'Our story')
    assert.equal(props.description, 'Roasting since 2019.')
    assert.equal(props.noindex, true)
    assert.equal(props.canonical, 'https://magazine.example/story')
    assert.match(props.ogImage?.src ?? '', /^https:\/\/cdn\.sanity\.io\/.+og-2400x1260\.jpg\?/)
    assert.deepEqual(
      [props.ogImage?.width, props.ogImage?.height, props.ogImage?.alt],
      [1200, 630, undefined],
    )
  })

  it('shares the fallback image with its alt when Social image is empty, or is the same photo', () => {
    assert.equal(layoutSeo(null, { title: 'Post', image: main }).ogImage?.alt, main.alt)
    const samePhoto = layoutSeo({ ogImage: photo('main') }, { title: 'Post', image: main })
    assert.equal(samePhoto.ogImage?.alt, main.alt)
    const decorative = layoutSeo(null, { title: 'Post', image: { ...main, decorative: true } })
    assert.equal(decorative.ogImage?.alt, undefined)
  })

  it('shares a different Social image without the fallback alt', () => {
    const props = layoutSeo({ ogImage: photo('other') }, { title: 'Post', image: main })
    assert.match(props.ogImage?.src ?? '', /other-2560x1707\.jpg/)
    assert.equal(props.ogImage?.alt, undefined)
  })

  it('never passes noindex or canonical for the home page', () => {
    const props = homeSeo(
      { metaTitle: 'Home', noindex: true, canonical: 'https://magazine.example/' },
      { title: 'Site' },
    )
    assert.deepEqual(props, { title: 'Home', description: undefined, ogImage: undefined })
  })
})
