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
    _updatedAt,
    title,
    "slug": slug.current,
    description
  }`,
)

export const PAGE_DATES_QUERY = defineQuery(
  `*[_type == "page" && defined(slug.current)]{
    "slug": slug.current,
    _updatedAt,
    "listsPosts": slug.current == "blog" || count(sections[_type == "latestPosts"]) > 0
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

export const REDIRECTS_QUERY = defineQuery(
  `*[_type == "redirect" && defined(from) && defined(to)] | order(from asc){ from, to, permanent }`,
)

export const IMAGE_PLACEHOLDERS_QUERY = defineQuery(
  `*[_type == "sanity.imageAsset" && defined(metadata.lqip)]{ _id, "lqip": metadata.lqip }`,
)

export const RAG_PAGES_QUERY = defineQuery(
  `*[_type == "page" && defined(slug.current) && seo.noindex != true]{ title, "slug": slug.current, sections }`,
)
