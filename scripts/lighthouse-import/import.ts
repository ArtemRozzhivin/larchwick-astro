import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { parseArgs } from 'node:util'
import { gunzipSync, gzipSync } from 'node:zlib'

import { type Author, parseAuthors, Scrubber } from '../seo-check/privacy.ts'

const ROOT = resolve(import.meta.dirname, '../..')
const WORDPRESS_USERS_URL = 'http://larchwick.local/wp-json/wp/v2/users?per_page=100'
const REQUEST_TIMEOUT_MS = 10_000
const REMOVED = '[removed]'
const DATA_IMAGE = /^data:image\//i
const EMBEDDED_DATA_IMAGE = /data:image\/[\w.+-]+(?:;[\w.+=-]+)*,[^\s"'<>)]*/gi
const GZIP_OS_BYTE = 9
const GZIP_OS_UNKNOWN = 255

const SIDES = ['before', 'after'] as const
const DEVICES = ['mobile', 'desktop'] as const
const PAGES = [
  'home',
  'about',
  'services',
  'products',
  'faq',
  'contact',
  'blog',
  'post-pour-over',
  'post-ethiopia',
] as const
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'] as const
const HTTPS_AUDITS = ['is-on-https', 'redirects-http'] as const

type Side = (typeof SIDES)[number]
type Device = (typeof DEVICES)[number]
type Page = (typeof PAGES)[number]
type Category = (typeof CATEGORIES)[number]
type HttpsAudit = (typeof HTTPS_AUDITS)[number]

const PAGE_PATHS: Record<Page, string> = {
  home: '/',
  about: '/about/',
  services: '/services/',
  products: '/products/',
  faq: '/faq/',
  contact: '/contact/',
  blog: '/blog/',
  'post-pour-over': '/how-to-brew-pour-over-at-home/',
  'post-ethiopia': '/ethiopia-yirgacheffe/',
}
const PROTOCOL_RUNS: Record<Page, number> = {
  home: 5,
  about: 3,
  services: 3,
  products: 3,
  faq: 3,
  contact: 3,
  blog: 3,
  'post-pour-over': 3,
  'post-ethiopia': 3,
}
const HEADLINE: { page: Page; device: Device } = { page: 'home', device: 'mobile' }

const INBOX_NAME = new RegExp(`^(${PAGES.join('|')})-(${DEVICES.join('|')})-([1-9]\\d*)\\.json$`)
const STORED_PATH = new RegExp(
  `^(${PAGES.join('|')})/(${DEVICES.join('|')})/run-([1-9]\\d*)\\.json\\.gz$`,
)

interface Options {
  side: Side
  inbox: string
  out: string
}

interface Authors {
  authors: Author[]
  source: string
}

interface Audit {
  score?: number | null
  numericValue?: number
  details?: { items?: { resourceType?: string; transferSize?: number }[] }
}

interface ScreenshotSize {
  width: number
  height: number
}

interface Throttling {
  rttMs?: number
  throughputKbps?: number
  cpuSlowdownMultiplier?: number
}

interface Report {
  lighthouseVersion?: unknown
  requestedUrl?: unknown
  fetchTime?: string
  gatherMode?: string
  runtimeError?: { code?: string; message?: string }
  environment?: { hostUserAgent?: string; benchmarkIndex?: number }
  configSettings?: { formFactor?: string; throttlingMethod?: string; throttling?: Throttling }
  categories?: Partial<Record<string, { score?: number | null }>>
  audits?: Partial<Record<string, Audit>>
  fullPageScreenshot?: { screenshot?: Partial<ScreenshotSize> }
  larchwickImport?: { fullPageScreenshot?: ScreenshotSize | null }
}

interface RunId {
  page: Page
  device: Device
  run: number
}

interface InboxReport extends RunId {
  name: string
  bytes: number
  report: Report
}

interface MetricsRow extends RunId {
  file: string
  requestedUrl: string
  lighthouseVersion: string
  fetchTime: string
  hostUserAgent: string | null
  benchmarkIndex: number | null
  formFactor: string
  screenWidth: number | null
  throttlingMethod: string | null
  throttling: Throttling | null
  scores: Record<Category, number>
  firstContentfulPaintMs: number
  largestContentfulPaintMs: number
  totalBlockingTimeMs: number
  cumulativeLayoutShift: number
  speedIndexMs: number
  totalByteWeight: number
  requestCount: number
  scriptTransferSize: number
  httpsAuditScores: Record<HttpsAudit, number | null>
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function isSide(value: unknown): value is Side {
  return SIDES.some((side) => side === value)
}

function readOptions(): Options {
  const { values } = parseArgs({
    options: {
      side: { type: 'string', default: 'before' },
      inbox: { type: 'string' },
      out: { type: 'string' },
    },
  })
  if (!isSide(values.side))
    throw new Error(`--side must be "before" or "after", not "${values.side}"`)
  const side = values.side
  return {
    side,
    inbox: resolve(ROOT, values.inbox ?? `docs/${side}/lighthouse/inbox`),
    out: resolve(ROOT, values.out ?? `docs/${side}/lighthouse`),
  }
}

function show(path: string): string {
  const fromRoot = relative(ROOT, path)
  return fromRoot.startsWith('..') ? path : fromRoot || '.'
}

function countRuns(count: number): string {
  return `${count} ${count === 1 ? 'run' : 'runs'}`
}

function expectedPath(page: Page, side: Side): string {
  const path = PAGE_PATHS[page]
  return side === 'after' && page.startsWith('post-') ? `/blog${path}` : path
}

function runFile({ page, device, run }: RunId): string {
  return `${page}/${device}/run-${run}.json.gz`
}

function checkReport(report: Report, { page, device }: RunId, side: Side): string | null {
  if (typeof report !== 'object' || report === null || Array.isArray(report)) {
    return 'not a Lighthouse JSON report'
  }
  if (typeof report.lighthouseVersion !== 'string') {
    return 'not a Lighthouse JSON report (no lighthouseVersion)'
  }
  if (report.runtimeError) {
    const { code = 'unknown', message = '' } = report.runtimeError
    return `Lighthouse could not finish this run (${code}) ${message}`.trim()
  }
  if (report.gatherMode !== 'navigation') {
    return `Lighthouse ran in ${report.gatherMode ?? 'an unknown'} mode; use Navigation mode`
  }
  const formFactor = report.configSettings?.formFactor
  if (formFactor !== device) {
    return `Lighthouse ran it as ${formFactor ?? 'an unknown device'}, but the name says ${device}`
  }
  if (typeof report.requestedUrl !== 'string' || !URL.canParse(report.requestedUrl)) {
    return 'the report has no requested URL'
  }
  const path = new URL(report.requestedUrl).pathname
  const expected = expectedPath(page, side)
  if (path !== expected) {
    return `it measured ${path}, but "${page}" on the ${side} site is ${expected}`
  }
  const missing = CATEGORIES.filter(
    (category) => typeof report.categories?.[category]?.score !== 'number',
  )
  if (missing.length > 0) {
    return `no score for ${missing.join(', ')}; run all four categories`
  }
  return null
}

function readInbox(inbox: string, side: Side): { reports: InboxReport[]; problems: string[] } {
  const reports: InboxReport[] = []
  const problems: string[] = []
  const names = existsSync(inbox) ? readdirSync(inbox).sort() : []
  for (const name of names) {
    if (name.startsWith('.') || !statSync(join(inbox, name)).isFile()) continue
    const match = INBOX_NAME.exec(name)
    if (!match) {
      problems.push(
        `${name}: the name must be <page>-<mobile|desktop>-<n>.json, with <page> one of ${PAGES.join(', ')}`,
      )
      continue
    }
    const id: RunId = { page: match[1] as Page, device: match[2] as Device, run: Number(match[3]) }
    const text = readFileSync(join(inbox, name), 'utf8')
    let report: Report
    try {
      report = JSON.parse(text)
    } catch {
      problems.push(`${name}: not valid JSON`)
      continue
    }
    const problem = checkReport(report, id, side)
    if (problem) problems.push(`${name}: ${problem}`)
    else reports.push({ ...id, name, bytes: Buffer.byteLength(text), report })
  }
  return { reports: reports.sort(compareRuns), problems }
}

function compareRuns(a: RunId, b: RunId): number {
  return (
    PAGES.indexOf(a.page) - PAGES.indexOf(b.page) ||
    DEVICES.indexOf(a.device) - DEVICES.indexOf(b.device) ||
    a.run - b.run
  )
}

async function readAuthors(): Promise<Authors> {
  let reason: string
  try {
    const response = await fetch(WORDPRESS_USERS_URL, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const authors = parseAuthors(await response.json())
    if (authors.length > 0) return { authors, source: 'the WordPress REST API' }
    reason = 'no users in the response'
  } catch (error) {
    reason = describeError(error)
  }
  const slug = process.env.WP_AUTHOR_SLUG?.trim()
  const name = process.env.WP_AUTHOR_NAME?.trim()
  if (!slug || !name) {
    throw new Error(
      `Cannot read the author from ${WORDPRESS_USERS_URL} (${reason}). Start WordPress, or set WP_AUTHOR_SLUG and WP_AUTHOR_NAME so the login can still be removed.`,
    )
  }
  return { authors: [{ slug, name }], source: 'WP_AUTHOR_SLUG and WP_AUTHOR_NAME' }
}

function cleanString(text: string, scrubber: Scrubber): string {
  if (DATA_IMAGE.test(text)) return REMOVED
  return scrubber.scrub(text.replace(EMBEDDED_DATA_IMAGE, REMOVED))
}

function cleanValue(value: unknown, scrubber: Scrubber): unknown {
  if (typeof value === 'string') return cleanString(value, scrubber)
  if (Array.isArray(value)) return value.map((item) => cleanValue(item, scrubber))
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [scrubber.scrub(key), cleanValue(item, scrubber)]),
    )
  }
  return value
}

