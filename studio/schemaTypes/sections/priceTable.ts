import { defineArrayMember, defineField, defineType } from 'sanity'

import {
  eyebrowField,
  introField,
  lightToneField,
  optionalHeadingField,
  sectionPreview,
} from '../fields'

export const priceTable = defineType({
  name: 'priceTable',
  title: 'Price list',
  type: 'object',
  fields: [
    eyebrowField,
    optionalHeadingField,
    introField,
    defineField({
      name: 'rows',
      title: 'Rows',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'priceRow',
          title: 'Row',
          type: 'object',
          fields: [
            defineField({
              name: 'name',
              title: 'Item',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({ name: 'description', title: 'Description', type: 'string' }),
            defineField({
              name: 'price',
              title: 'Price',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
          ],
          preview: { select: { title: 'name', subtitle: 'price' } },
        }),
      ],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({ name: 'note', title: 'Note under the table', type: 'string' }),
    lightToneField,
  ],
  preview: sectionPreview('Price list'),
})
