import { defineField, defineType } from 'sanity'

import { ALT_DESCRIPTION } from './accessibleImage'

export const figure = defineType({
  name: 'figure',
  title: 'Image',
  type: 'image',
  options: { hotspot: true },
  fields: [
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      description: ALT_DESCRIPTION,
      validation: (rule) => [
        rule.required().error('Images in the content always need alt text.'),
        rule.max(150).warning('Keep alt text to about 125 characters.'),
      ],
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
      description: 'Optional visible caption under the image.',
    }),
  ],
  preview: { select: { title: 'alt', subtitle: 'caption', media: 'asset' } },
})
