export const siteConfig = {
  name: 'My App',
  description: 'A modern web application built with Astro.',
  url: 'https://your-site.com',
  ogImage: '/og.png',

  author: {
    name: 'Your Name',
    email: 'hello@your-site.com',
    twitter: '@yourhandle',
  },

  keywords: ['astro', 'landing page', 'marketing'],

  nav: [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Contact', href: '/contact' },
  ],

  social: {
    twitter: 'https://twitter.com/yourhandle',
    github: 'https://github.com/yourusername',
    linkedin: 'https://linkedin.com/in/yourprofile',
  },

  footer: {
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
    copyright: `© ${new Date().getFullYear()} My App. All rights reserved.`,
  },
} as const

export type SiteConfig = typeof siteConfig
