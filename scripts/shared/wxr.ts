import { decodeEntities } from './html.ts'

export interface WxrTerm {
  id: number
  slug: string
  name: string
  description: string
}

export interface WxrItem {
  id: number
  type: string
  status: string
  title: string
  slug: string
  link: string
  date: string
  localDate: string
  content: string
  excerpt: string
  parentId: number
  menuOrder: number
  attachmentUrl: string
  terms: { domain: string; slug: string }[]
  meta: ReadonlyMap<string, readonly string[]>
}

export interface Wxr {
  siteTitle: string
  items: WxrItem[]
  categories: WxrTerm[]
  tags: WxrTerm[]
}

function toIsoUtc(date: string): string {
  return date ? `${date.replace(' ', 'T')}Z` : ''
}

export function parseWxr(xml: string): Wxr {
  const cdata: string[] = []
  const skeleton = xml.replace(
    /<!\[CDATA\[([\s\S]*?)\]\]>/g,
    (_match, text: string) => `\u0000${cdata.push(text) - 1}\u0000`,
  )
  const readText = (raw: string): string =>
    raw
      .split(/\u0000(\d+)\u0000/)
      .map((part, index) => (index % 2 === 1 ? (cdata[Number(part)] ?? '') : decodeEntities(part)))
      .join('')
      .trim()
  const field = (source: string, tag: string): string => {
    const match = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`).exec(source)
    return match ? readText(match[1]) : ''
  }
  const attribute = (source: string, name: string): string =>
    decodeEntities(new RegExp(`\\b${name}="([^"]*)"`).exec(source)?.[1] ?? '')
  const metaPattern =
    /<wp:postmeta>\s*<wp:meta_key>([\s\S]*?)<\/wp:meta_key>\s*<wp:meta_value>([\s\S]*?)<\/wp:meta_value>\s*<\/wp:postmeta>/g

  const readMeta = (item: string): Map<string, string[]> => {
    const meta = new Map<string, string[]>()
    for (const [, key, value] of item.matchAll(metaPattern)) {
      const name = readText(key)
      meta.set(name, [...(meta.get(name) ?? []), readText(value)])
    }
    return meta
  }

  const items = [...skeleton.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, item]) => ({
    id: Number(field(item, 'wp:post_id')),
    type: field(item, 'wp:post_type'),
    status: field(item, 'wp:status'),
    title: field(item, 'title'),
    slug: field(item, 'wp:post_name'),
    link: field(item, 'link'),
    date: toIsoUtc(field(item, 'wp:post_date_gmt')),
    localDate: field(item, 'wp:post_date'),
    content: field(item, 'content:encoded'),
    excerpt: field(item, 'excerpt:encoded'),
    parentId: Number(field(item, 'wp:post_parent') || 0),
    menuOrder: Number(field(item, 'wp:menu_order') || 0),
    attachmentUrl: field(item, 'wp:attachment_url'),
    terms: [...item.matchAll(/<category\b([^>]*)>/g)].map(([, attributes]) => ({
      domain: attribute(attributes, 'domain'),
      slug: attribute(attributes, 'nicename'),
    })),
    meta: readMeta(item),
  }))

  const categories = [...skeleton.matchAll(/<wp:category>([\s\S]*?)<\/wp:category>/g)].map(
    ([, term]) => ({
      id: Number(field(term, 'wp:term_id')),
      slug: field(term, 'wp:category_nicename'),
      name: field(term, 'wp:cat_name'),
      description: field(term, 'wp:category_description'),
    }),
  )
  const tags = [...skeleton.matchAll(/<wp:tag>([\s\S]*?)<\/wp:tag>/g)].map(([, term]) => ({
    id: Number(field(term, 'wp:term_id')),
    slug: field(term, 'wp:tag_slug'),
    name: field(term, 'wp:tag_name'),
    description: field(term, 'wp:tag_description'),
  }))

  const siteTitle = field(/<channel>[\s\S]*?<item>/.exec(skeleton)?.[0] ?? '', 'title')

  return { siteTitle, items, categories, tags }
}

export function metaValue(item: WxrItem, key: string): string {
  return item.meta.get(key)?.[0] ?? ''
}