function screenshotSize(report: Report): ScreenshotSize | null {
  const { width, height } = report.fullPageScreenshot?.screenshot ?? {}
  if (typeof width === 'number' && typeof height === 'number') return { width, height }
  return report.larchwickImport?.fullPageScreenshot ?? null
}

function cleanReport(report: Report, scrubber: Scrubber): Report {
  const { fullPageScreenshot: _removed, larchwickImport: _previous, ...rest } = report
  return {
    ...(cleanValue(rest, scrubber) as Report),
    larchwickImport: { fullPageScreenshot: screenshotSize(report) },
  }
}

function gzip(text: string): Buffer {
  const zipped = gzipSync(text, { level: 9 })
  // zlib stamps the build OS into the header; a fixed byte keeps output identical across machines.
  zipped[GZIP_OS_BYTE] = GZIP_OS_UNKNOWN
  return zipped
}

function formatBytes(bytes: number): string {
  return `${bytes.toLocaleString('en-US')} B`
}

function readStored(path: string): Report {
  return JSON.parse(gunzipSync(readFileSync(path)).toString())
}

function describeTarget(target: string, fetchTime: string | undefined): string {
  if (!existsSync(target)) return 'new'
  const previous = readStored(target).fetchTime
  if (previous === fetchTime) return 'same run, rewritten'
  console.warn(`  Warning: ${show(target)} held another run (fetchTime ${previous}); replacing it`)
  return `replaced the run from ${previous}`
}

