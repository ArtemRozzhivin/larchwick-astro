import { defineField, defineType } from 'sanity'

export const callout = defineType({
  name: 'callout',
  title: 'Callout',
  type: 'object',
  fields: [
    defineField({
      name: 'tone',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Note', value: 'note' },
          { title: 'Tip', value: 'tip' },
          { title: 'Warning', value: 'warning' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'tip',
    }),
    defineField({
      name: 'text',
      title: 'Text',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: 'text', tone: 'tone' },
    prepare: ({ title, tone }) => ({ title, subtitle: `Callout · ${tone ?? 'tip'}` }),
  },
})
