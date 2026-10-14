import { defineArrayMember, defineField, defineType } from 'sanity'

import {
  eyebrowField,
  introField,
  optionalHeadingField,
  sectionPreview,
  toneField,
} from '../fields'

export const faq = defineType({
  name: 'faq',
  title: 'FAQ',
  type: 'object',
  fields: [
    eyebrowField,
    optionalHeadingField,
    introField,
    defineField({
      name: 'groups',
      title: 'Groups',
      type: 'array',
      description: 'Questions grouped under their own heading (H2), e.g. "Orders and shipping".',
      of: [
        defineArrayMember({
          name: 'faqGroup',
          title: 'Group',
          type: 'object',
          fields: [
            defineField({ name: 'heading', title: 'Group heading', type: 'string' }),
            defineField({
              name: 'items',
              title: 'Questions',
              type: 'array',
              of: [
                defineArrayMember({
                  name: 'faqItem',
                  title: 'Question',
                  type: 'object',
                  fields: [
                    defineField({
                      name: 'question',
                      title: 'Question',
                      type: 'string',
                      validation: (rule) => rule.required(),
                    }),
                    defineField({
                      name: 'answer',
                      title: 'Answer',
                      type: 'blockContent',
                      validation: (rule) => rule.required(),
                    }),
                  ],
                  preview: { select: { title: 'question' } },
                }),
              ],
              validation: (rule) => rule.required().min(1),
            }),
          ],
          preview: {
            select: { title: 'heading', items: 'items' },
            prepare: ({ title, items }) => ({
              title: title || 'Questions',
              subtitle: `${Array.isArray(items) ? items.length : 0} questions`,
            }),
          },
        }),
      ],
      validation: (rule) => rule.required().min(1),
    }),
    toneField,
  ],
  preview: sectionPreview('FAQ'),
})
