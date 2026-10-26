import type { WxrItem } from '../shared/wxr.ts'

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
  const match = /^(\d{4})-(\d{2})-(\d{2})\b/.exec(post.localDate)
  if (!match) throw new Error(`Post ${post.id} has no usable date: "${post.localDate}"`)
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
  const frontPages = pages.filter((page) => pathOf(page.link) === '/' && page.slug !== '')
  const oldSlugs = posts.flatMap((post) =>
    (post.meta.get('_wp_old_slug') ?? []).filter((slug) => slug !== post.slug),
  )

  const groups: Record<Group, string[]> = {
    pages: pages.map((page) => pathOf(page.link)),
    'home-alias': frontPages.map((page) => `/${page.slug}/`),
    posts: postPaths,
    'old-slugs': unique(oldSlugs.map((slug) => `/${slug}/`)),
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
