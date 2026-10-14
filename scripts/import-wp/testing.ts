import { createKeyer } from './keys.ts'
import { type LinkRules, rewriteHref } from './links.ts'
import type { ContactDetails, ConvertContext, LinkChange } from './types.ts'

export const ORIGIN = 'http://larchwick.local'

export const ALT: Readonly<Record<number, string>> = {
  42: 'Mason jar of iced cold brew coffee next to a stack of books',
  46: 'Dark purple coffee cherries drying on a raised mesh bed',
  47: 'Terraced coffee farm on a green hillside surrounded by trees',
  103: 'Pour-over coffee drippers lined up on a café brew bar next to takeaway cups',
}

export function testContext(postSlugs: readonly string[] = []): ConvertContext & {
  warnings: string[]
  links: Omit<LinkChange, 'where'>[]
  contact: ContactDetails
} {
  const warnings: string[] = []
  const links: Omit<LinkChange, 'where'>[] = []
  const rules: LinkRules = { origin: ORIGIN, postSlugs: new Set(postSlugs) }
  return {
    where: 'test',
    key: createKeyer('test'),
    media: (wpId) =>
      wpId in ALT || wpId === 999 ? { assetId: `image-${wpId}`, alt: ALT[wpId] } : undefined,
    href: (href) => rewriteHref(href, rules, (change) => links.push(change)),
    warn: (message) => warnings.push(message),
    contact: {},
    warnings,
    links,
  }
}
