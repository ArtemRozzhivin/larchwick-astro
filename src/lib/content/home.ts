/**
 * All copy for the home page lives here.
 *
 * Building a landing page = edit this file, then pick which sections to render in
 * `src/pages/index.astro`. No component needs to be touched for a copy change.
 */
export const home = {
  seo: {
    title: 'Larchwick Coffee Roasters | Fresh Small-Batch Coffee',
    description:
      'Fresh, small-batch coffee roasted twice a week. Single origins, blends, brewing guides, classes and EU shipping from Larchwick Coffee Roasters.',
  },

  hero: {
    eyebrow: 'Specialty coffee roastery · Est. 2019',
    heading: 'Fresh coffee, roasted in small batches',
    text: 'Single origins and blends, roasted every Monday and Thursday and shipped across Europe within 48 hours. Every bag shows its roast date, origin and process, so you always know exactly what’s in your cup.',
    primaryCta: { label: 'Shop our coffees', href: '/products/' },
    secondaryCta: { label: 'Our story', href: '/about/' },
    trustList: [
      'Roasted to order',
      'Free EU shipping over €40',
      'Pause or cancel subscriptions any time',
    ],
  },

  features: {
    items: [
      {
        icon: 'coffee',
        title: 'Roasted to order',
        text: 'We roast on Mondays and Thursdays, never weeks in advance.',
      },
      {
        icon: 'coffee',
        title: 'Fully traceable',
        text: 'Origin, process and altitude are printed on every bag.',
      },
      {
        icon: 'coffee',
        title: 'Brewing help',
        text: 'Simple guides for every method, from French press to espresso.',
      },
    ],
  },

  cta: {
    heading: 'Try a subscription',
    text: 'Fresh coffee every 2 or 4 weeks. Save 10%, pause any time.',
    primaryCta: { label: 'Ask about subscriptions', href: '/contact/' },
  },
} as const
