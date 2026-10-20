import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { EMBEDDING_MODEL, MODEL, TOP_K } from '../../worker/chat.ts'

const ROOT = resolve(import.meta.dirname, '../..')
const PRODUCTION = 'https://larchwick-astro.larchwick.workers.dev'
const INDEX = 'larchwick-content'
const QUESTIONS = 'scripts/rag-eval/questions.json'
const PRODUCTION_REPORT = 'docs/after/rag-eval.json'
const OTHER_REPORT = '.cache/rag/eval.json'
// The chat allows 10 questions a minute per visitor.
const PAUSE_MS = 6500

interface Question {
  question: string
  expect: string[]
}

interface Asked {
  status: number
  answer: string
  cited: string[]
  error: string
  firstTokenMs: number | null
  totalMs: number
}

interface Result extends Asked {
  question: string
  expect: string[]
  retrieved: string[]
  rank: number | null
  pass: boolean
}

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2)
}

/** A path written as text instead of a [label](/path/) link. */
function hasBarePath(answer: string): boolean {
  return /\/[\w-]+\//.test(answer.replace(/\[[^\]]*\]\([^)]*\)/g, ''))
}

function percent(part: number, whole: number): string {
  return whole ? `${Math.round((part / whole) * 100)}%` : 'n/a'
}

