import { createImageUrlBuilder } from '@sanity/image-url'

// With extensions, so `node --test` can load this module.
import { dataset, projectId } from '../../../studio/env.ts'
import { sanityFetch } from './client.ts'
import { IMAGE_PLACEHOLDERS_QUERY } from './queries.ts'
import type { IMAGE_PLACEHOLDERS_QUERY_RESULT } from './sanity.types'

export interface SanityImageValue {
  asset?: { _ref: string }
  crop?: { top?: number; bottom?: number; left?: number; right?: number }
  hotspot?: { x?: number; y?: number; width?: number; height?: number }
  alt?: string
  decorative?: boolean
}

export interface SocialImage {
  src: string
  width: number
  height: number
  alt?: string
}

export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630

const builder = createImageUrlBuilder({ projectId, dataset })

export function imageSize(image: SanityImageValue): { width: number; height: number } {
  const match = /-(\d+)x(\d+)-/.exec(image.asset?._ref ?? '')
  return match ? { width: Number(match[1]), height: Number(match[2]) } : { width: 0, height: 0 }
}

export function imageSource(
  image: SanityImageValue,
  width: number,
  aspectRatio?: number,
): { src: string; width: number; height: number } {
  const original = imageSize(image)
  const targetWidth = Math.min(width, original.width)
  const ratio = aspectRatio ?? original.width / original.height
  const height = Math.round(targetWidth / ratio)
  const src = builder
    .image(image)
    .width(targetWidth)
    .height(height)
    .fit('crop')
    .format('jpg')
    .quality(90)
    .url()
  return { src, width: targetWidth, height }
}

/** The image cropped for social cards, at its real size (narrower when the original is). */
export function ogImageSource(
  image: SanityImageValue | null | undefined,
  alt?: string,
): SocialImage | undefined {
  if (!image?.asset) return undefined
  const source = imageSource(image, OG_IMAGE_WIDTH, OG_IMAGE_WIDTH / OG_IMAGE_HEIGHT)
  return alt ? { ...source, alt } : source
}

let placeholders: Promise<ReadonlyMap<string, string>> | undefined

// Sanity keeps a tiny blurred preview (LQIP, about 1 KB) of every image; one query per build reads them all.
export function getImagePlaceholders(): Promise<ReadonlyMap<string, string>> {
  placeholders ??= sanityFetch<IMAGE_PLACEHOLDERS_QUERY_RESULT>(IMAGE_PLACEHOLDERS_QUERY).then(
    (rows) => new Map(rows.flatMap((row) => (row.lqip ? [[row._id, row.lqip] as const] : []))),
  )
  return placeholders
}
