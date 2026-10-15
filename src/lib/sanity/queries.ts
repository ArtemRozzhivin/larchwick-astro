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

export const POSTS_QUERY = defineQuery(
  `*[_type == "post" && defined(slug.current)] | order(publishedAt desc){
    _id,
    _updatedAt,
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    mainImage,
    body,
    seo,
    "categories": categories[]->{ _id, title, "slug": slug.current },
    "tags": tags[]->{ _id, title, "slug": slug.current }
  }`,
)

export const TERMS_QUERY = defineQuery(
  `*[_type in ["category", "tag"] && defined(slug.current)] | order(title asc){
    _id,
    _type,
    title,
    "slug": slug.current,
    description
  }`,
)

export const BLOG_PAGE_QUERY = defineQuery(
  `*[_type == "page" && slug.current == "blog"][0]{ title, seo }`,
)

export const SETTINGS_QUERY = defineQuery(
  `*[_type == "siteSettings"][0]{
    siteName,
    description,
    "navigation": navigation[]{ label, href },
    contact,
    demoLabel
  }`,
)
