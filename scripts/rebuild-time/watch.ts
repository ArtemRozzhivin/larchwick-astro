import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { parseArgs } from 'node:util'

import { siteConfig } from '../../src/lib/config/site.ts'
import { apiVersion, dataset, projectId } from '../../studio/env.ts'
import { sleep } from '../shared/http.ts'

const ROOT = resolve(import.meta.dirname, '../..')
const OUTPUT = 'docs/after/rebuild-times.json'

interface Run {
  run: number
  document: string | null
  url: string
  publishedAt: string | null
  firstLiveAt: string
  secondsToLive: number | null
  buildId: string | null
  buildStartedAt: string | null
  buildEndedAt: string | null
}

interface Options {
  url: string
  text: string
  doc: string | null
  intervalMs: number
  timeoutMs: number
}

const USAGE = `Usage: npm run rebuild:watch -- --path /blog/<slug>/ --text "new words" [--doc <id>]

Run it, then publish in the Studio. It waits until the page shows the text and records
the time from publish to live in ${OUTPUT}.

  --path      page to watch, e.g. /blog/autumn-seasonal-blend/
  --text      words that only the new version contains
  --doc       Sanity document id, to read the publish time (optional)
  --interval  seconds between checks (default 5)
  --timeout   seconds before giving up (default 900)`

function readOptions(): Options | null {
  const { values } = parseArgs({
    options: {
      path: { type: 'string' },
      text: { type: 'string' },
      doc: { type: 'string' },
      base: { type: 'string', default: siteConfig.url },
      interval: { type: 'string', default: '5' },
      timeout: { type: 'string', default: '900' },
    },
  })
  if (!values.path || !values.text) return null
  return {
    url: new URL(values.path, values.base).href,
    text: values.text,
    doc: values.doc ?? null,
    intervalMs: Number(values.interval) * 1000,
    timeoutMs: Number(values.timeout) * 1000,
  }
}

async function isLive(url: string, text: string, attempt: number): Promise<boolean> {
  const busted = new URL(url)
  busted.searchParams.set('rebuild-check', String(attempt))
  const response = await fetch(busted, { cache: 'no-store', redirect: 'follow' })
  return response.status === 200 && (await response.text()).includes(text)
}

async function publishedAt(doc: string | null): Promise<string | null> {
  if (!doc) return null
  const query = new URL(`https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`)
  query.searchParams.set('query', '*[_id == $id][0]._updatedAt')
  query.searchParams.set('$id', JSON.stringify(doc))
  query.searchParams.set('perspective', 'published')
  const body = (await (await fetch(query)).json()) as { result: string | null }
  return body.result
}

function readRuns(): Run[] {
  const file = resolve(ROOT, OUTPUT)
  return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as Run[]) : []
}

async function main(): Promise<void> {
  const options = readOptions()
  if (!options) {
    console.log(USAGE)
    process.exitCode = 1
    return
  }
  if (await isLive(options.url, options.text, 0)) {
    console.log(
      `"${options.text}" is already on ${options.url}. Pick words only the new version has.`,
    )
    process.exitCode = 1
    return
  }
  const started = Date.now()
  console.log(`Watching ${options.url} for "${options.text}" every ${options.intervalMs / 1000}s`)
  let attempt = 1
  while (!(await isLive(options.url, options.text, attempt))) {
    if (Date.now() - started > options.timeoutMs)
      throw new Error('Timed out before the change went live')
    attempt += 1
    await sleep(options.intervalMs)
  }
  const firstLiveAt = new Date().toISOString()
  const published = await publishedAt(options.doc)
  const secondsToLive = published
    ? Math.round((Date.parse(firstLiveAt) - Date.parse(published)) / 1000)
    : null
  const runs = readRuns()
  const run: Run = {
    run: runs.length + 1,
    document: options.doc,
    url: options.url,
    publishedAt: published,
    firstLiveAt,
    secondsToLive,
    buildId: null,
    buildStartedAt: null,
    buildEndedAt: null,
  }
  mkdirSync(dirname(resolve(ROOT, OUTPUT)), { recursive: true })
  writeFileSync(resolve(ROOT, OUTPUT), `${JSON.stringify([...runs, run], null, 2)}\n`)
  console.log(
    `Live at ${firstLiveAt}${secondsToLive === null ? '' : `, ${secondsToLive}s after publish`}`,
  )
  console.log(`Saved run ${run.run} to ${OUTPUT}; add the build id and times from the dashboard.`)
}

await main()
