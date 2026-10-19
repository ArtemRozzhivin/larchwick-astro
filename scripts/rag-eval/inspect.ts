import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '../..')
const INDEX = 'larchwick-content'
const EXPECTED = '.cache/rag/passages.json'
const REPORT = '.cache/rag/production-index.html'
const BATCH = 20

interface Passage {
  id: string
  url: string
  title: string
  heading: string
  text: string
}

interface StoredVector {
  id: string
  namespace?: string
  values?: number[]
  metadata?: Record<string, string>
}

type Status = 'match' | 'different text' | 'missing from index' | 'not in content'

interface Row {
  status: Status
  id: string
  url: string
  heading: string
  text: string
  dimensions: number
}

// Read-only wrangler calls with the developer's own login; nothing here writes to the index.
function wrangler(args: readonly string[]): string {
  return execFileSync('npx', ['-y', 'wrangler', 'vectorize', ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function json<T>(output: string): T {
  const start = output.search(/[[{]/)
  return JSON.parse(output.slice(start)) as T
}

function listIds(): string[] {
  const ids: string[] = []
  let cursor: string | undefined
  do {
    const page = json<{ vectors: { id: string }[]; nextCursor?: string | null }>(
      wrangler([
        'list-vectors',
        INDEX,
        '--count',
        '1000',
        '--json',
        ...(cursor ? ['--cursor', cursor] : []),
      ]),
    )
    ids.push(...page.vectors.map((vector) => vector.id))
    cursor = page.nextCursor ?? undefined
  } while (cursor)
  return ids
}

function getVectors(ids: readonly string[]): StoredVector[] {
  const vectors: StoredVector[] = []
  for (let start = 0; start < ids.length; start += BATCH) {
    vectors.push(
      ...json<StoredVector[]>(
        wrangler(['get-vectors', INDEX, '--ids', ...ids.slice(start, start + BATCH)]),
      ),
    )
  }
  return vectors
}

function escape(text: string): string {
  return text.replace(/[&<>"]/g, (char) => `&#${char.charCodeAt(0)};`)
}

function compare(expected: readonly Passage[], stored: readonly StoredVector[]): Row[] {
  const byId = new Map(
    stored.filter((vector) => vector.namespace === 'content').map((vector) => [vector.id, vector]),
  )
  const rows: Row[] = expected.map((passage) => {
    const vector = byId.get(passage.id)
    byId.delete(passage.id)
    const status: Status = !vector
      ? 'missing from index'
      : vector.metadata?.text === passage.text && vector.metadata?.url === passage.url
        ? 'match'
        : 'different text'
    return {
      status,
      id: passage.id,
      url: passage.url,
      heading: passage.heading,
      text: passage.text,
      dimensions: vector?.values?.length ?? 0,
    }
  })
  for (const vector of byId.values()) {
    rows.push({
      status: 'not in content',
      id: vector.id,
      url: vector.metadata?.url ?? '',
      heading: vector.metadata?.heading ?? '',
      text: vector.metadata?.text ?? '',
      dimensions: vector.values?.length ?? 0,
    })
  }
  return rows
}

function report(rows: readonly Row[], manifest: StoredVector | undefined, total: number): string {
  const counts = rows.reduce<Record<string, number>>(
    (all, row) => ({ ...all, [row.status]: (all[row.status] ?? 0) + 1 }),
    {},
  )
  const manifestIds = (manifest?.metadata?.ids ?? '').split(',').filter(Boolean).length
  const ok = rows.every((row) => row.status === 'match')
  const summary = [
    `${total} vectors in the production index`,
    `${counts.match ?? 0} passages match the current content`,
    `${counts['different text'] ?? 0} differ, ${counts['missing from index'] ?? 0} missing, ${counts['not in content'] ?? 0} extra`,
    `manifest lists ${manifestIds} ids`,
  ]
  const body = rows
    .map(
      (row) =>
        `<tr class="${row.status === 'match' ? '' : 'bad'}"><td>${escape(row.status)}</td><td><a href="https://larchwick-astro.larchwick.workers.dev${escape(row.url)}">${escape(row.url)}</a></td><td>${escape(row.heading)}</td><td>${escape(row.text).replace(/\n/g, '<br>')}</td><td>${row.dimensions}</td><td><code>${row.id}</code></td></tr>`,
    )
    .join('\n')
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Production index: ${INDEX}</title>
<style>body{font:15px/1.5 system-ui,sans-serif;margin:24px;color:#2a1a10;background:#f2f3ef}h1{margin:0 0 8px}
.ok{color:#34502f}.fail{color:#a3362b}ul{margin:0 0 20px}table{border-collapse:collapse;width:100%;background:#fbfbf8}
td,th{border:1px solid #d9d8cf;padding:6px 8px;vertical-align:top;text-align:left}th{background:#34502f;color:#fbfbf8;position:sticky;top:0}
tr.bad td{background:#f6dcd8}code{font-size:12px}</style></head><body>
<h1>${INDEX} <span class="${ok ? 'ok' : 'fail'}">${ok ? 'matches the site' : 'does NOT match the site'}</span></h1>
<ul>${summary.map((line) => `<li>${escape(line)}</li>`).join('')}</ul>
<table><thead><tr><th>Status</th><th>Page</th><th>Heading</th><th>Stored text</th><th>Dims</th><th>Id</th></tr></thead><tbody>
${body}
</tbody></table></body></html>
`
}

function main(): void {
  console.log('Refreshing the expected passages from Sanity (npm run rag:passages)...')
  execFileSync('npm', ['run', 'rag:passages'], {
    cwd: ROOT,
    stdio: ['ignore', 'ignore', 'inherit'],
  })
  const expected = JSON.parse(readFileSync(resolve(ROOT, EXPECTED), 'utf8')) as Passage[]
  console.log('Reading the production index (read-only)...')
  const ids = listIds()
  const stored = getVectors(ids)
  const rows = compare(expected, stored)
  const manifest = stored.find((vector) => vector.namespace === 'meta')
  writeFileSync(resolve(ROOT, REPORT), report(rows, manifest, ids.length))
  const bad = rows.filter((row) => row.status !== 'match')
  console.log(
    `${ids.length} vectors in production; ${rows.length - bad.length} of ${expected.length} passages match.`,
  )
  for (const row of bad) console.log(`  ${row.status}: ${row.url} "${row.heading}"`)
  console.log(`Report: ${REPORT}  (open it with: open ${REPORT})`)
  if (bad.length > 0) process.exitCode = 1
}

main()
