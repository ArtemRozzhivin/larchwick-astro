import type { AstroIntegration, AstroIntegrationLogger } from 'astro'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

import { siteConfig } from '../lib/config/site'
import { errorMessage } from '../lib/errors'
import { contactPassages, embeddingText, pagePassages, postPassages } from '../lib/rag/chunks'
import { CONTENT_NAMESPACE, EMBEDDING_MODEL, type Passage, RAG_INDEX } from '../lib/rag/config'
import {
  type IndexMode,
  indexMode,
  LIST_PAGE_SIZE,
  listAllIds,
  planIndex,
  type VectorIdPage,
} from '../lib/rag/index-plan'
import { unpublishedWords, visibleText, words } from '../lib/rag/public-check'
import { CONTACT_SLUG, pagePath, postPath } from '../lib/routes'
import { sanityFetch } from '../lib/sanity/client'
import { getPosts } from '../lib/sanity/posts'
import { RAG_PAGES_QUERY } from '../lib/sanity/queries'
import type { RAG_PAGES_QUERY_RESULT } from '../lib/sanity/sanity.types'
import { contactDetails, getSiteSettings } from '../lib/sanity/settings'

const EMBED_BATCH = 100
const DRY_RUN_FILE = '.cache/rag/passages.json'

async function collectPassages(): Promise<Passage[]> {
  const [pages, posts, settings] = await Promise.all([
    sanityFetch<RAG_PAGES_QUERY_RESULT>(RAG_PAGES_QUERY),
    getPosts(),
    getSiteSettings(),
  ])
  const details = contactDetails(settings.contact, siteConfig.footer.labels)
  const passages = [
    ...pages.flatMap((page) =>
      page.slug
        ? pagePassages({
            title: page.title ?? '',
            url: pagePath(page.slug),
            sections: page.sections ?? [],
          })
        : [],
    ),
    ...posts
      .filter((post) => !post.seo?.noindex)
      .flatMap((post) =>
        postPassages({
          title: post.title ?? '',
          url: postPath(post),
          excerpt: post.excerpt,
          publishedAt: post.publishedAt,
          categories: (post.categories ?? []).flatMap((term) => (term.title ? [term.title] : [])),
          body: post.body ?? [],
        }),
      ),
    ...contactPassages({
      url: pagePath(CONTACT_SLUG),
      title: `Contact ${settings.siteName}`,
      description: settings.description,
      lines: [
        ...details.map((detail) => `${detail.label}: ${detail.value}`),
        ...settings.contact.hours.map((line) => `${siteConfig.footer.headings.hours}: ${line}`),
      ],
    }),
  ]
  return [...new Map(passages.map((passage) => [passage.id, passage])).values()]
}

interface CloudflareApi {
  embed(_texts: readonly string[]): Promise<number[][]>
  storedIds(): Promise<string[]>
  upsert(_vectors: readonly object[]): Promise<void>
  remove(_ids: readonly string[]): Promise<void>
}

