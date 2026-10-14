import { defineField, defineType } from 'sanity'

import { hrefError } from '../fields'

export const linkItem = defineType({
  name: 'linkItem',
  title: 'Link',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      description: 'The visible text of the link or button.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'href',
      title: 'Address',
      type: 'string',
      description: 'A site path such as /contact/, or a full https://, mailto: or tel: address.',
      validation: (rule) => rule.required().custom(hrefError),
    }),
  ],
  preview: { select: { title: 'label', subtitle: 'href' } },
})
