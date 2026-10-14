import { defineField, defineType } from 'sanity'

interface ImageValue {
  asset?: unknown
  decorative?: boolean
}

export const ALT_DESCRIPTION =
  'What the photo shows, for screen readers and search engines (about 125 characters). Use a page keyword only where it reads naturally, and never start with "Image of".'

export const accessibleImage = defineType({
  name: 'accessibleImage',
  title: 'Image',
  type: 'image',
  options: { hotspot: true },
  fields: [
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      description: ALT_DESCRIPTION,
      hidden: ({ parent }) => (parent as ImageValue | undefined)?.decorative === true,
      validation: (rule) => [
        rule.custom((alt, context) => {
          const image = context.parent as ImageValue | undefined
          if (!image?.asset || image.decorative) return true
          return alt?.trim() ? true : 'Alt text is required unless the image is decorative.'
        }),
        rule.max(150).warning('Keep alt text to about 125 characters.'),
      ],
    }),
    defineField({
      name: 'decorative',
      title: 'Decorative only',
      type: 'boolean',
      description:
        'Tick only for a pure background behind text. The image is then hidden from screen readers.',
      initialValue: false,
    }),
  ],
})
