import { defineArrayMember, defineField, defineType } from 'sanity'

import {
  eyebrowField,
  introField,
  lightToneField,
  optionalHeadingField,
  sectionPreview,
} from '../fields'

const ICONS = ['coffee', 'sprout', 'flame', 'truck', 'check', 'mail', 'phone', 'clock']

export const featureGrid = defineType({
  name: 'featureGrid',
  title: 'Features',
  type: 'object',
  fields: [
    eyebrowField,
    optionalHeadingField,
    introField,
    defineField({
      name: 'items',
      title: 'Features',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'feature',
          title: 'Feature',
          type: 'object',
          fields: [
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'string',
              options: { list: ICONS },
            }),
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
  preview: sectionPreview('Features'),
})
