/**
 * The leak guard for the assistant's index: every word of a passage must already appear in the
 * rendered text (the <body>) of the page it links to, so the index never holds anything the site
 * doesn't publish (drafts, Studio-only fields, hidden pages).
 */
const ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
}

export function visibleText(html: string): string {
  const body = /<body[^>]*>([\s\S]*)<\/body>/i.exec(html)?.[1] ?? ''
  return body
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&([a-z]+);/gi, (entity, name: string) => ENTITIES[name.toLowerCase()] ?? entity)
}

export function words(text: string): Set<string> {
  return new Set(text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [])
}

export function unpublishedWords(passage: string, pageWords: ReadonlySet<string>): string[] {
  return [...words(passage)].filter((word) => !pageWords.has(word))
}
