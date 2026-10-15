import { sanityFetch } from './client'
import { POSTS_QUERY, TERMS_QUERY } from './queries'
import type { POSTS_QUERY_RESULT, TERMS_QUERY_RESULT } from './sanity.types'

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

export function postPath(post: Pick<Post, 'slug'>): string {
  return `/blog/${post.slug}/`
}

export function termPath(term: Pick<Term, '_type' | 'slug'>): string {
  return `/blog/${term._type === 'category' ? 'category' : 'tag'}/${term.slug}/`
}

export function postsWithTerm(all: readonly Post[], term: Term): Post[] {
  const field = term._type === 'category' ? 'categories' : 'tags'
  return all.filter((post) => post[field]?.some((item) => item._id === term._id))
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

export async function archivePaths(
  type: 'category' | 'tag',
): Promise<{ params: { slug: string }; props: { term: Term; posts: Post[] } }[]> {
  const [all, terms] = await Promise.all([getPosts(), getTerms()])
  return terms
    .filter((term) => term._type === type && term.slug)
    .map((term) => ({ term, posts: postsWithTerm(all, term) }))
    .filter(({ posts: matching }) => matching.length > 0)
    .map(({ term, posts: matching }) => ({
      params: { slug: term.slug ?? '' },
      props: { term, posts: matching },
    }))
}

export function termLabel(title: string | null | undefined): string {
  const text = title ?? ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}
