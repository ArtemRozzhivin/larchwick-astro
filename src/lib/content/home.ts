/**
 * All copy for the home page lives here.
 *
 * Building a landing page = edit this file, then pick which sections to render in
 * `src/pages/index.astro`. No component needs to be touched for a copy change.
 */
export const home = {
  hero: {
    eyebrow: 'Specialty coffee roastery · Est. 2019',
    title: 'Fresh coffee, roasted in small batches',
    subtitle:
      'Single origins and blends, roasted every Monday and Thursday and shipped across Europe within 48 hours. Every bag shows its roast date, origin and process, so you always know exactly what’s in your cup.',
    primaryCta: { label: 'Shop our coffees', href: '/products/' },
    secondaryCta: { label: 'Our story', href: '/about/' },
  },

  features: {
    items: [
      {
        icon: 'coffee',
        title: 'Roasted to order',
        description: 'We roast on Mondays and Thursdays, never weeks in advance.',
      },
      {
        icon: 'coffee',
        title: 'Fully traceable',
        description: 'Origin, process and altitude are printed on every bag.',
      },
      {
        icon: 'coffee',
        title: 'Brewing help',
        description: 'Simple guides for every method, from French press to espresso.',
      },
    ],
  },

  cta: {
    title: 'Try a subscription',
    subtitle: 'Fresh coffee every 2 or 4 weeks. Save 10%, pause any time.',
    primaryCta: { label: 'Ask about subscriptions', href: '/contact/' },
  },
} as const
