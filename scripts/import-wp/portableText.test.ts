import { describe, expect, it } from 'vitest'

import { parseBlocks } from './blocks.ts'
import { toPortableText } from './portableText.ts'
import { testContext } from './testing.ts'
import type { Gallery, PortableTable, Quote, TextBlock } from './types.ts'

function convert(content: string, postSlugs: readonly string[] = []) {
  const context = testContext(postSlugs)
  return { nodes: toPortableText(parseBlocks(content), context), context }
}

describe('rich text from post blocks', () => {
  it('converts bold, italics and links, and rewrites old post links', () => {
    const { nodes, context } = convert(
      '<!-- wp:paragraph --><p>See our <strong>grind <em>chart</em></strong> in <a href="/choosing-the-right-grind-size/">this guide</a>.</p><!-- /wp:paragraph -->',
      ['choosing-the-right-grind-size'],
    )
    const block = nodes[0] as TextBlock
    expect(block.children.map((span) => [span.text, span.marks.length])).toEqual([
      ['See our ', 0],
      ['grind ', 1],
      ['chart', 2],
      [' in ', 0],
      ['this guide', 1],
      ['.', 0],
    ])
    expect(block.markDefs).toEqual([
      expect.objectContaining({ _type: 'link', href: '/blog/choosing-the-right-grind-size/' }),
    ])
    expect(context.links).toHaveLength(1)
  })

  it('drops empty paragraphs', () => {
    expect(convert('<!-- wp:paragraph --><p></p><!-- /wp:paragraph -->').nodes).toEqual([])
  })

  it('maps heading levels and nested numbered lists', () => {
    const { nodes } =
      convert(`<!-- wp:heading {"level":3} --><h3 class="wp-block-heading">Steps</h3><!-- /wp:heading -->
<!-- wp:list {"ordered":true} --><ol class="wp-block-list"><!-- wp:list-item --><li>Grind<!-- wp:list {"ordered":true} --><ol class="wp-block-list"><!-- wp:list-item --><li>Coarse</li><!-- /wp:list-item --></ol><!-- /wp:list --></li><!-- /wp:list-item --></ol><!-- /wp:list -->`)
    expect(
      nodes.map((node) => [
        (node as TextBlock).style,
        (node as TextBlock).listItem,
        (node as TextBlock).level,
      ]),
    ).toEqual([
      ['h3', undefined, undefined],
      ['normal', 'number', 1],
      ['normal', 'number', 2],
    ])
  })

  it('turns an image with a caption into a figure with alt text from alt-text.json', () => {
    const { nodes } = convert(
      '<!-- wp:image {"id":42,"sizeSlug":"large"} --><figure class="wp-block-image size-large"><img src="x-1024x819.jpg" alt="" class="wp-image-42" style="width:750px"/><figcaption class="wp-element-caption">Large glass jar of cold brew coffee</figcaption></figure><!-- /wp:image -->',
    )
    expect(nodes[0]).toMatchObject({
      _type: 'figure',
      asset: { _ref: 'image-42' },
      alt: 'Mason jar of iced cold brew coffee next to a stack of books',
      caption: 'Large glass jar of cold brew coffee',
    })
  })

  it('warns when an image has no alt text yet', () => {
    const { nodes, context } = convert(
      '<!-- wp:image {"id":999} --><figure class="wp-block-image"><img src="x.jpg" alt=""/></figure><!-- /wp:image -->',
    )
    expect(nodes).toHaveLength(1)
    expect(context.warnings).toEqual(['media 999 has no alt text in alt-text.json'])
  })

  it('keeps a gallery as one gallery of figures', () => {
    const { nodes } =
      convert(`<!-- wp:gallery {"linkTo":"none"} --><figure class="wp-block-gallery has-nested-images"><!-- wp:image {"id":46} --><figure class="wp-block-image"><img src="a.jpg" alt=""/></figure><!-- /wp:image -->
<!-- wp:image {"id":47} --><figure class="wp-block-image"><img src="b.jpg" alt=""/></figure><!-- /wp:image --></figure><!-- /wp:gallery -->`)
    const gallery = nodes[0] as Gallery
    expect(gallery._type).toBe('gallery')
    expect(gallery.images.map((image) => image.asset._ref)).toEqual(['image-46', 'image-47'])
  })

  it('converts a table with a header row', () => {
    const { nodes } = convert(
      '<!-- wp:table --><figure class="wp-block-table"><table class="has-fixed-layout"><thead><tr><th>Brew method</th><th>Grind size</th></tr></thead><tbody><tr><td>Espresso</td><td>Fine</td></tr></tbody></table></figure><!-- /wp:table -->',
    )
    const table = nodes[0] as PortableTable
    expect(table.headerRow).toBe(true)
    expect(table.rows.map((row) => row.cells)).toEqual([
      ['Brew method', 'Grind size'],
      ['Espresso', 'Fine'],
    ])
  })

  it('splits an inline "— Name" off a quote into the citation', () => {
    const { nodes } = convert(
      '<!-- wp:quote --><blockquote class="wp-block-quote"><!-- wp:paragraph --><p>Consistency is the most underrated flavor. — Mira Holt</p><!-- /wp:paragraph --></blockquote><!-- /wp:quote -->',
    )
    expect(nodes[0]).toMatchObject({
      _type: 'quote',
      text: 'Consistency is the most underrated flavor.',
      citation: 'Mira Holt',
    })
  })

  it('reads a pull quote and its <cite>', () => {
    const { nodes } = convert(
      '<!-- wp:pullquote --><figure class="wp-block-pullquote"><blockquote><!-- wp:paragraph --><p>Roast to order, always.</p><!-- /wp:paragraph --><cite>Larchwick Team</cite></blockquote></figure><!-- /wp:pullquote -->',
    )
    expect(nodes[0] as Quote).toMatchObject({
      text: 'Roast to order, always.',
      citation: 'Larchwick Team',
    })
  })

  it('drops a contact form shortcode inside a post and reports it', () => {
    const { nodes, context } = convert(
      '<!-- wp:paragraph --><p>Write to us:</p><!-- /wp:paragraph --><!-- wp:shortcode -->[contact-form-7 id="6"]<!-- /wp:shortcode -->',
    )
    expect(nodes).toHaveLength(1)
    expect(context.warnings[0]).toMatch(/shortcode \[contact-form-7 id="6"\] was dropped/)
  })

  it('produces the same keys on every run', () => {
    const content = '<!-- wp:paragraph --><p>Same <a href="/x/">input</a></p><!-- /wp:paragraph -->'
    expect(convert(content).nodes).toEqual(convert(content).nodes)
  })
})
