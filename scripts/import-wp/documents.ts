import { metaValue, type Wxr, type WxrItem } from '../shared/wxr.ts'
import { parseBlocks } from './blocks.ts'
import { createKeyer, hash } from './keys.ts'
import { type LinkRules, rewriteHref } from './links.ts'
import { toPortableText } from './portableText.ts'
import { toSections } from './sections.ts'
import { valueAt } from './sync.ts'
import type {
  AccessibleImage,
  ContactDetails,
  ConvertContext,
  LinkChange,
  MediaAsset,
} from './types.ts'

export const GROUPS = ['taxonomy', 'posts', 'pages', 'settings', 'redirects'] as const
export type Group = (typeof GROUPS)[number]

export type SanityDoc = { _id: string; _type: string } & Record<string, unknown>

export interface DesiredDoc {
  group: Group
  doc: SanityDoc
  owned: readonly string[]
}

export interface Warning {
  where: string
  message: string
}

export interface RedirectRow {
  from: string
  to: string
  status: 301
  reason: string
}

export interface Skipped {
  where: string
  reason: string
}

export interface BuildOptions {
  origin: string
  media: (_wpId: number) => MediaAsset | undefined
  limit?: number
}

export interface Built {
  docs: DesiredDoc[]
  warnings: Warning[]
  links: LinkChange[]
  redirects: RedirectRow[]
  skipped: Skipped[]
}

const DEMO_LABEL = 'Demo project — fictional business'
const SEO_PATHS = ['seo.metaTitle', 'seo.metaDescription', 'seo.ogImage']
const OWNED: Readonly<Record<string, readonly string[]>> = {
  category: ['title', 'slug', 'description'],
  tag: ['title', 'slug', 'description'],
  post: [
    'title',
    'slug',
    'publishedAt',
    'excerpt',
    'mainImage.asset',
    'mainImage.alt',
    'categories',
    'tags',
    'body',
    ...SEO_PATHS,
  ],
  page: ['title', 'slug', 'sections', ...SEO_PATHS],
  shellPage: ['title', 'slug', ...SEO_PATHS],
  siteSettings: ['siteName', 'description', 'navigation', 'contact', 'demoLabel'],
  redirect: ['from', 'to', 'permanent'],
}

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === '') return true
  if (Array.isArray(value)) return value.length === 0
  if (value && typeof value === 'object') {
    return Object.entries(value).every(([key, field]) => key === '_type' || isEmpty(field))
  }
  return false
}

function defined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, field]) => !isEmpty(field))) as T
}

function desired(group: Group, kind: string, doc: SanityDoc): DesiredDoc {
  return {
    group,
    doc,
    owned: OWNED[kind].filter((path) => !isEmpty(valueAt(doc, path))),
  }
}

function hasBlocks(item: WxrItem): boolean {
  return item.content.includes('<!-- wp:')
}

function isElementor(item: WxrItem): boolean {
  return !hasBlocks(item) && item.meta.has('_elementor_data')
}

function pagePath(page: WxrItem | undefined): string {
  if (!page || page.slug === 'home') return '/'
  return `/${page.slug}/`
}

