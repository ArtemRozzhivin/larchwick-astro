import { readFileSync, writeFileSync } from 'node:fs'
import { basename, relative, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '../..')
const DEFAULT_WXR = 'docs/before/larchwick.WordPress.2026-10-07.xml'
const OUTPUT = resolve(ROOT, 'CREDITS.md')

const UNSPLASH_ID = /([A-Za-z0-9_-]{11})-unsplash(?:-scaled)?\.jpe?g$/
const UNSPLASH_LICENSE = 'https://unsplash.com/license'
const USER_AGENT = 'larchwick-credits/1.0 (CREDITS.md generator; sequential requests)'
const REQUEST_DELAY_MS = 300
const RETRY_DELAY_MS = 2000
const MAX_ATTEMPTS = 2
const REQUEST_TIMEOUT_MS = 20_000
const REDIRECT_STATUSES = new Set([301, 302, 307, 308])
const NOT_FOUND_STATUSES = new Set([404, 410])
const CONTENT_TYPES = new Set(['page', 'post'])
const OG_IMAGE_PHOTO_ID = 'hFpqG9KU5Gc'
const LUCIDE_NOTICE = [
  'ISC License',
  '',
  'Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2026 as part of Feather (MIT).',
  'All other copyright (c) for Lucide are held by Lucide Contributors 2026.',
  '',
  'Permission to use, copy, modify, and/or distribute this software for any',
  'purpose with or without fee is hereby granted, provided that the above',
  'copyright notice and this permission notice appear in all copies.',
  '',
  'THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES',
  'WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF',
  'MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR',
  'ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES',
  'WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN',
  'ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF',
  'OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.',
  '',
  '---',
  '',
  'The MIT License (MIT) (for portions derived from Feather)',
  '',
  'Copyright (c) 2013-2026 Cole Bemis',
  '',
  'Permission is hereby granted, free of charge, to any person obtaining a copy',
  'of this software and associated documentation files (the "Software"), to deal',
  'in the Software without restriction, including without limitation the rights',
  'to use, copy, modify, merge, publish, distribute, sublicense, and/or sell',
  'copies of the Software, and to permit persons to whom the Software is',
  'furnished to do so, subject to the following conditions:',
  '',
  'The above copyright notice and this permission notice shall be included in all',
  'copies or substantial portions of the Software.',
  '',
  'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR',
  'IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,',
  'FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE',
  'AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER',
  'LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,',
  'OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE',
  'SOFTWARE.',
]

interface WxrItem {
  id: number
  type: string
  status: string
  title: string
  parentId: number
  content: string
  attachmentUrl: string
  meta: ReadonlyMap<string, string>
}

interface Attachment {
  id: number
  parentId: number
  fileName: string
  stem: string
  unsplashId: string
  filenamePrefix: string
}

type Check =
  | { kind: 'verified'; url: string; html: string }
  | { kind: 'unverified'; url: string; reason: string }
  | { kind: 'not-found'; url: string; reason: string }

interface Photo {
  check: Check
  photographer: string
  nameFromPage: boolean
  license: string | null
}

interface Row {
  attachment: Attachment
  photo: Photo
  usedOn: string[]
}

const XML_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
}

function decodeEntity(entity: string): string {
  if (entity.startsWith('#x') || entity.startsWith('#X')) {
    return String.fromCodePoint(Number.parseInt(entity.slice(2), 16))
  }
  if (entity.startsWith('#')) return String.fromCodePoint(Number.parseInt(entity.slice(1), 10))
  return XML_ENTITIES[entity.toLowerCase()] ?? `&${entity};`
}

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (_match, entity: string) =>
    decodeEntity(entity),
  )
}

