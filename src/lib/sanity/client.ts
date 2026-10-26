// With an extension, so `node --test` can load this module.
import { apiVersion, dataset, projectId } from '../../../studio/env.ts'

const QUERY_URL = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`

type Params = Record<string, string | number | boolean | readonly string[]>

export async function sanityFetch<T>(query: string, params: Params = {}): Promise<T> {
  const url = new URL(QUERY_URL)
  url.searchParams.set('query', query)
  url.searchParams.set('perspective', 'published')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(`$${key}`, JSON.stringify(value))
  }
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Sanity query failed with HTTP ${response.status}: ${await response.text()}`)
  }
  const body = (await response.json()) as { result: T }
  return body.result
}