async function importInbox(reports: readonly InboxReport[], out: string): Promise<void> {
  const { authors, source } = await readAuthors()
  console.log(`Login scrub: ${authors.length} author(s) from ${source}`)
  const scrubber = new Scrubber(authors)
  const cleaned = reports.map((entry) => {
    const json = JSON.stringify(cleanReport(entry.report, scrubber))
    if (scrubber.leaks(json)) throw new Error(`${entry.name}: the login survived cleaning`)
    return { entry, json, target: join(out, runFile(entry)) }
  })
  for (const { entry, json, target } of cleaned) {
    const zipped = gzip(json)
    const status = describeTarget(target, entry.report.fetchTime)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, zipped)
    console.log(
      `  ${entry.name} -> ${show(target)} (${status}): ${formatBytes(entry.bytes)} raw, ${formatBytes(Buffer.byteLength(json))} cleaned, ${formatBytes(zipped.length)} gzip`,
    )
  }
}

function requireNumber(value: unknown, label: string, file: string): number {
  if (typeof value !== 'number') throw new Error(`${file}: no ${label}`)
  return value
}

function toRow(report: Report, id: RunId): MetricsRow {
  const file = runFile(id)
  const audit = (key: string): Audit => report.audits?.[key] ?? {}
  const numeric = (key: string): number => requireNumber(audit(key).numericValue, key, file)
  const requests = audit('network-requests').details?.items
  if (!Array.isArray(requests)) throw new Error(`${file}: no network-requests table`)
  const scriptTransferSize = requests
    .filter((request) => request.resourceType === 'Script')
    .reduce((total, request) => total + (request.transferSize ?? 0), 0)
  const score = (category: Category): number =>
    Math.round(requireNumber(report.categories?.[category]?.score, category, file) * 100)
  const httpsScore = (key: HttpsAudit): number | null => audit(key).score ?? null

  return {
    ...id,
    file,
    requestedUrl: String(report.requestedUrl),
    lighthouseVersion: String(report.lighthouseVersion),
    fetchTime: report.fetchTime ?? '',
    hostUserAgent: report.environment?.hostUserAgent ?? null,
    benchmarkIndex: report.environment?.benchmarkIndex ?? null,
    formFactor: report.configSettings?.formFactor ?? '',
    screenWidth: screenshotSize(report)?.width ?? null,
    throttlingMethod: report.configSettings?.throttlingMethod ?? null,
    throttling: report.configSettings?.throttling ?? null,
    scores: {
      performance: score('performance'),
      accessibility: score('accessibility'),
      'best-practices': score('best-practices'),
      seo: score('seo'),
    },
    firstContentfulPaintMs: numeric('first-contentful-paint'),
    largestContentfulPaintMs: numeric('largest-contentful-paint'),
    totalBlockingTimeMs: numeric('total-blocking-time'),
    cumulativeLayoutShift: numeric('cumulative-layout-shift'),
    speedIndexMs: numeric('speed-index'),
    totalByteWeight: numeric('total-byte-weight'),
    requestCount: requests.length,
    scriptTransferSize,
    httpsAuditScores: {
      'is-on-https': httpsScore('is-on-https'),
      'redirects-http': httpsScore('redirects-http'),
    },
  }
}

