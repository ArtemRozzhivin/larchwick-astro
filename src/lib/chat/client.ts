import { parseEvents, safePath, type Source, sourceLabel, withoutMarkers } from './stream'

/**
 * The chat panel's behaviour, loaded the first time the panel opens (ChatPanel.astro). Every
 * piece of text is set with textContent, never HTML, so nothing in an answer can inject markup.
 */
const BUBBLE = 'max-w-[85%] rounded-label px-4 py-3 leading-relaxed'
const STYLES = {
  question: `${BUBBLE} bg-larch text-surface self-end`,
  answer: `${BUBBLE} bg-paper text-ink border-border self-start border`,
  failed: `${BUBBLE} bg-paper text-stamp border-stamp self-start border-2`,
  thinking: 'text-ink/70 animate-pulse',
  sourcesLabel: 'mt-3 text-sm font-bold',
  sourceLink:
    'border-espresso text-espresso hover:bg-needle mt-2 mr-2 inline-block rounded-full border-2 px-3 py-1 text-sm font-bold transition-colors',
} as const

interface Labels {
  thinking: string
  sources: string
  failed: string
}

function element(tag: string, className: string, text = ''): HTMLElement {
  const node = document.createElement(tag)
  node.className = className
  node.textContent = text
  return node
}

function renderSources(bubble: HTMLElement, sources: readonly Source[], label: string): void {
  const links = sources.flatMap((source) => {
    const href = safePath(source.url)
    if (!href) return []
    const link = element('a', STYLES.sourceLink, sourceLabel(source)) as HTMLAnchorElement
    link.href = href
    return [link]
  })
  if (links.length === 0) return
  const box = element('div', '')
  box.append(element('p', STYLES.sourcesLabel, label), ...links)
  bubble.append(box)
}

async function readAnswer(
  body: ReadableStream<Uint8Array>,
  bubble: HTMLElement,
  labels: Labels,
): Promise<void> {
  const text = element('p', '')
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let answer = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    const parsed = parseEvents(buffer + decoder.decode(value, { stream: true }))
    buffer = parsed.rest
    for (const event of parsed.events) {
      if (event.type === 'delta') {
        answer += event.text
        text.textContent = withoutMarkers(answer)
        if (!text.isConnected) bubble.replaceChildren(text)
      } else if (event.type === 'sources') {
        renderSources(bubble, event.sources, labels.sources)
      } else if (event.type === 'error') {
        bubble.className = STYLES.failed
        bubble.replaceChildren(
          element('p', '', answer ? `${withoutMarkers(answer)} ${event.message}` : event.message),
        )
      }
    }
  }
  if (!answer && bubble.className !== STYLES.failed) {
    bubble.className = STYLES.failed
    bubble.replaceChildren(element('p', '', labels.failed))
  }
}

async function errorMessage(response: Response, fallback: string): Promise<string> {
  const body = (await response.json().catch(() => undefined)) as { error?: unknown } | undefined
  return typeof body?.error === 'string' ? body.error : fallback
}

export function startChat(panel: HTMLElement): void {
  const form = panel.querySelector<HTMLFormElement>('[data-chat-form]')
  const input = form?.querySelector<HTMLInputElement>('input[name="question"]')
  const send = form?.querySelector<HTMLButtonElement>('button[type="submit"]')
  const log = panel.querySelector<HTMLElement>('[data-chat-log]')
  if (!form || !input || !send || !log) return
  input.focus()
  if (panel.dataset.ready) return
  panel.dataset.ready = 'true'
  const labels: Labels = {
    thinking: panel.dataset.thinking ?? '',
    sources: panel.dataset.sources ?? '',
    failed: panel.dataset.failed ?? '',
  }
  let busy = false

  const ask = async (question: string): Promise<void> => {
    if (busy || !question) return
    busy = true
    send.disabled = true
    input.value = ''
    panel.querySelector('[data-chat-suggestions]')?.remove()
    log.append(element('p', STYLES.question, question))
    const bubble = element('div', STYLES.answer)
    bubble.append(element('p', STYLES.thinking, labels.thinking))
    log.append(bubble)
    log.setAttribute('aria-busy', 'true')
    bubble.scrollIntoView({ block: 'end' })
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      if (!response.ok || !response.body) {
        bubble.className = STYLES.failed
        bubble.replaceChildren(element('p', '', await errorMessage(response, labels.failed)))
      } else {
        await readAnswer(response.body, bubble, labels)
      }
    } catch {
      bubble.className = STYLES.failed
      bubble.replaceChildren(element('p', '', labels.failed))
    } finally {
      log.setAttribute('aria-busy', 'false')
      bubble.scrollIntoView({ block: 'end' })
      busy = false
      send.disabled = false
      input.focus()
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    void ask(input.value.trim())
  })
  for (const button of panel.querySelectorAll<HTMLButtonElement>('[data-suggestion]')) {
    button.addEventListener('click', () => void ask(button.textContent?.trim() ?? ''))
  }
}
