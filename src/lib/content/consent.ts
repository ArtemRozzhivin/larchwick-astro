/**
 * Copy for the analytics consent banner (PLAN.md Phase 7c), rendered by
 * `src/components/consent/ConsentBanner.astro`.
 */
export const consent = {
  title: 'Can we measure your visit?',
  text: 'With your permission we use Google Analytics, which sets cookies, to see which pages help visitors. Nothing is sent to Google unless you accept.',
  privacy: { label: 'Read our privacy policy', href: '/privacy/' },
  accept: 'Accept',
  decline: 'Decline',
} as const
