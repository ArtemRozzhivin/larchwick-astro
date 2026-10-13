export const siteConfig = {
  name: 'Larchwick',
  description:
    'Specialty coffee, roasted in small batches every Monday and Thursday and shipped across Europe within 48 hours, with the roast date on every bag.',
  // Placeholder on the reserved .example domain; Phase 2c sets the workers.dev address.
  url: 'https://larchwick.example',
  ogImage: '/og.png',

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
    demoLabel: 'Demo project — fictional business',
    copyright: `© ${new Date().getFullYear()} Larchwick`,
  },
} as const

export type SiteConfig = typeof siteConfig
