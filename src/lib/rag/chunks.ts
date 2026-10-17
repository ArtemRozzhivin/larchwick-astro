import { createHash } from 'node:crypto'

/**
 * Splits the site's Sanity content into passages for the "Ask Larchwick" index (PLAN.md
 * Phase 7b). Pure: no Sanity or network access, so it is tested with plain objects.
 */
export interface Passage {
  id: string
  url: string
  title: string
  heading: string
  text: string
}

export interface PageSource {
  title: string
  url: string
  sections: readonly unknown[]
}

export interface PostSource {
  title: string
  url: string
  excerpt?: string | null
  publishedAt?: string | null
  categories?: readonly string[]
  body: readonly unknown[]
}

export interface ContactSource {
  url: string
  title: string
  description?: string
  lines: readonly string[]
}

interface Draft {
  heading: string
  lines: string[]
}

type Node = Record<string, unknown>

const MAX_WORDS = 350
const SKIPPED_SECTIONS = new Set(['latestPosts'])

function isNode(value: unknown): value is Node {
  return typeof value === 'object' && value !== null
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function list(value: unknown): Node[] {
  return Array.isArray(value) ? value.filter(isNode) : []
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.map(str).filter(Boolean) : []
}

function spans(block: Node): string {
  return list(block.children)
    .map((child) => (typeof child.text === 'string' ? child.text : ''))
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}

function pair(label: unknown, value: unknown): string {
  const [left, right] = [str(label), str(value)]
  return left && right ? `${left}: ${right}` : left || right
}

function quoted(text: unknown, citation: unknown): string {
  const body = str(text)
  if (!body) return ''
  return str(citation) ? `"${body}" (${str(citation)})` : `"${body}"`
}

/** Portable text → one draft per heading, with lists, tables, callouts and quotes as lines. */
export function richTextDrafts(blocks: readonly unknown[], heading = ''): Draft[] {
  const drafts: Draft[] = [{ heading, lines: [] }]
  for (const block of blocks.filter(isNode)) {
    const current = drafts[drafts.length - 1]
    if (block._type === 'block') {
      const text = spans(block)
      if (!text) continue
      if (/^h[2-4]$/.test(str(block.style))) drafts.push({ heading: text, lines: [] })
      else current.lines.push(block.listItem ? `- ${text}` : text)
    } else if (block._type === 'table') {
      const rows = list(block.rows).map((row) => strings(row.cells).join(' | '))
      current.lines.push(...[str(block.caption), ...rows].filter(Boolean))
    } else if (block._type === 'callout') {
      current.lines.push(str(block.text))
    } else if (block._type === 'quote') {
      current.lines.push(quoted(block.text, block.citation))
    } else if (block._type === 'figure' || block._type === 'gallery') {
      current.lines.push(str(block.caption))
    }
  }
  return drafts.map((draft) => ({ ...draft, lines: draft.lines.filter(Boolean) }))
}

function itemLines(items: unknown): string[] {
  return list(items).map((item) => pair(item.title ?? item.label, item.text ?? item.value))
}

function cardDraft(card: Node): Draft {
  return {
    heading: str(card.title),
    lines: [
      str(card.eyebrow),
      str(card.text),
      ...list(card.specs).map((spec) => pair(spec.label, spec.value)),
      ...strings(card.points),
      str(card.price),
    ].filter(Boolean),
  }
}

/** One page section → drafts. Unknown types fall back to their heading, intro and text. */
export function sectionDrafts(section: Node): Draft[] {
  const heading = str(section.heading)
  const intro = [str(section.eyebrow), str(section.intro)]
  switch (section._type) {
    case 'hero': {
      const label = isNode(section.label) ? section.label : {}
      return [
        {
          heading,
          lines: [
            ...intro,
            str(section.text),
            ...strings(section.trustList),
            str(label.name),
            str(label.origin),
            ...list(label.details).map((detail) => pair(detail.label, detail.value)),
            str(label.footnote),
          ],
        },
      ]
    }
    case 'textBlock':
    case 'imageText': {
      const [first, ...rest] = richTextDrafts(list(section.body), heading)
      return [{ ...first, lines: [...intro, ...first.lines] }, ...rest]
    }
    case 'featureGrid':
    case 'steps':
    case 'stats':
      return [{ heading, lines: [...intro, ...itemLines(section.items)] }]
    case 'cardGrid':
      return [{ heading, lines: intro }, ...list(section.cards).map(cardDraft)]
    case 'priceTable':
      return [
        {
          heading,
          lines: [
            ...intro,
            ...list(section.rows).map((row) =>
              [pair(row.name, row.price), str(row.description), str(row.note)]
                .filter(Boolean)
                .join(', '),
            ),
          ],
        },
      ]
    case 'faq':
      return list(section.groups).flatMap((group) =>
        list(group.items).map((item) => ({
          heading: str(item.question),
          lines: richTextDrafts(list(item.answer)).flatMap((draft) => draft.lines),
        })),
      )
    case 'cta':
      return [{ heading, lines: [quoted(section.quote, section.citation), str(section.text)] }]
    case 'quote':
      return [{ heading: '', lines: [quoted(section.text, section.citation)] }]
    default:
      return [{ heading, lines: [...intro, str(section.text)] }]
  }
}

/** Splits at paragraph boundaries so no passage runs much past MAX_WORDS. */
export function splitLong(lines: readonly string[], maxWords = MAX_WORDS): string[] {
  const parts: string[][] = [[]]
  let words = 0
  for (const line of lines) {
    const count = line.split(/\s+/).length
    if (words > 0 && words + count > maxWords) {
      parts.push([])
      words = 0
    }
    parts[parts.length - 1].push(line)
    words += count
  }
  return parts.filter((part) => part.length > 0).map((part) => part.join('\n'))
}

export function passageId(url: string, heading: string, text: string): string {
  return createHash('sha256').update(`${url}\n${heading}\n${text}`).digest('hex').slice(0, 32)
}

function toPassages(url: string, title: string, drafts: readonly Draft[]): Passage[] {
  return drafts.flatMap((draft) =>
    splitLong(draft.lines.filter(Boolean)).map((text) => ({
      id: passageId(url, draft.heading, text),
      url,
      title,
      heading: draft.heading,
      text,
    })),
  )
}

export function pagePassages(page: PageSource): Passage[] {
  const drafts = page.sections
    .filter(isNode)
    .filter((section) => !SKIPPED_SECTIONS.has(str(section._type)))
    .flatMap(sectionDrafts)
  return toPassages(page.url, page.title, drafts)
}

export function postPassages(post: PostSource): Passage[] {
  const published = post.publishedAt ? `Published ${post.publishedAt.slice(0, 10)}` : ''
  const filed = post.categories?.length ? `in ${post.categories.join(', ')}` : ''
  const intro = {
    heading: '',
    lines: [str(post.excerpt), [published, filed].filter(Boolean).join(' ')],
  }
  const [first, ...rest] = richTextDrafts(post.body)
  return toPassages(post.url, post.title, [
    { ...intro, lines: [...intro.lines, ...first.lines] },
    ...rest,
  ])
}

export function contactPassages(contact: ContactSource): Passage[] {
  return toPassages(contact.url, contact.title, [
    { heading: '', lines: [str(contact.description), ...contact.lines] },
  ])
}

/** The text that gets embedded: the passage with its page title and heading for context. */
export function embeddingText(passage: Passage): string {
  return [passage.title, passage.heading, passage.text].filter(Boolean).join('\n')
}
