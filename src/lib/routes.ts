// With an extension, so `node --test` can load this module. The Studio owns the slug, so its
// schema can single out the home page.
import { HOME_SLUG } from '../../studio/homePage.ts'

export { HOME_SLUG }

/** The slug of the Sanity page that holds the contact form. */
export const CONTACT_SLUG = 'contact'

export const BLOG_PATH = '/blog/'

/** The pages the contact form's POST redirects to, at `/contact/<result>/`. */
export const CONTACT_RESULTS = ['thanks', 'error'] as const
export type ContactResult = (typeof CONTACT_RESULTS)[number]

export function pagePath(slug: string): string {
  return slug === HOME_SLUG ? '/' : `/${slug}/`
}

export function postPath(post: { slug: string | null }): string {
  return `${BLOG_PATH}${post.slug}/`
}

export function termPath(term: { _type: 'category' | 'tag'; slug: string | null }): string {
  return `${BLOG_PATH}${term._type}/${term.slug}/`
}

export function contactResultPath(result: ContactResult): string {
  return `/contact/${result}/`
}
