import type { LinkItem } from '@lib/sanity/sanity.types'

/** A link or button as Sanity stores it (`linkItem`): either field may be missing. */
export type Link = Pick<LinkItem, 'label' | 'href'>

export type UsableLink = Required<Link>

/** Only a link with both a label and an address is rendered. */
export function isUsableLink(link: Link | null | undefined): link is UsableLink {
  return Boolean(link?.href && link.label)
}
