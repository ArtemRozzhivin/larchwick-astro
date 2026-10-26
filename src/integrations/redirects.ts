import type { AstroIntegration } from 'astro'
import { readFile, writeFile } from 'node:fs/promises'

import { sanityFetch } from '../lib/sanity/client'
import { getPosts } from '../lib/sanity/posts'
import { REDIRECTS_QUERY } from '../lib/sanity/queries'
import type { REDIRECTS_QUERY_RESULT } from '../lib/sanity/sanity.types'
import { filterSitemap, type SitemapExclusion } from '../lib/seo/sitemap'
import {
  codeRules,
  type RedirectDoc,
  sanityRules,
  slashlessRules,
  toRedirectsFile,
  validateRules,
} from './redirect-rules'

async function filterSitemapFile(dir: URL, site: URL): Promise<Record<SitemapExclusion, number>> {
  const file = new URL('sitemap-0.xml', dir)
  const xml = await readFile(file, 'utf8')
  const filtered = await filterSitemap(xml, (loc) =>
    readFile(new URL(`.${new URL(loc, site).pathname}index.html`, dir), 'utf8').catch(() => ''),
  )
  if (filtered.xml !== xml) await writeFile(file, filtered.xml)
  return filtered.dropped
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
        const { noindex, canonicalElsewhere } = await filterSitemapFile(dir, site)
        logger.info(
          `removed ${noindex} noindex pages and ${canonicalElsewhere} pages canonical elsewhere from the sitemap`,
        )
      },
    },
  }
}
