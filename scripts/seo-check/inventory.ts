export const GROUPS = [
  'pages',
  'home-alias',
  'posts',
  'old-slugs',
  'categories',
  'tags',
  'date-archives',
  'author',
  'feeds',
  'attachments',
  'sitemaps',
  'robots',
  'shortlinks',
] as const

export type Group = (typeof GROUPS)[number]

export interface OldUrl {
  group: Group
  path: string
}

export const EXPECTED_COUNTS: Readonly<Record<Group, number>> = {
  pages: 7,
  'home-alias': 1,
  posts: 10,
  'old-slugs': 2,
  categories: 3,
  tags: 8,
  'date-archives': 18,
  author: 1,
  feeds: 24,
  attachments: 30,
  sitemaps: 8,
  robots: 1,
  shortlinks: 17,
}

export const EXPECTED_TOTAL = 130

const SITEMAPS = [
  '/sitemap_index.xml',
  '/sitemap.xml',
  '/wp-sitemap.xml',
  '/post-sitemap.xml',
  '/page-sitemap.xml',
  '/category-sitemap.xml',
  '/post_tag-sitemap.xml',
  '/author-sitemap.xml',
]

interface Term {
  domain: string
  slug: string
}

export interface WxrItem {
  id: number
  type: string
  status: string
  link: string
  name: string
  date: string
  terms: Term[]
  meta: [string, string][]
}

const XML_ENTITIES = new Map([
  ['amp', '&'],
  ['lt', '<'],
  ['gt', '>'],
  ['quot', '"'],
  ['apos', "'"],
])

function decodeXml(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (/^#x/i.test(entity)) return String.fromCodePoint(Number.parseInt(entity.slice(2), 16))
    if (entity.startsWith('#')) return String.fromCodePoint(Number.parseInt(entity.slice(1), 10))
    return XML_ENTITIES.get(entity.toLowerCase()) ?? match
  })
}

export function parseWxr(xml: string): WxrItem[] {
  const cdata: string[] = []
  const skeleton = xml.replace(
    /<!\[CDATA\[([\s\S]*?)\]\]>/g,
    (_match, text: string) => `${cdata.push(text) - 1}`,
  )
  const readText = (raw: string): string =>
    raw
      .split(/(\d+)/)
      .map((part, index) => (index % 2 === 1 ? (cdata[Number(part)] ?? '') : decodeXml(part)))
      .join('')
      .trim()
  const field = (item: string, tag: string): string => {
    const match = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`).exec(item)
    return match ? readText(match[1]) : ''
  }
  const metaPattern =
    /<wp:postmeta>\s*<wp:meta_key>([\s\S]*?)<\/wp:meta_key>\s*<wp:meta_value>([\s\S]*?)<\/wp:meta_value>\s*<\/wp:postmeta>/g
  const termPattern = /<category\b([^>]*)>/g
  const attribute = (source: string, name: string): string =>
    decodeXml(new RegExp(`\\b${name}="([^"]*)"`).exec(source)?.[1] ?? '')

  return [...skeleton.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, item]) => ({
    id: Number(field(item, 'wp:post_id')),
    type: field(item, 'wp:post_type'),
    status: field(item, 'wp:status'),
    link: field(item, 'link'),
    name: field(item, 'wp:post_name'),
    date: field(item, 'wp:post_date'),
    terms: [...item.matchAll(termPattern)].map(([, attributes]) => ({
      domain: attribute(attributes, 'domain'),
      slug: attribute(attributes, 'nicename'),
    })),
    meta: [...item.matchAll(metaPattern)].map(([, key, value]) => [readText(key), readText(value)]),
  }))
}

function pathOf(link: string): string {
  const url = new URL(link)
  return `${url.pathname}${url.search}`
}

function feedOf(path: string): string {
  if (!path.endsWith('/')) throw new Error(`Cannot build a feed URL from "${path}"`)
  return `${path}feed/`
}

function unique(paths: readonly string[]): string[] {
  return [...new Set(paths)]
}

