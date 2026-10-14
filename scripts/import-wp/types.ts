export interface Span {
  _type: 'span'
  _key: string
  text: string
  marks: string[]
}

export interface LinkMark {
  _type: 'link'
  _key: string
  href: string
}

export interface TextBlock {
  _type: 'block'
  _key: string
  style: 'normal' | 'h2' | 'h3' | 'h4'
  children: Span[]
  markDefs: LinkMark[]
  listItem?: 'bullet' | 'number'
  level?: number
}

export interface ImageRef {
  _type: 'reference'
  _ref: string
}

export interface Figure {
  _type: 'figure'
  _key: string
  asset: ImageRef
  alt: string
  caption?: string
}

export interface AccessibleImage {
  _type: 'accessibleImage'
  asset: ImageRef
  alt?: string
  decorative?: boolean
}

export interface TableRow {
  _type: 'tableRow'
  _key: string
  cells: string[]
}

export interface PortableTable {
  _type: 'table'
  _key: string
  caption?: string
  headerRow: boolean
  rows: TableRow[]
}

export interface Gallery {
  _type: 'gallery'
  _key: string
  images: Figure[]
  caption?: string
}

export interface Quote {
  _type: 'quote'
  _key: string
  text: string
  citation?: string
}

export type PortableNode = TextBlock | Figure | Gallery | PortableTable | Quote

export interface LinkItem {
  _type: 'linkItem'
  _key: string
  label: string
  href: string
}

export type Section = { _type: string; _key: string } & Record<string, unknown>

export interface MediaAsset {
  assetId: string
  alt?: string
}

export interface LinkChange {
  where: string
  from: string
  to: string
  reason: string
}

export interface ContactDetails {
  email?: string
  wholesaleEmail?: string
  phone?: string
  hours?: string[]
}

export interface ConvertContext {
  where: string
  key: () => string
  media: (_wpId: number) => MediaAsset | undefined
  href: (_href: string) => string
  warn: (_message: string) => void
  contact: ContactDetails
}
