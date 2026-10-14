import { defineArrayMember, defineField, defineType } from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  fields: [
    defineField({
      name: 'siteName',
      title: 'Site name',
      type: 'string',
      description: 'Shown in the header, the footer and social previews.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Default meta description',
      type: 'text',
      rows: 3,
      description: 'Used by any page without its own meta description.',
      validation: (rule) => [
        rule.required(),
        rule.max(160).warning('Search results cut descriptions at about 160 characters.'),
      ],
    }),
    defineField({
      name: 'ogImage',
      title: 'Default social image',
      type: 'image',
      description: 'Shown when a page without its own social image is shared (1200 × 630).',
    }),
    defineField({
      name: 'navigation',
      title: 'Main menu',
      type: 'array',
      of: [defineArrayMember({ type: 'linkItem' })],
      validation: (rule) => rule.required().min(1).max(8),
    }),
    defineField({
      name: 'contact',
      title: 'Contact details',
      type: 'object',
      description: 'Shown in the footer and on the contact page. Use placeholder details only.',
      fields: [
        defineField({ name: 'email', title: 'Email', type: 'email' }),
        defineField({ name: 'wholesaleEmail', title: 'Wholesale email', type: 'email' }),
        defineField({ name: 'phone', title: 'Phone', type: 'string' }),
        defineField({
          name: 'hours',
          title: 'Opening hours',
          type: 'array',
          of: [defineArrayMember({ type: 'string' })],
          description: 'One line per entry, e.g. "Monday–Friday: 9:00–17:00".',
        }),
      ],
    }),
    defineField({
      name: 'demoLabel',
      title: 'Demo label',
      type: 'string',
      description: 'Shown in the footer on every page. Required: this is a fictional business.',
      initialValue: 'Demo project — fictional business',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: { prepare: () => ({ title: 'Site settings' }) },
})
