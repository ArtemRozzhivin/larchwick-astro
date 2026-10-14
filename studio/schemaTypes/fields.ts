import { defineField } from 'sanity'

const INTERNAL_PATH = /^\/(?:[a-z0-9-]+\/)*(?:#[a-z0-9-]+)?$/
const EXTERNAL_HREF = /^(?:https:\/\/\S+|mailto:\S+@\S+|tel:\+?[\d ]+)$/
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function hrefError(href: string | undefined): string | true {
  if (!href) return true
  if (INTERNAL_PATH.test(href) || EXTERNAL_HREF.test(href)) return true
  return 'Use a site path that starts and ends with "/" (e.g. /contact/), or a full https://, mailto: or tel: address.'
}

export function slugError(slug: { current?: string } | undefined): string | true {
  if (!slug?.current) return true
  return SLUG.test(slug.current) ? true : 'Lowercase letters, numbers and single hyphens only.'
}

export const eyebrowField = defineField({
  name: 'eyebrow',
  title: 'Eyebrow',
  type: 'string',
  description: 'Optional short label above the heading, e.g. "For businesses".',
})

export const headingField = defineField({
  name: 'heading',
  title: 'Heading',
  type: 'string',
  validation: (rule) => rule.required(),
})

export const optionalHeadingField = defineField({
  name: 'heading',
  title: 'Heading',
  type: 'string',
  description: 'Optional. Without it, the section has no heading.',
})

export const introField = defineField({
  name: 'intro',
  title: 'Intro',
  type: 'text',
  rows: 3,
  description: 'Optional sentence or two under the heading.',
})

export const toneField = defineField({
  name: 'tone',
  title: 'Background',
  type: 'string',
  options: {
    list: [
      { title: 'Light', value: 'default' },
      { title: 'Cream', value: 'muted' },
      { title: 'Dark', value: 'inverted' },
    ],
    layout: 'radio',
    direction: 'horizontal',
  },
  initialValue: 'default',
})

export function sectionPreview(label: string) {
  return {
    select: { heading: 'heading' },
    prepare: ({ heading }: { heading?: string }) => ({
      title: heading || label,
      subtitle: label,
    }),
  }
}
