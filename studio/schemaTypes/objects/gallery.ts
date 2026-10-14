import { defineArrayMember, defineField, defineType } from 'sanity'

export const gallery = defineType({
  name: 'gallery',
  title: 'Gallery',
  type: 'object',
  fields: [
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [defineArrayMember({ type: 'figure' })],
      options: { layout: 'grid' },
      validation: (rule) => rule.required().min(2),
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
      description: 'Optional caption for the whole gallery.',
    }),
  ],
  preview: {
    select: { images: 'images', caption: 'caption', media: 'images.0.asset' },
    prepare: ({ images, caption, media }) => ({
      title: caption || 'Gallery',
      subtitle: `${Array.isArray(images) ? images.length : 0} images`,
      media,
    }),
  },
})
