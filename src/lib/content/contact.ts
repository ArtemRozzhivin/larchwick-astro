import { siteConfig } from '@lib/config/site'
import { BLOG_PATH, CONTACT_SLUG, type ContactResult, HOME_SLUG, pagePath } from '@lib/routes'

/**
 * Copy for the contact form's fields (ContactForm.astro; its heading and intro come from the
 * Sanity section) and for the pages the form redirects to.
 */
export const contactForm = {
  name: 'Your name',
  email: 'Your email',
  subject: 'Subject',
  message: (max: string): string => `Your message (optional, up to ${max} characters)`,
  honeypot: 'Leave this field empty',
  submit: 'Send message',
} as const

export const contactResult = {
  thanks: {
    seo: { title: `Message sent | ${siteConfig.name}`, description: 'Thanks for your message.' },
    heading: 'Thanks, your message is on its way',
    message:
      'We reply within two working days. In the meantime, have a look at our brewing guides.',
    primaryCta: { label: 'Read the blog', href: BLOG_PATH },
    secondaryCta: { label: 'Back to the home page', href: pagePath(HOME_SLUG) },
  },
  error: {
    seo: {
      title: `Message not sent | ${siteConfig.name}`,
      description: 'Your message could not be sent.',
    },
    heading: 'Your message wasn’t sent',
    message:
      'Something went wrong, or a required field was missing. Please go back and try again, or email us directly.',
    primaryCta: { label: 'Back to the contact form', href: pagePath(CONTACT_SLUG) },
    secondaryCta: { label: 'Back to the home page', href: pagePath(HOME_SLUG) },
  },
} as const satisfies Record<ContactResult, object>
