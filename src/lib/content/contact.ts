/**
 * Copy for the pages the contact form redirects to. The form itself is a Sanity section.
 */
export const contactResult = {
  thanks: {
    seo: { title: 'Message sent | Larchwick', description: 'Thanks for your message.' },
    heading: 'Thanks, your message is on its way',
    message:
      'We reply within two working days. In the meantime, have a look at our brewing guides.',
    primaryCta: { label: 'Read the blog', href: '/blog/' },
    secondaryCta: { label: 'Back to the home page', href: '/' },
  },
  error: {
    seo: { title: 'Message not sent | Larchwick', description: 'Your message could not be sent.' },
    heading: 'Your message wasn’t sent',
    message:
      'Something went wrong, or a required field was missing. Please go back and try again, or email us directly.',
    primaryCta: { label: 'Back to the contact form', href: '/contact/' },
    secondaryCta: { label: 'Back to the home page', href: '/' },
  },
} as const
