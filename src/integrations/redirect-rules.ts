export interface Rule {
  from: string
  to: string
  status: 301 | 302
}

export interface RedirectDoc {
  from: string
  to: string
  permanent?: boolean | null
}

const LIMITS = { exactPath: 2000, dynamic: 100, lineLength: 1000 } as const
const OLD_SITEMAPS = [
  '/sitemap_index.xml',
  '/sitemap.xml',
  '/wp-sitemap.xml',
  '/post-sitemap.xml',
  '/page-sitemap.xml',
  '/category-sitemap.xml',
  '/post_tag-sitemap.xml',
  '/author-sitemap.xml',
]

export function isDynamic(source: string): boolean {
  return /[:*]/.test(source)
}

function withoutSlash(path: string): string | undefined {
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : undefined
}

function bothForms(rule: Rule): Rule[] {
  const slashless = withoutSlash(rule.from)
  return slashless ? [rule, { ...rule, from: slashless }] : [rule]
}

/** The WordPress URL patterns that live in code, not in Sanity (PLAN.md §8). */
export function codeRules(years: readonly number[]): Rule[] {
  const permanent = (from: string, to: string): Rule => ({ from, to, status: 301 })
  return [
    ...['/feed/', '/comments/feed/'].map((from) => permanent(from, '/blog/')),
    permanent('/category/:slug/feed/', '/blog/'),
    permanent('/tag/:slug/feed/', '/blog/'),
    permanent('/author/:name/feed/', '/blog/'),
    permanent('/:slug/feed/', '/blog/'),
    permanent('/category/:slug/', '/blog/category/:slug/'),
    permanent('/tag/:slug/', '/blog/tag/:slug/'),
    permanent('/author/:name/', '/about/'),
    ...years.flatMap((year) => [
      permanent(`/${year}/`, '/blog/'),
      permanent(`/${year}/*`, '/blog/'),
    ]),
    ...OLD_SITEMAPS.map((from) => permanent(from, '/sitemap-index.xml')),
  ].flatMap(bothForms)
}

export function sanityRules(docs: readonly RedirectDoc[]): Rule[] {
  return docs.flatMap((doc) =>
    bothForms({ from: doc.from, to: doc.to, status: doc.permanent === false ? 302 : 301 }),
  )
}

/** Slashless URLs of live pages get a 301 instead of Cloudflare's default 307. */
export function slashlessRules(routes: readonly string[]): Rule[] {
  return routes.flatMap((route) => {
    const slashless = withoutSlash(route)
    return slashless ? [{ from: slashless, to: route, status: 301 as const }] : []
  })
}

function patternOf(source: string): RegExp {
  const escaped = source.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^${escaped.replace(/:[a-z]+/gi, '[^/]+').replace(/\*/g, '.*')}$`)
}

export function validateRules(rules: readonly Rule[], routes: readonly string[]): string[] {
  const errors: string[] = []
  const seen = new Set<string>()
  const live = new Set(routes)
  const dynamicRules = rules.filter((rule) => isDynamic(rule.from))
  for (const rule of rules) {
    if (seen.has(rule.from)) errors.push(`duplicate source ${rule.from}`)
    seen.add(rule.from)
    if (live.has(rule.from)) errors.push(`source ${rule.from} is a live page and would never load`)
    const line = `${rule.from} ${rule.to} ${rule.status}`
    if (line.length > LIMITS.lineLength)
      errors.push(`rule longer than ${LIMITS.lineLength} characters`)
  }
  for (const rule of dynamicRules) {
    const pattern = patternOf(rule.from)
    const hit = routes.find((route) => pattern.test(route))
    if (hit) errors.push(`dynamic source ${rule.from} matches the live page ${hit}`)
  }
  for (const rule of rules.filter((candidate) => !isDynamic(candidate.to))) {
    if (seen.has(rule.to) && !isDynamic(rule.to))
      errors.push(`${rule.from} → ${rule.to} is a chain`)
  }
  if (rules.length - dynamicRules.length > LIMITS.exactPath)
    errors.push('more than 2,000 exact-path rules')
  if (dynamicRules.length > LIMITS.dynamic) errors.push('more than 100 dynamic rules')
  return errors
}

export function toRedirectsFile(rules: readonly Rule[]): string {
  const staticRules = rules.filter((rule) => !isDynamic(rule.from))
  const dynamicRules = rules.filter((rule) => isDynamic(rule.from))
  const lines = (list: readonly Rule[]) =>
    list.map((rule) => `${rule.from} ${rule.to} ${rule.status}`)
  return [
    '# Generated at build time by src/integrations/redirects.ts. Do not edit.',
    '# Static rules first, then patterns; Cloudflare uses the first match.',
    ...lines(staticRules),
    ...lines(dynamicRules),
    '',
  ].join('\n')
}
