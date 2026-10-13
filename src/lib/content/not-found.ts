/**
 * All copy for the 404 page. Rendered by `src/pages/404.astro`.
 */
export const notFound = {
  seo: {
    title: 'Page not found | Larchwick',
    description: 'The page you were looking for doesn’t exist or has moved.',
  },

  code: '404',
  title: 'Page not found',
  message:
    'The page you were looking for doesn’t exist or has moved. Start again from the home page, read the blog, or get in touch.',
  primaryCta: { label: 'Go to the home page', href: '/' },
  secondaryCtas: [
    { label: 'Read the blog', href: '/blog/' },
    { label: 'Contact us', href: '/contact/' },
  ],
} as const
