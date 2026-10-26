import type { Excerpt } from '../rag/config.ts'

/** Pure helpers for the chat client: reading /api/chat's event stream (see worker/chat.ts). */

/** The longest question /api/chat accepts: the input's `maxlength` and the Worker's check. */
export const QUESTION_MAX = 500

export type Source = Pick<Excerpt, 'title' | 'url' | 'heading'>

export type ChatEvent =
  | { type: 'delta'; text: string }
  | { type: 'sources'; sources: Source[] }
  | { type: 'error'; message: string }
  | { type: 'done' }

/** Complete events from the buffer, plus the unfinished tail to keep for the next chunk. */
export function parseEvents(buffer: string): { events: ChatEvent[]; rest: string } {
  const blocks = buffer.split('\n\n')
  const rest = blocks.pop() ?? ''
  const events = blocks.flatMap((block) => {
    const data = block.startsWith('data: ') ? block.slice(6) : ''
    try {
      return data ? [JSON.parse(data) as ChatEvent] : []
    } catch {
      return []
    }
  })
  return { events, rest }
}

/** The answer as shown: without the [n] citation markers, which become the source links. */
export function withoutMarkers(text: string): string {
  return text.replace(/\s?\[\d+\]/g, '')
}

/** Only links to our own pages: a path, never a protocol or another host. */
export function safePath(url: string): string | null {
  return /^\/(?!\/)[\w\-/.]*$/.test(url) ? url : null
}

export interface AnswerPart {
  text: string
  href?: string
}

const LINK = /\[([^\]\n]+)\]\(([^)\s]*)\)/g
const UNFINISHED = /\[[^\]\n]*(?:\]\([^)\s]*)?$/

/**
 * The answer as shown, split into text and [label](/path/) links (our own pages only; any other
 * target keeps just its label). While streaming, an unfinished link or marker at the end is held
 * back until it completes.
 */
export function answerParts(text: string, streaming = false): AnswerPart[] {
  const shown = streaming ? withoutMarkers(text).replace(UNFINISHED, '') : withoutMarkers(text)
  const parts: AnswerPart[] = []
  let end = 0
  for (const match of shown.matchAll(LINK)) {
    if (match.index > end) parts.push({ text: shown.slice(end, match.index) })
    const href = safePath(match[2])
    parts.push(href ? { text: match[1], href } : { text: match[1] })
    end = match.index + match[0].length
  }
  if (end < shown.length) parts.push({ text: shown.slice(end) })
  return parts
}

export function sourceLabel(source: Source): string {
  return source.heading ? `${source.title}: ${source.heading}` : source.title
}
