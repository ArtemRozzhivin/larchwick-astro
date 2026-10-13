import { siteConfig } from '@lib/config/site'

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
  email: string
  telephone: string
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

export function organizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': organizationId,
    name: siteConfig.title,
    url: homeUrl,
    description: siteConfig.description,
    email: siteConfig.contact.email,
    telephone: siteConfig.contact.phone,
  }
}

export function websiteSchema(): WebSiteSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': websiteId,
    name: siteConfig.name,
    alternateName: siteConfig.title,
    url: homeUrl,
    description: siteConfig.description,
    inLanguage: siteConfig.lang,
    publisher: { '@id': organizationId },
  }
}
