import { decodeEntities } from '../shared/html.ts'

export interface PageSeo {
  title: string | null
  description: string | null
  canonical: string | null
  robots: string | null
  h1: string[]
}

const TAG_BODY = `(?:[^>"']|"[^"]*"|'[^']*')*`
const NON_CONTENT = new RegExp(
  `<!--[\\s\\S]*?-->|<(script|style|template)\\b${TAG_BODY}>[\\s\\S]*?</\\1\\s*>`,
  'gi',
)
const ANY_TAG = new RegExp(`</?[A-Za-z]${TAG_BODY}>`, 'g')
const BREAKING_TAG = /^<\/?(?:br|p|div|li|tr|td|th)\b/i
const TITLE = new RegExp(`<title\\b${TAG_BODY}>([\\s\\S]*?)</title\\s*>`, 'i')
const H1 = new RegExp(`<h1\\b${TAG_BODY}>([\\s\\S]*?)</h1\\s*>`, 'gi')
const ATTRIBUTE = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g

function collapse(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function parseAttributes(source: string, unknown?: Set<string>): Map<string, string> {
  const attributes = new Map<string, string>()
  for (const [, name, double, single, bare] of source.matchAll(ATTRIBUTE)) {
    const key = name.toLowerCase()
    if (attributes.has(key)) continue
    attributes.set(key, decodeEntities(double ?? single ?? bare ?? '', unknown))
  }
  return attributes
}

function findTags(html: string, name: string, unknown?: Set<string>): Map<string, string>[] {
  const pattern = new RegExp(`<${name}\\b(${TAG_BODY})>`, 'gi')
  return [...html.matchAll(pattern)].map(([, attributes]) => parseAttributes(attributes, unknown))
}

function headOf(html: string): string {
  const end = html.search(/<\/head\s*>|<body\b/i)
  return end === -1 ? html : html.slice(0, end)
}

function textOf(fragment: string, unknown?: Set<string>): string {
  const text = fragment.replace(ANY_TAG, (tag) => (BREAKING_TAG.test(tag) ? ' ' : ''))
  return collapse(decodeEntities(text, unknown))
}

export function isHtml(contentType: string | null): boolean {
  return contentType !== null && /^\s*(?:text\/html|application\/xhtml\+xml)\b/i.test(contentType)
}

export function extractHtml(html: string, unknown?: Set<string>): PageSeo {
  const document = html.replace(NON_CONTENT, ' ')
  const head = headOf(document)
  const metas = findTags(head, 'meta', unknown)
  const metaContents = (name: string): string[] =>
    metas
      .filter((meta) => meta.get('name')?.trim().toLowerCase() === name)
      .map((meta) => collapse(meta.get('content') ?? ''))
  const isCanonical = (link: Map<string, string>): boolean =>
    (link.get('rel') ?? '').toLowerCase().split(/\s+/).includes('canonical')
  const canonical = findTags(head, 'link', unknown).find(isCanonical)?.get('href')
  const title = TITLE.exec(head)?.[1]
  const robots = metaContents('robots')

  return {
    title: title === undefined ? null : collapse(decodeEntities(title, unknown)),
    description: metaContents('description')[0] ?? null,
    canonical: canonical === undefined ? null : canonical.trim(),
    robots: robots.length > 0 ? robots.join(', ') : null,
    h1: [...document.matchAll(H1)].map(([, inner]) => textOf(inner, unknown)),
  }
}

export function countLocs(xml: string): number {
  return xml.replace(/<!--[\s\S]*?-->/g, '').match(/<loc\b/gi)?.length ?? 0
}
