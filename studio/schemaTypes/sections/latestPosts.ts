import { defineField, defineType } from 'sanity'

import { eyebrowField, optionalHeadingField, sectionPreview, toneField } from '../fields'

export const latestPosts = defineType({
  name: 'latestPosts',
  title: 'Latest posts',
  type: 'object',
  description: 'Lists the newest blog posts automatically.',
  fields: [
    eyebrowField,
    optionalHeadingField,
    defineField({
      name: 'count',
      title: 'How many posts',
      type: 'number',
      initialValue: 3,
      validation: (rule) => rule.required().integer().min(1).max(6),
    }),
    defineField({ name: 'cta', title: 'Button', type: 'linkItem' }),
    toneField,
  ],
  preview: sectionPreview('Latest posts'),
})
