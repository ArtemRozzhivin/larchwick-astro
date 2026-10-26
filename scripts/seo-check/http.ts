import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { request, type RequestOptions } from '../shared/http.ts'

export interface RawResponse {
  url: string
  status: number
  statusText: string
  headers: [string, string][]
  body: string | null
}

export interface Hop {
  status: number
  location: string
}

export interface Chain {
  hops: Hop[]
  final: RawResponse
}

export const MAX_HOPS = 10

const USER_AGENT = 'larchwick-seo-check/1.0 (read-only crawl; sequential requests)'
const ACCEPT = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308])
const REQUEST: RequestOptions = {
  userAgent: USER_AGENT,
  accept: ACCEPT,
  timeoutMs: 30_000,
  retryDelayMs: 1000,
}

export function header(response: RawResponse, name: string): string | null {
  const key = name.toLowerCase()
  const values = response.headers.filter(([headerName]) => headerName === key)
  return values.length > 0 ? values.map(([, value]) => value).join(', ') : null
}

export function isTextual(contentType: string | null): boolean {
  return contentType !== null && /^\s*text\/|[/+](?:xml|json)\b|javascript/i.test(contentType)
}

function cacheFile(cacheDir: string, url: string): string {
  const { pathname, search } = new URL(url)
  const slug = `${pathname}${search}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  const hash = createHash('sha256').update(url).digest('hex').slice(0, 12)
  return join(cacheDir, `${slug || 'root'}-${hash}.http`)
}

function serializeRaw(response: RawResponse): string {
  const head = [
    `GET ${response.url}`,
    `HTTP ${response.status} ${response.statusText}`.trimEnd(),
    ...response.headers.map(([name, value]) => `${name}: ${value}`),
  ]
  return `${head.join('\n')}\n\n${response.body ?? ''}`
}

function parseRaw(text: string, url: string): RawResponse {
  const split = text.indexOf('\n\n')
  const [requestLine, statusLine, ...headerLines] = text.slice(0, split).split('\n')
  const status = /^HTTP (\d{3}) ?(.*)$/.exec(statusLine ?? '')
  if (split === -1 || requestLine !== `GET ${url}` || !status) {
    throw new Error(`The cached response for ${url} is not in the expected format`)
  }
  const headers = headerLines.map((line): [string, string] => {
    const colon = line.indexOf(': ')
    return [line.slice(0, colon), line.slice(colon + 2)]
  })
  const response = { url, status: Number(status[1]), statusText: status[2], headers, body: null }
  return {
    ...response,
    body: isTextual(header(response, 'content-type')) ? text.slice(split + 2) : null,
  }
}

async function fetchAndStore(url: string, cacheDir: string): Promise<RawResponse> {
  const response = await request(url, REQUEST)
  const contentType = response.headers.get('content-type')
  const body = isTextual(contentType) ? await response.text() : null
  if (body === null) await response.body?.cancel()
  const raw: RawResponse = {
    url,
    status: response.status,
    statusText: response.statusText,
    headers: [...response.headers],
    body,
  }
  writeFileSync(cacheFile(cacheDir, url), serializeRaw(raw))
  return raw
}

function readStored(url: string, cacheDir: string): RawResponse {
  let text: string
  try {
    text = readFileSync(cacheFile(cacheDir, url), 'utf8')
  } catch {
    throw new Error(`No cached response for ${url} in ${cacheDir}; crawl without --from-cache`)
  }
  return parseRaw(text, url)
}

export class Fetcher {
  readonly #cacheDir: string
  readonly #fromCache: boolean

  constructor(cacheDir: string, fromCache: boolean) {
    this.#cacheDir = cacheDir
    this.#fromCache = fromCache
    if (!fromCache) mkdirSync(cacheDir, { recursive: true })
  }

  async get(url: string): Promise<RawResponse> {
    if (this.#fromCache) return readStored(url, this.#cacheDir)
    return fetchAndStore(url, this.#cacheDir)
  }
}

export async function followRedirects(url: string, fetcher: Fetcher): Promise<Chain> {
  const hops: Hop[] = []
  let response = await fetcher.get(url)
  for (;;) {
    const location = header(response, 'location')
    const isRedirect = REDIRECT_STATUSES.has(response.status) && location !== null
    if (!isRedirect || hops.length === MAX_HOPS) return { hops, final: response }
    const next = new URL(location, response.url).href
    hops.push({ status: response.status, location: next })
    response = await fetcher.get(next)
  }
}
