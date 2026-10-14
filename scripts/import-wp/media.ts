import type { WxrItem } from './wxr.ts'

export interface AltEntry {
  file: string
  alt: string
}

export interface Credit {
  photographer: string
  url: string
}

export interface MediaItem {
  wpId: number
  parentId: number
  url: string
  filename: string
  alt?: string
  credit?: Credit
}

const CREDIT_ROW =
  /^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*\[[^\]]+\]\((https:\/\/unsplash\.com\/photos\/[^)]+)\)/

export function parseCredits(markdown: string): Map<number, Credit> {
  const credits = new Map<number, Credit>()
  for (const line of markdown.split('\n')) {
    const match = CREDIT_ROW.exec(line)
    if (match) credits.set(Number(match[1]), { photographer: match[2], url: match[3] })
  }
  return credits
}

export function mediaItems(
  items: readonly WxrItem[],
  altText: Readonly<Record<string, AltEntry>>,
  credits: ReadonlyMap<number, Credit>,
): MediaItem[] {
  return items
    .filter((item) => item.type === 'attachment' && item.attachmentUrl)
    .map((item) => ({
      wpId: item.id,
      parentId: item.parentId,
      url: item.attachmentUrl,
      filename: item.attachmentUrl.split('/').at(-1) ?? `${item.id}.jpg`,
      alt: altText[String(item.id)]?.alt,
      credit: credits.get(item.id),
    }))
}

export function creditLine(credit: Credit | undefined): string | undefined {
  return credit ? `${credit.photographer} / Unsplash` : undefined
}
