import { defineArrayMember, defineField, defineType } from 'sanity'

import {
  eyebrowField,
  introField,
  lightToneField,
  optionalHeadingField,
  sectionPreview,
} from '../fields'

export const steps = defineType({
  name: 'steps',
  title: 'Steps',
  type: 'object',
  fields: [
    eyebrowField,
    optionalHeadingField,
    introField,
    defineField({
      name: 'items',
      title: 'Steps',
      type: 'array',
      description: 'Shown numbered, in this order.',
      of: [
        defineArrayMember({
          name: 'step',
          title: 'Step',
          type: 'object',
          fields: [
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({ name: 'text', title: 'Text', type: 'text', rows: 2 }),
          ],
          preview: { select: { title: 'title', subtitle: 'text' } },
        }),
      ],
      validation: (rule) => rule.required().min(2),
    }),
    lightToneField,
  ],
  preview: sectionPreview('Steps'),
})
