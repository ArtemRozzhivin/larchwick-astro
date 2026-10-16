import { describe, expect, it } from 'vitest'

import { parseBlocks } from './blocks.ts'
import { toSections } from './sections.ts'
import { testContext } from './testing.ts'

function sections(content: string) {
  const context = testContext()
  return { result: toSections(parseBlocks(content), context), context }
}

const COVER = `<!-- wp:cover {"id":103,"dimRatio":60,"overlayColor":"ast-global-color-2"} -->
<div class="wp-block-cover"><img class="wp-block-cover__image-background wp-image-103" alt="" src="x.jpg"/><div class="wp-block-cover__inner-container"><!-- wp:group -->
<div class="wp-block-group"><!-- wp:heading {"textColor":"ast-global-color-5"} --><h2 class="wp-block-heading">About Larchwick</h2><!-- /wp:heading -->
<!-- wp:paragraph --><p>Small batches. Fresh roasts. No secrets.</p><!-- /wp:paragraph --></div><!-- /wp:group --></div></div><!-- /wp:cover -->`

describe('page sections from page blocks', () => {
  it('turns a cover into a banner hero with a decorative background and makes its heading the H1', () => {
    const { result, context } = sections(COVER)
    expect(result).toEqual([
      expect.objectContaining({
        _type: 'hero',
        variant: 'banner',
        heading: 'About Larchwick',
        text: 'Small batches. Fresh roasts. No secrets.',
        image: {
          _type: 'accessibleImage',
          asset: { _type: 'reference', _ref: 'image-103' },
          decorative: true,
        },
        tone: 'inverted',
      }),
    ])
    expect(context.warnings).toEqual([
      'the cover heading was not an H1; the hero makes it the page H1',
    ])
  })

  it('turns three titled columns into a feature grid', () => {
    const { result } =
      sections(`<!-- wp:group --><div class="wp-block-group"><!-- wp:heading --><h2 class="wp-block-heading">What we care about</h2><!-- /wp:heading -->
<!-- wp:columns --><div class="wp-block-columns"><!-- wp:column --><div class="wp-block-column"><!-- wp:heading {"level":3} --><h3 class="wp-block-heading">Freshness</h3><!-- /wp:heading --><!-- wp:paragraph --><p>Every bag shows its roast date.</p><!-- /wp:paragraph --></div><!-- /wp:column -->
<!-- wp:column --><div class="wp-block-column"><!-- wp:heading {"level":3} --><h3 class="wp-block-heading">Transparency</h3><!-- /wp:heading --><!-- wp:paragraph --><p>Origin is on every label.</p><!-- /wp:paragraph --></div><!-- /wp:column --></div><!-- /wp:columns --></div><!-- /wp:group -->`)
    expect(result[0]).toMatchObject({
      _type: 'featureGrid',
      heading: 'What we care about',
      items: [
        { title: 'Freshness', text: 'Every bag shows its roast date.' },
        { title: 'Transparency', text: 'Origin is on every label.' },
      ],
    })
  })

  it('turns columns with "Label: value" lists into cards with details, and plain lists into points', () => {
    const column = (title: string, items: string[]) =>
      `<!-- wp:column --><div class="wp-block-column"><!-- wp:heading {"level":3} --><h3 class="wp-block-heading">${title}</h3><!-- /wp:heading --><!-- wp:list --><ul class="wp-block-list">${items.map((item) => `<!-- wp:list-item --><li>${item}</li><!-- /wp:list-item -->`).join('')}</ul><!-- /wp:list --></div><!-- /wp:column -->`
    const { result } = sections(
      `<!-- wp:columns --><div class="wp-block-columns">${column('Ethiopia Yirgacheffe', ['Region: Gedeo zone', 'Roast: Light'])}${column('Office coffee', ['Cancel any time'])}</div><!-- /wp:columns -->`,
    )
    expect(result[0]).toMatchObject({
      _type: 'cardGrid',
      cards: [
        {
          title: 'Ethiopia Yirgacheffe',
          specs: [
            { label: 'Region', value: 'Gedeo zone' },
            { label: 'Roast', value: 'Light' },
          ],
        },
        { title: 'Office coffee', points: ['Cancel any time'] },
      ],
    })
  })

  it('reads one-item lists with a bold value as numbers on a cream band', () => {
    const stat = (value: string, label: string) =>
      `<!-- wp:column --><div class="wp-block-column"><!-- wp:list --><ul class="wp-block-list"><!-- wp:list-item --><li><strong>${value}</strong> ${label}</li><!-- /wp:list-item --></ul><!-- /wp:list --></div><!-- /wp:column -->`
    const { result } =
      sections(`<!-- wp:group --><div class="wp-block-group"><!-- wp:heading --><h2 class="wp-block-heading">Our numbers</h2><!-- /wp:heading -->
<!-- wp:group {"backgroundColor":"ast-global-color-5"} --><div class="wp-block-group"><!-- wp:columns --><div class="wp-block-columns">${stat('2×', 'roast days a week')}${stat('48 h', 'from roaster to courier')}</div><!-- /wp:columns --></div><!-- /wp:group --></div><!-- /wp:group -->`)
    expect(result[0]).toMatchObject({
      _type: 'stats',
      heading: 'Our numbers',
      tone: 'muted',
      items: [
        { value: '2×', label: 'roast days a week' },
        { value: '48 h', label: 'from roaster to courier' },
      ],
    })
  })

  it('merges question groups under their H2s into one FAQ section', () => {
    const group = (heading: string, question: string) =>
      `<!-- wp:group --><div class="wp-block-group"><!-- wp:heading --><h2 class="wp-block-heading">${heading}</h2><!-- /wp:heading --><!-- wp:details --><details class="wp-block-details"><summary>${question}</summary><!-- wp:paragraph --><p>Yes.</p><!-- /wp:paragraph --></details><!-- /wp:details --></div><!-- /wp:group -->`
    const { result } = sections(
      group('Orders and shipping', 'Where do you ship?') + group('Subscriptions', 'Can I pause?'),
    )
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      _type: 'faq',
      groups: [
        { heading: 'Orders and shipping', items: [{ question: 'Where do you ship?' }] },
        { heading: 'Subscriptions', items: [{ question: 'Can I pause?' }] },
      ],
    })
  })

  it('turns the CF7 column into a contact form and moves the details into site settings', () => {
    const { result, context } =
      sections(`<!-- wp:columns --><div class="wp-block-columns"><!-- wp:column --><div class="wp-block-column"><!-- wp:shortcode -->[contact-form-7 id="6"]<!-- /wp:shortcode --></div><!-- /wp:column -->
<!-- wp:column --><div class="wp-block-column"><!-- wp:heading {"level":3} --><h3 class="wp-block-heading">Email</h3><!-- /wp:heading --><!-- wp:paragraph --><p>hello@larchwick.example</p><!-- /wp:paragraph -->
<!-- wp:heading {"level":3} --><h3 class="wp-block-heading">Opening hours</h3><!-- /wp:heading --><!-- wp:paragraph --><p>Monday–Friday: 9:00–17:00<br>Sunday: closed</p><!-- /wp:paragraph -->
<!-- wp:heading {"level":3} --><h3 class="wp-block-heading">Wholesale enquiries</h3><!-- /wp:heading --><!-- wp:paragraph --><p>wholesale@larchwick.example</p><!-- /wp:paragraph --></div><!-- /wp:column --></div><!-- /wp:columns -->`)
    expect(result).toEqual([
      expect.objectContaining({ _type: 'contactForm', showContactDetails: true }),
    ])
    expect(context.contact).toEqual({
      email: 'hello@larchwick.example',
      hours: ['Monday–Friday: 9:00–17:00', 'Sunday: closed'],
      wholesaleEmail: 'wholesale@larchwick.example',
    })
  })

  it('drops an italic "fictional business" note and reports it, since the footer label covers it', () => {
    const { result, context } = sections(
      '<!-- wp:paragraph --><p><em>Contact details are placeholders. Larchwick is a fictional business.</em></p><!-- /wp:paragraph -->',
    )
    expect(result).toEqual([])
    expect(context.skipped[0]).toMatch(/fictional-business note dropped/)
  })

  it('turns an ordered "Title: text" list under a heading into steps', () => {
    const { result } = sections(
      `<!-- wp:group --><div class="wp-block-group"><!-- wp:heading --><h2 class="wp-block-heading">How wholesale works</h2><!-- /wp:heading --><!-- wp:list {"ordered":true} --><ol class="wp-block-list"><!-- wp:list-item --><li>Taste samples: we send three coffees.</li><!-- /wp:list-item --><!-- wp:list-item --><li>Set up: we visit.</li><!-- /wp:list-item --></ol><!-- /wp:list --></div><!-- /wp:group -->`,
    )
    expect(result[0]).toMatchObject({
      _type: 'steps',
      items: [
        { title: 'Taste samples', text: 'we send three coffees.' },
        { title: 'Set up', text: 'we visit.' },
      ],
    })
  })

  it('turns a coloured box with a heading and buttons into a call to action', () => {
    const { result } = sections(
      `<!-- wp:group --><div class="wp-block-group"><!-- wp:group {"backgroundColor":"ast-global-color-7"} --><div class="wp-block-group"><!-- wp:heading --><h2 class="wp-block-heading">Not sure what you need</h2><!-- /wp:heading --><!-- wp:paragraph --><p>Tell us a bit about your café.</p><!-- /wp:paragraph --><!-- wp:buttons --><div class="wp-block-buttons"><!-- wp:button --><div class="wp-block-button"><a class="wp-block-button__link" href="/contact">Contact us</a></div><!-- /wp:button --></div><!-- /wp:buttons --></div><!-- /wp:group --></div><!-- /wp:group -->`,
    )
    expect(result[0]).toMatchObject({
      _type: 'cta',
      heading: 'Not sure what you need',
      tone: 'muted',
      primaryCta: { label: 'Contact us', href: '/contact/' },
    })
  })

  it('merges a quote and the buttons right after it into one call to action', () => {
    const { result } = sections(
      `<!-- wp:quote --><blockquote class="wp-block-quote"><!-- wp:paragraph --><p>Four coffees we love.</p><!-- /wp:paragraph --><cite>Tomas Varga, founder</cite></blockquote><!-- /wp:quote --><!-- wp:buttons --><div class="wp-block-buttons"><!-- wp:button --><div class="wp-block-button"><a class="wp-block-button__link" href="/products">See our coffees</a></div><!-- /wp:button --></div><!-- /wp:buttons -->`,
    )
    expect(result).toEqual([
      expect.objectContaining({
        _type: 'cta',
        quote: 'Four coffees we love.',
        citation: 'Tomas Varga, founder',
        primaryCta: expect.objectContaining({ label: 'See our coffees', href: '/products/' }),
      }),
    ])
  })

  it('keeps anything unrecognised as a text section', () => {
    const { result } = sections(
      '<!-- wp:paragraph --><p>Beyond our online shop, we work with cafés.</p><!-- /wp:paragraph -->',
    )
    expect(result).toEqual([
      expect.objectContaining({
        _type: 'textBlock',
        body: [expect.objectContaining({ _type: 'block' })],
      }),
    ])
  })
})