function cloudflareApi(accountId: string, token: string): CloudflareApi {
  const call = async <T>(
    method: 'GET' | 'POST',
    path: string,
    body?: string,
    contentType = 'application/json',
  ): Promise<T> => {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}${path}`
    const response = await fetch(url, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        ...(body !== undefined && { 'content-type': contentType }),
      },
      body,
    })
    const json = (await response.json()) as { success: boolean; result: T; errors?: unknown[] }
    if (!response.ok || !json.success) {
      throw new Error(`${path} failed with HTTP ${response.status}: ${JSON.stringify(json.errors)}`)
    }
    return json.result
  }
  const vectorize = `/vectorize/v2/indexes/${RAG_INDEX}`
  return {
    async embed(texts) {
      const vectors: number[][] = []
      for (let start = 0; start < texts.length; start += EMBED_BATCH) {
        const batch = texts.slice(start, start + EMBED_BATCH)
        const result = await call<{ data: number[][] }>(
          'POST',
          `/ai/run/${EMBEDDING_MODEL}`,
          JSON.stringify({ text: batch }),
        )
        vectors.push(...result.data)
      }
      return vectors
    },
    async storedIds() {
      return listAllIds((cursor) => {
        const query = new URLSearchParams({
          count: String(LIST_PAGE_SIZE),
          ...(cursor && { cursor }),
        })
        return call<VectorIdPage>('GET', `${vectorize}/list?${query}`)
      })
    },
    async upsert(vectors) {
      if (vectors.length === 0) return
      const ndjson = vectors.map((vector) => JSON.stringify(vector)).join('\n')
      await call('POST', `${vectorize}/upsert`, ndjson, 'application/x-ndjson')
    },
    async remove(ids) {
      if (ids.length === 0) return
      await call('POST', `${vectorize}/delete_by_ids`, JSON.stringify({ ids }))
    },
  }
}

async function writeIndex(passages: readonly Passage[], api: CloudflareApi): Promise<string> {
  const { add, remove } = planIndex(await api.storedIds(), passages)
  const vectors = await api.embed(add.map(embeddingText))
  await api.upsert(
    add.map(({ id, ...metadata }, index) => ({
      id,
      namespace: CONTENT_NAMESPACE,
      values: vectors[index],
      metadata,
    })),
  )
  await api.remove(remove)
  return `${passages.length} passages: ${add.length} embedded, ${remove.length} removed`
}

async function onlyAccount(token: string): Promise<string | undefined> {
  const response = await fetch('https://api.cloudflare.com/client/v4/accounts', {
    headers: { authorization: `Bearer ${token}` },
  })
  const json = (await response.json()) as { result?: { id: string }[] }
  return json.result?.length === 1 ? json.result[0].id : undefined
}

async function unpublished(dir: URL, passages: readonly Passage[]): Promise<string[]> {
  const pages = new Map<string, Set<string>>()
  const problems: string[] = []
  for (const passage of passages) {
    if (!pages.has(passage.url)) {
      const html = await readFile(new URL(`.${passage.url}index.html`, dir), 'utf8').catch(() => '')
      pages.set(passage.url, words(visibleText(html)))
    }
    const missing = unpublishedWords(embeddingText(passage), pages.get(passage.url) ?? new Set())
    if (missing.length > 0) {
      problems.push(`${passage.url} "${passage.heading}": ${missing.slice(0, 8).join(', ')}`)
    }
  }
  return problems
}

async function run(mode: IndexMode, logger: AstroIntegrationLogger, dir: URL): Promise<void> {
  const passages = await collectPassages()
  const problems = await unpublished(dir, passages)
  if (problems.length > 0) {
    const report = `${problems.length} passage(s) contain words their page doesn't show:\n${problems.join('\n')}`
    if (mode === 'dry') throw new Error(report)
    logger.error(`${report}\nThe index was not updated.`)
    return
  }
  if (mode === 'dry') {
    await mkdir('.cache/rag', { recursive: true })
    await writeFile(DRY_RUN_FILE, `${JSON.stringify(passages, null, 2)}\n`)
    logger.info(
      `${passages.length} passages written to ${DRY_RUN_FILE}, all public on their pages (nothing sent)`,
    )
    return
  }
  const token = process.env.RAG_INDEX_TOKEN ?? process.env.CLOUDFLARE_API_TOKEN
  const accountId = token && (process.env.CLOUDFLARE_ACCOUNT_ID ?? (await onlyAccount(token)))
  if (!token || !accountId) {
    logger.error('no Cloudflare token or account id in the build: the index was not updated')
    return
  }
  logger.info(await writeIndex(passages, cloudflareApi(accountId, token)))
}

export function ragIndex(): AstroIntegration {
  return {
    name: 'larchwick:rag-index',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const mode = indexMode(process.env)
        if (mode === 'skip') return
        try {
          await run(mode, logger, dir)
        } catch (error) {
          // The review command should fail loudly; a production build must never be blocked.
          if (mode === 'dry') throw error
          logger.error(`indexing failed, the site deploys anyway: ${errorMessage(error)}`)
        }
      },
    },
  }
}