function parseWxr(xml: string): WxrItem[] {
  const cdata: string[] = []
  const skeleton = xml.replace(
    /<!\[CDATA\[([\s\S]*?)\]\]>/g,
    (_match, text: string) => `\uE000${cdata.push(text) - 1}\uE001`,
  )
  const readText = (raw: string): string =>
    raw
      .split(/\uE000(\d+)\uE001/)
      .map((part, index) => (index % 2 === 1 ? (cdata[Number(part)] ?? '') : decodeEntities(part)))
      .join('')
      .trim()
  const field = (item: string, tag: string): string => {
    const match = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`).exec(item)
    return match ? readText(match[1]) : ''
  }
  const metaPattern =
    /<wp:postmeta>\s*<wp:meta_key>([\s\S]*?)<\/wp:meta_key>\s*<wp:meta_value>([\s\S]*?)<\/wp:meta_value>\s*<\/wp:postmeta>/g

  return [...skeleton.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, item]) => ({
    id: Number(field(item, 'wp:post_id')),
    type: field(item, 'wp:post_type'),
    status: field(item, 'wp:status'),
    title: field(item, 'title'),
    parentId: Number(field(item, 'wp:post_parent') || 0),
    content: field(item, 'content:encoded'),
    attachmentUrl: field(item, 'wp:attachment_url'),
    meta: new Map(
      [...item.matchAll(metaPattern)].map(([, key, value]) => [readText(key), readText(value)]),
    ),
  }))
}

function toAttachment(item: WxrItem): Attachment {
  const file = item.meta.get('_wp_attached_file') || item.attachmentUrl
  const fileName = basename(file)
  const match = UNSPLASH_ID.exec(fileName)
  if (!match) {
    throw new Error(`Attachment ${item.id}: "${fileName}" does not contain an Unsplash photo ID`)
  }
  return {
    id: item.id,
    parentId: item.parentId,
    fileName,
    stem: fileName.replace(/\.[a-z0-9]+$/i, '').replace(/-scaled$/, ''),
    unsplashId: match[1],
    filenamePrefix: fileName.slice(0, match.index).replace(/-+$/, ''),
  }
}

function elementorData(item: WxrItem): string | null {
  const data = item.meta.get('_elementor_data') ?? ''
  const isBuilderPage = item.meta.get('_elementor_edit_mode') === 'builder'
  return isBuilderPage && data !== '' && data !== '[]' ? data : null
}

function findUsage(attachment: Attachment, items: readonly WxrItem[]): string[] {
  const contentPattern = new RegExp(`\\bwp-image-${attachment.id}\\b`)
  const elementorPattern = new RegExp(`"id":\\s*${attachment.id}\\b`)
  const featured: string[] = []
  const inContent: string[] = []
  const inElementor: string[] = []

  for (const item of items) {
    if (item.status !== 'publish' || !CONTENT_TYPES.has(item.type)) continue
    if (item.meta.get('_thumbnail_id') === String(attachment.id)) {
      featured.push(`featured image of "${item.title}"`)
    }
    const elementor = elementorData(item)
    if (elementor !== null) {
      if (elementor.includes(attachment.stem) || elementorPattern.test(elementor)) {
        inElementor.push(`${item.title} (Elementor)`)
      }
    } else if (item.content.includes(attachment.stem) || contentPattern.test(item.content)) {
      inContent.push(`in content of "${item.title}"`)
    }
  }
  return [...featured, ...inContent, ...inElementor]
}

function sleep(ms: number): Promise<void> {
  return new Promise((done) => setTimeout(done, ms))
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

async function request(url: string): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    await sleep(attempt === 1 ? REQUEST_DELAY_MS : RETRY_DELAY_MS)
    const response = await fetch(url, {
      redirect: 'manual',
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    const isTransient = response.status === 429 || response.status >= 500
    if (!isTransient || attempt === MAX_ATTEMPTS) return response
    await response.body?.cancel()
  }
}

async function checkPhoto(id: string): Promise<Check> {
  const shortUrl = `https://unsplash.com/photos/${id}`
  let first: Response
  try {
    first = await request(shortUrl)
  } catch (error) {
    return { kind: 'unverified', url: shortUrl, reason: describeError(error) }
  }
  if (NOT_FOUND_STATUSES.has(first.status)) {
    return { kind: 'not-found', url: shortUrl, reason: `HTTP ${first.status}` }
  }
  if (first.status === 200) return { kind: 'verified', url: shortUrl, html: await first.text() }

  const location = first.headers.get('location')
  await first.body?.cancel()
  if (!REDIRECT_STATUSES.has(first.status) || !location) {
    return { kind: 'unverified', url: shortUrl, reason: `HTTP ${first.status} without a redirect` }
  }
  const canonicalUrl = new URL(location, shortUrl).href
  if (!canonicalUrl.endsWith(`-${id}`) && !canonicalUrl.endsWith(`/${id}`)) {
    return { kind: 'unverified', url: shortUrl, reason: `redirected to ${canonicalUrl}` }
  }

  try {
    const page = await request(canonicalUrl)
    if (NOT_FOUND_STATUSES.has(page.status)) {
      return { kind: 'not-found', url: canonicalUrl, reason: `HTTP ${page.status}` }
    }
    if (page.status !== 200) {
      await page.body?.cancel()
      return { kind: 'unverified', url: canonicalUrl, reason: `HTTP ${page.status}` }
    }
    return { kind: 'verified', url: canonicalUrl, html: await page.text() }
  } catch (error) {
    return { kind: 'unverified', url: canonicalUrl, reason: describeError(error) }
  }
}

function describeCheck(check: Check): string {
  if (check.kind === 'verified') return 'ok'
  return `${check.kind === 'not-found' ? 'not found' : 'not verified'}: ${check.reason}`
}

function readMetaContent(html: string, key: string): string | null {
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const isKey = tag.includes(`property="${key}"`) || tag.includes(`name="${key}"`)
    const content = /\bcontent="([^"]*)"/.exec(tag)
    if (isKey && content) return decodeEntities(content[1])
  }
  return null
}

