import { siteConfig } from '@lib/config/site'

/**
 * Copy for the blog index, archives and post pages. Posts themselves come from Sanity.
 */
export const blog = {
  seo: {
    title: `Coffee Brewing Guides and Roastery News | ${siteConfig.name} Blog`,
    description: `Brewing guides, coffee origins and roastery news from ${siteConfig.title}: pour-over, French press, cold brew and the coffees we roast.`,
  },

  heading: `The ${siteConfig.name} blog`,
  intro: 'Brewing guides, coffee origins and news from the roastery.',
  byline: `${siteConfig.name} Team`,
  categoryLabel: 'Category',
  tagLabel: 'Tag',
  tagsHeading: 'Tags',
  relatedHeading: 'More from the blog',
  newerLabel: 'Newer post',
  olderLabel: 'Older post',
  allPostsLabel: 'All posts',
  bylineLabel: 'By',
  postNavLabel: 'Previous and next posts',
  breadcrumbs: { home: 'Home', blog: 'Blog' },
  archiveTitle: (term: string) => `${term} | ${siteConfig.name} Blog`,
  categoryDescription: (term: string) => `${term}: posts from the ${siteConfig.title} blog.`,
  tagDescription: (term: string) => `Posts tagged "${term}" on the ${siteConfig.title} blog.`,
} as const
