/**
 * The absolute canonical URL for `canonical` (a path or an absolute URL). Our own URLs get the
 * trailing slash every route has and lose any query or fragment; a URL on another site (content
 * published there first) is kept exactly as given.
 */
export function canonicalUrl(canonical: string, site: string): string {
  const url = new URL(canonical, site)
  if (url.origin !== new URL(site).origin) return url.href
  url.search = ''
  url.hash = ''
  url.pathname = url.pathname.replace(/\/?$/, '/')
  return url.href
}
