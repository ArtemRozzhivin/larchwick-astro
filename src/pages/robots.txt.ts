import type { APIRoute } from 'astro'

import { siteConfig } from '@lib/config/site'

/**
 * Generated at build time so the sitemap URL always matches the configured site.
 */
export const GET: APIRoute = () => {
  const body = `User-agent: *
Allow: /

Sitemap: ${new URL('sitemap-index.xml', siteConfig.url).href}
`

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
