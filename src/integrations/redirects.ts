import type { AstroIntegration } from 'astro'
import { readFile, writeFile } from 'node:fs/promises'

import { sanityFetch } from '../lib/sanity/client'
import { getPosts } from '../lib/sanity/posts'
import { REDIRECTS_QUERY } from '../lib/sanity/queries'
import type { REDIRECTS_QUERY_RESULT } from '../lib/sanity/sanity.types'
import {
  codeRules,
  type RedirectDoc,
  sanityRules,
  slashlessRules,
  toRedirectsFile,
  validateRules,
} from './redirect-rules'

const NOINDEX = /<meta name="robots" content="[^"]*noindex/

async function isNoindex(dir: URL, path: string): Promise<boolean> {
  const file = new URL(`.${path}index.html`, dir)
  const html = await readFile(file, 'utf8').catch(() => '')
  return NOINDEX.test(html)
}

async function dropNoindexFromSitemap(dir: URL, site: URL): Promise<number> {
  const file = new URL('sitemap-0.xml', dir)
  const xml = await readFile(file, 'utf8')
  const entries = [...xml.matchAll(/<url><loc>([^<]+)<\/loc>.*?<\/url>/g)]
  let dropped = 0
  let next = xml
  for (const [entry, loc] of entries) {
    if (await isNoindex(dir, new URL(loc, site).pathname)) {
      next = next.replace(entry, '')
      dropped += 1
    }
  }
  if (dropped > 0) await writeFile(file, next)
  return dropped
}

export function redirects(): AstroIntegration {
  let site: URL
  return {
    name: 'larchwick-redirects',
    hooks: {
      'astro:config:done': ({ config }) => {
        site = new URL(config.site ?? 'http://localhost')
      },
      'astro:build:done': async ({ dir, pages, logger }) => {
        const routes = pages
          .map(({ pathname }) => `/${pathname}`.replace(/\/?$/, '/'))
          .filter((route) => route !== '/404/')
        const [docs, posts] = await Promise.all([
          sanityFetch<REDIRECTS_QUERY_RESULT>(REDIRECTS_QUERY),
          getPosts(),
        ])
        const years = [
          ...new Set(
            posts.flatMap((post) =>
              post.publishedAt ? [Number(post.publishedAt.slice(0, 4))] : [],
            ),
          ),
        ].sort()
        const rules = [
          ...sanityRules(
            docs.flatMap((doc): RedirectDoc[] =>
              doc.from && doc.to ? [{ from: doc.from, to: doc.to, permanent: doc.permanent }] : [],
            ),
          ),
          ...slashlessRules(routes),
          ...codeRules(years),
        ]
        const errors = validateRules(rules, routes)
        if (errors.length > 0) throw new Error(`_redirects is invalid:\n${errors.join('\n')}`)
        await writeFile(new URL('_redirects', dir), toRedirectsFile(rules))
        logger.info(`wrote ${rules.length} redirect rules`)
        const dropped = await dropNoindexFromSitemap(dir, site)
        logger.info(`removed ${dropped} noindex pages from the sitemap`)
      },
    },
  }
}