// The developer's own wrangler login, kept in memory and sent only to api.cloudflare.com.
function wranglerToken(): string {
  const output = execFileSync('npx', ['-y', 'wrangler', 'auth', 'token', '--json'], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  return (JSON.parse(output.slice(output.indexOf('{'))) as { token: string }).token
}

interface CloudflareReply {
  success: boolean
  result: unknown
  errors?: { code: number }[]
}

function cloudflare(): (_path: string, _body?: unknown) => Promise<unknown> {
  let token = wranglerToken()
  const request = async (path: string, body?: unknown): Promise<CloudflareReply> => {
    const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    return (await response.json()) as CloudflareReply
  }
  return async (path, body) => {
    let reply = await request(path, body)
    // The wrangler login token is short-lived; on an authentication error ask wrangler for a fresh one.
    if (!reply.success && reply.errors?.some((error) => error.code === 10000)) {
      token = wranglerToken()
      reply = await request(path, body)
    }
    if (!reply.success) throw new Error(`Cloudflare ${path}: ${JSON.stringify(reply.errors)}`)
    return reply.result
  }
}

/** The same retrieval as the Worker (`retrieve()` in worker/chat.ts), read-only. */
async function retrieve(
  call: ReturnType<typeof cloudflare>,
  accountId: string,
  question: string,
): Promise<string[]> {
  const { data } = (await call(`/accounts/${accountId}/ai/run/${EMBEDDING_MODEL}`, {
    text: [question],
  })) as { data: number[][] }
  const { matches } = (await call(`/accounts/${accountId}/vectorize/v2/indexes/${INDEX}/query`, {
    vector: data[0],
    topK: TOP_K,
    namespace: 'content',
    returnMetadata: 'all',
  })) as { matches: { metadata?: { url?: string } }[] }
  return matches.map((match) => match.metadata?.url ?? '')
}

async function ask(target: string, question: string): Promise<Asked> {
  const started = performance.now()
  const response = await fetch(`${target}/api/chat`, {
    method: 'POST',
    headers: { Origin: target, 'content-type': 'application/json' },
    body: JSON.stringify({ question }),
  })
  const asked: Asked = {
    status: response.status,
    answer: '',
    cited: [],
    error: '',
    firstTokenMs: null,
    totalMs: 0,
  }
  if (!response.ok || !response.body) {
    const body = (await response.json().catch(() => ({}))) as { error?: string; debug?: string }
    asked.error = body.debug ?? body.error ?? `HTTP ${response.status}`
  } else {
    const decoder = new TextDecoder()
    let buffer = ''
    for await (const chunk of response.body) {
      buffer += decoder.decode(chunk, { stream: true })
      const blocks = buffer.split('\n\n')
      buffer = blocks.pop() ?? ''
      for (const block of blocks) {
        const event = JSON.parse(block.replace(/^data: /, '')) as {
          type: string
          text?: string
          message?: string
          sources?: { url: string }[]
        }
        if (event.type === 'delta') {
          asked.firstTokenMs ??= Math.round(performance.now() - started)
          asked.answer += event.text ?? ''
        } else if (event.type === 'sources') {
          asked.cited = (event.sources ?? []).map((source) => source.url)
        } else if (event.type === 'error') {
          asked.error = event.message ?? 'error'
        }
      }
    }
  }
  asked.totalMs = Math.round(performance.now() - started)
  return asked
}

function score(question: Question, retrieved: string[], asked: Asked): Result {
  const index = retrieved.findIndex((url) => question.expect.includes(url))
  const answered = asked.status === 200 && !asked.error && asked.answer.trim() !== ''
  const pass =
    question.expect.length === 0
      ? answered && asked.cited.length === 0
      : answered && asked.cited.some((url) => question.expect.includes(url))
  return {
    question: question.question,
    expect: question.expect,
    retrieved,
    rank: index === -1 ? null : index + 1,
    ...asked,
    pass,
  }
}

function summarize(results: readonly Result[]): Record<string, unknown> {
  const onTopic = results.filter((result) => result.expect.length > 0)
  const offTopic = results.filter((result) => result.expect.length === 0)
  const retrievalHits = onTopic.filter((result) => result.rank !== null).length
  const cited = onTopic.filter((result) => result.pass).length
  const declined = offTopic.filter((result) => result.pass).length
  return {
    questions: results.length,
    onTopic: onTopic.length,
    offTopic: offTopic.length,
    retrievalHits: `${retrievalHits}/${onTopic.length} (${percent(retrievalHits, onTopic.length)})`,
    citedExpectedPage: `${cited}/${onTopic.length} (${percent(cited, onTopic.length)})`,
    declinedOffTopic: `${declined}/${offTopic.length} (${percent(declined, offTopic.length)})`,
    failures: results.filter((result) => result.error).length,
    cutOff: results.filter((result) => result.answer.endsWith('…')).length,
    barePaths: results.filter((result) => hasBarePath(result.answer)).length,
    medianFirstTokenMs: median(results.flatMap((result) => result.firstTokenMs ?? [])),
    medianTotalMs: median(results.map((result) => result.totalMs)),
  }
}

async function main(): Promise<void> {
  const target = (process.argv[2] ?? PRODUCTION).replace(/\/$/, '')
  const questions = JSON.parse(readFileSync(resolve(ROOT, QUESTIONS), 'utf8')) as Question[]
  const call = cloudflare()
  const accounts = (await call('/accounts')) as { id: string }[]
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID ?? accounts[0]?.id
  if (!accountId) throw new Error('No Cloudflare account for this wrangler login.')
  console.log(
    `Asking ${target} ${questions.length} questions (about a cent of Anthropic credit)...`,
  )
  const results: Result[] = []
  for (const [index, question] of questions.entries()) {
    if (index > 0) await new Promise((done) => setTimeout(done, PAUSE_MS))
    const retrieved = await retrieve(call, accountId, question.question)
    const result = score(question, retrieved, await ask(target, question.question))
    results.push(result)
    console.log(
      `${result.pass ? 'pass' : 'FAIL'}  rank ${result.rank ?? '-'}  ${result.totalMs} ms  ${result.question}`,
    )
    if (!result.pass)
      console.log(`      ${result.error || result.answer} [${result.cited.join(', ')}]`)
  }
  const summary = summarize(results)
  const report = {
    date: new Date().toISOString().slice(0, 10),
    target,
    model: MODEL,
    embedding: EMBEDDING_MODEL,
    topK: TOP_K,
    summary,
    results,
  }
  const out = resolve(ROOT, target === PRODUCTION ? PRODUCTION_REPORT : OTHER_REPORT)
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`)
  console.log(summary)
  console.log(`Report: ${out.slice(ROOT.length + 1)}`)
}

await main()
