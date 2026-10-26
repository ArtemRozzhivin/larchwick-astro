import { defineField, defineType } from 'sanity'

import { introField, lightToneField, optionalHeadingField, sectionPreview } from '../fields'

export const contactForm = defineType({
  name: 'contactForm',
  title: 'Contact form',
  type: 'object',
  description: 'Name, email, subject and message. The fields are fixed; messages arrive by email.',
  fields: [
    optionalHeadingField,
    introField,
    defineField({
      name: 'showContactDetails',
      title: 'Show contact details next to the form',
      type: 'boolean',
      description: 'Uses the details from Site settings.',
      initialValue: true,
    }),
    lightToneField,
  ],
  preview: sectionPreview('Contact form'),
})