function readStoredRuns(out: string, side: Side): MetricsRow[] {
  if (!existsSync(out)) return []
  const files = readdirSync(out, { encoding: 'utf8', recursive: true })
    .map((path) => path.split(sep).join('/'))
    .filter((path) => path.endsWith('.json.gz'))
  return files
    .map((path) => {
      const match = STORED_PATH.exec(path)
      if (!match) {
        throw new Error(
          `${show(join(out, path))}: stored runs must be <page>/<mobile|desktop>/run-<n>.json.gz`,
        )
      }
      const id: RunId = {
        page: match[1] as Page,
        device: match[2] as Device,
        run: Number(match[3]),
      }
      const report = readStored(join(out, path))
      const problem = checkReport(report, id, side)
      if (problem) throw new Error(`${show(join(out, path))}: ${problem}`)
      return toRow(report, id)
    })
    .sort(compareRuns)
}

function medianRun(runs: readonly MetricsRow[]): MetricsRow {
  const byPerformance = [...runs].sort((a, b) => a.scores.performance - b.scores.performance)
  const median = byPerformance[Math.floor((byPerformance.length - 1) / 2)].scores.performance
  return runs
    .filter((row) => row.scores.performance === median)
    .sort((a, b) => a.largestContentfulPaintMs - b.largestContentfulPaintMs || a.run - b.run)[0]
}

function seconds(ms: number): string {
  return `${(Math.round(ms / 100) / 10).toFixed(1)} s`
}

function milliseconds(ms: number): string {
  return `${(Math.round(ms / 10) * 10).toLocaleString('en-US')} ms`
}

function kibibytes(bytes: number): string {
  return `${Math.round(bytes / 1024).toLocaleString('en-US')} KiB`
}

function layoutShift(value: number): string {
  return String(Math.round(value * 1000) / 1000)
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)].sort()
}

function renderTable(header: readonly string[], rows: readonly (readonly string[])[]): string {
  const widths = header.map((cell, column) =>
    Math.max(3, cell.length, ...rows.map((row) => row[column].length)),
  )
  const line = (cells: readonly string[]): string =>
    `| ${cells.map((cell, column) => cell.padEnd(widths[column])).join(' | ')} |`
  const divider = `| ${widths.map((width) => '-'.repeat(width)).join(' | ')} |`
  return [line(header), divider, ...rows.map(line)].join('\n')
}

