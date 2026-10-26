import { inlineLinkClass, pillVariants } from '../../components/ui/link'
import { track } from '../analytics/track'
import { answerParts, parseEvents, safePath, type Source, sourceLabel } from './stream'

/**
 * The chat panel's behaviour, loaded the first time the panel opens (ChatPanel.astro). Every
 * piece of text is set with textContent, never HTML, so nothing in an answer can inject markup.
 */
const BUBBLE = 'max-w-[85%] rounded-label px-4 py-3 leading-relaxed'
const STYLES = {
  question: `${BUBBLE} bg-larch text-surface self-end`,
  answer: `${BUBBLE} bg-paper text-ink border-border self-start border`,
  failed: `${BUBBLE} bg-paper text-stamp border-stamp self-start border-2`,
  // The dot pulses, not the text: fading text would drop below 4.5:1 contrast.
  thinking: 'text-ink flex items-center gap-2',
  thinkingDot: 'bg-larch size-2 shrink-0 rounded-full motion-safe:animate-pulse',
  sourcesLabel: 'mt-3 text-sm font-bold',
  inlineLink: inlineLinkClass,
  sourceLink: `${pillVariants()} mt-2 mr-2`,
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

/** Text and [label](/path/) links, never HTML. */
function renderText(node: HTMLElement, text: string, streaming = false): void {
  node.replaceChildren(
    ...answerParts(text, streaming).map((part) => {
      if (!part.href) return document.createTextNode(part.text)
      const link = element('a', STYLES.inlineLink, part.text) as HTMLAnchorElement
      link.href = part.href
      link.dataset.track = 'chat_source_click'
      link.dataset.trackLinkUrl = part.href
      return link
    }),
  )
}

function textElement(text: string): HTMLElement {
  const node = element('p', '')
  renderText(node, text)
  return node
}

/**
 * The bubble stays silent while it streams (aria-live="off", and the draft inert, which hides it
 * from screen readers that still report changes inside the log and keeps its links out of the Tab
 * sequence); its final content goes in as new nodes, not inert, once live updates are back on, so
 * the log announces the whole answer once.
 */
function settle(bubble: HTMLElement, ...nodes: HTMLElement[]): void {
  bubble.removeAttribute('aria-live')
  bubble.replaceChildren(...nodes)
}

function fail(bubble: HTMLElement, text: string): void {
  bubble.className = STYLES.failed
  settle(bubble, textElement(text))
}

function thinkingStatus(label: string): HTMLElement {
  const dot = element('span', STYLES.thinkingDot)
  dot.setAttribute('aria-hidden', 'true')
  const status = element('p', STYLES.thinking)
  status.append(dot, label)
  return status
}

function sourcesBox(sources: readonly Source[], label: string): HTMLElement | null {
  const links = sources.flatMap((source) => {
    const href = safePath(source.url)
    if (!href) return []
    const link = element('a', STYLES.sourceLink, sourceLabel(source)) as HTMLAnchorElement
    link.href = href
    link.dataset.track = 'chat_source_click'
    link.dataset.trackLinkUrl = href
    return [link]
  })
  if (links.length === 0) return null
  const box = element('div', '')
  box.dataset.chatSources = ''
  box.append(element('p', STYLES.sourcesLabel, label), ...links)
  return box
}

async function readAnswer(
  body: ReadableStream<Uint8Array>,
  bubble: HTMLElement,
  labels: Labels,
): Promise<void> {
  const draft = element('p', '')
  draft.inert = true
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let answer = ''
  let sources: HTMLElement | null = null
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    const parsed = parseEvents(buffer + decoder.decode(value, { stream: true }))
    buffer = parsed.rest
    for (const event of parsed.events) {
      if (event.type === 'delta') {
        answer += event.text
        renderText(draft, answer, true)
        if (!draft.isConnected) {
          bubble.setAttribute('aria-live', 'off')
          bubble.replaceChildren(draft)
        }
      } else if (event.type === 'sources') {
        sources = sourcesBox(event.sources, labels.sources)
      } else if (event.type === 'error') {
        fail(bubble, answer ? `${answer} ${event.message}` : event.message)
      }
    }
  }
  if (bubble.className === STYLES.failed) return
  if (answer) settle(bubble, textElement(answer), ...(sources ? [sources] : []))
  else fail(bubble, labels.failed)
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

  const ask = async (question: string, source: 'suggestion' | 'typed'): Promise<void> => {
    if (busy || !question) return
    busy = true
    // A suggestion removes the button that has focus; move focus first so it doesn't drop to <body>.
    input.focus()
    track('chat_question', { question_source: source })
    let result: 'answered' | 'failed' | 'busy' = 'failed'
    send.disabled = true
    input.value = ''
    panel.querySelector('[data-chat-suggestions]')?.remove()
    log.append(element('p', STYLES.question, question))
    const bubble = element('div', STYLES.answer)
    bubble.append(thinkingStatus(labels.thinking))
    log.append(bubble)
    bubble.scrollIntoView({ block: 'end' })
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      if (!response.ok || !response.body) {
        if (response.status === 429) result = 'busy'
        fail(bubble, await errorMessage(response, labels.failed))
      } else {
        await readAnswer(response.body, bubble, labels)
        if (bubble.className !== STYLES.failed) result = 'answered'
      }
    } catch {
      fail(bubble, labels.failed)
    } finally {
      track('chat_answer', {
        answer_result: result,
        source_count: bubble.querySelectorAll('[data-chat-sources] a').length,
      })
      bubble.scrollIntoView({ block: 'end' })
      busy = false
      send.disabled = false
      input.focus()
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    void ask(input.value.trim(), 'typed')
  })
  for (const button of panel.querySelectorAll<HTMLButtonElement>('[data-suggestion]')) {
    button.addEventListener('click', () => void ask(button.textContent?.trim() ?? '', 'suggestion'))
  }
}
