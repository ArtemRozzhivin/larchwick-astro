import { defineField, defineType } from 'sanity'

import { eyebrowField, optionalHeadingField, sectionPreview, toneField } from '../fields'

export const textBlock = defineType({
  name: 'textBlock',
  title: 'Text',
  type: 'object',
  fields: [
    eyebrowField,
    optionalHeadingField,
    defineField({
      name: 'body',
      title: 'Text',
      type: 'blockContent',
      validation: (rule) => rule.required(),
    }),
    toneField,
  ],
  preview: sectionPreview('Text'),
})
