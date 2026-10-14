import { defineField, defineType } from 'sanity'

import { headingField, sectionPreview, toneField } from '../fields'

export const cta = defineType({
  name: 'cta',
  title: 'Call to action',
  type: 'object',
  fields: [
    headingField,
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
