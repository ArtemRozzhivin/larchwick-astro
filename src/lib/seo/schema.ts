import type { PAGE_QUERY_RESULT } from '@lib/sanity/sanity.types'
import type { SiteSettings } from '@lib/sanity/settings'

// Relative, with extensions, so `node --test` can load this module (it doesn't resolve @lib).
import { siteConfig } from '../config/site.ts'
import { plainText } from '../sanity/text.ts'

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
  logo: string
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
    logo: new URL(siteConfig.logo, siteConfig.url).href,
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
  author: { '@type': 'Organization'; '@id': string; name: string; url: string }
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
    author: {
      '@type': 'Organization',
      '@id': organizationId,
      name: siteConfig.title,
      url: homeUrl,
    },
    publisher: { '@id': organizationId },
    inLanguage: siteConfig.lang,
  }
}

export interface BreadcrumbListSchema extends JsonLd {
  '@type': 'BreadcrumbList'
  itemListElement: { '@type': 'ListItem'; position: number; name: string; item: string }[]
}

/** `crumbs` from the home page down to the current page; paths become absolute URLs. */
export function breadcrumbListSchema(
  crumbs: readonly { name: string; path: string }[],
): BreadcrumbListSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map(({ name, path }, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name,
      item: new URL(path, siteConfig.url).href,
    })),
  }
}

type PageSection = NonNullable<NonNullable<PAGE_QUERY_RESULT>['sections']>[number]

export interface FaqQuestion {
  question: string
  answer: string
}

/** Every question in the page's FAQ sections, with its answer as plain text. */
export function faqQuestions(sections: readonly PageSection[]): FaqQuestion[] {
  return sections.flatMap((section) =>
    section._type === 'faq'
      ? (section.groups ?? []).flatMap((group) =>
          (group.items ?? []).flatMap((item) =>
            item.question ? [{ question: item.question, answer: plainText(item.answer) }] : [],
          ),
        )
      : [],
  )
}

export interface FaqPageSchema extends JsonLd {
  '@type': 'FAQPage'
  mainEntity: {
    '@type': 'Question'
    name: string
    acceptedAnswer: { '@type': 'Answer'; text: string }
  }[]
}

export function faqPageSchema(questions: readonly FaqQuestion[]): FaqPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  }
}
