import { defineField, defineType } from 'sanity'

export const disclaimer = defineType({
  name: 'disclaimer',
  title: 'Disclaimer',
  type: 'object',
  fields: [
    defineField({
      name: 'text',
      title: 'Text',
      type: 'string',
      description: 'A short italic note, e.g. "Contact details are placeholders."',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: 'text' },
    prepare: ({ title }) => ({ title, subtitle: 'Disclaimer' }),
  },
})
