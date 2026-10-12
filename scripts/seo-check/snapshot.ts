import { countLocs, extractHtml, isHtml } from './extract.ts'
import { type Fetcher, followRedirects, header, type Hop } from './http.ts'
import { countByGroup, type Group, type OldUrl } from './inventory.ts'

export interface SnapshotRecord {
  group: Group
  path: string
  hops: Hop[]
  finalUrl: string
  finalStatus: number
  contentType: string | null
  title: string | null
  description: string | null
  canonical: string | null
  robots: string | null
  xRobotsTag: string | null
  h1: string[] | null
  locCount?: number | null
}

export interface SnapshotCounts {
  total: number
  groups: Record<Group, number>
  finalStatus: Record<string, number>
}

export interface Snapshot {
  crawledAt: string
  base: string
  counts: SnapshotCounts
  records: SnapshotRecord[]
}

export function toSitePath(url: string, base: string): string {
  const target = new URL(url)
  if (target.origin !== new URL(base).origin) return target.href
  return `${target.pathname}${target.search}${target.hash}`
}

function toRecordedHref(href: string | null, pageUrl: string, base: string): string | null {
  if (href === null || href === '') return href
  try {
    return toSitePath(new URL(href, pageUrl).href, base)
  } catch {
    return href
  }
}

export async function crawlUrl(
  { group, path }: OldUrl,
  base: string,
  fetcher: Fetcher,
  unknownEntities?: Set<string>,
): Promise<SnapshotRecord> {
  const { hops, final } = await followRedirects(new URL(path, base).href, fetcher)
  const contentType = header(final, 'content-type')
  const isPage = final.status === 200 && isHtml(contentType)
  const page = isPage && final.body !== null ? extractHtml(final.body, unknownEntities) : null
  const record: SnapshotRecord = {
    group,
    path,
    hops: hops.map((hop) => ({ status: hop.status, location: toSitePath(hop.location, base) })),
    finalUrl: toSitePath(final.url, base),
    finalStatus: final.status,
    contentType,
    title: page?.title ?? null,
    description: page?.description ?? null,
    canonical: toRecordedHref(page?.canonical ?? null, final.url, base),
    robots: page?.robots ?? null,
    xRobotsTag: header(final, 'x-robots-tag'),
    h1: page?.h1 ?? null,
  }
  if (group === 'sitemaps') {
    record.locCount = final.status === 200 && final.body !== null ? countLocs(final.body) : null
  }
  return record
}

export function countRecords(records: readonly SnapshotRecord[]): SnapshotCounts {
  const finalStatus: Record<string, number> = {}
  for (const record of records) {
    finalStatus[record.finalStatus] = (finalStatus[record.finalStatus] ?? 0) + 1
  }
  return { total: records.length, groups: countByGroup(records), finalStatus }
}

export function toJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`
}