function readJsonLd(html: string): Record<string, unknown>[] {
  const blocks = html.matchAll(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi,
  )
  return [...blocks].flatMap(([, json]) => {
    try {
      const parsed: unknown = JSON.parse(json)
      return parsed && typeof parsed === 'object' ? [parsed as Record<string, unknown>] : []
    } catch {
      return []
    }
  })
}

function photographerFromPage(html: string): string | null {
  const titles = [
    readMetaContent(html, 'og:title'),
    readMetaContent(html, 'twitter:title'),
    /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1] ?? null,
  ]
  for (const title of titles) {
    const name = title && /^Photo by (.+?) on Unsplash$/.exec(decodeEntities(title).trim())?.[1]
    if (name) return name.trim()
  }
  for (const data of readJsonLd(html)) {
    const creator = data.creator
    if (creator && typeof creator === 'object' && 'name' in creator) {
      if (typeof creator.name === 'string' && creator.name.trim()) return creator.name.trim()
    }
  }
  return null
}

function licenseFromPage(html: string): string | null {
  const license = readJsonLd(html).find((data) => data['@type'] === 'ImageObject')?.license
  return typeof license === 'string' ? license : null
}

function nameFromFilename(prefix: string): string {
  return prefix
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

async function describePhoto(attachment: Attachment): Promise<Photo> {
  const check = await checkPhoto(attachment.unsplashId)
  const html = check.kind === 'verified' ? check.html : ''
  const nameOnPage = html ? photographerFromPage(html) : null
  return {
    check,
    photographer: (nameOnPage ?? nameFromFilename(attachment.filenamePrefix)).normalize('NFC'),
    nameFromPage: nameOnPage !== null,
    license: html ? licenseFromPage(html) : null,
  }
}

function textWidth(text: string): number {
  let width = 0
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0
    if (code < 0x20 || (code >= 0x300 && code <= 0x36f)) continue
    const isWide =
      (code >= 0x1100 && code <= 0x115f) ||
      (code >= 0x2e80 && code <= 0xa4cf) ||
      (code >= 0xac00 && code <= 0xd7a3) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xff00 && code <= 0xff60) ||
      (code >= 0x1f300 && code <= 0x1faff) ||
      code >= 0x20000
    width += isWide ? 2 : 1
  }
  return width
}

