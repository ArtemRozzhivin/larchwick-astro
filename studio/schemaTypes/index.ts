import { page } from './documents/page'
import { post } from './documents/post'
import { redirect } from './documents/redirect'
import { siteSettings } from './documents/siteSettings'
import { category, tag } from './documents/taxonomy'
import { accessibleImage } from './objects/accessibleImage'
import { blockContent } from './objects/blockContent'
import { callout } from './objects/callout'
import { figure } from './objects/figure'
import { gallery } from './objects/gallery'
import { linkItem } from './objects/linkItem'
import { quote } from './objects/quote'
import { seo } from './objects/seo'
import { table } from './objects/table'
import { sectionTypes } from './sections'

export const SINGLETONS = new Set(['siteSettings'])

export const schemaTypes = [
  siteSettings,
  page,
  post,
  category,
  tag,
  redirect,
  seo,
  linkItem,
  accessibleImage,
  figure,
  blockContent,
  gallery,
  table,
  callout,
  quote,
  ...sectionTypes,
]
