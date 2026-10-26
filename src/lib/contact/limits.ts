/**
 * The contact form's field lengths: the inputs' `maxlength` (ContactForm.astro) and the Worker's
 * check (worker/contact.ts). Pure, with no imports, so the site's build and the Worker can share it.
 * Resend caps each template variable at 2,000 characters and escaped HTML can grow, so the
 * message stays well below that.
 */
export const LIMITS = { name: 100, email: 254, subject: 150, message: 1500 } as const
