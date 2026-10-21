export const siteConfig = {
  name: 'Larchwick',
  title: 'Larchwick Coffee Roasters',
  // The free workers.dev address (PLAN.md D-3, D-18); a custom domain can replace it later.
  url: 'https://larchwick-astro.larchwick.workers.dev',
  lang: 'en-US',
  locale: 'en_US',
  // 1200×630 JPEG; every og:image on the site uses that size.
  ogImage: '/og.jpg',
  ogImageAlt:
    'Larchwick: fresh coffee, roasted in small batches, beside a coffee label for Ethiopia Yirgacheffe',
  // Same value as --color-paper in global.css, so the browser bar matches the sticky header.
  themeColor: '#f2f3ef',

  // Google Analytics 4 (PLAN.md Phase 7c): public, built into production pages only.
  analytics: { measurementId: 'G-C7SVR1FYHZ' },

  header: {
    labels: { openMenu: 'Open menu', closeMenu: 'Close menu' },
  },

  footer: {
    headings: { nav: 'Explore', contact: 'Contact', hours: 'Opening hours' },
    labels: { email: 'Email', wholesaleEmail: 'Wholesale enquiries', phone: 'Phone' },
    copyright: `© ${new Date().getFullYear()} Larchwick`,
    legal: {
      privacy: { label: 'Privacy', href: '/privacy/' },
      cookieSettings: 'Cookie settings',
    },
  },
} as const

export type SiteConfig = typeof siteConfig