export function buildDocuments(wxr: Wxr, options: BuildOptions): Built {
  const warnings: Warning[] = []
  const links: LinkChange[] = []
  const skipped: Skipped[] = []
  const published = (type: string) =>
    wxr.items.filter((item) => item.type === type && item.status === 'publish')
  const posts = published('post').slice(0, options.limit)
  const pages = published('page').slice(0, options.limit)
  const allPosts = published('post')
  const allPages = published('page')
  const rules: LinkRules = {
    origin: options.origin,
    postSlugs: new Set(allPosts.map((post) => post.slug)),
  }
  const contact: ContactDetails = {}

  const contextFor = (id: string, where: string): ConvertContext => ({
    where,
    key: createKeyer(id),
    media: options.media,
    href: (href) => rewriteHref(href, rules, (change) => links.push({ ...change, where })),
    warn: (message) => warnings.push({ where, message }),
    skip: (reason) => skipped.push({ where, reason }),
    contact,
  })

  const image = (wpId: number, context: ConvertContext): AccessibleImage | undefined => {
    const media = options.media(wpId)
    if (!media) return undefined
    if (!media.alt) context.warn(`media ${wpId} has no alt text in alt-text.json`)
    return {
      _type: 'accessibleImage',
      asset: { _type: 'reference', _ref: media.assetId },
      alt: media.alt ?? '',
    }
  }

  const seo = (item: WxrItem, context: ConvertContext) => {
    const metaTitle = metaValue(item, '_yoast_wpseo_title')
    const metaDescription = metaValue(item, '_yoast_wpseo_metadesc')
    if (/%%/.test(metaTitle + metaDescription))
      context.warn('Yoast value still holds a %%variable%%')
    const featured = Number(metaValue(item, '_thumbnail_id'))
    const media = featured ? options.media(featured) : undefined
    return defined({
      _type: 'seo',
      metaTitle,
      metaDescription,
      ogImage: media && { _type: 'image', asset: { _type: 'reference', _ref: media.assetId } },
    })
  }

  const termDocs = (type: 'category' | 'tag') =>
    (type === 'category' ? wxr.categories : wxr.tags).map((term) =>
      desired(
        'taxonomy',
        type,
        defined({
          _id: `wp-${type}-${term.id}`,
          _type: type,
          title: term.name,
          slug: { _type: 'slug', current: term.slug },
          description: term.description,
        }),
      ),
    )
  const termId = (domain: string, slug: string) =>
    (domain === 'category' ? wxr.categories : wxr.tags).find((term) => term.slug === slug)?.id

  const postDocs = posts.map((post) => {
    const id = `wp-post-${post.id}`
    const context = contextFor(id, `post "${post.title}"`)
    const references = (domain: 'category' | 'post_tag', type: 'category' | 'tag') =>
      post.terms
        .filter((term) => term.domain === domain)
        .map((term) => ({
          _type: 'reference',
          _key: context.key(),
          _ref: `wp-${type}-${termId(domain === 'post_tag' ? 'tag' : 'category', term.slug)}`,
        }))
    if (!post.excerpt) context.warn('no excerpt')
    const featured = Number(metaValue(post, '_thumbnail_id'))
    if (!featured) context.warn('no featured image')
    return desired(
      'posts',
      'post',
      defined({
        _id: id,
        _type: 'post',
        title: post.title,
        slug: { _type: 'slug', current: post.slug },
        publishedAt: post.date,
        excerpt: post.excerpt,
        mainImage: featured ? image(featured, context) : undefined,
        categories: references('category', 'category'),
        tags: references('post_tag', 'tag'),
        body: toPortableText(parseBlocks(post.content), context),
        seo: seo(post, context),
      }),
    )
  })

  const pageDocs = pages.map((page) => {
    const id = `wp-page-${page.id}`
    const context = contextFor(id, `page "${page.title}"`)
    const shell = !hasBlocks(page)
    if (isElementor(page)) {
      skipped.push({
        where: `page "${page.title}"`,
        reason:
          'built with Elementor (JSON widgets, not blocks); its sections are rebuilt by hand in Phase 5c. Title, slug and SEO are still imported.',
      })
    }
    return desired(
      'pages',
      shell ? 'shellPage' : 'page',
      defined({
        _id: id,
        _type: 'page',
        title: page.title,
        slug: { _type: 'slug', current: page.slug },
        sections: shell ? undefined : toSections(parseBlocks(page.content), context),
        seo: seo(page, context),
      }),
    )
  })

  const navigation = wxr.items
    .filter((item) => item.type === 'nav_menu_item')
    .sort((a, b) => a.menuOrder - b.menuOrder)
    .map((item, index) => {
      const target = allPages.find(
        (page) => String(page.id) === metaValue(item, '_menu_item_object_id'),
      )
      return {
        _type: 'linkItem',
        _key: hash(`siteSettings:navigation:${index}`),
        label: item.title || target?.title || '',
        href: pagePath(target),
      }
    })
  const home = allPages.find((page) => page.slug === 'home')
  const settings = desired(
    'settings',
    'siteSettings',
    defined({
      _id: 'siteSettings',
      _type: 'siteSettings',
      siteName: wxr.siteTitle,
      description: home ? metaValue(home, '_yoast_wpseo_metadesc') : undefined,
      navigation,
      contact: defined({ ...contact }),
      demoLabel: DEMO_LABEL,
    }),
  )

  const redirects = buildRedirects(wxr, allPosts, allPages, options.origin)
  const redirectDocs = redirects.map((row) =>
    desired('redirects', 'redirect', {
      _id: `wp-redirect-${hash(row.from)}`,
      _type: 'redirect',
      from: row.from,
      to: row.to,
      permanent: true,
    }),
  )

  const ignored = wxr.items.filter(
    (item) => ['post', 'page'].includes(item.type) && item.status !== 'publish',
  )
  for (const item of ignored) {
    skipped.push({ where: `${item.type} "${item.title}"`, reason: `status "${item.status}"` })
  }

  return {
    docs: [
      ...termDocs('category'),
      ...termDocs('tag'),
      ...postDocs,
      ...pageDocs,
      settings,
      ...redirectDocs,
    ],
    warnings,
    links,
    redirects,
    skipped,
  }
}

export function buildRedirects(
  wxr: Wxr,
  posts: readonly WxrItem[],
  pages: readonly WxrItem[],
  origin: string,
): RedirectRow[] {
  const rows = new Map<string, RedirectRow>()
  const add = (from: string, to: string, reason: string) => {
    if (from !== to && from.endsWith('/') && from !== '/' && !rows.has(from)) {
      rows.set(from, { from, to, status: 301, reason })
    }
  }
  const postPath = (post: WxrItem) => `/blog/${post.slug}/`
  const pathOf = (link: string) => (link.startsWith(origin) ? link.slice(origin.length) : link)

  if (pages.some((page) => page.slug === 'home')) add('/home/', '/', 'old home page slug')
  for (const post of posts) {
    add(`/${post.slug}/`, postPath(post), 'post moved under /blog/')
    for (const old of post.meta.get('_wp_old_slug') ?? []) {
      add(`/${old}/`, postPath(post), 'old post slug')
    }
  }
  for (const page of pages) {
    for (const old of page.meta.get('_wp_old_slug') ?? [])
      add(`/${old}/`, pagePath(page), 'old page slug')
  }
  for (const attachment of wxr.items.filter((item) => item.type === 'attachment')) {
    const parentPost = posts.find((post) => post.id === attachment.parentId)
    const parentPage = pages.find((page) => page.id === attachment.parentId)
    const to = parentPost ? postPath(parentPost) : parentPage ? pagePath(parentPage) : '/'
    const reason =
      parentPost || parentPage
        ? 'attachment page → its parent'
        : 'attachment page without a parent → home'
    add(pathOf(attachment.link), to, reason)
  }
  return [...rows.values()].sort((a, b) => a.from.localeCompare(b.from))
}
