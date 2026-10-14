import { defineArrayMember, defineField, defineType } from 'sanity'

export const table = defineType({
  name: 'table',
  title: 'Table',
  type: 'object',
  fields: [
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
      description: 'Describes the table for screen readers, e.g. "Grind size by brew method".',
    }),
    defineField({
      name: 'headerRow',
      title: 'First row is the header',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'rows',
      title: 'Rows',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'tableRow',
          title: 'Row',
          type: 'object',
          fields: [
            defineField({
              name: 'cells',
              title: 'Cells',
              type: 'array',
              of: [defineArrayMember({ type: 'string' })],
              validation: (rule) => rule.required().min(1),
            }),
          ],
          preview: {
            select: { cells: 'cells' },
            prepare: ({ cells }) => ({
              title: Array.isArray(cells) ? cells.join(' · ') : 'Empty row',
            }),
          },
        }),
      ],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: { caption: 'caption', rows: 'rows' },
    prepare: ({ caption, rows }) => ({
      title: caption || 'Table',
      subtitle: `${Array.isArray(rows) ? rows.length : 0} rows`,
    }),
  },
})
