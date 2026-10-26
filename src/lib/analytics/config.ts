/** Google Analytics 4 with consent (PLAN.md Phase 7c): the parts that don't need a browser. */
export type Consent = 'granted' | 'denied'

export const CONSENT_KEY = 'larchwick-analytics-consent'
export const CONSENT_BANNER_ID = 'consent-banner'
/** The page's `<main>` (Layout.astro): focus lands there when the banner closes with focus inside. */
export const MAIN_ID = 'main'

/**
 * The Measurement ID to build into the pages, or undefined. Only production builds (Workers
 * Builds on `main`) get it, so previews, local builds and GitHub CI never send data.
 */
export function measurementId(
  env: Record<string, string | undefined>,
  id: string,
): string | undefined {
  return env.WORKERS_CI_BRANCH === 'main' ? id : undefined
}

export function readConsent(value: string | null): Consent | null {
  return value === 'granted' || value === 'denied' ? value : null
}

/** The names of Google Analytics cookies (`_ga`, `_ga_<id>`) in a `document.cookie` string. */
export function analyticsCookies(cookie: string): string[] {
  return cookie
    .split(';')
    .map((pair) => pair.split('=')[0].trim())
    .filter((name) => /^_ga(_|$)/.test(name))
}

/** Every domain a cookie for this host can be set on, most specific first. */
export function cookieDomains(hostname: string): string[] {
  const labels = hostname.split('.')
  return labels.slice(0, -1).map((_, index) => labels.slice(index).join('.'))
}
