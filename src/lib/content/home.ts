/**
 * All copy for the home page lives here.
 *
 * Building a landing page = edit this file, then pick which sections to render in
 * `src/pages/index.astro`. No component needs to be touched for a copy change.
 */
export const home = {
  hero: {
    eyebrow: 'New — v1.0 is out',
    title: 'Ship your landing page today',
    subtitle:
      'A pre-wired Astro starter: section blocks, SEO, and quality gates already in place, so you only write copy and swap the design tokens.',
    primaryCta: { label: 'Get started', href: '#features' },
    secondaryCta: { label: 'See the blocks', href: '#faq' },
    note: 'No credit card required.',
  },

  logos: {
    title: 'Trusted by teams at',
    items: ['Acme', 'Globex', 'Umbrella', 'Initech', 'Hooli'],
  },

  features: {
    eyebrow: 'Why this template',
    title: 'Everything a landing page needs, already wired',
    subtitle: 'Zero client-side JavaScript by default. Add an island only where you need one.',
    items: [
      {
        icon: 'zap',
        title: 'Static by default',
        description:
          'Every section is a plain Astro component, so the shipped page is HTML and CSS with no runtime cost.',
      },
      {
        icon: 'search',
        title: 'SEO out of the box',
        description:
          'Canonical URLs, OpenGraph, Twitter cards, JSON-LD, a sitemap, and robots.txt are all generated from one config file.',
      },
      {
        icon: 'layout',
        title: 'Composable sections',
        description:
          'Hero, logos, features, testimonials, FAQ, and CTA blocks that take their copy as props.',
      },
      {
        icon: 'palette',
        title: 'Design tokens',
        description:
          'Colours, shadows, and spacing come from CSS tokens, so rebranding is one file rather than a find-and-replace.',
      },
      {
        icon: 'shield',
        title: 'Quality gates',
        description:
          'Type checking, linting, formatting, and a build all run before a commit lands and again in CI.',
      },
      {
        icon: 'rocket',
        title: 'Deploy anywhere',
        description:
          'Static output works on Vercel, Netlify, S3, or any static host. Docker files are included.',
      },
    ],
  },

  testimonials: {
    eyebrow: 'Testimonials',
    title: 'What people say',
    items: [
      {
        quote:
          'We had the marketing page live the same afternoon. The section blocks meant nobody had to argue about spacing.',
        author: 'Alex Morgan',
        role: 'Head of Growth, Acme',
      },
      {
        quote:
          'Lighthouse came back at 100 without us touching anything. That has never happened before.',
        author: 'Sam Okafor',
        role: 'Frontend Lead, Globex',
      },
      {
        quote: 'Swapping the palette took one file. The whole rebrand was done before lunch.',
        author: 'Priya Nair',
        role: 'Designer, Initech',
      },
    ],
  },

  faq: {
    eyebrow: 'FAQ',
    title: 'Common questions',
    items: [
      {
        question: 'How do I change the copy?',
        answer:
          'Edit src/lib/content/home.ts. Every section reads its text from there, so no component needs to change.',
      },
      {
        question: 'How do I add a new section?',
        answer:
          'Create an .astro file in src/components/sections/, give it a typed Props interface, and render it from the page. Copy an existing section as the starting point.',
      },
      {
        question: 'Does this ship JavaScript?',
        answer:
          'Not by default. Every section is static HTML. Add a React island with a client: directive only where a component genuinely needs interactivity.',
      },
      {
        question: 'How do I rebrand it?',
        answer:
          'Change the colour tokens in src/styles/global.css and the name, URL, and social links in src/lib/config/site.ts.',
      },
    ],
  },

  cta: {
    title: 'Ready to build?',
    subtitle: 'Clone the template, edit one content file, and deploy.',
    primaryCta: { label: 'Get started', href: '#hero' },
  },
} as const
