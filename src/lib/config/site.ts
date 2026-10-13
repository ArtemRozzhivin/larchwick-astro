export const siteConfig = {
  name: 'Larchwick',
  title: 'Larchwick Coffee Roasters',
  description:
    'Specialty coffee, roasted in small batches every Monday and Thursday and shipped across Europe within 48 hours, with the roast date on every bag.',
  // Placeholder on the reserved .example domain; Phase 2c sets the workers.dev address.
  url: 'https://larchwick.example',
  lang: 'en-US',
  locale: 'en_US',
  // 1200×630 JPEG; every og:image on the site uses that size.
  ogImage: '/og.jpg',
  ogImageAlt: 'Close-up of dark roasted coffee beans with the Larchwick name',
  // Same value as --color-surface in global.css, so the browser bar matches the header.
  themeColor: '#fffcf7',

  nav: [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about/' },
    { label: 'Services', href: '/services/' },
    { label: 'Products', href: '/products/' },
    { label: 'Blog', href: '/blog/' },
    { label: 'FAQ', href: '/faq/' },
    { label: 'Contact', href: '/contact/' },
  ],

  contact: {
    email: 'hello@larchwick.example',
    wholesaleEmail: 'wholesale@larchwick.example',
    phone: '+40 700 000 000',
    hours: ['Monday–Friday: 9:00–17:00', 'Saturday: 10:00–14:00 (pick-up only)', 'Sunday: closed'],
  },

  footer: {
    headings: { nav: 'Explore', contact: 'Contact', hours: 'Opening hours' },
    labels: { email: 'Email', wholesaleEmail: 'Wholesale enquiries', phone: 'Phone' },
    demoLabel: 'Demo project — fictional business',
    copyright: `© ${new Date().getFullYear()} Larchwick`,
  },
} as const

export type SiteConfig = typeof siteConfig
