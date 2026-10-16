import { defineField, defineType } from 'sanity'

import { optionalHeadingField, sectionPreview, toneField } from '../fields'

export const cta = defineType({
  name: 'cta',
  title: 'Call to action',
  type: 'object',
  fields: [
    optionalHeadingField,
    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'text',
      rows: 3,
      description: 'Shown large in place of a heading. Only quote fictional people.',
    }),
    defineField({
      name: 'citation',
      title: 'Who said it',
      type: 'string',
      description: 'Name or source, without a leading dash.',
      hidden: ({ parent }) => !parent?.quote,
    }),
    defineField({ name: 'text', title: 'Text', type: 'text', rows: 2 }),
    defineField({
      name: 'primaryCta',
      title: 'Main button',
      type: 'linkItem',
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'secondaryCta', title: 'Second button', type: 'linkItem' }),
    toneField,
  ],
  preview: sectionPreview('Call to action'),
})
