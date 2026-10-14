import { defineField, defineType } from 'sanity'

export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  options: { collapsible: true, collapsed: false },
  fields: [
    defineField({
      name: 'metaTitle',
      title: 'Meta title',
      type: 'string',
      description:
        'The exact title shown in search results and browser tabs. Leave empty to use the page title.',
      validation: (rule) =>
        rule.max(60).warning('Search results cut titles at about 60 characters.'),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta description',
      type: 'text',
      rows: 3,
      description: 'The snippet under the title in search results.',
      validation: (rule) => [
        rule.min(70).warning('Aim for 70–160 characters.'),
        rule.max(160).warning('Search results cut descriptions at about 160 characters.'),
      ],
    }),
    defineField({
      name: 'ogImage',
      title: 'Social image',
      type: 'image',
      description: 'Shown when the page is shared (1200 × 630). Leave empty for the site default.',
    }),
    defineField({
      name: 'noindex',
      title: 'Hide from search engines',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'canonical',
      title: 'Canonical URL',
      type: 'url',
      description:
        "Only if this content was published elsewhere first. Leave empty: the canonical is built from the page's own address.",
      validation: (rule) => rule.uri({ scheme: ['https'] }),
    }),
  ],
})
