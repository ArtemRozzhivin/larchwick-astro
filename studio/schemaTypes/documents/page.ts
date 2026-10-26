import { defineArrayMember, defineField, defineType } from 'sanity'

import { HOME_SLUG } from '../../homePage'
import { slugError } from '../fields'
import { SECTION_TYPES } from '../sections'

const RESERVED_SLUGS = new Set(['api'])

export const page = defineType({
  name: 'page',
  title: 'Page',
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
      description: 'The page name in the Studio and the default meta title.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      description: `The address: /<slug>/. The home page uses "${HOME_SLUG}" and lives at /. Changing a slug after publishing needs a redirect.`,
      options: { source: 'title', maxLength: 96 },
      validation: (rule) =>
        rule
          .required()
          .custom(slugError)
          .custom((slug) =>
            slug?.current && RESERVED_SLUGS.has(slug.current)
              ? `"${slug.current}" is reserved for the site itself.`
              : true,
          ),
    }),
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      group: 'content',
      description: 'The page, top to bottom. The first section should hold the page heading (H1).',
      of: SECTION_TYPES.map((type) => defineArrayMember({ type })),
    }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo', group: 'seo' }),
  ],
  preview: {
    select: { title: 'title', slug: 'slug.current' },
    prepare: ({ title, slug }) => ({
      title,
      subtitle: slug === HOME_SLUG ? '/' : slug ? `/${slug}/` : 'No slug',
    }),
  },
})
