import { blog } from '@lib/content/blog'
import type { LayoutSeo } from '@lib/seo/layout-seo'

import { getPosts, getTerms, type Post, type Term, termArchives, termLabel } from './posts'

// A tag on a single post makes an archive that repeats that post: keep it out of search.
const MIN_INDEXED_TAG_POSTS = 2

export interface TermArchive {
  seo: LayoutSeo
  archive: { eyebrow: string; heading: string; intro?: string; posts: Post[] }
}

function termArchive(term: Term, posts: Post[]): TermArchive {
  const label = termLabel(term.title)
  const isTag = term._type === 'tag'
  const describe = isTag ? blog.tagDescription : blog.categoryDescription
  const intro = term.description ?? undefined
  return {
    seo: {
      title: blog.archiveTitle(label),
      description: intro ?? describe(label),
      noindex: isTag && posts.length < MIN_INDEXED_TAG_POSTS,
    },
    archive: { eyebrow: isTag ? blog.tagLabel : blog.categoryLabel, heading: label, intro, posts },
  }
}

export async function archivePaths(
  type: Term['_type'],
): Promise<{ params: { slug: string }; props: TermArchive }[]> {
  const [all, terms] = await Promise.all([getPosts(), getTerms()])
  const ofType = terms.filter((term) => term._type === type)
  return termArchives(all, ofType).map(({ term, posts: matching }) => ({
    params: { slug: term.slug ?? '' },
    props: termArchive(term, matching),
  }))
}
