import { defineField, defineType } from 'sanity'

export const quote = defineType({
  name: 'quote',
  title: 'Quote',
  type: 'object',
  fields: [
    defineField({
      name: 'text',
      title: 'Quote',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'citation',
      title: 'Who said it',
      type: 'string',
      description: 'Name or source, without a leading dash. Only quote fictional people.',
    }),
  ],
  preview: {
    select: { title: 'text', citation: 'citation' },
    prepare: ({ title, citation }) => ({
      title,
      subtitle: citation ? `Quote · ${citation}` : 'Quote',
    }),
  },
})
