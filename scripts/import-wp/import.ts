import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { parseArgs } from 'node:util'

import { apiVersion, dataset, projectId } from '../../studio/env.ts'
import { buildDocuments, type DesiredDoc, type Group, GROUPS } from './documents.ts'
import { type AltEntry, mediaItems, type MediaSwap, parseCredits, withSwaps } from './media.ts'
import { type Report, summarise, toCsv, toMarkdown } from './report.ts'
import { commit, existingAssets, existingDocuments, sanityClient, uploadAsset } from './sanity.ts'
import { planMutations } from './sync.ts'
import type { MediaAsset } from './types.ts'
import { parseWxr } from './wxr.ts'

const ROOT = resolve(import.meta.dirname, '../..')
const DEFAULT_WXR = 'docs/before/larchwick.WordPress.2026-10-07.xml'
const DEFAULT_ORIGIN = 'http://larchwick.local'
const ONLY = [...GROUPS, 'media'] as const

interface Options {
  write: boolean
  only: Set<string>
  limit?: number
  wxrPath: string
  origin: string
}

function readOptions(): Options {
  const { values } = parseArgs({
    options: {
      write: { type: 'boolean', default: false },
      only: { type: 'string' },
      limit: { type: 'string' },
      wxr: { type: 'string', default: DEFAULT_WXR },
      origin: { type: 'string', default: DEFAULT_ORIGIN },
    },
  })
  const only = new Set(values.only ? values.only.split(',').map((part) => part.trim()) : ONLY)
  const unknown = [...only].filter((part) => !(ONLY as readonly string[]).includes(part))
  if (unknown.length > 0)
    throw new Error(`--only accepts ${ONLY.join(', ')}; got ${unknown.join(', ')}`)
  const limit = values.limit ? Number(values.limit) : undefined
  if (limit !== undefined && !(limit > 0)) throw new Error('--limit must be a positive number')
  return {
    write: values.write ?? false,
    only,
    limit,
    wxrPath: resolve(ROOT, values.wxr ?? DEFAULT_WXR),
    origin: (values.origin ?? DEFAULT_ORIGIN).replace(/\/+$/, ''),
  }
}

async function main(): Promise<void> {
  const options = readOptions()
  const token = process.env.SANITY_WRITE_TOKEN
  if (options.write && !token) throw new Error('--write needs SANITY_WRITE_TOKEN in .env')
  const mode = options.write ? 'write' : 'dry run'
  console.log(`WordPress → Sanity import (${mode}) into ${projectId}/${dataset}`)

  const wxr = parseWxr(readFileSync(options.wxrPath, 'utf8'))
  const altText = JSON.parse(
    readFileSync(resolve(import.meta.dirname, 'alt-text.json'), 'utf8'),
  ) as Record<string, AltEntry>
  const credits = parseCredits(readFileSync(resolve(ROOT, 'CREDITS.md'), 'utf8'))
  const media = mediaItems(wxr.items, altText, credits)
  const client = sanityClient({ projectId, dataset, apiVersion, token })

  const assets = await existingAssets(client)
  const existingCount = media.filter((item) => assets.has(item.wpId)).length
  let uploaded = 0
  if (options.write && options.only.has('media')) {
    for (const item of media.filter((candidate) => !assets.has(candidate.wpId))) {
      assets.set(item.wpId, await uploadAsset(client, item))
      uploaded += 1
      console.log(`  uploaded media ${item.wpId} (${item.filename})`)
    }
  }
  const swaps = JSON.parse(
    readFileSync(resolve(import.meta.dirname, 'media-swaps.json'), 'utf8'),
  ) as Record<string, MediaSwap>
  const lookup = withSwaps((wpId: number): MediaAsset | undefined => {
    const item = media.find((candidate) => candidate.wpId === wpId)
    if (!item) return undefined
    return { assetId: assets.get(wpId) ?? `image-pending-wp-${wpId}`, alt: item.alt }
  }, swaps)

  const built = buildDocuments(wxr, { origin: options.origin, media: lookup, limit: options.limit })
  for (const [from, swap] of Object.entries(swaps)) {
    built.skipped.push({
      where: `media ${from}`,
      reason: `replaced by media ${swap.use}: ${swap.reason}`,
    })
  }
  const selected: DesiredDoc[] = built.docs.filter((item) => options.only.has(item.group as Group))
  const existing = await existingDocuments(
    client,
    selected.map((item) => item.doc._id),
  )
  const plan = planMutations(selected, existing.published, existing.drafts)
  for (const id of plan.drafts) {
    built.skipped.push({
      where: id,
      reason: 'has an unpublished draft in the Studio; publish or discard it, then run again',
    })
  }
  const pending = media.filter((item) => !assets.has(item.wpId)).length
  if (options.write) {
    if (pending > 0 && plan.mutations.length > 0) {
      throw new Error(`${pending} images are not in Sanity yet; run with --only=media first`)
    }
    await commit(client, plan.mutations)
  }

  const report: Report = summarise({ ...built, docs: selected }, plan, {
    mode,
    date: new Date().toISOString().slice(0, 10),
    source: relative(ROOT, options.wxrPath),
    target: `${projectId}/${dataset}`,
    media: {
      total: media.length,
      existing: existingCount,
      uploaded,
      pending,
      missingAlt: media.filter((item) => !item.alt).map((item) => item.wpId),
    },
  })
  const docsDir = resolve(ROOT, 'docs')
  mkdirSync(docsDir, { recursive: true })
  writeFileSync(resolve(docsDir, 'import-report.md'), toMarkdown(report))
  writeFileSync(resolve(docsDir, 'import-report.json'), `${JSON.stringify(report, null, 2)}\n`)
  writeFileSync(resolve(docsDir, 'redirect-map.csv'), toCsv(built.redirects))

  for (const [group, row] of Object.entries(report.documents)) {
    console.log(
      `  ${group.padEnd(10)} ${row.total} docs: ${row.create} create, ${row.patch} patch, ${row.unchanged} unchanged`,
    )
  }
  console.log(`  media: ${media.length} images, ${uploaded} uploaded, ${pending} pending`)
  console.log(`  ${report.warnings.length} warnings, ${report.links.length} rewritten links`)
  console.log(`${options.write ? 'Applied' : 'Would apply'} ${plan.mutations.length} mutations.`)
  console.log('Wrote docs/import-report.md, docs/import-report.json and docs/redirect-map.csv')
}

await main()