function renderTable(header: readonly string[], rows: readonly (readonly string[])[]): string {
  const widths = header.map((cell, column) =>
    Math.max(3, textWidth(cell), ...rows.map((row) => textWidth(row[column] ?? ''))),
  )
  const pad = (cell: string, column: number): string =>
    cell + ' '.repeat(widths[column] - textWidth(cell))
  const line = (cells: readonly string[]): string => `| ${cells.map(pad).join(' | ')} |`
  const divider = `| ${widths.map((width) => '-'.repeat(width)).join(' | ')} |`
  return [line(header), divider, ...rows.map(line)].join('\n')
}

function escapeCell(text: string): string {
  return text.replaceAll('|', '\\|')
}

function linkCell({ attachment, photo }: Row): string {
  const link = `[${attachment.unsplashId}](${photo.check.url})`
  if (photo.check.kind === 'not-found') return `${link} (not found on Unsplash)`
  return photo.check.kind === 'unverified' ? `${link} (not verified)` : link
}

function usedOnCell(row: Row, titles: ReadonlyMap<number, string>): string {
  if (row.usedOn.length > 0) return row.usedOn.join('; ')
  const parentTitle = titles.get(row.attachment.parentId)
  return parentTitle
    ? `not used on the site (uploaded to "${parentTitle}")`
    : 'not used on the site'
}

function renderSocialPreview(rows: readonly Row[]): string[] {
  const source = rows.find((row) => row.attachment.unsplashId === OG_IMAGE_PHOTO_ID)
  if (!source) throw new Error(`No attachment for Unsplash photo ${OG_IMAGE_PHOTO_ID} (og.jpg)`)
  const { attachment, photo } = source
  return [
    '## Social preview image',
    '',
    '`public/og.jpg`, the image shown when a page is shared, is a cropped and darkened copy of',
    `[${attachment.unsplashId}](${photo.check.url})`,
    `by ${photo.photographer} (media ${attachment.id} above), used under the`,
    `[Unsplash License](${UNSPLASH_LICENSE}). The Larchwick name on it is set in`,
    'DM Serif Display and the tagline in Inter, both under the SIL Open Font License 1.1.',
    '',
  ]
}

