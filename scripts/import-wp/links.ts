import type { LinkChange } from './types.ts'

export interface LinkRules {
  origin: string
  postSlugs: ReadonlySet<string>
}

const FILE_PATH = /\.[a-z0-9]{2,5}$/i

function splitPath(href: string): { path: string; suffix: string } {
  const index = href.search(/[?#]/)
  return index === -1
    ? { path: href, suffix: '' }
    : { path: href.slice(0, index), suffix: href.slice(index) }
}

export function rewriteHref(
  href: string,
  rules: LinkRules,
  record: (_change: Omit<LinkChange, 'where'>) => void,
): string {
  const original = href.trim()
  if (original === '#') {
    record({ from: original, to: original, reason: 'empty "#" link, needs a real target' })
    return original
  }

  let next = original
  if (next.startsWith(rules.origin)) next = next.slice(rules.origin.length) || '/'
  if (!next.startsWith('/')) {
    if (next.startsWith('http://')) {
      record({ from: original, to: original, reason: 'external link over http' })
    }
    return next
  }

  const { path, suffix } = splitPath(next)
  let target = path
  if (!target.endsWith('/') && !FILE_PATH.test(target)) target = `${target}/`
  const slug = /^\/([a-z0-9-]+)\/$/.exec(target)?.[1]
  if (slug && rules.postSlugs.has(slug)) target = `/blog/${slug}/`
  next = `${target}${suffix}`

  if (next !== original) {
    const reasons = [
      original.startsWith(rules.origin) && 'absolute → relative',
      !path.endsWith('/') && target.endsWith('/') && 'trailing slash added',
      target.startsWith('/blog/') && !path.startsWith('/blog/') && 'post moved under /blog/',
    ].filter(Boolean)
    record({ from: original, to: next, reason: reasons.join(', ') })
  }
  return next
}
