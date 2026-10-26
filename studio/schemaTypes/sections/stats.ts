import { defineArrayMember, defineField, defineType } from 'sanity'

import { eyebrowField, lightToneField, optionalHeadingField, sectionPreview } from '../fields'

export const stats = defineType({
  name: 'stats',
  title: 'Numbers',
  type: 'object',
  fields: [
    eyebrowField,
    optionalHeadingField,
    defineField({
      name: 'items',
      title: 'Numbers',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'stat',
          title: 'Number',
          type: 'object',
          fields: [
            defineField({
              name: 'value',
              title: 'Value',
              type: 'string',
              description: 'e.g. "48 h" or "5–12 kg".',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
          ],
          preview: { select: { title: 'value', subtitle: 'label' } },
        }),
      ],
      validation: (rule) => rule.required().min(2).max(4),
    }),
    lightToneField,
  ],
  preview: sectionPreview('Numbers'),
})
