/** The slug of the page the site serves at `/`; `src/lib/routes.ts` takes it from here. */
export const HOME_SLUG = 'home'

// A structural type, not Sanity's SanityDocument: the site imports this module, and its
// type-check runs without the Studio's packages installed.
export function isHomePage(document: { _type?: string; slug?: unknown } | undefined): boolean {
  const slug = document?.slug as { current?: string } | undefined
  return document?._type === 'page' && slug?.current === HOME_SLUG
}
