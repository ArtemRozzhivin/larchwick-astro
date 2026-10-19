/** Pure helpers for the chat client: reading /api/chat's event stream (see worker/chat.ts). */
export interface Source {
  title: string
  url: string
  heading: string
}

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

export function sourceLabel(source: Source): string {
  return source.heading ? `${source.title}: ${source.heading}` : source.title
}
