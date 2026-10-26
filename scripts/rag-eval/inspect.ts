import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { siteConfig } from '../../src/lib/config/site.ts'
import {
  CONTENT_NAMESPACE,
  EXCERPT_FIELDS,
  type Passage,
  RAG_INDEX,
} from '../../src/lib/rag/config.ts'
import { LIST_PAGE_SIZE, listAllIds, type VectorIdPage } from '../../src/lib/rag/index-plan.ts'

const ROOT = resolve(import.meta.dirname, '../..')
const EXPECTED = '.cache/rag/passages.json'
const REPORT = '.cache/rag/production-index.html'
const BATCH = 20

interface StoredVector {
  id: string
  namespace?: string
  values?: number[]
  metadata?: Record<string, string>
}

type Status = 'match' | 'different metadata' | 'missing from index' | 'not in content'

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

function listPage(cursor: string | undefined): VectorIdPage {
  const cursorArgs = cursor ? ['--cursor', cursor] : []
  return json<VectorIdPage>(
    wrangler([
      'list-vectors',
      RAG_INDEX,
      '--count',
      String(LIST_PAGE_SIZE),
      '--json',
      ...cursorArgs,
    ]),
  )
}

function getVectors(ids: readonly string[]): StoredVector[] {
  const vectors: StoredVector[] = []
  for (let start = 0; start < ids.length; start += BATCH) {
    vectors.push(
      ...json<StoredVector[]>(
        wrangler(['get-vectors', RAG_INDEX, '--ids', ...ids.slice(start, start + BATCH)]),
      ),
    )
  }
  return vectors
}

function escape(text: string): string {
  return text.replace(/[&<>"]/g, (char) => `&#${char.charCodeAt(0)};`)
}

function compare(expected: readonly Passage[], stored: readonly StoredVector[]): Row[] {
  const byId = new Map(stored.map((vector) => [vector.id, vector]))
  const rows: Row[] = expected.map((passage) => {
    const found = byId.get(passage.id)
    const vector = found?.namespace === CONTENT_NAMESPACE ? found : undefined
    if (vector) byId.delete(passage.id)
    const same = EXCERPT_FIELDS.every((field) => vector?.metadata?.[field] === passage[field])
    const status: Status = !vector ? 'missing from index' : same ? 'match' : 'different metadata'
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

function report(rows: readonly Row[], total: number): string {
  const counts = rows.reduce<Record<string, number>>(
    (all, row) => ({ ...all, [row.status]: (all[row.status] ?? 0) + 1 }),
    {},
  )
  const ok = rows.every((row) => row.status === 'match')
  const summary = [
    `${total} vectors in the production index`,
    `${counts.match ?? 0} passages match the current content`,
    `${counts['different metadata'] ?? 0} differ, ${counts['missing from index'] ?? 0} missing, ${counts['not in content'] ?? 0} extra (the next production build removes extras)`,
  ]
  const body = rows
    .map(
      (row) =>
        `<tr class="${row.status === 'match' ? '' : 'bad'}"><td>${escape(row.status)}</td><td><a href="${siteConfig.url}${escape(row.url)}">${escape(row.url)}</a></td><td>${escape(row.heading)}</td><td>${escape(row.text).replace(/\n/g, '<br>')}</td><td>${row.dimensions}</td><td><code>${row.id}</code></td></tr>`,
    )
    .join('\n')
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Production index: ${RAG_INDEX}</title>
<style>body{font:15px/1.5 system-ui,sans-serif;margin:24px;color:#2a1a10;background:#f2f3ef}h1{margin:0 0 8px}
.ok{color:#34502f}.fail{color:#a3362b}ul{margin:0 0 20px}table{border-collapse:collapse;width:100%;background:#fbfbf8}
td,th{border:1px solid #d9d8cf;padding:6px 8px;vertical-align:top;text-align:left}th{background:#34502f;color:#fbfbf8;position:sticky;top:0}
tr.bad td{background:#f6dcd8}code{font-size:12px}</style></head><body>
<h1>${RAG_INDEX} <span class="${ok ? 'ok' : 'fail'}">${ok ? 'matches the site' : 'does NOT match the site'}</span></h1>
<ul>${summary.map((line) => `<li>${escape(line)}</li>`).join('')}</ul>
<table><thead><tr><th>Status</th><th>Page</th><th>Heading</th><th>Stored text</th><th>Dims</th><th>Id</th></tr></thead><tbody>
${body}
</tbody></table></body></html>
`
}

async function main(): Promise<void> {
  console.log('Refreshing the expected passages from Sanity (npm run rag:passages)...')
  execFileSync('npm', ['run', 'rag:passages'], {
    cwd: ROOT,
    stdio: ['ignore', 'ignore', 'inherit'],
  })
  const expected = JSON.parse(readFileSync(resolve(ROOT, EXPECTED), 'utf8')) as Passage[]
  console.log('Reading the production index (read-only)...')
  const ids = await listAllIds(listPage)
  const stored = getVectors(ids)
  const rows = compare(expected, stored)
  writeFileSync(resolve(ROOT, REPORT), report(rows, ids.length))
  const bad = rows.filter((row) => row.status !== 'match')
  console.log(
    `${ids.length} vectors in production; ${rows.length - bad.length} of ${expected.length} passages match.`,
  )
  for (const row of bad) console.log(`  ${row.status}: ${row.url} "${row.heading}"`)
  console.log(`Report: ${REPORT}  (open it with: open ${REPORT})`)
  if (bad.length > 0) process.exitCode = 1
}

await main()
