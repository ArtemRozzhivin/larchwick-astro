import { defineField, defineType, type ValidationContext } from 'sanity'

import { apiVersion } from '../../env'
import { hrefError } from '../fields'

const FROM_PATH = /^\/[^\s?#]+\/$/

async function fromError(from: string | undefined, context: ValidationContext) {
  if (!from) return true
  if (!FROM_PATH.test(from)) {
    return 'Start and end with "/", e.g. /old-post/. The home page "/" and query strings (?p=…) can\'t be redirected.'
  }
  const id = context.document?._id.replace(/^drafts\./, '') ?? ''
  const client = context.getClient({ apiVersion })
  const params = { from, id, draftId: `drafts.${id}` }
  const clashes = await client.fetch<{ duplicates: number; routes: number }>(
    `{
      "duplicates": count(*[_type == "redirect" && from == $from && !(_id in [$id, $draftId])]),
      "routes": count(*[
        (_type == "page" && slug.current != "home" && "/" + slug.current + "/" == $from) ||
        (_type == "post" && "/blog/" + slug.current + "/" == $from)
      ])
    }`,
    params,
  )
  if (clashes.duplicates > 0) return 'Another redirect already starts from this address.'
  if (clashes.routes > 0) return 'A live page or post uses this address, so it would never load.'
  return true
}

export const redirect = defineType({
  name: 'redirect',
  title: 'Redirect',
  type: 'document',
  fields: [
    defineField({
      name: 'from',
      title: 'From',
      type: 'string',
      description: 'The old address, e.g. /brewing-guides/.',
      validation: (rule) => rule.required().custom(fromError),
    }),
    defineField({
      name: 'to',
      title: 'To',
      type: 'string',
      description: 'Where visitors land: a site path such as /blog/ or a full https:// address.',
      validation: (rule) =>
        rule
          .required()
          .custom(hrefError)
          .custom((to, context) =>
            to && to === (context.document as { from?: string } | undefined)?.from
              ? 'A redirect cannot point to itself.'
              : true,
          ),
    }),
    defineField({
      name: 'permanent',
      title: 'Permanent (301)',
      type: 'boolean',
      description: 'Keep on for moved content. Off sends a temporary 302.',
      initialValue: true,
    }),
  ],
  preview: {
    select: { from: 'from', to: 'to', permanent: 'permanent' },
    prepare: ({ from, to, permanent }) => ({
      title: from,
      subtitle: `→ ${to ?? '?'} · ${permanent === false ? '302' : '301'}`,
    }),
  },
})
