import { defineArrayMember, defineField, defineType } from 'sanity'

import {
  eyebrowField,
  introField,
  optionalHeadingField,
  sectionPreview,
  toneField,
} from '../fields'

export const cardGrid = defineType({
  name: 'cardGrid',
  title: 'Cards',
  type: 'object',
  fields: [
    eyebrowField,
    optionalHeadingField,
    introField,
    defineField({
      name: 'cards',
      title: 'Cards',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'card',
          title: 'Card',
          type: 'object',
          fields: [
            defineField({ name: 'image', title: 'Image', type: 'accessibleImage' }),
            eyebrowField,
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({ name: 'text', title: 'Text', type: 'text', rows: 3 }),
            defineField({
              name: 'specs',
              title: 'Details',
              type: 'array',
              description: 'Label and value pairs, e.g. Origin: Ethiopia.',
              of: [
                defineArrayMember({
                  name: 'spec',
                  title: 'Detail',
                  type: 'object',
                  fields: [
                    defineField({
                      name: 'label',
                      title: 'Label',
                      type: 'string',
                      validation: (rule) => rule.required(),
                    }),
                    defineField({
                      name: 'value',
                      title: 'Value',
                      type: 'string',
                      validation: (rule) => rule.required(),
                    }),
                  ],
                  preview: { select: { title: 'label', subtitle: 'value' } },
                }),
              ],
            }),
            defineField({
              name: 'price',
              title: 'Price',
              type: 'string',
              description: 'As shown, e.g. "€14 / 250 g".',
            }),
            defineField({ name: 'cta', title: 'Button', type: 'linkItem' }),
          ],
          preview: { select: { title: 'title', subtitle: 'price', media: 'image' } },
        }),
      ],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({ name: 'cta', title: 'Button under the cards', type: 'linkItem' }),
    toneField,
  ],
  preview: sectionPreview('Cards'),
})
