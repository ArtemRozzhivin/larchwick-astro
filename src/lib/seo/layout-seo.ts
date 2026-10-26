// Relative, with extensions, so `node --test` can load this module (it doesn't resolve @lib).
import { ogImageSource, type SanityImageValue, type SocialImage } from '../sanity/image.ts'

/** The SEO props of `Layout.astro`; a route spreads them in. */
export interface LayoutSeo {
  title: string
  description?: string
  ogImage?: SocialImage
  noindex?: boolean
  canonical?: string
}

/** What a route shows where its document leaves an `seo` field empty. */
export interface SeoDefaults {
  title: string
  /** Without one, the Layout uses the Site settings description. */
  description?: string
  /** The Sanity image shared when Social image is empty (a post's main image). */
  image?: SanityImageValue | null
}

/** The `seo` object that pages and posts share in the Studio. */
interface SeoFields {
  metaTitle?: string | null
  metaDescription?: string | null
  ogImage?: SanityImageValue | null
  noindex?: boolean | null
  canonical?: string | null
}

// The fallback image's alt also describes the Social image when the editor picked the same photo.
function socialImage(
  own: SanityImageValue | null | undefined,
  fallback: SanityImageValue | null | undefined,
): SocialImage | undefined {
  const image = own?.asset ? own : fallback
  const isFallbackPhoto = image?.asset?._ref === fallback?.asset?._ref && !fallback?.decorative
  return ogImageSource(image, isFallbackPhoto ? fallback?.alt : undefined)
}

function sharedSeo(seo: SeoFields | null | undefined, defaults: SeoDefaults): LayoutSeo {
  return {
    title: seo?.metaTitle ?? defaults.title,
    description: seo?.metaDescription ?? defaults.description,
    ogImage: socialImage(seo?.ogImage, defaults.image),
  }
}

/**
 * Layout SEO props for a Sanity page or post: its Meta title, Meta description and Social image,
 * each falling back to `defaults`, plus its noindex and canonical URL.
 */
export function layoutSeo(seo: SeoFields | null | undefined, defaults: SeoDefaults): LayoutSeo {
  return {
    ...sharedSeo(seo, defaults),
    noindex: seo?.noindex ?? false,
    canonical: seo?.canonical ?? undefined,
  }
}

/**
 * The home page's Layout SEO props: as `layoutSeo()`, without noindex and canonical. Home is always
 * indexed at `/`, so the Studio hides "Hide from search engines" and "Canonical URL" there.
 */
export function homeSeo(seo: SeoFields | null | undefined, defaults: SeoDefaults): LayoutSeo {
  return sharedSeo(seo, defaults)
}