function renderDevice(device: Device, rows: readonly MetricsRow[]): string[] {
  const tableRows: string[][] = []
  const missing: Page[] = []
  const short: string[] = []
  for (const page of PAGES) {
    const runs = rows.filter((row) => row.page === page && row.device === device)
    if (runs.length === 0) {
      missing.push(page)
      continue
    }
    if (runs.length < PROTOCOL_RUNS[page])
      short.push(`${page} (${runs.length} of ${PROTOCOL_RUNS[page]})`)
    const median = medianRun(runs)
    const performance = runs.map((row) => row.scores.performance)
    const isHeadline = page === HEADLINE.page && device === HEADLINE.device
    tableRows.push([
      isHeadline ? `**${page}** (D-13 headline)` : page,
      String(runs.length),
      String(median.run),
      ...CATEGORIES.map((category) => String(median.scores[category])),
      seconds(median.largestContentfulPaintMs),
      seconds(median.firstContentfulPaintMs),
      milliseconds(median.totalBlockingTimeMs),
      layoutShift(median.cumulativeLayoutShift),
      kibibytes(median.totalByteWeight),
      String(median.requestCount),
      `${Math.min(...performance)}–${Math.max(...performance)}`,
    ])
  }
  const title = device === 'mobile' ? 'Mobile' : 'Desktop'
  if (tableRows.length === 0) return [`## ${title}`, '', 'No runs yet.', '']
  const table = renderTable(
    [
      'Page',
      'Runs',
      'Median run',
      'Performance',
      'Accessibility',
      'Best Practices',
      'SEO',
      'LCP',
      'FCP',
      'TBT',
      'CLS',
      'Total bytes',
      'Requests',
      'Performance min–max',
    ],
    tableRows,
  )
  return [
    `## ${title}`,
    '',
    table,
    '',
    ...(short.length > 0
      ? [`Fewer runs than the protocol asks for: ${short.join(', ')}.`, '']
      : []),
    ...(missing.length > 0 ? [`No runs yet: ${missing.join(', ')}.`, ''] : []),
  ]
}

function describeThrottling(row: MetricsRow): string {
  const { rttMs, throughputKbps, cpuSlowdownMultiplier } = row.throttling ?? {}
  const settings = [
    rttMs === undefined ? null : `RTT ${rttMs} ms`,
    throughputKbps === undefined ? null : `${throughputKbps.toLocaleString('en-US')} Kbps`,
    cpuSlowdownMultiplier === undefined ? null : `CPU slowdown ${cpuSlowdownMultiplier}×`,
  ].filter(Boolean)
  return `${row.throttlingMethod ?? 'unknown'} (${settings.join(', ')})`
}

function perDevice(rows: readonly MetricsRow[], describe: (_row: MetricsRow) => string): string {
  return DEVICES.flatMap((device) => {
    const values = unique(rows.filter((row) => row.device === device).map(describe))
    return values.length > 0 ? [`${device} ${values.join(' / ')}`] : []
  }).join('; ')
}

