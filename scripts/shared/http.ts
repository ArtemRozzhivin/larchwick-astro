export interface RequestOptions {
  userAgent: string
  accept: string
  timeoutMs: number
  retryDelayMs: number
}

const MAX_ATTEMPTS = 2

export function sleep(ms: number): Promise<void> {
  return new Promise((done) => setTimeout(done, ms))
}

export function describeError(error: unknown): string {
  if (!(error instanceof Error)) return String(error)
  return error.cause instanceof Error ? `${error.message} (${error.cause.message})` : error.message
}

/**
 * GET `url`, retried once after a network error, a 429 or a 5xx.
 *
 * Redirects are returned unfollowed (`redirect: 'manual'`): the SEO crawl records every 301 hop,
 * and the credits script checks where Unsplash redirects before it follows. A caller that just
 * wants the page must follow a 3xx `location` itself.
 *
 * @throws When the second attempt fails too, with the URL and the cause in the message.
 */
export async function request(url: string, options: RequestOptions): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(url, {
        redirect: 'manual',
        headers: { 'User-Agent': options.userAgent, Accept: options.accept },
        signal: AbortSignal.timeout(options.timeoutMs),
      })
      const isTransient = response.status === 429 || response.status >= 500
      if (!isTransient || attempt === MAX_ATTEMPTS) return response
      await response.body?.cancel()
    } catch (error) {
      if (attempt === MAX_ATTEMPTS) throw new Error(`GET ${url} failed: ${describeError(error)}`)
    }
    await sleep(options.retryDelayMs)
  }
}
