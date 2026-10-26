import {
  analyticsCookies,
  type Consent,
  CONSENT_KEY,
  cookieDomains,
  MAIN_ID,
  readConsent,
} from './config'

/**
 * The consent banner's behaviour (ConsentBanner.astro). Nothing from Google loads until the
 * visitor accepts; after that, gtag.js loads once the page has finished loading and the browser is
 * idle, so it never competes with the page itself.
 */
const page = window as Window & { dataLayer?: unknown[]; gtag?: (..._args: unknown[]) => void }

function storedConsent(): Consent | null {
  try {
    return readConsent(localStorage.getItem(CONSENT_KEY))
  } catch {
    return null
  }
}

function storeConsent(consent: Consent): void {
  try {
    localStorage.setItem(CONSENT_KEY, consent)
  } catch {
    // Private mode or blocked storage: the choice holds for this page only.
  }
}

function whenIdle(run: () => void): void {
  const idle = (): void => {
    if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 3000 })
    else setTimeout(run, 200)
  }
  if (document.readyState === 'complete') idle()
  else addEventListener('load', idle, { once: true })
}

function startAnalytics(id: string): void {
  Reflect.set(window, `ga-disable-${id}`, false)
  if (page.gtag) {
    page.gtag('consent', 'update', { analytics_storage: 'granted' })
    return
  }
  const dataLayer = (page.dataLayer ??= [])
  // gtag.js reads the arguments object itself, not an array.
  page.gtag = function gtag() {
    dataLayer.push(arguments)
  }
  page.gtag('consent', 'default', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  })
  page.gtag('js', new Date())
  page.gtag('config', id, { cookie_domain: location.hostname })
  whenIdle(() => {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
    document.head.append(script)
  })
}

function stopAnalytics(id: string): void {
  Reflect.set(window, `ga-disable-${id}`, true)
  page.gtag?.('consent', 'update', { analytics_storage: 'denied' })
  for (const name of analyticsCookies(document.cookie)) {
    document.cookie = `${name}=; Max-Age=0; path=/`
    for (const domain of cookieDomains(location.hostname)) {
      document.cookie = `${name}=; Max-Age=0; path=/; domain=${domain}`
    }
  }
}

export function startConsent(banner: HTMLElement): void {
  if (!('showPopover' in banner)) return
  const id = banner.dataset.measurementId
  const consent = storedConsent()
  if (consent === 'granted' && id) startAnalytics(id)
  for (const settings of document.querySelectorAll<HTMLElement>('[data-consent-settings]')) {
    settings.hidden = false
  }
  // Shown on arrival, the banner leaves focus where it is; opened from Cookie settings, it takes it.
  let focusOnOpen = Boolean(consent)
  let returnFocus: HTMLElement | null = null
  banner.addEventListener('toggle', (event) => {
    if ((event as ToggleEvent).newState === 'open' && focusOnOpen) {
      returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
      banner.querySelector<HTMLElement>('[data-consent]')?.focus()
    }
    focusOnOpen = true
  })
  const close = (): void => {
    const hadFocus = banner.contains(document.activeElement)
    banner.hidePopover()
    if (returnFocus) returnFocus.focus()
    else if (hadFocus) document.getElementById(MAIN_ID)?.focus({ preventScroll: true })
    returnFocus = null
  }
  for (const button of banner.querySelectorAll<HTMLButtonElement>('[data-consent]')) {
    button.addEventListener('click', () => {
      const choice: Consent = button.dataset.consent === 'granted' ? 'granted' : 'denied'
      storeConsent(choice)
      close()
      if (!id) return
      if (choice === 'granted') startAnalytics(id)
      else stopAnalytics(id)
    })
  }
  // Escape hides the banner without a choice, so it asks again on the next page. Another open
  // popover (the menu, the assistant) takes the Escape first.
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || event.defaultPrevented || !banner.matches(':popover-open')) return
    if (document.querySelectorAll(':popover-open').length > 1) return
    close()
  })
  if (!consent) banner.showPopover()
}
