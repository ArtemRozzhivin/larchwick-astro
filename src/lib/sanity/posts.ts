import { postPath, termPath } from '../routes'
import { lastModified } from '../seo/sitemap'
import { sanityFetch } from './client'
import { PAGE_DATES_QUERY, POSTS_QUERY, TERMS_QUERY } from './queries'
import type {
  PAGE_DATES_QUERY_RESULT,
  POSTS_QUERY_RESULT,
  TERMS_QUERY_RESULT,
} from './sanity.types'

export type Post = POSTS_QUERY_RESULT[number]
export type Term = TERMS_QUERY_RESULT[number]

let posts: Promise<POSTS_QUERY_RESULT> | undefined
let terms: Promise<TERMS_QUERY_RESULT> | undefined

// Every blog route reads the same two queries, so each runs once per build.
export function getPosts(): Promise<POSTS_QUERY_RESULT> {
  posts ??= sanityFetch<POSTS_QUERY_RESULT>(POSTS_QUERY)
  return posts
}

export function getTerms(): Promise<TERMS_QUERY_RESULT> {
  terms ??= sanityFetch<TERMS_QUERY_RESULT>(TERMS_QUERY)
  return terms
}

/** Path → last change of every page, post and term archive, for the sitemap's <lastmod>. */
export async function getLastModified(): Promise<ReadonlyMap<string, string>> {
  const [all, pages, terms] = await Promise.all([
    getPosts(),
    sanityFetch<PAGE_DATES_QUERY_RESULT>(PAGE_DATES_QUERY),
    getTerms(),
  ])
  const archives = termArchives(all, terms).map(({ term }) => ({
    path: termPath(term),
    _updatedAt: term._updatedAt,
  }))
  return lastModified(
    pages,
    all.map((post) => ({ path: postPath(post), _updatedAt: post._updatedAt })),
    archives,
  )
}

function postsWithTerm(all: readonly Post[], term: Term): Post[] {
  const field = term._type === 'category' ? 'categories' : 'tags'
  return all.filter((post) => post[field]?.some((item) => item._id === term._id))
}

/** The terms that get an archive page (a slug and at least one post), each with its posts. */
export function termArchives(
  all: readonly Post[],
  terms: readonly Term[],
): { term: Term; posts: Post[] }[] {
  return terms
    .filter((term) => term.slug)
    .map((term) => ({ term, posts: postsWithTerm(all, term) }))
    .filter(({ posts: listed }) => listed.length > 0)
}

export function relatedPosts(post: Post, all: readonly Post[], limit = 3): Post[] {
  const categoryIds = new Set(post.categories?.map((category) => category._id))
  return all
    .filter((other) => other._id !== post._id)
    .filter((other) => other.categories?.some((category) => categoryIds.has(category._id)))
    .slice(0, limit)
}

export function adjacentPosts(
  post: Post,
  all: readonly Post[],
): { newer: Post | undefined; older: Post | undefined } {
  const index = all.findIndex((other) => other._id === post._id)
  return { newer: all[index - 1], older: all[index + 1] }
}

export function termLabel(title: string | null | undefined): string {
  const text = title ?? ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}
