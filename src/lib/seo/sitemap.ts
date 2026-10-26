import type { SitemapItem } from '@astrojs/sitemap'

// Relative, with an extension, so `node --test` can load this module.
import { errorMessage } from '../errors.ts'
import { pagePath } from '../routes.ts'

export interface DatedPage {
  slug: string | null
  _updatedAt: string
  /** The blog index, or a page with a latest-posts section. */
  listsPosts: boolean | null
}

export interface DatedPost {
  path: string
  _updatedAt: string
}

/** A category or tag archive, with its term's last change. */
export interface DatedArchive {
  path: string
  _updatedAt: string
}

// Sanity's _updatedAt values share one ISO 8601 format, so the newest sorts last.
function newest(dates: readonly string[]): string {
  return [...dates].sort().at(-1) ?? ''
}

/**
 * Path → last change of every Sanity page, post and term archive. A page that lists posts, and
 * every archive, is dated no earlier than the newest post of all.
 *
 * An archive isn't dated by the posts it lists: when a post leaves it, only that post's date
 * moves, so the archive would go back in time. Any post change may be such a move, hence the
 * newest post as the floor, which over-dates rather than under-dates. A deleted post leaves no
 * date at all, so deleting the newest post still moves these dates back.
 */
export function lastModified(
  pages: readonly DatedPage[],
  posts: readonly DatedPost[],
  archives: readonly DatedArchive[] = [],
): Map<string, string> {
  const newestPost = newest(posts.map((post) => post._updatedAt))
  const pageDates = pages.flatMap(({ slug, _updatedAt, listsPosts }) => {
    if (!slug) return []
    const date = listsPosts && newestPost > _updatedAt ? newestPost : _updatedAt
    return [[pagePath(slug), date] as const]
  })
  const archiveDates = archives.map(
    ({ path, _updatedAt }) => [path, newest([_updatedAt, newestPost])] as const,
  )
  return new Map([
    ...posts.map((post) => [post.path, post._updatedAt] as const),
    ...pageDates,
    ...archiveDates,
  ])
}

async function loadDates(
  load: () => Promise<ReadonlyMap<string, string>>,
  warn: (_message: string) => void,
): Promise<ReadonlyMap<string, string>> {
  try {
    return await load()
  } catch (error) {
    warn(`sitemap: written without <lastmod>, loading the dates failed: ${errorMessage(error)}`)
    return new Map()
  }
}

/**
 * A sitemap `serialize` hook adding <lastmod> to the URLs `load` dates; it loads once. When
 * loading fails it warns and leaves every URL undated, because @astrojs/sitemap writes no
 * sitemap at all when `serialize` throws.
 */
export function withLastmod(
  load: () => Promise<ReadonlyMap<string, string>>,
  warn: (_message: string) => void = console.warn,
): (_item: SitemapItem) => Promise<SitemapItem> {
  let dates: Promise<ReadonlyMap<string, string>> | undefined
  return async (item) => {
    dates ??= loadDates(load, warn)
    const lastmod = (await dates).get(new URL(item.url).pathname)
    return lastmod ? { ...item, lastmod } : item
  }
}

const ROBOTS_NOINDEX = /<meta name="robots" content="[^"]*noindex/
const CANONICAL_LINK = /<link rel="canonical" href="([^"]*)"/
const URL_ENTRY = /<url><loc>([^<]+)<\/loc>.*?<\/url>/g

export type SitemapExclusion = 'noindex' | 'canonicalElsewhere'

/**
 * Why the sitemap must leave out `loc`, judged from its built page: the page is noindex, or its
 * `<link rel="canonical">` names another URL (a listed URL tells search engines it is canonical).
 */
export function sitemapExclusion(html: string, loc: string): SitemapExclusion | undefined {
  if (ROBOTS_NOINDEX.test(html)) return 'noindex'
  const canonical = CANONICAL_LINK.exec(html)?.[1]
  return canonical !== undefined && canonical !== loc ? 'canonicalElsewhere' : undefined
}

/**
 * The sitemap file `xml` without the URLs `sitemapExclusion()` rules out, and how many it dropped
 * for each reason. `pageHtml` returns the built page of a URL, or '' when there is none (kept).
 */
export async function filterSitemap(
  xml: string,
  pageHtml: (_loc: string) => Promise<string>,
): Promise<{ xml: string; dropped: Record<SitemapExclusion, number> }> {
  const dropped: Record<SitemapExclusion, number> = { noindex: 0, canonicalElsewhere: 0 }
  let next = xml
  for (const [entry, loc] of xml.matchAll(URL_ENTRY)) {
    const reason = sitemapExclusion(await pageHtml(loc), loc)
    if (!reason) continue
    next = next.replace(entry, '')
    dropped[reason] += 1
  }
  return { xml: next, dropped }
}
