import { defineQuery } from 'groq'

export const PAGE_SLUGS_QUERY = defineQuery(
  `*[_type == "page" && defined(slug.current) && !(slug.current in ["home", "blog"])].slug.current`,
)

export const PAGE_QUERY = defineQuery(
  `*[_type == "page" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    seo,
    sections
  }`,
)

export const LATEST_POSTS_QUERY = defineQuery(
  `*[_type == "post" && defined(slug.current)] | order(publishedAt desc)[0...$count]{
    _id,
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    mainImage
  }`,
)
