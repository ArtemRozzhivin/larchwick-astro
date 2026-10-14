import { defineArrayMember, defineField, defineType } from 'sanity'

import { eyebrowField, headingField, sectionPreview, toneField } from '../fields'

export const hero = defineType({
  name: 'hero',
  title: 'Hero',
  type: 'object',
  fields: [
    defineField({
      name: 'variant',
      title: 'Style',
      type: 'string',
      description:
        'Cover: a full-width photo behind the text (home). Banner: a shorter title band (inner pages).',
      options: {
        list: [
          { title: 'Cover', value: 'cover' },
          { title: 'Banner', value: 'banner' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'banner',
    }),
    eyebrowField,
    defineField({ ...headingField, description: 'The page heading (H1).' }),
    defineField({ name: 'text', title: 'Text', type: 'text', rows: 3 }),
    defineField({
      name: 'image',
      title: 'Background image',
      type: 'accessibleImage',
      description: 'Behind the text, darkened for contrast. Usually marked decorative.',
    }),
    defineField({ name: 'primaryCta', title: 'Main button', type: 'linkItem' }),
    defineField({ name: 'secondaryCta', title: 'Second button', type: 'linkItem' }),
    defineField({
      name: 'trustList',
      title: 'Promises',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      description: 'Short ticked points under the buttons, e.g. "Roasted to order".',
      validation: (rule) => rule.max(4),
    }),
    toneField,
  ],
  preview: sectionPreview('Hero'),
})
