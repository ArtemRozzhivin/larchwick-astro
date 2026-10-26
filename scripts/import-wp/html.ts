import { DomUtils, parseDocument } from 'htmlparser2'

import type { ConvertContext, LinkMark, Span, TextBlock } from './types.ts'

export type HtmlNode = ReturnType<typeof parseDocument>['children'][number]
export type HtmlElement = Extract<HtmlNode, { attribs: Record<string, string> }>
type HtmlText = Extract<HtmlNode, { data: string }>

export function isElement(node: HtmlNode): node is HtmlElement {
  return 'attribs' in node
}

function isText(node: HtmlNode): node is HtmlText {
  return (node.type as string) === 'text'
}

const MARKS: Readonly<Record<string, string>> = { strong: 'strong', b: 'strong', em: 'em', i: 'em' }
const BLOCK_TAGS = new Set(['ul', 'ol', 'figure', 'table', 'blockquote', 'details'])

export function parseHtml(html: string): HtmlNode[] {
  return parseDocument(html).children
}

export function elements(nodes: readonly HtmlNode[], tag: string): HtmlElement[] {
  return DomUtils.getElementsByTagName(tag, [...nodes], true) as HtmlElement[]
}

export function firstElement(nodes: readonly HtmlNode[], tag: string): HtmlElement | undefined {
  return elements(nodes, tag)[0]
}

export function innerOf(html: string, tag: string): HtmlNode[] {
  return firstElement(parseHtml(html), tag)?.children ?? []
}

export function textOf(nodes: HtmlNode | readonly HtmlNode[]): string {
  return DomUtils.textContent(Array.isArray(nodes) ? [...nodes] : (nodes as HtmlNode))
    .replace(/\s+/g, ' ')
    .trim()
}

export function attr(element: HtmlElement | undefined, name: string): string | undefined {
  return element?.attribs[name]
}

export function isItalicOnly(nodes: readonly HtmlNode[]): boolean {
  const meaningful = nodes.filter((node) => !(isText(node) && !node.data.trim()))
  return (
    meaningful.length === 1 &&
    isElement(meaningful[0]) &&
    (meaningful[0].name === 'em' || meaningful[0].name === 'i')
  )
}

function mergeSpans(spans: Span[]): Span[] {
  const merged: Span[] = []
  for (const span of spans) {
    const last = merged.at(-1)
    if (last && last.marks.join() === span.marks.join()) last.text += span.text
    else merged.push({ ...span })
  }
  return merged
}

function trimEdges(spans: Span[]): Span[] {
  if (spans.length === 0) return spans
  spans[0].text = spans[0].text.replace(/^\s+/, '')
  spans[spans.length - 1].text = spans[spans.length - 1].text.replace(/\s+$/, '')
  return spans.filter((span) => span.text !== '')
}

export function inlineToSpans(
  nodes: readonly HtmlNode[],
  context: ConvertContext,
): { children: Span[]; markDefs: LinkMark[] } {
  const spans: Span[] = []
  const markDefs: LinkMark[] = []

  const walk = (list: readonly HtmlNode[], marks: readonly string[]): void => {
    for (const node of list) {
      if (isText(node)) {
        const text = node.data.replace(/\s+/g, ' ')
        if (text) spans.push({ _type: 'span', _key: '', text, marks: [...marks] })
        continue
      }
      if (!isElement(node) || BLOCK_TAGS.has(node.name)) continue
      if (node.name === 'br') {
        spans.push({ _type: 'span', _key: '', text: '\n', marks: [...marks] })
        continue
      }
      const decorator = MARKS[node.name]
      if (decorator) {
        walk(node.children, marks.includes(decorator) ? marks : [...marks, decorator])
        continue
      }
      const href = node.name === 'a' ? node.attribs.href : undefined
      if (href) {
        const mark: LinkMark = { _type: 'link', _key: context.key(), href: context.href(href) }
        markDefs.push(mark)
        walk(node.children, [...marks, mark._key])
        continue
      }
      walk(node.children, marks)
    }
  }

  walk(nodes, [])
  const children = trimEdges(mergeSpans(spans)).map((span) => ({ ...span, _key: context.key() }))
  const used = new Set(children.flatMap((span) => span.marks))
  return { children, markDefs: markDefs.filter((mark) => used.has(mark._key)) }
}

export function textBlock(
  nodes: readonly HtmlNode[],
  context: ConvertContext,
  style: TextBlock['style'] = 'normal',
): TextBlock | undefined {
  const { children, markDefs } = inlineToSpans(nodes, context)
  if (children.length === 0) return undefined
  return { _type: 'block', _key: context.key(), style, children, markDefs }
}
