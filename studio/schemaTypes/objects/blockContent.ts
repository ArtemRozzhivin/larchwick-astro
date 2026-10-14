import { defineArrayMember, defineField, defineType } from 'sanity'

import { hrefError } from '../fields'

export const blockContent = defineType({
  name: 'blockContent',
  title: 'Content',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Paragraph', value: 'normal' },
        { title: 'Heading 2', value: 'h2' },
        { title: 'Heading 3', value: 'h3' },
        { title: 'Heading 4', value: 'h4' },
      ],
      lists: [
        { title: 'Bullet list', value: 'bullet' },
        { title: 'Numbered list', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: 'Bold', value: 'strong' },
          { title: 'Italic', value: 'em' },
        ],
        annotations: [
          defineArrayMember({
            name: 'link',
            title: 'Link',
            type: 'object',
            fields: [
              defineField({
                name: 'href',
                title: 'Address',
                type: 'string',
                description:
                  'A site path such as /blog/ethiopia-yirgacheffe/, or a full https://, mailto: or tel: address.',
                validation: (rule) => rule.required().custom(hrefError),
              }),
            ],
          }),
        ],
      },
    }),
    defineArrayMember({ type: 'figure' }),
    defineArrayMember({ type: 'gallery' }),
    defineArrayMember({ type: 'table' }),
    defineArrayMember({ type: 'callout' }),
    defineArrayMember({ type: 'quote' }),
  ],
})
