import { defineField, defineType } from 'sanity'

import { eyebrowField, headingField, sectionPreview, toneField } from '../fields'

export const imageText = defineType({
  name: 'imageText',
  title: 'Image and text',
  type: 'object',
  fields: [
    eyebrowField,
    headingField,
    defineField({ name: 'body', title: 'Text', type: 'blockContent' }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'accessibleImage',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'imagePosition',
      title: 'Image side',
      type: 'string',
      options: {
        list: [
          { title: 'Left', value: 'left' },
          { title: 'Right', value: 'right' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'left',
    }),
    defineField({ name: 'cta', title: 'Button', type: 'linkItem' }),
    toneField,
  ],
  preview: sectionPreview('Image and text'),
})
