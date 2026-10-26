import { type Block, numberAttr } from './blocks.ts'
import {
  elements,
  firstElement,
  type HtmlElement,
  type HtmlNode,
  innerOf,
  parseHtml,
  textBlock,
  textOf,
} from './html.ts'
import type {
  ConvertContext,
  Figure,
  Gallery,
  PortableNode,
  PortableTable,
  Quote,
  TextBlock,
} from './types.ts'

const HEADING_STYLES: Readonly<Record<number, TextBlock['style']>> = {
  1: 'h2',
  2: 'h2',
  3: 'h3',
  4: 'h4',
  5: 'h4',
  6: 'h4',
}
const CITATION = /\s+[—–]\s+([^—–]+)$/
const IGNORED = new Set(['spacer', 'separator'])

export function figureFromImage(block: Block, context: ConvertContext): Figure | undefined {
  const wpId = numberAttr(block, 'id')
  const media = wpId === undefined ? undefined : context.media(wpId)
  if (!wpId || !media) {
    context.warn(`image block without a known media id (${wpId ?? 'none'}) was dropped`)
    return undefined
  }
  if (!media.alt) context.warn(`media ${wpId} has no alt text in alt-text.json`)
  const caption = textOf(firstElement(parseHtml(block.html), 'figcaption')?.children ?? [])
  return {
    _type: 'figure',
    _key: context.key(),
    asset: { _type: 'reference', _ref: media.assetId },
    alt: media.alt ?? '',
    ...(caption && { caption }),
  }
}

function gallery(block: Block, context: ConvertContext): Gallery | undefined {
  const images = block.inner
    .filter((inner) => inner.name === 'image')
    .map((inner) => figureFromImage(inner, context))
    .filter((figure): figure is Figure => figure !== undefined)
  if (images.length === 0) return undefined
  const outer = parseHtml(block.html)
  const caption = textOf(
    elements(outer, 'figcaption').filter(
      (element) => element.attribs.class?.includes('blocks-gallery-caption') ?? false,
    ),
  )
  return { _type: 'gallery', _key: context.key(), images, ...(caption && { caption }) }
}

export function table(html: string, context: ConvertContext): PortableTable | undefined {
  const nodes = parseHtml(html)
  const rows = elements(nodes, 'tr').map((row: HtmlElement) => ({
    _type: 'tableRow' as const,
    _key: context.key(),
    cells: row.children
      .filter((cell): cell is HtmlElement => 'name' in cell && /^t[hd]$/.test(cell.name))
      .map((cell) => textOf(cell.children)),
  }))
  if (rows.length === 0) return undefined
  const caption = textOf(firstElement(nodes, 'figcaption')?.children ?? [])
  return {
    _type: 'table',
    _key: context.key(),
    headerRow: firstElement(nodes, 'thead') !== undefined,
    rows,
    ...(caption && { caption }),
  }
}

function quoteParagraphs(block: Block, outer: readonly HtmlNode[]): string[] {
  const inner = block.inner.filter((child) => child.name === 'paragraph')
  const paragraphs =
    inner.length > 0
      ? inner.map((paragraph) => innerOf(paragraph.html, 'p'))
      : elements(outer, 'p').map((paragraph) => paragraph.children)
  return paragraphs.map((nodes) => textOf(nodes)).filter(Boolean)
}

export function quote(block: Block, context: ConvertContext): Quote | undefined {
  const outer = parseHtml(block.html)
  const cite = textOf(firstElement(outer, 'cite')?.children ?? [])
  let text = quoteParagraphs(block, outer).join('\n\n')
  let citation = cite
  const inline = CITATION.exec(text)
  if (!citation && inline) {
    citation = inline[1].trim()
    text = text.slice(0, inline.index).trim()
  }
  if (!text) {
    context.warn(`${block.name} block without text was dropped`)
    return undefined
  }
  return { _type: 'quote', _key: context.key(), text, ...(citation && { citation }) }
}

function listBlocks(block: Block, context: ConvertContext, level: number): TextBlock[] {
  const listItem = block.attrs.ordered === true ? 'number' : 'bullet'
  return block.inner.flatMap((item) => {
    const own = textBlock(
      (firstElement(parseHtml(item.html), 'li')?.children ?? []).filter(
        (node) => !('name' in node && (node.name === 'ul' || node.name === 'ol')),
      ),
      context,
    )
    const nested = item.inner
      .filter((inner) => inner.name === 'list')
      .flatMap((inner) => listBlocks(inner, context, level + 1))
    return [...(own ? [{ ...own, listItem, level } satisfies TextBlock] : []), ...nested]
  })
}

export function convertBlock(block: Block, context: ConvertContext): PortableNode[] {
  switch (block.name) {
    case 'paragraph': {
      const paragraph = textBlock(innerOf(block.html, 'p'), context)
      return paragraph ? [paragraph] : []
    }
    case 'heading': {
      const level = numberAttr(block, 'level') ?? 2
      const tag = `h${level}`
      const heading = textBlock(innerOf(block.html, tag), context, HEADING_STYLES[level] ?? 'h2')
      if (level === 1) context.warn('an H1 inside content became an H2')
      return heading ? [heading] : []
    }
    case 'list':
      return listBlocks(block, context, 1)
    case 'image': {
      const figure = figureFromImage(block, context)
      return figure ? [figure] : []
    }
    case 'gallery': {
      const result = gallery(block, context)
      return result ? [result] : []
    }
    case 'table': {
      const result = table(block.html, context)
      return result ? [result] : []
    }
    case 'quote':
    case 'pullquote': {
      const result = quote(block, context)
      return result ? [result] : []
    }
    case 'shortcode': {
      const code = textOf(parseHtml(block.html))
      context.warn(`shortcode ${code} was dropped: rich text can't hold it`)
      return []
    }
    case 'group':
    case 'column':
    case 'columns':
      return toPortableText(block.inner, context)
    default: {
      if (IGNORED.has(block.name)) return []
      const fallback = textBlock(parseHtml(block.html), context)
      context.warn(`unsupported block "${block.name}" kept as plain text`)
      return [...(fallback ? [fallback] : []), ...toPortableText(block.inner, context)]
    }
  }
}

export function toPortableText(blocks: readonly Block[], context: ConvertContext): PortableNode[] {
  return blocks.flatMap((block) => convertBlock(block, context))
}