function renderCredits(
  rows: readonly Row[],
  titles: ReadonlyMap<number, string>,
  wxr: string,
): string {
  const table = renderTable(
    ['Media ID', 'Photographer', 'Unsplash photo', 'Used on'],
    rows.map((row) => [
      String(row.attachment.id),
      escapeCell(
        row.photo.nameFromPage
          ? row.photo.photographer
          : `${row.photo.photographer} (name from filename)`,
      ),
      linkCell(row),
      escapeCell(usedOnCell(row, titles)),
    ]),
  )
  const unchecked = rows.filter((row) => row.photo.check.kind !== 'verified')
  const otherLicenses = rows.filter(
    (row) => row.photo.check.kind === 'verified' && row.photo.license !== UNSPLASH_LICENSE,
  )
  const notes = [
    ...unchecked.map(
      ({ attachment, photo }) =>
        `- Media ${attachment.id}: ${photo.check.url} ${describeCheck(photo.check)}.`,
    ),
    ...otherLicenses.map(
      ({ attachment, photo }) =>
        `- Media ${attachment.id}: the Unsplash page states the licence as ${photo.license ?? 'nothing'}, not ${UNSPLASH_LICENSE}.`,
    ),
  ]

  return [
    '# Credits',
    '',
    'Larchwick is a demo project for a fictional business. This file lists the third-party images,',
    'fonts and code the project uses, with their sources and licences.',
    '',
    'This file is generated by `npm run credits` (`scripts/credits/build-credits.ts`) from the',
    "WordPress export. Don't edit it by hand: change the script and run it again.",
    '',
    '## Images',
    '',
    `All ${rows.length} photos are from [Unsplash](https://unsplash.com) and are used under the`,
    `[Unsplash License](${UNSPLASH_LICENSE}). The licence doesn't require attribution, but every`,
    'photographer is credited here.',
    '',
    "The media ID is the image's WordPress attachment ID in the export",
    `\`${wxr}\`. "Used on" is read from the published pages and posts in`,
    "the same export: featured images, images in the content, and the Home page's Elementor layout.",
    '',
    table,
    '',
    ...(notes.length > 0 ? ['Notes from the last run:', '', ...notes, ''] : []),
    ...renderSocialPreview(rows),
    '## Fonts',
    '',
    '- **DM Serif Display** and **Inter**: [SIL Open Font License 1.1](https://openfontlicense.org).',
    '  Self-hosted from our own origin through the Astro Fonts API (Fontsource), latin subset.',
    '',
    '## Icons',
    '',
    '- **[Lucide](https://lucide.dev)** 0.563.0: [ISC License](https://lucide.dev/license), with',
    '  portions derived from Feather under the MIT License. The SVG path data of the icons the site',
    '  uses is copied into `src/components/ui/Icon.astro`. The notices below travel with those copies.',
    '',
    '```text',
    ...LUCIDE_NOTICE,
    '```',
    '',
    '## The "before" WordPress site',
    '',
    'The "before" site used the Astra theme, Elementor, Yoast SEO and Contact Form 7. None of their',
    'code is in this repository.',
    '',
  ].join('\n')
}

async function main(): Promise<void> {
  const wxrPath = resolve(ROOT, process.argv[2] ?? DEFAULT_WXR)
  const wxr = relative(ROOT, wxrPath)
  const items = parseWxr(readFileSync(wxrPath, 'utf8'))
  const titles = new Map(
    items.filter((item) => item.status === 'publish').map((item) => [item.id, item.title]),
  )
  const attachments = items
    .filter((item) => item.type === 'attachment')
    .map(toAttachment)
    .sort((a, b) => a.id - b.id)
  console.log(`Read ${attachments.length} attachments from ${wxr}`)

  const rows: Row[] = []
  for (const attachment of attachments) {
    const photo = await describePhoto(attachment)
    const usedOn = findUsage(attachment, items)
    rows.push({ attachment, photo, usedOn })
    const status = describeCheck(photo.check)
    console.log(`  ${attachment.id} ${attachment.unsplashId} ${photo.photographer} [${status}]`)
  }

  writeFileSync(OUTPUT, renderCredits(rows, titles, wxr))

  const verified = rows.filter((row) => row.photo.check.kind === 'verified')
  const unverified = rows.filter((row) => row.photo.check.kind === 'unverified')
  const notFound = rows.filter((row) => row.photo.check.kind === 'not-found')
  const namesFromPage = rows.filter((row) => row.photo.nameFromPage)
  const unused = rows.filter((row) => row.usedOn.length === 0)
  console.log(`Verified (HTTP 200): ${verified.length}/${rows.length}`)
  console.log(`Not verified: ${unverified.length}`)
  console.log(`Not found: ${notFound.length}`)
  console.log(
    `Names from Unsplash pages: ${namesFromPage.length}, from filenames: ${rows.length - namesFromPage.length}`,
  )
  console.log(
    `Not used on the site: ${unused.map((row) => row.attachment.id).join(', ') || 'none'}`,
  )
  console.log(`Wrote ${relative(ROOT, OUTPUT)}`)

  if (notFound.length > 0) {
    console.error(
      `Unsplash returned 404 for: ${notFound.map((row) => row.photo.check.url).join(', ')}`,
    )
    process.exitCode = 1
  }
}

await main()