function renderConditions(rows: readonly MetricsRow[]): string[] {
  const versions = unique(rows.map((row) => row.lighthouseVersion))
  const agents = unique(rows.map((row) => row.hostUserAgent ?? 'unknown'))
  const days = unique(rows.map((row) => row.fetchTime.slice(0, 10)))
  const httpsScores = HTTPS_AUDITS.map(
    (key) =>
      `\`${key}\` ${unique(rows.map((row) => String(row.httpsAuditScores[key]))).join(' / ')}`,
  )
  const benchmark = (row: MetricsRow): string => String(row.benchmarkIndex ?? 'unknown')
  const viewport = (row: MetricsRow): string =>
    row.screenWidth === null ? 'unknown' : `${row.screenWidth} px`
  return [
    '## Conditions',
    '',
    `- Lighthouse: ${versions.join(', ')}${versions.length > 1 ? ' (more than one version)' : ''}`,
    `- Browser user agent: ${agents.map((agent) => `\`${agent}\``).join(', ')}`,
    `- Throttling: ${perDevice(rows, describeThrottling)}`,
    `- Viewport width (from the full-page screenshot, before it was removed): ${perDevice(rows, viewport)}`,
    `- Benchmark index: ${perDevice(rows, benchmark)}`,
    `- Measured on (fetchTime, UTC): ${days.join(', ')}`,
    `- Site: ${unique(rows.map((row) => new URL(row.requestedUrl).origin)).join(', ')}`,
    `- ${httpsScores.join(' and ')} (scores across all runs). They reflect the local plain-http setup, not the stack, and are reported separately (PLAN §10). Both count towards Best Practices.`,
    '',
  ]
}

function renderSummary(side: Side, rows: readonly MetricsRow[]): string {
  const headlineRuns = rows.filter(
    (row) => row.page === HEADLINE.page && row.device === HEADLINE.device,
  )
  const headline = headlineRuns.length > 0 ? medianRun(headlineRuns) : null
  return [
    `# Lighthouse summary (${side})`,
    '',
    `Generated by \`node scripts/lighthouse-import/import.ts --side ${side}\` from the ${countRuns(rows.length)} stored`,
    "next to this file. Don't edit it by hand.",
    '',
    'Each row is the median run for that page and device: the run with the median Performance score',
    '(the lower middle one for an even number of runs), ties going to the lower LCP. Values are shown',
    'the way the Lighthouse report shows them; the exact values of every run are in `metrics.json`.',
    '',
    '## Headline (D-13)',
    '',
    headline
      ? `Home \`/\`, mobile, median of ${countRuns(headlineRuns.length)} (run ${headline.run}): Performance **${headline.scores.performance}**, total byte weight **${kibibytes(headline.totalByteWeight)}** (${formatBytes(headline.totalByteWeight)}).`
      : 'No home mobile runs yet.',
    '',
    ...renderDevice('mobile', rows),
    ...renderDevice('desktop', rows),
    ...renderConditions(rows),
  ].join('\n')
}

function checkOrigins(urls: readonly string[], out: string): void {
  const origins = unique(urls.map((url) => new URL(url).origin))
  if (origins.length > 1) {
    throw new Error(
      `The runs for ${show(out)} would come from more than one site (${origins.join(', ')}). Keep each environment in its own --out folder.`,
    )
  }
}

function checkIncoming(reports: readonly InboxReport[], out: string, side: Side): void {
  const incoming = new Set(reports.map(runFile))
  const kept = readStoredRuns(out, side).filter((row) => !incoming.has(row.file))
  const urls = [
    ...kept.map((row) => row.requestedUrl),
    ...reports.map((entry) => String(entry.report.requestedUrl)),
  ]
  checkOrigins(urls, out)
}

function rebuild(out: string, side: Side): void {
  const rows = readStoredRuns(out, side)
  if (rows.length === 0) {
    console.log(`Nothing to summarise yet: no runs are stored under ${show(out)}`)
    return
  }
  const urls = rows.map((row) => row.requestedUrl)
  checkOrigins(urls, out)
  writeFileSync(join(out, 'metrics.json'), `${JSON.stringify(rows, null, 2)}\n`)
  writeFileSync(join(out, 'summary.md'), renderSummary(side, rows))
  console.log(
    `Wrote ${show(join(out, 'metrics.json'))} and summary.md from ${countRuns(rows.length)}`,
  )
}

async function main(): Promise<void> {
  const { side, inbox, out } = readOptions()
  const { reports, problems } = readInbox(inbox, side)
  if (problems.length > 0) {
    console.error(`Rejected ${problems.length} file(s) in ${show(inbox)}; nothing was imported:`)
    for (const problem of problems) console.error(`  ${problem}`)
    process.exitCode = 1
    return
  }
  if (reports.length > 0) {
    console.log(`Importing ${reports.length} report(s) from ${show(inbox)}`)
    checkIncoming(reports, out, side)
    await importInbox(reports, out)
  } else {
    console.log(`No reports in ${show(inbox)}; rebuilding from the stored runs`)
  }
  rebuild(out, side)
}

try {
  await main()
} catch (error) {
  console.error(describeError(error))
  process.exitCode = 1
}
