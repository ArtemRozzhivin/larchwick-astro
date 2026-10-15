import { siteConfig } from '@lib/config/site'
import type { SiteSettings } from '@lib/sanity/settings'

export interface JsonLd {
  '@context': 'https://schema.org'
  '@type': string
  [property: string]: unknown
}

export interface OrganizationSchema extends JsonLd {
  '@type': 'Organization'
  '@id': string
  name: string
  url: string
  description: string
  email?: string
  telephone?: string
}

export interface WebSiteSchema extends JsonLd {
  '@type': 'WebSite'
  '@id': string
  name: string
  alternateName: string
  url: string
  description: string
  inLanguage: string
  publisher: { '@id': string }
}

const homeUrl = new URL('/', siteConfig.url).href
const organizationId = `${homeUrl}#organization`
const websiteId = `${homeUrl}#website`

export function organizationSchema(settings: SiteSettings): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': organizationId,
    name: siteConfig.title,
    url: homeUrl,
    description: settings.description,
    ...(settings.contact.email && { email: settings.contact.email }),
    ...(settings.contact.phone && { telephone: settings.contact.phone }),
  }
}

export function websiteSchema(settings: SiteSettings): WebSiteSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': websiteId,
    name: siteConfig.name,
    alternateName: siteConfig.title,
    url: homeUrl,
    description: settings.description,
    inLanguage: siteConfig.lang,
    publisher: { '@id': organizationId },
  }
}

export interface BlogPostingSchema extends JsonLd {
  '@type': 'BlogPosting'
  headline: string
  description: string
  url: string
  datePublished: string
  dateModified: string
  image?: string
  author: { '@type': 'Organization'; name: string; url: string }
  publisher: { '@id': string }
  inLanguage: string
}

export function blogPostingSchema(post: {
  title: string
  description: string
  url: string
  publishedAt: string
  modifiedAt: string
  image?: string
  byline: string
}): BlogPostingSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    url: post.url,
    datePublished: post.publishedAt,
    dateModified: post.modifiedAt,
    ...(post.image && { image: post.image }),
    author: { '@type': 'Organization', name: post.byline, url: homeUrl },
    publisher: { '@id': organizationId },
    inLanguage: siteConfig.lang,
  }
}
