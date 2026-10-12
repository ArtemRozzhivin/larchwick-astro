import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, isAbsolute, join, relative, resolve } from 'node:path'
import { parseArgs } from 'node:util'

import { describeError, Fetcher } from './http.ts'
import { buildInventory, compareUrls, GROUPS, parseWxr } from './inventory.ts'
import { type Author, parseAuthors, Scrubber } from './privacy.ts'
import { countRecords, crawlUrl, type Snapshot, type SnapshotRecord, toJson } from './snapshot.ts'

const ROOT = resolve(import.meta.dirname, '../..')
const DEFAULT_BASE = 'http://larchwick.local'
const DEFAULT_OUT = 'docs/before'
const DEFAULT_WXR = 'docs/before/larchwick.WordPress.2026-10-07.xml'
const CACHE_ROOT = '.cache/seo-check'
const CRAWLED_AT_FILE = 'crawled-at.txt'

interface Options {
  base: string
  outDir: string
  wxrPath: string
  cacheDir: string
  fromCache: boolean
}

function readOptions(): Options {
  const { values } = parseArgs({
    options: {
      base: { type: 'string', default: DEFAULT_BASE },
      out: { type: 'string', default: DEFAULT_OUT },
      wxr: { type: 'string', default: DEFAULT_WXR },
      'from-cache': { type: 'boolean', default: false },
    },
  })
  const base = (values.base ?? DEFAULT_BASE).replace(/\/+$/, '')
  if (!/^https?:\/\/[^/]+$/.test(base)) throw new Error(`--base must be an origin, got "${base}"`)
  const outDir = resolve(ROOT, values.out ?? DEFAULT_OUT)
  return {
    base,
    outDir,
    wxrPath: resolve(ROOT, values.wxr ?? DEFAULT_WXR),
    cacheDir: cacheDirFor(outDir),
    fromCache: values['from-cache'] ?? false,
  }
}

async function readAuthors(base: string, fetcher: Fetcher): Promise<Author[]> {
  const response = await fetcher.get(`${base}/wp-json/wp/v2/users?per_page=100`)
  if (response.status !== 200 || response.body === null) {
    throw new Error(`GET /wp-json/wp/v2/users returned HTTP ${response.status}`)
  }
  return parseAuthors(JSON.parse(response.body))
}

function cacheDirFor(outDir: string): string {
  const inRepo = relative(ROOT, outDir)
  const outside = inRepo.startsWith('..') || isAbsolute(inRepo)
  return outside
    ? resolve(ROOT, CACHE_ROOT, 'external', basename(outDir))
    : resolve(ROOT, CACHE_ROOT, inRepo)
}

function readCrawledAt({ cacheDir, fromCache }: Options): string {
  const file = join(cacheDir, CRAWLED_AT_FILE)
  if (fromCache) return readFileSync(file, 'utf8').trim()
  const crawledAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
  mkdirSync(cacheDir, { recursive: true })
  writeFileSync(file, `${crawledAt}\n`)
  return crawledAt
}

function mediaType(contentType: string | null): string {
  return contentType?.split(';')[0].trim() || 'no content-type'
}

function signature(record: SnapshotRecord): string {
  const statuses = [...record.hops.map((hop) => hop.status), record.finalStatus]
  return `${statuses.join(' -> ')} ${mediaType(record.contentType)}`
}

function summarize(snapshot: Snapshot): string[] {
  const lines = GROUPS.map((group) => {
    const tally = new Map<string, number>()
    for (const record of snapshot.records.filter((item) => item.group === group)) {
      tally.set(signature(record), (tally.get(signature(record)) ?? 0) + 1)
    }
    const shapes = [...tally].map(([shape, count]) => `${shape} x${count}`).join('; ')
    return `  ${group.padEnd(14)} ${String(snapshot.counts.groups[group]).padStart(3)}  ${shapes}`
  })
  const statuses = Object.entries(snapshot.counts.finalStatus)
    .map(([status, count]) => `${status}: ${count}`)
    .join(', ')
  return [...lines, `Total: ${snapshot.counts.total}. Final status: ${statuses}.`]
}

async function main(): Promise<void> {
  const options = readOptions()
  const fetcher = new Fetcher(options.cacheDir, options.fromCache)
  const crawledAt = readCrawledAt(options)
  const items = parseWxr(readFileSync(options.wxrPath, 'utf8'))
  const authors = await readAuthors(options.base, fetcher)
  const scrubber = new Scrubber(authors)

  const queue = buildInventory(
    items,
    authors.map((author) => author.slug),
  )
    .map((url) => ({ url, recorded: { group: url.group, path: scrubber.scrub(url.path) } }))
    .sort((a, b) => compareUrls(a.recorded, b.recorded))
  const mode = options.fromCache ? `cache ${relative(ROOT, options.cacheDir)}` : options.base
  console.log(`Crawling ${queue.length} URLs from ${mode}`)

  const unknownEntities = new Set<string>()
  const records: SnapshotRecord[] = []
  for (const { url, recorded } of queue) {
    try {
      records.push(await crawlUrl(url, options.base, fetcher, unknownEntities))
    } catch (error) {
      throw new Error(`${recorded.group} ${recorded.path}: ${scrubber.scrub(describeError(error))}`)
    }
  }

  const snapshot: Snapshot = {
    crawledAt,
    base: options.base,
    counts: countRecords(records),
    records,
  }
  const outputs: [string, string][] = [
    ['old-urls.json', scrubber.scrub(toJson(queue.map(({ recorded }) => recorded)))],
    ['seo-snapshot.json', scrubber.scrub(toJson(snapshot))],
  ]
  for (const [name, text] of outputs) {
    if (scrubber.leaks(text))
      throw new Error(`${name} still contains the login after scrubbing; not written`)
  }
  mkdirSync(options.outDir, { recursive: true })
  for (const [name, text] of outputs) writeFileSync(join(options.outDir, name), text)

  console.log(scrubber.scrub(summarize(snapshot).join('\n')))
  if (unknownEntities.size > 0) {
    console.warn(
      `Unknown HTML entities left as is: ${scrubber.scrub([...unknownEntities].join(' '))}`,
    )
  }
  for (const [name] of outputs) console.log(`Wrote ${relative(ROOT, join(options.outDir, name))}`)
}

await main()
