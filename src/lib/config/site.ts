export const siteConfig = {
  name: 'Larchwick',
  title: 'Larchwick Coffee Roasters',
  // The free workers.dev address (PLAN.md D-3, D-18); a custom domain can replace it later.
  url: 'https://larchwick-astro.larchwick.workers.dev',
  lang: 'en-US',
  locale: 'en_US',
  // 1200×630 JPEG; every og:image on the site uses that size.
  ogImage: '/og.jpg',
  ogImageAlt: 'Close-up of dark roasted coffee beans with the Larchwick name',
  // Same value as --color-surface in global.css, so the browser bar matches the header.
  themeColor: '#fffcf7',

  footer: {
    headings: { nav: 'Explore', contact: 'Contact', hours: 'Opening hours' },
    labels: { email: 'Email', wholesaleEmail: 'Wholesale enquiries', phone: 'Phone' },
    copyright: `© ${new Date().getFullYear()} Larchwick`,
  },
} as const

export type SiteConfig = typeof siteConfig
