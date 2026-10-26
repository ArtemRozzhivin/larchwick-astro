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
        'Cover: the tall home-page band with the biggest heading. Banner: a shorter title band (inner pages).',
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
      title: 'Image',
      type: 'accessibleImage',
      description: 'Shown beside the heading. Hidden when a coffee label is filled in.',
    }),
    defineField({
      name: 'label',
      title: 'Coffee label',
      type: 'object',
      description: 'A coffee bag label shown beside the heading instead of the image.',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'name', title: 'Coffee name', type: 'string' }),
        defineField({
          name: 'origin',
          title: 'Origin line',
          type: 'string',
          description: 'e.g. "Gedeo zone, southern Ethiopia".',
        }),
        defineField({
          name: 'details',
          title: 'Details',
          type: 'array',
          description: 'Label and value rows, e.g. Process: Washed.',
          of: [
            defineArrayMember({
              name: 'detail',
              title: 'Detail',
              type: 'object',
              fields: [
                defineField({ name: 'label', title: 'Label', type: 'string' }),
                defineField({ name: 'value', title: 'Value', type: 'string' }),
              ],
              preview: { select: { title: 'label', subtitle: 'value' } },
            }),
          ],
          validation: (rule) => rule.max(6),
        }),
        defineField({
          name: 'footnote',
          title: 'Bottom line',
          type: 'string',
          description: 'e.g. "250 g whole beans".',
        }),
        defineField({
          name: 'stamp',
          title: 'Stamp',
          type: 'text',
          rows: 2,
          description:
            'The round stamp on the label. First line small, second line big, e.g. "Roasted to order" then "Mon & Thu".',
          validation: (rule) => rule.max(40),
        }),
      ],
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
    // The hero is always the larch band. Hidden, not removed, so stored values raise no warning.
    defineField({ ...toneField, hidden: true }),
  ],
  preview: sectionPreview('Hero'),
})