function termArchives(posts: readonly WxrItem[], domain: string, prefix: string): string[] {
  const slugs = posts.flatMap((post) => post.terms.filter((term) => term.domain === domain))
  return unique(slugs.map((term) => `/${prefix}/${term.slug}/`))
}

function dateArchives(post: WxrItem): string[] {
  const match = /^(\d{4})-(\d{2})-(\d{2})\b/.exec(post.date)
  if (!match) throw new Error(`Post ${post.id} has no usable date: "${post.date}"`)
  const [, year, month, day] = match
  return [`/${year}/`, `/${year}/${month}/`, `/${year}/${month}/${day}/`]
}

export function compareUrls(a: OldUrl, b: OldUrl): number {
  const byGroup = GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group)
  if (byGroup !== 0) return byGroup
  return a.path < b.path ? -1 : a.path > b.path ? 1 : 0
}

export function countByGroup(urls: readonly OldUrl[]): Record<Group, number> {
  const counts = Object.fromEntries(GROUPS.map((group) => [group, 0])) as Record<Group, number>
  for (const { group } of urls) counts[group] += 1
  return counts
}

function assertCounts(urls: readonly OldUrl[]): void {
  const counts = countByGroup(urls)
  const isExpected =
    urls.length === EXPECTED_TOTAL &&
    GROUPS.every((group) => counts[group] === EXPECTED_COUNTS[group])
  if (isExpected) return
  const rows = GROUPS.map((group) => {
    const flag = counts[group] === EXPECTED_COUNTS[group] ? '' : '  <-- mismatch'
    return `  ${group.padEnd(14)} expected ${String(EXPECTED_COUNTS[group]).padStart(3)}, got ${String(counts[group]).padStart(3)}${flag}`
  })
  throw new Error(
    [
      `URL inventory has ${urls.length} URLs, expected ${EXPECTED_TOTAL} (PLAN.md §8):`,
      ...rows,
    ].join('\n'),
  )
}

function assertUnique(urls: readonly OldUrl[]): void {
  const seen = new Map<string, Group>()
  for (const { group, path } of urls) {
    const previous = seen.get(path)
    if (previous) throw new Error(`"${path}" is in both "${previous}" and "${group}"`)
    seen.set(path, group)
  }
}

export function buildInventory(
  items: readonly WxrItem[],
  authorSlugs: readonly string[],
): OldUrl[] {
  const published = items.filter((item) => item.status === 'publish')
  const pages = published.filter((item) => item.type === 'page')
  const posts = published.filter((item) => item.type === 'post')
  const attachments = items.filter((item) => item.type === 'attachment')

  const postPaths = posts.map((post) => pathOf(post.link))
  const categories = termArchives(posts, 'category', 'category')
  const tags = termArchives(posts, 'post_tag', 'tag')
  const authors = authorSlugs.map((slug) => `/author/${slug}/`)
  const frontPages = pages.filter((page) => pathOf(page.link) === '/' && page.name !== '')
  const oldSlugs = posts.flatMap((post) =>
    post.meta.filter(([key, value]) => key === '_wp_old_slug' && value !== post.name),
  )

  const groups: Record<Group, string[]> = {
    pages: pages.map((page) => pathOf(page.link)),
    'home-alias': frontPages.map((page) => `/${page.name}/`),
    posts: postPaths,
    'old-slugs': unique(oldSlugs.map(([, slug]) => `/${slug}/`)),
    categories,
    tags,
    'date-archives': unique(posts.flatMap(dateArchives)),
    author: authors,
    feeds: [
      '/feed/',
      '/comments/feed/',
      ...[...categories, ...tags, ...authors, ...postPaths].map(feedOf),
    ],
    attachments: attachments.map((attachment) => pathOf(attachment.link)),
    sitemaps: SITEMAPS,
    robots: ['/robots.txt'],
    shortlinks: [
      ...posts.map((post) => `/?p=${post.id}`),
      ...pages.map((page) => `/?page_id=${page.id}`),
    ],
  }

  const urls = GROUPS.flatMap((group) => groups[group].map((path) => ({ group, path })))
  assertUnique(urls)
  assertCounts(urls)
  return urls.sort(compareUrls)
}
