import { siteConfig } from '@lib/config/site'
import { BLOG_PATH, CONTACT_SLUG, HOME_SLUG, pagePath } from '@lib/routes'

/**
 * All copy for the 404 page. Rendered by `src/pages/404.astro`.
 */
export const notFound = {
  seo: {
    title: `Page not found | ${siteConfig.name}`,
    description: 'The page you were looking for doesn’t exist or has moved.',
  },

  code: '404',
  title: 'Page not found',
  message:
    'The page you were looking for doesn’t exist or has moved. Start again from the home page, read the blog, or get in touch.',
  primaryCta: { label: 'Go to the home page', href: pagePath(HOME_SLUG) },
  secondaryCtas: [
    { label: 'Read the blog', href: BLOG_PATH },
    { label: 'Contact us', href: pagePath(CONTACT_SLUG) },
  ],
} as const
