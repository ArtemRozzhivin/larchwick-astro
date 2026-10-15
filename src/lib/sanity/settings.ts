import { sanityFetch } from './client'
import { SETTINGS_QUERY } from './queries'
import type { SETTINGS_QUERY_RESULT } from './sanity.types'

export interface SiteSettings {
  siteName: string
  description: string
  navigation: { label: string; href: string }[]
  contact: { email?: string; wholesaleEmail?: string; phone?: string; hours: string[] }
  demoLabel: string
}

let settings: Promise<SiteSettings> | undefined

function normalise(result: SETTINGS_QUERY_RESULT): SiteSettings {
  if (!result?.siteName || !result.description || !result.demoLabel) {
    throw new Error('Site settings in Sanity need a site name, a description and the demo label')
  }
  return {
    siteName: result.siteName,
    description: result.description,
    navigation: (result.navigation ?? []).flatMap((item) =>
      item.label && item.href ? [{ label: item.label, href: item.href }] : [],
    ),
    contact: {
      email: result.contact?.email ?? undefined,
      wholesaleEmail: result.contact?.wholesaleEmail ?? undefined,
      phone: result.contact?.phone ?? undefined,
      hours: result.contact?.hours ?? [],
    },
    demoLabel: result.demoLabel,
  }
}

// The header, footer and every page read the same document, so it is fetched once per build.
export function getSiteSettings(): Promise<SiteSettings> {
  settings ??= sanityFetch<SETTINGS_QUERY_RESULT>(SETTINGS_QUERY).then(normalise)
  return settings
}

export interface ContactDetail {
  icon: 'mail' | 'phone'
  label: string
  value: string
  href: string
}

export function contactDetails(
  contact: SiteSettings['contact'],
  labels: { email: string; wholesaleEmail: string; phone: string },
): ContactDetail[] {
  const details: (ContactDetail | undefined)[] = [
    contact.email
      ? { icon: 'mail', label: labels.email, value: contact.email, href: `mailto:${contact.email}` }
      : undefined,
    contact.wholesaleEmail
      ? {
          icon: 'mail',
          label: labels.wholesaleEmail,
          value: contact.wholesaleEmail,
          href: `mailto:${contact.wholesaleEmail}`,
        }
      : undefined,
    contact.phone
      ? {
          icon: 'phone',
          label: labels.phone,
          value: contact.phone,
          href: `tel:${contact.phone.replace(/\s+/g, '')}`,
        }
      : undefined,
  ]
  return details.filter((detail) => detail !== undefined)
}
