import { defineField, defineType } from 'sanity'

import { slugError } from '../fields'

function taxonomyFields(path: string) {
  return [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: `The address: /blog/${path}/<slug>/.`,
      options: { source: 'title', maxLength: 64 },
      validation: (rule) => rule.required().custom(slugError),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
      description: 'Optional intro on the archive page, also its meta description.',
    }),
  ]
}

export const category = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: taxonomyFields('category'),
  preview: { select: { title: 'title', subtitle: 'slug.current' } },
})

export const tag = defineType({
  name: 'tag',
  title: 'Tag',
  type: 'document',
  fields: taxonomyFields('tag'),
  preview: { select: { title: 'title', subtitle: 'slug.current' } },
})
