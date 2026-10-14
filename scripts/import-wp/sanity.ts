import { createClient, type SanityClient } from '@sanity/client'

import { creditLine, type MediaItem } from './media.ts'
import type { Mutation } from './sync.ts'

const SOURCE = 'wordpress'
const CHUNK = 50

export function sanityClient(config: {
  projectId: string
  dataset: string
  apiVersion: string
  token?: string
}): SanityClient {
  return createClient({ ...config, useCdn: false, perspective: 'raw' })
}

export async function existingAssets(client: SanityClient): Promise<Map<number, string>> {
  const rows = await client.fetch<{ _id: string; wpId: string }[]>(
    `*[_type == "sanity.imageAsset" && source.name == $source]{ _id, "wpId": source.id }`,
    { source: SOURCE },
  )
  return new Map(rows.map((row) => [Number(row.wpId), row._id]))
}

export async function uploadAsset(client: SanityClient, item: MediaItem): Promise<string> {
  const response = await fetch(item.url)
  if (!response.ok) throw new Error(`GET ${item.url} returned HTTP ${response.status}`)
  const buffer = Buffer.from(await response.arrayBuffer())
  const asset = await client.assets.upload('image', buffer, {
    filename: item.filename,
    source: { name: SOURCE, id: String(item.wpId), url: item.credit?.url ?? item.url },
    creditLine: creditLine(item.credit),
    title: item.alt,
  })
  return asset._id
}

export async function existingDocuments(
  client: SanityClient,
  ids: readonly string[],
): Promise<{ published: Map<string, Record<string, unknown>>; drafts: Set<string> }> {
  const published = new Map<string, Record<string, unknown>>()
  const drafts = new Set<string>()
  const all = ids.flatMap((id) => [id, `drafts.${id}`])
  for (let index = 0; index < all.length; index += CHUNK) {
    const docs = await client.getDocuments(all.slice(index, index + CHUNK))
    for (const doc of docs) {
      if (!doc) continue
      if (doc._id.startsWith('drafts.')) drafts.add(doc._id.slice('drafts.'.length))
      else published.set(doc._id, doc)
    }
  }
  return { published, drafts }
}

export async function commit(client: SanityClient, mutations: readonly Mutation[]): Promise<void> {
  if (mutations.length === 0) return
  const transaction = client.transaction()
  for (const mutation of mutations) {
    if (mutation.kind === 'create') {
      transaction.create(mutation.doc)
    } else {
      transaction.patch(mutation.id, (patch) =>
        patch.ifRevisionId(mutation.rev).setIfMissing(mutation.setIfMissing).set(mutation.set),
      )
    }
  }
  await transaction.commit({ visibility: 'async' })
}
