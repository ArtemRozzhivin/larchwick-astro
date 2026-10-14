import { defineArrayMember, defineField, defineType } from 'sanity'

import { slugError } from '../fields'

const DATE_FORMAT = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' })

export const post = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      description: 'The heading on the post page (H1) and on blog cards.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      description:
        'The address: /blog/<slug>/. Changing it after publishing breaks old links, so add a redirect.',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required().custom(slugError),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published',
      type: 'datetime',
      group: 'content',
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      group: 'content',
      description:
        'One or two sentences for blog cards, also used as the meta description when SEO is empty.',
      validation: (rule) => [
        rule.required(),
        rule.max(200).warning('Keep the excerpt under 200 characters.'),
      ],
    }),
    defineField({
      name: 'mainImage',
      title: 'Main image',
      type: 'accessibleImage',
      group: 'content',
      description: 'Shown at the top of the post and on blog cards.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'category' }] })],
      validation: (rule) => rule.required().min(1).unique(),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'tag' }] })],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'blockContent',
      group: 'content',
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo', group: 'seo' }),
  ],
  orderings: [
    {
      title: 'Newest first',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: { title: 'title', media: 'mainImage', publishedAt: 'publishedAt' },
    prepare: ({ title, media, publishedAt }) => ({
      title,
      media,
      subtitle: publishedAt ? DATE_FORMAT.format(new Date(publishedAt)) : 'No date',
    }),
  },
})
