/**
 * Analytics events (PLAN.md Phase 7c). `track()` does nothing until the visitor has accepted
 * analytics, because only then does consent.ts define `gtag`. Markup opts in with attributes:
 * `data-track="cta_click" data-track-cta-label="Shop"` sends `cta_click` with `cta_label` on click,
 * and `data-track-view="generate_lead"` sends its event when the page loads.
 */
export type EventParams = Record<string, string | number>

export interface PendingEvent {
  name: string
  params: EventParams
}

type Gtag = (..._args: unknown[]) => void

const PENDING_KEY = 'larchwick-analytics-pending'

function gtag(): Gtag | undefined {
  return (window as Window & { gtag?: Gtag }).gtag
}

export function track(name: string, params: EventParams = {}): void {
  gtag()?.('event', name, params)
}

/** Events saved by the previous page, from session storage; anything malformed is dropped. */
export function readPending(value: string | null): PendingEvent[] {
  try {
    const parsed: unknown = JSON.parse(value ?? '[]')
    return Array.isArray(parsed)
      ? parsed.filter(
          (item): item is PendingEvent =>
            typeof item?.name === 'string' &&
            typeof item?.params === 'object' &&
            item.params !== null,
        )
      : []
  } catch {
    return []
  }
}

/** `data-track-cta-label="Shop"` → `{ cta_label: 'Shop' }`; `data-track` and `data-track-view` name the event. */
export function trackParams(dataset: Record<string, string | undefined>): EventParams {
  const params: EventParams = {}
  for (const [key, value] of Object.entries(dataset)) {
    if (!key.startsWith('track') || key === 'track' || key === 'trackView' || value === undefined) {
      continue
    }
    const name = key
      .slice('track'.length)
      .replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
      .slice(1)
    params[name] = value
  }
  return params
}

export function contactMethod(href: string): 'email' | 'phone' | null {
  if (href.startsWith('mailto:')) return 'email'
  if (href.startsWith('tel:')) return 'phone'
  return null
}

/**
 * A click that leaves for another page of ours would lose its event as the page unloads, so it
 * is saved for the next page to send. Keeps the click instant; GA records the clicked page as the
 * next page's referrer.
 */
function leavesForOurPage(event: MouseEvent, element: Element): boolean {
  const link = element.closest('a[href]')
  if (!(link instanceof HTMLAnchorElement) || (link.target && link.target !== '_self')) return false
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false
  }
  const samePage = link.pathname === location.pathname && link.search === location.search
  return link.origin === location.origin && !samePage
}

function sendLater(name: string, params: EventParams): void {
  if (!gtag()) return
  try {
    const pending = readPending(sessionStorage.getItem(PENDING_KEY))
    sessionStorage.setItem(PENDING_KEY, JSON.stringify([...pending, { name, params }]))
  } catch {
    track(name, params)
  }
}

function sendPending(): void {
  try {
    const pending = readPending(sessionStorage.getItem(PENDING_KEY))
    sessionStorage.removeItem(PENDING_KEY)
    for (const { name, params } of pending) track(name, params)
  } catch {
    // Storage blocked: nothing was saved either.
  }
}

function isReload(): boolean {
  const [entry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
  return entry?.type === 'reload'
}

export function startTracking(): void {
  sendPending()
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return
    const tracked = event.target.closest<HTMLElement>('[data-track]')
    if (tracked?.dataset.track) {
      const send = leavesForOurPage(event, tracked) ? sendLater : track
      send(tracked.dataset.track, trackParams(tracked.dataset))
    }
    const link = event.target.closest<HTMLAnchorElement>('a[href]')
    const method = link && contactMethod(link.getAttribute('href') ?? '')
    if (method) track('contact_click', { contact_method: method })
  })
  // A reload of the thanks page is not a second lead.
  if (isReload()) return
  for (const element of document.querySelectorAll<HTMLElement>('[data-track-view]')) {
    track(element.dataset.trackView ?? '', trackParams(element.dataset))
  }
}
