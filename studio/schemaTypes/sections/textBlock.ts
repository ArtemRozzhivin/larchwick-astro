import { defineField, defineType } from 'sanity'

import { eyebrowField, lightToneField, optionalHeadingField, sectionPreview } from '../fields'

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
    lightToneField,
  ],
  preview: sectionPreview('Text'),
})
