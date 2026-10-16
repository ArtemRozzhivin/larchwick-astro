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
      name: 'layout',
      title: 'Layout',
      type: 'string',
      description:
        "Cards: labels with photos and details. Bags: coffee bags coloured by each card's roast (photos are not shown).",
      options: {
        list: [
          { title: 'Cards', value: 'cards' },
          { title: 'Bags', value: 'bags' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'cards',
    }),
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
              name: 'points',
              title: 'Bullet points',
              type: 'array',
              description: 'Short plain points, e.g. "Weekly or twice-weekly delivery".',
              of: [defineArrayMember({ type: 'string' })],
            }),
            defineField({
              name: 'price',
              title: 'Price',
              type: 'string',
              description: 'As shown, e.g. "€14 / 250 g".',
            }),
            defineField({
              name: 'roast',
              title: 'Roast',
              type: 'string',
              description: 'Bags layout only: sets the bag colour.',
              options: {
                list: [
                  { title: 'Light', value: 'light' },
                  { title: 'Medium', value: 'medium' },
                  { title: 'Dark', value: 'dark' },
                  { title: 'Seasonal', value: 'seasonal' },
                ],
              },
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
